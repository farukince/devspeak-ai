import { z } from 'zod';

export const standupAnswerSchema = z.object({
  yesterday: z.string().trim().max(5000).default(''),
  today: z.string().trim().max(5000).default(''),
  blockers: z.string().trim().max(5000).default(''),
}).strict();

export const standupRequestSchema = standupAnswerSchema.extend({
  clientRequestId: z.string().uuid(),
  inputMode: z.enum(['written', 'voice']).default('written'),
  transcript: z.string().trim().max(20000).nullable().default(null),
  durationSeconds: z.number().int().nonnegative().max(3600).nullable().optional(),
}).refine(
  ({ yesterday, today, blockers }) => Boolean(yesterday || today || blockers),
  { message: 'At least one stand-up field is required.' }
).refine(
  ({ inputMode, transcript }) => inputMode !== 'voice' || Boolean(transcript),
  { message: 'Voice mode requires a transcript.' }
);

export type StandupRequest = z.infer<typeof standupRequestSchema>;
export type StandupAnswer = z.infer<typeof standupAnswerSchema>;
