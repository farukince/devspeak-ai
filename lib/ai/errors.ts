import { z } from 'zod';

export type AiErrorCode =
  | 'AI_CONFIGURATION_ERROR'
  | 'AI_AUTHENTICATION_ERROR'
  | 'AI_RATE_LIMITED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_PROVIDER_ERROR';

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = 'AiError';
  }
}

function statusFromError(error: unknown) {
  if (!error || typeof error !== 'object') return undefined;
  for (const key of ['status', 'statusCode', 'code']) {
    const value = Reflect.get(error, key);
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d{3}$/.test(value)) return Number(value);
  }
  return undefined;
}

function errorMessageChain(error: unknown) {
  const messages: string[] = [];
  let current = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) messages.push(current.message);
    if (typeof current !== 'object') break;
    current = Reflect.get(current, 'cause');
  }
  return messages.join(' ');
}

export function normalizeAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return new AiError('AI_INVALID_RESPONSE', 'The AI response did not match the required schema.', false, 502, { cause: error });
  }

  const status = statusFromError(error);
  const message = error instanceof Error ? error.message : 'Unknown AI provider error.';
  const messageChain = errorMessageChain(error) || message;
  const timeout = error instanceof Error && (
    error.name === 'AbortError'
    || error.name === 'TimeoutError'
    || /timed? ?out|timeout/i.test(messageChain)
  );
  if (timeout) return new AiError('AI_TIMEOUT', 'The AI provider timed out.', true, 504, { cause: error });
  if (status === 401 || status === 403) return new AiError('AI_AUTHENTICATION_ERROR', 'The AI provider rejected its credentials.', false, status, { cause: error });
  if (status === 429) return new AiError('AI_RATE_LIMITED', 'The AI provider rate limit was reached.', true, status, { cause: error });
  if (status && [500, 502, 503].includes(status)) return new AiError('AI_PROVIDER_ERROR', 'The AI provider is temporarily unavailable.', true, status, { cause: error });
  if (/fetch failed|unable to make request|econnreset|econnrefused|enotfound|eai_again|network|socket/i.test(messageChain)) {
    return new AiError('AI_PROVIDER_ERROR', 'The AI provider network connection failed.', true, 503, { cause: error });
  }
  if (/GEMINI_API_KEY|AI_MODEL_|AI_PROVIDER/.test(message)) return new AiError('AI_CONFIGURATION_ERROR', message, false, 500, { cause: error });
  return new AiError('AI_PROVIDER_ERROR', 'The AI provider request failed.', false, status, { cause: error });
}

export function aiErrorHttpResponse(error: unknown) {
  const aiError = normalizeAiError(error);
  const status = aiError.status && aiError.status >= 400 && aiError.status < 600 ? aiError.status : 500;
  return { status, body: { error: aiError.message, code: aiError.code, retryable: aiError.retryable } };
}
