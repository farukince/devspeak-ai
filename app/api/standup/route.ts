import { NextRequest, NextResponse } from 'next/server';
import { evaluateStructured } from '@/lib/aiClient';
import { buildStandupPrompt, STANDUP_PROMPT_VERSION } from '@/lib/ai/prompts/standup';
import { EVALUATOR_SYSTEM_INSTRUCTION } from '@/lib/ai/prompts/shared';
import { aiRouteError } from '@/lib/ai/route';
import { standupResponseSchema, type StandupEvaluation } from '@/lib/ai/schemas';
import { getServerDatabase } from '@/lib/database/server';
import type { EvaluationRecord, PracticeSessionRecord } from '@/lib/database/types';
import { standupAnswerSchema, standupRequestSchema, type StandupAnswer } from '@/lib/validation/standup';
import { enforceRateLimit, readJsonWithLimit } from '@/lib/security/api';

const STANDUP_SCHEMA_VERSION = '2';
const ATTEMPT_LIMIT = 10;

function parseAnswer(value: string): StandupAnswer | null {
  try {
    const parsed = standupAnswerSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function toStandupEvaluation(evaluation: EvaluationRecord | null): StandupEvaluation | null {
  if (!evaluation) return null;
  const parsed = standupResponseSchema.safeParse({
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    improvedAnswer: evaluation.improvedAnswer,
    nextExercise: evaluation.nextExercise ?? undefined,
  });
  return parsed.success ? parsed.data : null;
}

async function attemptResponse(
  database: Awaited<ReturnType<typeof getServerDatabase>>,
  session: PracticeSessionRecord
) {
  const evaluation = await database.evaluations.readBySession(session.id);
  return {
    id: session.id,
    createdAt: session.createdAt,
    status: session.status,
    answer: parseAnswer(session.userAnswer),
    evaluation: toStandupEvaluation(evaluation),
  };
}

export async function GET() {
  try {
    const database = await getServerDatabase();
    const sessions = await database.sessions.list({ moduleType: 'standup', limit: ATTEMPT_LIMIT });
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
    await enforceRateLimit(database.client, 'standup:evaluate', 10);
    const input = await readJsonWithLimit(request, standupRequestSchema, 24_000);
    const answer: StandupAnswer = {
      yesterday: input.yesterday,
      today: input.today,
      blockers: input.blockers,
    };
    const session = await database.sessions.create({
      moduleType: 'standup',
      clientRequestId: input.clientRequestId,
      inputMode: input.inputMode,
      userAnswer: JSON.stringify(answer),
      transcript: input.inputMode === 'voice' ? input.transcript : null,
      durationSeconds: input.durationSeconds ?? null,
      status: 'processing',
    });
    sessionId = session.id;

    const existingEvaluation = await database.evaluations.readBySession(session.id);
    const storedEvaluation = toStandupEvaluation(existingEvaluation);
    if (storedEvaluation) {
      if (session.status !== 'completed') {
        await database.sessions.update(session.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationSeconds: input.durationSeconds ?? undefined,
        });
      }
      return NextResponse.json({ sessionId: session.id, evaluation: storedEvaluation });
    }
    await database.sessions.update(session.id, {
      status: 'processing',
      userAnswer: JSON.stringify(answer),
      transcript: input.inputMode === 'voice' ? input.transcript : null,
      durationSeconds: input.durationSeconds ?? null,
      completedAt: null,
    });
    const profile = await database.profiles.read();

    const result = await evaluateStructured({
      prompt: buildStandupPrompt(answer, {
        jobTitle: profile?.jobTitle ?? null,
        englishLevel: profile?.englishLevel ?? null,
      }),
      schema: standupResponseSchema,
      mode: 'fast',
      promptVersion: STANDUP_PROMPT_VERSION,
      systemInstruction: EVALUATOR_SYSTEM_INSTRUCTION,
      sessionId: session.id,
    });

    await database.evaluations.create({
      sessionId: session.id,
      overallScore: result.data.overallScore,
      categoryScores: result.data.categoryScores,
      summary: result.data.summary,
      strengths: result.data.strengths,
      improvements: result.data.improvements,
      improvedAnswer: result.data.improvedAnswer,
      nextExercise: result.data.nextExercise ?? null,
      promptVersion: STANDUP_PROMPT_VERSION,
      schemaVersion: STANDUP_SCHEMA_VERSION,
      modelName: result.model,
    });
    await database.sessions.update(session.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      durationSeconds: input.durationSeconds ?? undefined,
    });

    return NextResponse.json({ sessionId: session.id, evaluation: result.data }, { status: 201 });
  } catch (error) {
    if (database && sessionId) {
      try {
        await database.sessions.update(sessionId, { status: 'failed' });
      } catch (updateError) {
        console.error('Failed to mark stand-up session as failed:', updateError);
      }
    }
    return aiRouteError(error);
  }
}
