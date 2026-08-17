import 'server-only';
import { z } from 'zod';
import { getServerDatabase } from '@/lib/database/server';
import { getAiConfig, type AiResponseMode } from './config';
import { normalizeAiError } from './errors';
import { generateStructured, type StructuredGeneration } from './generate';
import { evaluationResultSchema, type EvaluationResult } from './schemas';

export interface EvaluateInput<T> {
  prompt: string;
  schema: z.ZodType<T>;
  mode: AiResponseMode;
  promptVersion: string;
  systemInstruction?: string;
  sessionId?: string;
}

async function persistAiRun(
  sessionId: string,
  input: Parameters<Awaited<ReturnType<typeof getServerDatabase>>['aiRuns']['create']>[0]
) {
  try {
    const database = await getServerDatabase();
    await database.aiRuns.create({ ...input, sessionId });
  } catch (error) {
    console.error('AI run logging failed:', error);
  }
}

export async function evaluateStructured<T>(input: EvaluateInput<T>): Promise<StructuredGeneration<T>> {
  const startedAt = performance.now();
  try {
    const result = await generateStructured(input);
    if (input.sessionId) {
      await persistAiRun(input.sessionId, {
        sessionId: input.sessionId,
        provider: result.provider,
        model: result.model,
        promptVersion: input.promptVersion,
        status: 'completed',
        providerRequestId: result.providerRequestId,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      });
    }
    return result;
  } catch (error) {
    const aiError = normalizeAiError(error);
    if (input.sessionId) {
      let model = 'unknown';
      try {
        model = getAiConfig().models[input.mode];
      } catch {
        // Configuration errors are recorded without exposing secret values.
      }
      await persistAiRun(input.sessionId, {
        sessionId: input.sessionId,
        provider: 'gemini',
        model,
        promptVersion: input.promptVersion,
        status: 'failed',
        latencyMs: Math.round(performance.now() - startedAt),
        errorCode: aiError.code,
      });
    }
    throw aiError;
  }
}

export function evaluateCommunication(input: Omit<EvaluateInput<EvaluationResult>, 'schema'>) {
  return evaluateStructured({ ...input, schema: evaluationResultSchema });
}
