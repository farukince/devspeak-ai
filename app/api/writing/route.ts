import { NextRequest, NextResponse } from 'next/server';
import { evaluateStructured } from '@/lib/aiClient';
import { EVALUATOR_SYSTEM_INSTRUCTION } from '@/lib/ai/prompts/shared';
import { buildWritingPrompt, WRITING_PROMPT_VERSION } from '@/lib/ai/prompts/writing/index';
import { aiRouteError } from '@/lib/ai/route';
import { writingResponseSchema, type WritingEvaluation } from '@/lib/ai/schemas';
import { getServerDatabase } from '@/lib/database/server';
import type { EvaluationRecord, PracticeSessionRecord } from '@/lib/database/types';
import { writingAnswerSchema, writingRequestSchema, type WritingAnswer } from '@/lib/validation/writing';
import { enforceRateLimit, readJsonWithLimit } from '@/lib/security/api';

const WRITING_SCHEMA_VERSION = '2';
const ATTEMPT_LIMIT = 10;

function parseAnswer(value: string): WritingAnswer | null {
  try {
    const parsed = writingAnswerSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function toWritingEvaluation(evaluation: EvaluationRecord | null): WritingEvaluation | null {
  if (!evaluation) return null;
  const parsed = writingResponseSchema.safeParse({
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    improvedAnswer: evaluation.improvedAnswer,
    nextExercise: evaluation.nextExercise ?? undefined,
    suggestions: evaluation.details.suggestions,
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
    evaluation: toWritingEvaluation(evaluation),
  };
}

export async function GET() {
  try {
    const database = await getServerDatabase();
    const sessions = await database.sessions.list({ moduleType: 'writing', limit: ATTEMPT_LIMIT });
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
    await enforceRateLimit(database.client, 'writing:evaluate', 10);
    const input = await readJsonWithLimit(request, writingRequestSchema, 24_000);
    const answer: WritingAnswer = { taskType: input.taskType, content: input.content };
    const session = await database.sessions.create({
      moduleType: 'writing',
      clientRequestId: input.clientRequestId,
      inputMode: 'written',
      userAnswer: JSON.stringify(answer),
      durationSeconds: input.durationSeconds ?? null,
      status: 'processing',
    });
    sessionId = session.id;

    const existingEvaluation = await database.evaluations.readBySession(session.id);
    const storedEvaluation = toWritingEvaluation(existingEvaluation);
    if (storedEvaluation) {
      if (session.status !== 'completed') {
        await database.sessions.update(session.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationSeconds: input.durationSeconds ?? undefined,
        });
      }
      return NextResponse.json({
        sessionId: session.id,
        evaluation: storedEvaluation,
      });
    }
    if (session.status !== 'processing') {
      await database.sessions.update(session.id, {
        status: 'processing',
        completedAt: null,
        durationSeconds: input.durationSeconds ?? null,
      });
    }
    const profile = await database.profiles.read();

    const result = await evaluateStructured({
      prompt: buildWritingPrompt(answer, {
        jobTitle: profile?.jobTitle ?? null,
        englishLevel: profile?.englishLevel ?? null,
      }),
      schema: writingResponseSchema,
      mode: 'fast',
      promptVersion: WRITING_PROMPT_VERSION,
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
      promptVersion: WRITING_PROMPT_VERSION,
      schemaVersion: WRITING_SCHEMA_VERSION,
      modelName: result.model,
      details: { suggestions: result.data.suggestions },
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
        console.error('Failed to mark writing session as failed:', updateError);
      }
    }
    return aiRouteError(error);
  }
}
