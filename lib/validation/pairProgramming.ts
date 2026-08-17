import { z } from 'zod';

const driverAnswerSchema = z.object({
  role: z.literal('driver'),
  task: z.string().trim().min(1).max(5000),
  code: z.string().trim().min(1).max(30000),
}).strict();

const navigatorAnswerSchema = z.object({
  role: z.literal('navigator'),
  instruction: z.string().trim().min(1).max(10000),
  code: z.string().trim().min(1).max(30000),
}).strict();

export const pairProgrammingAnswerSchema = z.discriminatedUnion('role', [
  driverAnswerSchema,
  navigatorAnswerSchema,
]);

const requestMetadata = {
  clientRequestId: z.string().uuid(),
  durationSeconds: z.number().int().nonnegative().max(14400),
};

export const pairProgrammingRequestSchema = z.discriminatedUnion('role', [
  driverAnswerSchema.extend(requestMetadata),
  navigatorAnswerSchema.extend(requestMetadata),
]);

export type PairProgrammingAnswer = z.infer<typeof pairProgrammingAnswerSchema>;
