import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAiConfig } from '@/lib/ai/config';
import { normalizeAiError } from '@/lib/ai/errors';
import { aiRouteError } from '@/lib/ai/route';
import { transcribeAudio, TRANSCRIPTION_PROMPT_VERSION } from '@/lib/ai/transcribe';
import { getServerDatabase } from '@/lib/database/server';
import { enforceRateLimit } from '@/lib/security/api';

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const allowedMimeTypes = new Set(['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']);
const metadataSchema = z.object({
  moduleType: z.enum(['standup', 'interview']),
  clientRequestId: z.string().uuid(),
  scenarioId: z.string().uuid().nullable(),
  durationSeconds: z.coerce.number().int().min(1).max(300),
}).strict();

export async function POST(request: NextRequest) {
  let database: Awaited<ReturnType<typeof getServerDatabase>> | null = null;
  let sessionId: string | null = null;
  const startedAt = performance.now();

  try {
    database = await getServerDatabase();
    await enforceRateLimit(database.client, 'voice:transcribe', 5);
    const form = await request.formData();
    const file = form.get('audio');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    const mimeType = file.type.split(';')[0].toLowerCase();
    if (!allowedMimeTypes.has(mimeType)) return NextResponse.json({ error: 'Unsupported audio format.' }, { status: 415 });
    if (file.size === 0 || file.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'Audio must be between 1 byte and 15 MB.' }, { status: 413 });
    const metadata = metadataSchema.parse({
      moduleType: form.get('moduleType'),
      clientRequestId: form.get('clientRequestId'),
      scenarioId: form.get('scenarioId') || null,
      durationSeconds: form.get('durationSeconds'),
    });
    if (metadata.moduleType === 'interview') {
      if (!metadata.scenarioId) return NextResponse.json({ error: 'Interview scenario is required.' }, { status: 400 });
      if (!await database.scenarios.readInterview(metadata.scenarioId)) {
        return NextResponse.json({ error: 'Interview scenario not found.' }, { status: 404 });
      }
    }
    const session = await database.sessions.create({
      moduleType: metadata.moduleType,
      scenarioId: metadata.scenarioId,
      clientRequestId: metadata.clientRequestId,
      inputMode: 'voice',
      userAnswer: 'Voice transcription pending.',
      status: 'draft',
      durationSeconds: metadata.durationSeconds,
    });
    sessionId = session.id;
    if (session.status !== 'draft') {
      await database.sessions.update(session.id, { status: 'draft', completedAt: null, durationSeconds: metadata.durationSeconds });
    }

    const result = await transcribeAudio({ bytes: new Uint8Array(await file.arrayBuffer()), mimeType });
    await database.sessions.update(session.id, {
      status: 'draft',
      userAnswer: result.transcript,
      transcript: result.transcript,
      durationSeconds: metadata.durationSeconds,
    });
    await database.aiRuns.create({
      sessionId: session.id,
      provider: result.provider,
      model: result.model,
      promptVersion: TRANSCRIPTION_PROMPT_VERSION,
      status: 'completed',
      providerRequestId: result.providerRequestId,
      latencyMs: result.latencyMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
    });
    return NextResponse.json({
      sessionId: session.id,
      clientRequestId: metadata.clientRequestId,
      transcript: result.transcript,
      durationSeconds: metadata.durationSeconds,
    }, { status: 201 });
  } catch (error) {
    const aiError = normalizeAiError(error);
    if (database && sessionId) {
      try {
        await database.sessions.update(sessionId, { status: 'failed' });
        let model = 'unknown';
        try { model = getAiConfig().models.fast; } catch { /* configuration failure */ }
        await database.aiRuns.create({
          sessionId,
          provider: 'gemini',
          model,
          promptVersion: TRANSCRIPTION_PROMPT_VERSION,
          status: 'failed',
          latencyMs: Math.round(performance.now() - startedAt),
          errorCode: aiError.code,
        });
      } catch (loggingError) {
        console.error('Voice transcription failure logging failed:', loggingError);
      }
    }
    return aiRouteError(error);
  }
}
