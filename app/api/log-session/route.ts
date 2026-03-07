import { NextRequest, NextResponse } from 'next/server';
import { insertPracticeSession } from '@/lib/dynamoDBClient';

export async function POST(request: NextRequest) {
  try {
    // Get session data from request
    const body = await request.json();
    const { userId, moduleType, taskName, userInput, aiFeedback, scores, duration } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - userId required' }, { status: 401 });
    }

    if (!moduleType || !userInput || !aiFeedback) {
      return NextResponse.json({ error: 'Missing required session data.' }, { status: 400 });
    }

    // Insert into DynamoDB
    const savedSession = await insertPracticeSession({
      userId,
      moduleType,
      taskName: taskName || undefined,
      scores: scores || undefined,
      userInput,
      aiFeedback,
    });

    // Return success response
    return NextResponse.json(
      { message: 'Session logged successfully', sessionId: savedSession.sessionId },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}