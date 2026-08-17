import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerDatabase } from '@/lib/database/server';
import { moduleTypeSchema } from '@/lib/database/schemas';

const logSessionSchema = z.object({
  clientRequestId: z.string().uuid().optional(),
  moduleType: moduleTypeSchema,
  userInput: z.union([z.string(), z.record(z.string(), z.unknown())])
    .transform((value) => typeof value === 'string' ? value : JSON.stringify(value)),
  aiFeedback: z.string().trim().min(1).max(20000),
  scores: z.record(z.string(), z.unknown()).optional(),
  duration: z.number().int().nonnegative().optional(),
});

export async function POST(request: NextRequest) {
  let sessionId: string | null = null;
  try {
    const input = logSessionSchema.parse(await request.json());
    const database = await getServerDatabase();
    const session = await database.sessions.create({
      moduleType: input.moduleType,
      clientRequestId: input.clientRequestId ?? crypto.randomUUID(),
      userAnswer: input.userInput,
      status: 'processing',
      durationSeconds: input.duration,
    });
    sessionId = session.id;

    const existingEvaluation = await database.evaluations.readBySession(session.id);
    if (existingEvaluation) {
      return NextResponse.json(
        { message: 'Session already logged', sessionId: session.id },
        { status: 200 }
      );
    }

    const numericScores = Object.fromEntries(
      Object.entries(input.scores ?? {}).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    );
    const categoryScores = Object.fromEntries(Object.entries(numericScores).filter(([name]) => name !== 'overall'));
    const values = Object.values(numericScores);
    const overallScore = numericScores.overall ?? (
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    );

    await database.evaluations.create({
      sessionId: session.id,
      overallScore,
      categoryScores,
      summary: input.aiFeedback,
      strengths: [],
      improvements: [],
      improvedAnswer: input.userInput,
      promptVersion: 'legacy-v1',
      schemaVersion: '1',
      modelName: 'legacy',
    });
    await database.sessions.update(session.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      durationSeconds: input.duration,
    });

    return NextResponse.json(
      { message: 'Session logged successfully', sessionId: session.id },
      { status: 201 }
    );
  } catch (error) {
    if (sessionId) {
      try {
        const database = await getServerDatabase();
        await database.sessions.update(sessionId, { status: 'failed' });
      } catch (updateError) {
        console.error('Failed to mark practice session as failed:', updateError);
      }
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid session data.', details: error.flatten() }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Authentication required.') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error logging session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
