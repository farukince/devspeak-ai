import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { enforceRateLimit, readJsonWithLimit } from '../../lib/security/api';

describe('API security helpers', () => {
  it('rejects declared and actual oversized request bodies', async () => {
    const declared = new NextRequest('http://localhost/api/test', { method: 'POST', headers: { 'content-length': '200' }, body: '{}' });
    await expect(readJsonWithLimit(declared, z.object({}), 100)).rejects.toMatchObject({ status: 413 });
    const actual = new NextRequest('http://localhost/api/test', { method: 'POST', body: JSON.stringify({ value: 'x'.repeat(200) }) });
    await expect(readJsonWithLimit(actual, z.object({ value: z.string() }), 100)).rejects.toMatchObject({ code: 'REQUEST_TOO_LARGE' });
  });

  it('returns a safe 400 error for malformed JSON', async () => {
    const request = new NextRequest('http://localhost/api/test', { method: 'POST', body: '{bad' });
    await expect(readJsonWithLimit(request, z.object({}), 100)).rejects.toMatchObject({ status: 400, code: 'INVALID_JSON' });
  });

  it('throws an explanatory 429 with retry information', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: [{ allowed: false, remaining: 0, retry_after_seconds: 37 }], error: null }) };
    await expect(enforceRateLimit(client as never, 'test', 1)).rejects.toMatchObject({ status: 429, retryAfter: 37, code: 'RATE_LIMITED' });
  });
});
