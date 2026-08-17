import { z } from 'zod';

export const writingTaskTypeSchema = z.enum([
  'readme',
  'pull_request',
  'bug_report',
  'slack_message',
  'technical_documentation',
]);

export const writingAnswerSchema = z.object({
  taskType: writingTaskTypeSchema,
  content: z.string().trim().min(1).max(20000),
}).strict();

export const writingRequestSchema = writingAnswerSchema.extend({
  clientRequestId: z.string().uuid(),
  durationSeconds: z.number().int().nonnegative().max(14400).nullable().optional(),
});

export type WritingTaskType = z.infer<typeof writingTaskTypeSchema>;
export type WritingAnswer = z.infer<typeof writingAnswerSchema>;
export type WritingRequest = z.infer<typeof writingRequestSchema>;
