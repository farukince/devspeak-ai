import { NextRequest, NextResponse } from 'next/server';
import { evaluateStructured } from '@/lib/aiClient';
import { buildCodeReviewPrompt, CODE_REVIEW_PROMPT_VERSION } from '@/lib/ai/prompts/codeReview';
import { EVALUATOR_SYSTEM_INSTRUCTION } from '@/lib/ai/prompts/shared';
import { aiRouteError } from '@/lib/ai/route';
import { authorResponseSchema, reviewerResponseSchema } from '@/lib/ai/schemas';
import { getServerDatabase } from '@/lib/database/server';
import type { EvaluationRecord, PracticeSessionRecord } from '@/lib/database/types';
import { enforceRateLimit, readJsonWithLimit } from '@/lib/security/api';
import { codeReviewAnswerSchema, codeReviewRequestSchema } from '@/lib/validation/codeReview';

const CODE_REVIEW_SCHEMA_VERSION = '2';
const ATTEMPT_LIMIT = 10;

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toCodeReviewEvaluation(evaluation: EvaluationRecord | null) {
  if (!evaluation) return null;
  const common = {
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    improvedAnswer: evaluation.improvedAnswer,
    suggestions: evaluation.details.suggestions,
  };
  return evaluation.details.role === 'reviewer'
    ? reviewerResponseSchema.safeParse({
        ...common,
        constructiveness: evaluation.categoryScores.constructiveness,
        specificity: evaluation.categoryScores.specificity,
        tone: evaluation.categoryScores.tone,
      })
    : authorResponseSchema.safeParse({
        ...common,
        correctness: evaluation.categoryScores.correctness,
        readability: evaluation.categoryScores.readability,
        bestPractices: evaluation.categoryScores.bestPractices,
      });
}

async function attemptResponse(
  database: Awaited<ReturnType<typeof getServerDatabase>>,
  session: PracticeSessionRecord
) {
  const answer = (() => {
    try {
      const parsed = codeReviewAnswerSchema.safeParse(JSON.parse(session.userAnswer));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  })();
  const parsedEvaluation = toCodeReviewEvaluation(await database.evaluations.readBySession(session.id));
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
    const sessions = await database.sessions.list({ moduleType: 'code_review', limit: ATTEMPT_LIMIT });
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
    await enforceRateLimit(database.client, 'code-review:evaluate', 10);
    const input = await readJsonWithLimit(request, codeReviewRequestSchema, 56_000);
    const answer = input.role === 'reviewer'
      ? { role: input.role, userReview: input.userReview, codeToReview: input.codeToReview }
      : { role: input.role, codeToReview: input.codeToReview };
    const session = await database.sessions.create({
      moduleType: 'code_review',
      clientRequestId: input.clientRequestId,
      inputMode: 'written',
      userAnswer: JSON.stringify(answer),
      durationSeconds: input.durationSeconds,
      status: 'processing',
    });
    sessionId = session.id;

    const stored = toCodeReviewEvaluation(await database.evaluations.readBySession(session.id));
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
    const result = input.role === 'reviewer'
      ? await evaluateStructured({
          prompt: buildCodeReviewPrompt({
            role: input.role,
            code: input.codeToReview,
            review: input.userReview,
            profile: profileContext,
          }),
          schema: reviewerResponseSchema,
          mode: 'deep',
          promptVersion: CODE_REVIEW_PROMPT_VERSION,
          systemInstruction: EVALUATOR_SYSTEM_INSTRUCTION,
          sessionId: session.id,
        })
      : await evaluateStructured({
          prompt: buildCodeReviewPrompt({
            role: input.role,
            code: input.codeToReview,
            profile: profileContext,
          }),
          schema: authorResponseSchema,
          mode: 'deep',
          promptVersion: CODE_REVIEW_PROMPT_VERSION,
          systemInstruction: EVALUATOR_SYSTEM_INSTRUCTION,
          sessionId: session.id,
        });
    const categoryScores: Record<string, number> = 'constructiveness' in result.data
      ? {
          constructiveness: result.data.constructiveness,
          specificity: result.data.specificity,
          tone: result.data.tone,
        }
      : {
          correctness: result.data.correctness,
          readability: result.data.readability,
          bestPractices: result.data.bestPractices,
        };

    await database.evaluations.create({
      sessionId: session.id,
      overallScore: average(Object.values(categoryScores)),
      categoryScores,
      summary: result.data.summary,
      strengths: result.data.strengths,
      improvements: result.data.improvements,
      improvedAnswer: result.data.improvedAnswer,
      promptVersion: CODE_REVIEW_PROMPT_VERSION,
      schemaVersion: CODE_REVIEW_SCHEMA_VERSION,
      modelName: result.model,
      details: { role: input.role, suggestions: result.data.suggestions },
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
        console.error('Failed to mark code review session as failed:', updateError);
      }
    }
    return aiRouteError(error);
  }
}
