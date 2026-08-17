import 'server-only';
import { z } from 'zod';
import { getAiClient } from './client';
import { getAiConfig } from './config';
import { AiError, normalizeAiError } from './errors';
import { estimateTranscriptionCost } from './cost';

export const TRANSCRIPTION_PROMPT_VERSION = 'voice-transcription-v1';
const transcriptSchema = z.object({ transcript: z.string().trim().min(1).max(20000) }).strict();

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function transcribeAudio(input: { bytes: Uint8Array; mimeType: string }) {
  const config = getAiConfig();
  const model = config.models.fast;
  const jsonSchema = z.toJSONSchema(transcriptSchema, { target: 'draft-7' }) as Record<string, unknown>;
  delete jsonSchema.$schema;
  let lastError: AiError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    const startedAt = performance.now();
    try {
      const response = await getAiClient().models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { text: 'Transcribe the spoken English audio verbatim. Preserve technical terms, punctuation, and sentence boundaries. Do not translate, evaluate, summarize, or add commentary.' },
            { inlineData: { mimeType: input.mimeType, data: Buffer.from(input.bytes).toString('base64') } },
          ],
        }],
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseJsonSchema: jsonSchema,
          httpOptions: { timeout: 60_000 },
        },
      });
      if (!response.text) throw new AiError('AI_INVALID_RESPONSE', 'The transcription provider returned an empty response.', false, 502);
      const data = transcriptSchema.parse(JSON.parse(response.text));
      const inputTokens = response.usageMetadata?.promptTokenCount ?? null;
      const outputTokens = response.usageMetadata?.candidatesTokenCount ?? null;
      return {
        transcript: data.transcript,
        provider: 'gemini' as const,
        model,
        providerRequestId: response.responseId ?? null,
        latencyMs: Math.round(performance.now() - startedAt),
        inputTokens,
        outputTokens,
        estimatedCost: estimateTranscriptionCost(model, inputTokens, outputTokens),
      };
    } catch (error) {
      lastError = normalizeAiError(error);
      if (!lastError.retryable || attempt === config.maxRetries) throw lastError;
      await wait(250 * (2 ** attempt));
    }
  }
  throw lastError ?? new AiError('AI_PROVIDER_ERROR', 'Audio transcription failed.', false, 500);
}
