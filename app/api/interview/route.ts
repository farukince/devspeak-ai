import { NextRequest, NextResponse } from 'next/server';
import { evaluateStructured } from '@/lib/aiClient';
import { buildInterviewPrompt, INTERVIEW_PROMPT_VERSION } from '@/lib/ai/prompts/interview';
import { EVALUATOR_SYSTEM_INSTRUCTION } from '@/lib/ai/prompts/shared';
import { aiRouteError } from '@/lib/ai/route';
import { interviewResponseSchema, type InterviewEvaluation } from '@/lib/ai/schemas';
import { getServerDatabase } from '@/lib/database/server';
import type { EvaluationRecord, PracticeSessionRecord } from '@/lib/database/types';
import { interviewRequestSchema, interviewScenarioQuerySchema } from '@/lib/validation/interview';
import { enforceRateLimit, readJsonWithLimit } from '@/lib/security/api';

const INTERVIEW_SCHEMA_VERSION = '2';
const ATTEMPT_LIMIT = 10;

function toInterviewEvaluation(evaluation: EvaluationRecord | null): InterviewEvaluation | null {
  if (!evaluation) return null;
  const parsed = interviewResponseSchema.safeParse({
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    improvedAnswer: evaluation.improvedAnswer,
    nextExercise: evaluation.nextExercise ?? undefined,
    technicalScore: evaluation.details.technicalScore,
    communicationScore: evaluation.details.communicationScore,
    recommendedPhrasing: evaluation.details.recommendedPhrasing,
  });
  return parsed.success ? parsed.data : null;
}

async function interviewAttemptResponse(
  database: Awaited<ReturnType<typeof getServerDatabase>>,
  session: PracticeSessionRecord
) {
  const [evaluation, scenario] = await Promise.all([
    database.evaluations.readBySession(session.id),
    session.scenarioId ? database.scenarios.readInterview(session.scenarioId) : Promise.resolve(null),
  ]);
  const context = scenario
    ? interviewScenarioQuerySchema.safeParse({
        role: scenario.promptContext.role,
        experienceLevel: scenario.promptContext.experienceLevel,
        technologyArea: scenario.promptContext.technologyArea,
        difficulty: scenario.difficulty,
      })
    : null;

  return {
    id: session.id,
    createdAt: session.createdAt,
    status: session.status,
    answer: {
      scenarioId: session.scenarioId,
      content: session.userAnswer,
      inputMode: session.inputMode,
      durationSeconds: session.durationSeconds ?? 0,
    },
    scenario: scenario && context?.success
      ? {
          id: scenario.id,
          question: scenario.description ?? scenario.title,
          ...context.data,
        }
      : null,
    evaluation: toInterviewEvaluation(evaluation),
  };
}

export async function GET(request: NextRequest) {
  try {
    const database = await getServerDatabase();
    if (request.nextUrl.searchParams.get('view') === 'attempts') {
      const sessions = await database.sessions.list({ moduleType: 'interview', limit: ATTEMPT_LIMIT });
      const attempts = await Promise.all(sessions.map((session) => interviewAttemptResponse(database, session)));
      return NextResponse.json({ attempts });
    }

    const query = interviewScenarioQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    await enforceRateLimit(database.client, 'interview:scenario', 60);
    const scenarios = await database.scenarios.listInterview(query);
    const scenario = scenarios.find((item) => item.id !== query.excludeScenarioId) ?? scenarios[0];
    if (!scenario) return NextResponse.json({ error: 'No matching interview scenario found.' }, { status: 404 });
    return NextResponse.json({
      scenario: {
        id: scenario.id,
        question: scenario.description ?? scenario.title,
        role: query.role,
        experienceLevel: query.experienceLevel,
        technologyArea: query.technologyArea,
        difficulty: query.difficulty,
      },
    });
  } catch (error) {
    return aiRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  let database: Awaited<ReturnType<typeof getServerDatabase>> | null = null;
  let sessionId: string | null = null;

  try {
    database = await getServerDatabase();
    await enforceRateLimit(database.client, 'interview:evaluate', 10);
    const input = await readJsonWithLimit(request, interviewRequestSchema, 24_000);
    const scenario = await database.scenarios.readInterview(input.scenarioId);
    if (!scenario) return NextResponse.json({ error: 'Interview scenario not found.' }, { status: 404 });
    const context = interviewScenarioQuerySchema.parse({
      role: scenario.promptContext.role,
      experienceLevel: scenario.promptContext.experienceLevel,
      technologyArea: scenario.promptContext.technologyArea,
      difficulty: scenario.difficulty,
    });
    const question = scenario.description ?? scenario.title;
    const session = await database.sessions.create({
      moduleType: 'interview',
      scenarioId: scenario.id,
      clientRequestId: input.clientRequestId,
      inputMode: input.inputMode,
      userAnswer: input.answer,
      transcript: input.inputMode === 'voice' ? input.answer : null,
      durationSeconds: input.durationSeconds,
      status: 'processing',
    });
    sessionId = session.id;

    const storedEvaluation = toInterviewEvaluation(await database.evaluations.readBySession(session.id));
    if (storedEvaluation) {
      if (session.status !== 'completed') {
        await database.sessions.update(session.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationSeconds: input.durationSeconds,
        });
      }
      return NextResponse.json({ sessionId: session.id, evaluation: storedEvaluation });
    }
    await database.sessions.update(session.id, {
      status: 'processing',
      userAnswer: input.answer,
      transcript: input.inputMode === 'voice' ? input.answer : null,
      completedAt: null,
      durationSeconds: input.durationSeconds,
    });
    const profile = await database.profiles.read();

    const result = await evaluateStructured({
      prompt: buildInterviewPrompt({
        ...context,
        question,
        answer: input.answer,
        profile: {
          jobTitle: profile?.jobTitle ?? null,
          englishLevel: profile?.englishLevel ?? null,
        },
      }),
      schema: interviewResponseSchema,
      mode: 'deep',
      promptVersion: INTERVIEW_PROMPT_VERSION,
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
      promptVersion: INTERVIEW_PROMPT_VERSION,
      schemaVersion: INTERVIEW_SCHEMA_VERSION,
      modelName: result.model,
      details: {
        technicalScore: result.data.technicalScore,
        communicationScore: result.data.communicationScore,
        recommendedPhrasing: result.data.recommendedPhrasing,
      },
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
        console.error('Failed to mark interview session as failed:', updateError);
      }
    }
    return aiRouteError(error);
  }
}
