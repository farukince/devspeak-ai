import { z } from 'zod';

export const interviewRoleSchema = z.enum(['frontend_engineer', 'backend_engineer', 'devops_engineer']);
export const interviewExperienceSchema = z.enum(['junior', 'mid', 'senior']);
export const interviewDifficultySchema = z.enum(['medium', 'hard']);
export const interviewTechnologySchema = z.enum([
  'react',
  'web_performance',
  'nodejs',
  'api_design',
  'containers',
  'cicd',
]);
export const interviewInputModeSchema = z.enum(['written', 'voice']);

export const interviewScenarioQuerySchema = z.object({
  role: interviewRoleSchema,
  experienceLevel: interviewExperienceSchema,
  technologyArea: interviewTechnologySchema,
  difficulty: interviewDifficultySchema,
  excludeScenarioId: z.string().uuid().optional(),
}).strict();

export const interviewAnswerSchema = z.object({
  scenarioId: z.string().uuid(),
  answer: z.string().trim().min(1).max(20000),
  inputMode: interviewInputModeSchema,
  durationSeconds: z.number().int().min(0).max(3600),
}).strict();

export const interviewRequestSchema = interviewAnswerSchema.extend({
  clientRequestId: z.string().uuid(),
});

export type InterviewRole = z.infer<typeof interviewRoleSchema>;
export type InterviewExperience = z.infer<typeof interviewExperienceSchema>;
export type InterviewDifficulty = z.infer<typeof interviewDifficultySchema>;
export type InterviewTechnology = z.infer<typeof interviewTechnologySchema>;
export type InterviewInputMode = z.infer<typeof interviewInputModeSchema>;
export type InterviewScenarioQuery = z.infer<typeof interviewScenarioQuerySchema>;
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;
