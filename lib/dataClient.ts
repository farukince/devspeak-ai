import { createClient } from '@/lib/auth/client';
import {
  createEvaluation as createEvaluationRecord,
  createPracticeSession as createPracticeSessionRecord,
  createProfile,
  listPracticeSessions,
  readEvaluationBySession,
  readProfile,
  updatePracticeSession,
  updateProfile,
} from '@/lib/database/repository';
import type {
  CreateEvaluationInput,
  CreatePracticeSessionInput,
  CreateProfileInput,
  EvaluationRecord,
  PracticeSessionRecord,
  ProfileRecord,
} from '@/lib/database/types';

export type { EvaluationRecord, PracticeSessionRecord } from '@/lib/database/types';

export interface PracticeSession {
  userId: string;
  sessionId: string;
  createdAt: string;
  moduleType: string;
  taskName?: string;
  scores?: Record<string, number>;
  userInput: string;
  aiFeedback: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  birthday?: string;
  experienceLevel?: string;
  englishLevel?: string;
  nativeLanguage?: string;
  timezone?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

async function authenticatedClient(expectedUserId?: string) {
  const client = createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Authentication required.');
  if (expectedUserId && data.user.id !== expectedUserId) throw new Error('You cannot access another user’s data.');
  return { client, user: data.user };
}

function profileInput(profile: Partial<UserProfile>): CreateProfileInput {
  const input: CreateProfileInput = {};
  if (profile.fullName !== undefined || profile.firstName !== undefined || profile.lastName !== undefined) {
    input.displayName = profile.fullName
      ?? ([profile.firstName, profile.lastName].filter(Boolean).join(' ') || null);
  }
  if (profile.jobTitle !== undefined) input.jobTitle = profile.jobTitle;
  if (profile.experienceLevel !== undefined) input.experienceLevel = profile.experienceLevel;
  if (profile.englishLevel !== undefined) input.englishLevel = profile.englishLevel;
  if (profile.nativeLanguage !== undefined) input.nativeLanguage = profile.nativeLanguage;
  if (profile.timezone !== undefined) input.timezone = profile.timezone;
  if (profile.onboardingCompleted !== undefined) {
    input.onboardingCompletedAt = profile.onboardingCompleted ? new Date().toISOString() : null;
  }
  return input;
}

function mapProfile(
  profile: ProfileRecord,
  email: string
): UserProfile {
  const displayParts = profile.displayName?.trim().split(/\s+/) ?? [];
  return {
    userId: profile.id,
    email,
    firstName: displayParts[0],
    lastName: displayParts.length > 1 ? displayParts.slice(1).join(' ') : undefined,
    fullName: profile.displayName ?? undefined,
    jobTitle: profile.jobTitle ?? undefined,
    experienceLevel: profile.experienceLevel ?? undefined,
    englishLevel: profile.englishLevel ?? undefined,
    nativeLanguage: profile.nativeLanguage ?? undefined,
    timezone: profile.timezone ?? undefined,
    onboardingCompleted: Boolean(profile.onboardingCompletedAt),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function overallScore(scores?: Record<string, number>) {
  if (!scores) return 0;
  if (typeof scores.overall === 'number') return scores.overall;
  const values = Object.values(scores).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function mapLegacySession(session: PracticeSessionRecord, evaluation: EvaluationRecord | null): PracticeSession {
  return {
    userId: session.userId,
    sessionId: session.id,
    createdAt: session.createdAt,
    moduleType: session.moduleType,
    scores: evaluation ? { overall: evaluation.overallScore, ...evaluation.categoryScores } : undefined,
    userInput: session.userAnswer,
    aiFeedback: evaluation?.summary ?? '',
  };
}

export async function createSession(input: CreatePracticeSessionInput): Promise<PracticeSessionRecord> {
  const { client, user } = await authenticatedClient();
  return createPracticeSessionRecord(client, user.id, input);
}

export async function saveEvaluation(input: CreateEvaluationInput): Promise<EvaluationRecord> {
  const { client, user } = await authenticatedClient();
  return createEvaluationRecord(client, user.id, input);
}

export async function getSessionEvaluation(sessionId: string): Promise<EvaluationRecord | null> {
  const { client, user } = await authenticatedClient();
  return readEvaluationBySession(client, user.id, sessionId);
}

export async function insertPracticeSession(
  session: Omit<PracticeSession, 'sessionId' | 'createdAt'> & {
    clientRequestId?: string;
    durationSeconds?: number;
  }
): Promise<PracticeSession> {
  const { client, user } = await authenticatedClient(session.userId);
  const saved = await createPracticeSessionRecord(client, user.id, {
    moduleType: session.moduleType as CreatePracticeSessionInput['moduleType'],
    clientRequestId: session.clientRequestId ?? crypto.randomUUID(),
    userAnswer: session.userInput,
    status: 'processing',
    durationSeconds: session.durationSeconds,
  });

  try {
    const categoryScores = Object.fromEntries(
      Object.entries(session.scores ?? {}).filter(([name]) => name !== 'overall')
    );
    const evaluation = await createEvaluationRecord(client, user.id, {
      sessionId: saved.id,
      overallScore: overallScore(session.scores),
      categoryScores,
      summary: session.aiFeedback,
      strengths: [],
      improvements: [],
      improvedAnswer: session.userInput,
      promptVersion: 'legacy-v1',
      schemaVersion: '1',
      modelName: 'legacy',
    });
    const completed = await updatePracticeSession(client, user.id, saved.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      durationSeconds: session.durationSeconds,
    });
    return mapLegacySession(completed, evaluation);
  } catch (error) {
    await updatePracticeSession(client, user.id, saved.id, { status: 'failed' });
    throw error;
  }
}

export async function getUserPracticeSessions(userId: string): Promise<PracticeSession[]> {
  const { client, user } = await authenticatedClient(userId);
  const sessions = await listPracticeSessions(client, user.id);
  const withEvaluations = await Promise.all(
    sessions.map(async (session) => mapLegacySession(
      session,
      await readEvaluationBySession(client, user.id, session.id)
    ))
  );
  return withEvaluations.reverse();
}

export async function getUserSessionsByModule(userId: string, moduleType: string): Promise<PracticeSession[]> {
  const { client, user } = await authenticatedClient(userId);
  const sessions = await listPracticeSessions(client, user.id, { moduleType });
  return Promise.all(sessions.map(async (session) => mapLegacySession(
    session,
    await readEvaluationBySession(client, user.id, session.id)
  )));
}

export async function getRecentSessions(userId: string, limit = 5): Promise<PracticeSession[]> {
  const { client, user } = await authenticatedClient(userId);
  const sessions = await listPracticeSessions(client, user.id, { limit });
  return Promise.all(sessions.map(async (session) => mapLegacySession(
    session,
    await readEvaluationBySession(client, user.id, session.id)
  )));
}

export async function createUserProfile(
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>
): Promise<UserProfile> {
  const { client, user } = await authenticatedClient(profile.userId);
  const saved = await createProfile(client, user.id, profileInput(profile));
  return mapProfile(saved, user.email ?? profile.email);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { client, user } = await authenticatedClient(userId);
  const profile = await readProfile(client, user.id);
  return profile ? mapProfile(profile, user.email ?? '') : null;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const { client, user } = await authenticatedClient(userId);
  const saved = await updateProfile(client, user.id, profileInput(updates));
  return mapProfile(saved, user.email ?? updates.email ?? '');
}
