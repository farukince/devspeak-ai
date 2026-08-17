import 'server-only';
import { z } from 'zod';
import { getAiClient } from './client';
import { getAiConfig, type AiResponseMode } from './config';
import { AiError, normalizeAiError } from './errors';

export interface StructuredGeneration<T> {
  data: T;
  provider: 'gemini';
  model: string;
  providerRequestId: string | null;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function generateStructured<T>(input: {
  prompt: string;
  schema: z.ZodType<T>;
  mode: AiResponseMode;
  systemInstruction?: string;
}): Promise<StructuredGeneration<T>> {
  const config = getAiConfig();
  const model = config.models[input.mode];
  const jsonSchema = z.toJSONSchema(input.schema, { target: 'draft-7' }) as Record<string, unknown>;
  delete jsonSchema.$schema;

  let lastError: AiError | undefined;
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    const startedAt = performance.now();
    try {
      const response = await getAiClient().interactions.create({
        model,
        input: input.prompt,
        system_instruction: input.systemInstruction,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: jsonSchema,
        },
        generation_config: { temperature: 0.2 },
      }, { timeout: config.timeoutMs, maxRetries: 0 });

      if (!response.output_text) {
        throw new AiError('AI_INVALID_RESPONSE', 'The AI provider returned an empty response.', false, 502);
      }

      const parsedJson: unknown = JSON.parse(response.output_text);
      const data = input.schema.parse(parsedJson);
      return {
        data,
        provider: 'gemini',
        model,
        providerRequestId: response.id ?? null,
        latencyMs: Math.round(performance.now() - startedAt),
        inputTokens: response.usage?.total_input_tokens ?? null,
        outputTokens: response.usage?.total_output_tokens ?? null,
      };
    } catch (error) {
      lastError = normalizeAiError(error);
      if (!lastError.retryable || attempt === config.maxRetries) throw lastError;
      await wait(250 * (2 ** attempt));
    }
  }

  throw lastError ?? new AiError('AI_PROVIDER_ERROR', 'The AI provider request failed.', false, 500);
}
