import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { normalizeAiError } from '../../lib/ai/errors';

describe('AI provider error normalization', () => {
  it.each([429, 500, 502, 503])('marks status %s as retryable', (status) => {
    expect(normalizeAiError({ status }).retryable).toBe(true);
  });

  it('does not retry authentication errors', () => {
    const error = normalizeAiError({ status: 401 });
    expect(error.code).toBe('AI_AUTHENTICATION_ERROR');
    expect(error.retryable).toBe(false);
  });

  it('marks timeouts as retryable', () => {
    const source = new Error('request timeout');
    source.name = 'TimeoutError';
    expect(normalizeAiError(source).code).toBe('AI_TIMEOUT');
    expect(normalizeAiError(source).retryable).toBe(true);
  });

  it('retries provider connection and DNS failures', () => {
    const error = normalizeAiError(new Error('Unable to make request: TypeError: fetch failed'));
    expect(error.code).toBe('AI_PROVIDER_ERROR');
    expect(error.status).toBe(503);
    expect(error.retryable).toBe(true);
  });

  it('detects a nested connection timeout', () => {
    const error = normalizeAiError(new Error('fetch failed', { cause: new Error('Connect Timeout Error') }));
    expect(error.code).toBe('AI_TIMEOUT');
    expect(error.status).toBe(504);
    expect(error.retryable).toBe(true);
  });

  it('rejects invalid structured output without retry', () => {
    const result = z.object({ score: z.number() }).safeParse({ score: 'bad' });
    if (result.success) throw new Error('Fixture must be invalid.');
    const error = normalizeAiError(result.error);
    expect(error.code).toBe('AI_INVALID_RESPONSE');
    expect(error.retryable).toBe(false);
  });
});
