import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createEvaluationSchema,
  createPracticeSessionSchema,
  evaluationRowSchema,
  profileInputSchema,
  practiceSessionRowSchema,
  profileRowSchema,
  scenarioRowSchema,
} from './schemas';
import type {
  CreateEvaluationInput,
  CreateAiRunInput,
  CreatePracticeSessionInput,
  CreateProfileInput,
  DashboardSessionRecord,
  EvaluationRecord,
  PracticeSessionRecord,
  ProfileRecord,
  ScenarioRecord,
  UpdatePracticeSessionInput,
} from './types';

function databaseError(operation: string, error: { message: string; code?: string | null }) {
  return new Error(`${operation} failed: ${error.message}${error.code ? ` (${error.code})` : ''}`);
}

function mapProfile(value: unknown): ProfileRecord {
  const row = profileRowSchema.parse(value);
  return {
    id: row.id,
    displayName: row.display_name,
    jobTitle: row.job_title,
    experienceLevel: row.experience_level,
    englishLevel: row.english_level,
    nativeLanguage: row.native_language,
    timezone: row.timezone,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPracticeSession(value: unknown): PracticeSessionRecord {
  const row = practiceSessionRowSchema.parse(value);
  return {
    id: row.id,
    userId: row.user_id,
    moduleType: row.module_type,
    scenarioId: row.scenario_id,
    clientRequestId: row.client_request_id,
    inputMode: row.input_mode,
    userAnswer: row.user_answer,
    transcript: row.transcript,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScenario(value: unknown): ScenarioRecord {
  const row = scenarioRowSchema.parse(value);
  return {
    id: row.id,
    moduleType: row.module_type,
    title: row.title,
    description: row.description,
    promptContext: row.prompt_context,
    difficulty: row.difficulty,
    isActive: row.is_active,
  };
}

function mapEvaluation(value: unknown): EvaluationRecord {
  const row = evaluationRowSchema.parse(value);
  return {
    id: row.id,
    sessionId: row.session_id,
    overallScore: row.overall_score,
    categoryScores: row.category_scores,
    summary: row.summary,
    strengths: row.strengths,
    improvements: row.improvements,
    improvedAnswer: row.improved_answer,
    nextExercise: row.next_exercise,
    promptVersion: row.prompt_version,
    schemaVersion: row.schema_version,
    modelName: row.model_name,
    details: row.details,
    createdAt: row.created_at,
  };
}

export async function createProfile(
  client: SupabaseClient,
  userId: string,
  input: CreateProfileInput
): Promise<ProfileRecord> {
  const profile = profileInputSchema.parse(input);
  const { data, error } = await client
    .from('profiles')
    .insert({
      id: userId,
      display_name: profile.displayName ?? null,
      job_title: profile.jobTitle ?? null,
      experience_level: profile.experienceLevel ?? null,
      english_level: profile.englishLevel ?? null,
      native_language: profile.nativeLanguage ?? null,
      timezone: profile.timezone ?? null,
      onboarding_completed_at: profile.onboardingCompletedAt ?? null,
    })
    .select('*')
    .single();
  if (error) throw databaseError('Create profile', error);
  return mapProfile(data);
}

export async function readProfile(client: SupabaseClient, userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw databaseError('Read profile', error);
  return data ? mapProfile(data) : null;
}

export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  input: Partial<CreateProfileInput>
): Promise<ProfileRecord> {
  const profile = profileInputSchema.parse(input);
  const updates: Record<string, string | null> = {};
  if (profile.displayName !== undefined) updates.display_name = profile.displayName;
  if (profile.jobTitle !== undefined) updates.job_title = profile.jobTitle;
  if (profile.experienceLevel !== undefined) updates.experience_level = profile.experienceLevel;
  if (profile.englishLevel !== undefined) updates.english_level = profile.englishLevel;
  if (profile.nativeLanguage !== undefined) updates.native_language = profile.nativeLanguage;
  if (profile.timezone !== undefined) updates.timezone = profile.timezone;
  if (profile.onboardingCompletedAt !== undefined) updates.onboarding_completed_at = profile.onboardingCompletedAt;

  const { data, error } = await client.from('profiles').update(updates).eq('id', userId).select('*').single();
  if (error) throw databaseError('Update profile', error);
  return mapProfile(data);
}

export async function createPracticeSession(
  client: SupabaseClient,
  userId: string,
  rawInput: CreatePracticeSessionInput
): Promise<PracticeSessionRecord> {
  const input = createPracticeSessionSchema.parse(rawInput);
  const { data, error } = await client
    .from('practice_sessions')
    .insert({
      user_id: userId,
      module_type: input.moduleType,
      scenario_id: input.scenarioId ?? null,
      client_request_id: input.clientRequestId,
      input_mode: input.inputMode ?? 'written',
      user_answer: input.userAnswer,
      transcript: input.transcript ?? null,
      status: input.status ?? 'processing',
      started_at: input.startedAt ?? new Date().toISOString(),
      completed_at: input.completedAt ?? null,
      duration_seconds: input.durationSeconds ?? null,
    })
    .select('*')
    .single();
  if (error?.code === '23505') {
    const { data: existing, error: existingError } = await client
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('client_request_id', input.clientRequestId)
      .single();
    if (existingError) throw databaseError('Read idempotent practice session', existingError);
    return mapPracticeSession(existing);
  }
  if (error) throw databaseError('Create practice session', error);
  return mapPracticeSession(data);
}

export async function listInterviewScenarios(
  client: SupabaseClient,
  filters: { role: string; experienceLevel: string; technologyArea: string; difficulty: string }
): Promise<ScenarioRecord[]> {
  const { data, error } = await client
    .from('scenarios')
    .select('id,module_type,title,description,prompt_context,difficulty,is_active')
    .eq('module_type', 'interview')
    .eq('is_active', true)
    .eq('difficulty', filters.difficulty)
    .contains('prompt_context', {
      role: filters.role,
      experienceLevel: filters.experienceLevel,
      technologyArea: filters.technologyArea,
    })
    .order('title');
  if (error) throw databaseError('List interview scenarios', error);
  return (data ?? []).map(mapScenario);
}

export async function readInterviewScenario(client: SupabaseClient, scenarioId: string): Promise<ScenarioRecord | null> {
  const { data, error } = await client
    .from('scenarios')
    .select('id,module_type,title,description,prompt_context,difficulty,is_active')
    .eq('id', scenarioId)
    .eq('module_type', 'interview')
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw databaseError('Read interview scenario', error);
  return data ? mapScenario(data) : null;
}

export async function listPracticeSessions(
  client: SupabaseClient,
  userId: string,
  options: { moduleType?: string; limit?: number } = {}
): Promise<PracticeSessionRecord[]> {
  let query = client
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (options.moduleType) query = query.eq('module_type', options.moduleType);
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw databaseError('List practice sessions', error);
  return (data ?? []).map(mapPracticeSession);
}

export async function listCompletedDashboardSessions(
  client: SupabaseClient,
  userId: string
): Promise<DashboardSessionRecord[]> {
  const { data: sessionRows, error: sessionError } = await client
    .from('practice_sessions')
    .select('id,module_type,created_at,completed_at,duration_seconds')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (sessionError) throw databaseError('List completed dashboard sessions', sessionError);
  if (!sessionRows?.length) return [];

  const sessionIds = sessionRows.map((session) => session.id);
  const { data: evaluationRows, error: evaluationError } = await client
    .from('evaluations')
    .select('*')
    .in('session_id', sessionIds);
  if (evaluationError) throw databaseError('List dashboard evaluations', evaluationError);
  const evaluations = new Map((evaluationRows ?? []).map((row) => {
    const evaluation = mapEvaluation(row);
    return [evaluation.sessionId, evaluation] as const;
  }));

  return sessionRows.map((session) => {
    const evaluation = evaluations.get(session.id);
    return {
      id: session.id,
      moduleType: session.module_type as DashboardSessionRecord['moduleType'],
      createdAt: session.created_at,
      completedAt: session.completed_at,
      durationSeconds: session.duration_seconds,
      overallScore: evaluation?.overallScore ?? null,
      summary: evaluation?.summary ?? null,
    };
  });
}

export async function updatePracticeSession(
  client: SupabaseClient,
  userId: string,
  sessionId: string,
  input: UpdatePracticeSessionInput
): Promise<PracticeSessionRecord> {
  const updates: Record<string, string | number | null> = {};
  if (input.status !== undefined) updates.status = input.status;
  if (input.userAnswer !== undefined) updates.user_answer = input.userAnswer;
  if (input.transcript !== undefined) updates.transcript = input.transcript;
  if (input.completedAt !== undefined) updates.completed_at = input.completedAt;
  if (input.durationSeconds !== undefined) updates.duration_seconds = input.durationSeconds;
  const { data, error } = await client
    .from('practice_sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw databaseError('Update practice session', error);
  return mapPracticeSession(data);
}

export async function createEvaluation(
  client: SupabaseClient,
  userId: string,
  rawInput: CreateEvaluationInput
): Promise<EvaluationRecord> {
  const input = createEvaluationSchema.parse(rawInput);
  const { data: ownedSession, error: ownershipError } = await client
    .from('practice_sessions')
    .select('id')
    .eq('id', input.sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownershipError) throw databaseError('Verify session ownership', ownershipError);
  if (!ownedSession) throw new Error('Practice session not found.');

  const { data, error } = await client
    .from('evaluations')
    .insert({
      session_id: input.sessionId,
      overall_score: input.overallScore,
      category_scores: input.categoryScores,
      summary: input.summary,
      strengths: input.strengths,
      improvements: input.improvements,
      improved_answer: input.improvedAnswer,
      next_exercise: input.nextExercise ?? null,
      prompt_version: input.promptVersion,
      schema_version: input.schemaVersion,
      model_name: input.modelName,
      details: input.details ?? {},
    })
    .select('*')
    .single();
  if (error) throw databaseError('Create evaluation', error);
  return mapEvaluation(data);
}

export async function readEvaluationBySession(
  client: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<EvaluationRecord | null> {
  const { data: ownedSession, error: ownershipError } = await client
    .from('practice_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownershipError) throw databaseError('Verify session ownership', ownershipError);
  if (!ownedSession) return null;
  const { data, error } = await client.from('evaluations').select('*').eq('session_id', sessionId).maybeSingle();
  if (error) throw databaseError('Read evaluation', error);
  return data ? mapEvaluation(data) : null;
}

export async function createAiRun(
  client: SupabaseClient,
  userId: string,
  input: CreateAiRunInput
): Promise<void> {
  const { data: ownedSession, error: ownershipError } = await client
    .from('practice_sessions')
    .select('id')
    .eq('id', input.sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownershipError) throw databaseError('Verify AI run session ownership', ownershipError);
  if (!ownedSession) throw new Error('Practice session not found.');

  const { error } = await client.from('ai_runs').insert({
    session_id: input.sessionId,
    provider: input.provider,
    model: input.model,
    prompt_version: input.promptVersion,
    status: input.status,
    provider_request_id: input.providerRequestId ?? null,
    latency_ms: input.latencyMs ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    estimated_cost: input.estimatedCost ?? null,
    error_code: input.errorCode ?? null,
  });
  if (error) throw databaseError('Create AI run', error);
}
