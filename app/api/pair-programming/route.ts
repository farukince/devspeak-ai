import { NextRequest, NextResponse } from 'next/server';
import { evaluateStructured } from '@/lib/aiClient';
import { buildPairProgrammingPrompt, PAIR_PROGRAMMING_PROMPT_VERSION } from '@/lib/ai/prompts/pairProgramming';
import { EVALUATOR_SYSTEM_INSTRUCTION } from '@/lib/ai/prompts/shared';
import { aiRouteError } from '@/lib/ai/route';
import { driverResponseSchema, navigatorResponseSchema } from '@/lib/ai/schemas';
import { getServerDatabase } from '@/lib/database/server';
import type { EvaluationRecord, PracticeSessionRecord } from '@/lib/database/types';
import { enforceRateLimit, readJsonWithLimit } from '@/lib/security/api';
import { pairProgrammingAnswerSchema, pairProgrammingRequestSchema } from '@/lib/validation/pairProgramming';

const PAIR_PROGRAMMING_SCHEMA_VERSION = '2';
const ATTEMPT_LIMIT = 10;

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toPairProgrammingEvaluation(evaluation: EvaluationRecord | null) {
  if (!evaluation) return null;
  const common = {
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    improvedAnswer: evaluation.improvedAnswer,
    communication_tips: evaluation.details.communication_tips,
  };
  return evaluation.details.role === 'driver'
    ? driverResponseSchema.safeParse({
        ...common,
        correctness: evaluation.categoryScores.correctness,
        efficiency: evaluation.categoryScores.efficiency,
        readability: evaluation.categoryScores.readability,
      })
    : navigatorResponseSchema.safeParse({
        ...common,
        clarity: evaluation.categoryScores.clarity,
        effectiveness: evaluation.categoryScores.effectiveness,
        precision: evaluation.categoryScores.precision,
        generatedCode: evaluation.details.generatedCode,
      });
}

async function attemptResponse(
  database: Awaited<ReturnType<typeof getServerDatabase>>,
  session: PracticeSessionRecord
) {
  const answer = (() => {
    try {
      const parsed = pairProgrammingAnswerSchema.safeParse(JSON.parse(session.userAnswer));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  })();
  const parsedEvaluation = toPairProgrammingEvaluation(await database.evaluations.readBySession(session.id));
  return {
    id: session.id,
    createdAt: session.createdAt,
    status: session.status,
    answer,
    evaluation: parsedEvaluation?.success ? parsedEvaluation.data : null,
  };
}

export async function GET() {
  try {
    const database = await getServerDatabase();
    const sessions = await database.sessions.list({ moduleType: 'pair_programming', limit: ATTEMPT_LIMIT });
    const attempts = await Promise.all(sessions.map((session) => attemptResponse(database, session)));
    return NextResponse.json({ attempts });
  } catch (error) {
    return aiRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  let database: Awaited<ReturnType<typeof getServerDatabase>> | null = null;
  let sessionId: string | null = null;

  try {
    database = await getServerDatabase();
    await enforceRateLimit(database.client, 'pair-programming:evaluate', 10);
    const input = await readJsonWithLimit(request, pairProgrammingRequestSchema, 48_000);
    const answer = input.role === 'driver'
      ? { role: input.role, task: input.task, code: input.code }
      : { role: input.role, instruction: input.instruction, code: input.code };
    const session = await database.sessions.create({
      moduleType: 'pair_programming',
      clientRequestId: input.clientRequestId,
      inputMode: 'written',
      userAnswer: JSON.stringify(answer),
      durationSeconds: input.durationSeconds,
      status: 'processing',
    });
    sessionId = session.id;

    const stored = toPairProgrammingEvaluation(await database.evaluations.readBySession(session.id));
    if (stored?.success) {
      if (session.status !== 'completed') {
        await database.sessions.update(session.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationSeconds: input.durationSeconds,
        });
      }
      return NextResponse.json({ sessionId: session.id, evaluation: stored.data });
    }
    await database.sessions.update(session.id, {
      status: 'processing',
      userAnswer: JSON.stringify(answer),
      completedAt: null,
      durationSeconds: input.durationSeconds,
    });
    const profile = await database.profiles.read();
    const profileContext = {
      jobTitle: profile?.jobTitle ?? null,
      englishLevel: profile?.englishLevel ?? null,
    };
    const result = input.role === 'driver'
      ? await evaluateStructured({
          prompt: buildPairProgrammingPrompt({ ...input, profile: profileContext }),
          schema: driverResponseSchema,
          mode: 'deep',
          promptVersion: PAIR_PROGRAMMING_PROMPT_VERSION,
          systemInstruction: EVALUATOR_SYSTEM_INSTRUCTION,
          sessionId: session.id,
        })
      : await evaluateStructured({
          prompt: buildPairProgrammingPrompt({ ...input, profile: profileContext }),
          schema: navigatorResponseSchema,
          mode: 'deep',
          promptVersion: PAIR_PROGRAMMING_PROMPT_VERSION,
          systemInstruction: EVALUATOR_SYSTEM_INSTRUCTION,
          sessionId: session.id,
        });
    const categoryScores: Record<string, number> = 'correctness' in result.data
      ? {
          correctness: result.data.correctness,
          efficiency: result.data.efficiency,
          readability: result.data.readability,
        }
      : {
          clarity: result.data.clarity,
          effectiveness: result.data.effectiveness,
          precision: result.data.precision,
        };
    const details = 'correctness' in result.data
      ? {
          role: input.role,
          communication_tips: result.data.communication_tips,
        }
      : {
          role: input.role,
          communication_tips: result.data.communication_tips,
          generatedCode: result.data.generatedCode,
        };

    await database.evaluations.create({
      sessionId: session.id,
      overallScore: average(Object.values(categoryScores)),
      categoryScores,
      summary: result.data.summary,
      strengths: result.data.strengths,
      improvements: result.data.improvements,
      improvedAnswer: result.data.improvedAnswer,
      promptVersion: PAIR_PROGRAMMING_PROMPT_VERSION,
      schemaVersion: PAIR_PROGRAMMING_SCHEMA_VERSION,
      modelName: result.model,
      details,
    });
    await database.sessions.update(session.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      durationSeconds: input.durationSeconds,
    });
    return NextResponse.json({ sessionId: session.id, evaluation: result.data }, { status: 201 });
  } catch (error) {
    if (database && sessionId) {
      try {
        await database.sessions.update(sessionId, { status: 'failed' });
      } catch (updateError) {
        console.error('Failed to mark pair programming session as failed:', updateError);
      }
    }
    return aiRouteError(error);
  }
}
