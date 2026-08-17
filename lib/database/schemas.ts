import { z } from 'zod';

export const moduleTypeSchema = z.enum(['standup', 'writing', 'interview', 'code_review', 'pair_programming']);
export const inputModeSchema = z.enum(['written', 'voice']);
export const sessionStatusSchema = z.enum(['draft', 'processing', 'completed', 'failed']);
export const experienceLevelSchema = z.enum(['Junior', 'Mid-level', 'Senior', 'Lead']);
export const englishLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(100).nullable().optional(),
  jobTitle: z.string().trim().min(2).max(100).nullable().optional(),
  experienceLevel: experienceLevelSchema.nullable().optional(),
  englishLevel: englishLevelSchema.nullable().optional(),
  nativeLanguage: z.string().trim().min(2).max(80).nullable().optional(),
  timezone: z.string().trim().min(1).max(100).nullable().optional(),
  onboardingCompletedAt: z.string().datetime().nullable().optional(),
});

export const onboardingInputSchema = profileInputSchema.required({
  displayName: true,
  jobTitle: true,
  experienceLevel: true,
  englishLevel: true,
  nativeLanguage: true,
  timezone: true,
}).extend({
  displayName: z.string().trim().min(2).max(100),
  jobTitle: z.string().trim().min(2).max(100),
  experienceLevel: experienceLevelSchema,
  englishLevel: englishLevelSchema,
  nativeLanguage: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(1).max(100),
});

export const profileRowSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable(),
  job_title: z.string().nullable(),
  experience_level: z.string().nullable(),
  english_level: z.string().nullable(),
  native_language: z.string().nullable(),
  timezone: z.string().nullable(),
  onboarding_completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const practiceSessionRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  module_type: moduleTypeSchema,
  scenario_id: z.string().uuid().nullable(),
  client_request_id: z.string().uuid(),
  input_mode: inputModeSchema,
  user_answer: z.string(),
  transcript: z.string().nullable(),
  status: sessionStatusSchema,
  started_at: z.string(),
  completed_at: z.string().nullable(),
  duration_seconds: z.number().int().nonnegative().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const scenarioRowSchema = z.object({
  id: z.string().uuid(),
  module_type: moduleTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  prompt_context: z.record(z.string(), z.unknown()),
  difficulty: z.string().nullable(),
  is_active: z.boolean(),
});

export const evaluationRowSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  overall_score: z.coerce.number().min(0).max(100),
  category_scores: z.record(z.string(), z.coerce.number().min(0).max(100)),
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  improved_answer: z.string(),
  next_exercise: z.string().nullable(),
  prompt_version: z.string(),
  schema_version: z.string(),
  model_name: z.string(),
  details: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
});

export const createPracticeSessionSchema = z.object({
  moduleType: moduleTypeSchema,
  scenarioId: z.string().uuid().nullable().optional(),
  clientRequestId: z.string().uuid(),
  inputMode: inputModeSchema.optional(),
  userAnswer: z.string().trim().min(1).max(20000),
  transcript: z.string().max(20000).nullable().optional(),
  status: sessionStatusSchema.optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
});

export const createEvaluationSchema = z.object({
  sessionId: z.string().uuid(),
  overallScore: z.number().min(0).max(100),
  categoryScores: z.record(z.string(), z.number().min(0).max(100)),
  summary: z.string().trim().min(1).max(5000),
  strengths: z.array(z.string().trim().min(1)).max(20),
  improvements: z.array(z.string().trim().min(1)).max(20),
  improvedAnswer: z.string().max(20000),
  nextExercise: z.string().max(5000).nullable().optional(),
  promptVersion: z.string().trim().min(1).max(100),
  schemaVersion: z.string().trim().min(1).max(100),
  modelName: z.string().trim().min(1).max(200),
  details: z.record(z.string(), z.unknown()).optional(),
});
