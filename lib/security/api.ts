import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';

export class ApiSecurityError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string, public readonly retryAfter?: number) {
    super(message);
    this.name = 'ApiSecurityError';
  }
}

export async function readJsonWithLimit<T>(request: NextRequest, schema: z.ZodType<T>, maximumBytes: number): Promise<T> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > maximumBytes) throw new ApiSecurityError('Request body is too large.', 413, 'REQUEST_TOO_LARGE');
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumBytes) {
    throw new ApiSecurityError('Request body is too large.', 413, 'REQUEST_TOO_LARGE');
  }
  try {
    return schema.parse(JSON.parse(body));
  } catch (error) {
    if (error instanceof SyntaxError) throw new ApiSecurityError('Request body must be valid JSON.', 400, 'INVALID_JSON');
    throw error;
  }
}

export async function enforceRateLimit(
  client: SupabaseClient,
  endpoint: string,
  limit: number,
  windowSeconds = 60
) {
  const { data, error } = await client.rpc('consume_rate_limit', {
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`Rate limit check failed: ${error.message}`);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.allowed) {
    throw new ApiSecurityError(
      `Too many requests. Try again in ${result?.retry_after_seconds ?? windowSeconds} seconds.`,
      429,
      'RATE_LIMITED',
      result?.retry_after_seconds ?? windowSeconds
    );
  }
  return { remaining: result.remaining as number, retryAfter: result.retry_after_seconds as number };
}
