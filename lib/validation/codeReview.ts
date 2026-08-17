import { z } from 'zod';

const reviewerAnswerSchema = z.object({
  role: z.literal('reviewer'),
  userReview: z.string().trim().min(1).max(20000),
  codeToReview: z.string().trim().min(1).max(30000),
}).strict();

const authorAnswerSchema = z.object({
  role: z.literal('author'),
  codeToReview: z.string().trim().min(1).max(30000),
}).strict();

export const codeReviewAnswerSchema = z.discriminatedUnion('role', [
  reviewerAnswerSchema,
  authorAnswerSchema,
]);

const requestMetadata = {
  clientRequestId: z.string().uuid(),
  durationSeconds: z.number().int().nonnegative().max(14400),
};

export const codeReviewRequestSchema = z.discriminatedUnion('role', [
  reviewerAnswerSchema.extend(requestMetadata),
  authorAnswerSchema.extend(requestMetadata),
]);

export type CodeReviewAnswer = z.infer<typeof codeReviewAnswerSchema>;
export type CodeReviewRequest = z.infer<typeof codeReviewRequestSchema>;
