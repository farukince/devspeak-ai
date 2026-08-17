import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerDatabase } from '@/lib/database/server';
import { aiErrorHttpResponse } from './errors';
import { ApiSecurityError } from '@/lib/security/api';

export const optionalSessionIdSchema = z.string().uuid().optional();

export async function requireAiRouteAuth() {
  return getServerDatabase();
}

export function aiRouteError(error: unknown) {
  if (error instanceof ApiSecurityError) {
    return NextResponse.json(
      { error: error.message, code: error.code, retryable: error.status === 429 },
      { status: error.status, headers: error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : undefined }
    );
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request data.', details: error.flatten() },
      { status: 400 }
    );
  }
  if (error instanceof Error && error.message === 'Authentication required.') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const response = aiErrorHttpResponse(error);
  return NextResponse.json(response.body, { status: response.status });
}
