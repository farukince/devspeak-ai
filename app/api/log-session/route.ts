import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@aws-amplify/adapter-nextjs';
import { insertPracticeSession } from '@/lib/dynamoDBClient';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user with Cognito
    const authenticated = await runWithAmplifyServerContext({
      nextServerContext: { request },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          return session;
        } catch (error) {
          return null;
        }
      },
    });

    if (!authenticated || !authenticated.tokens) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from Cognito token
    const userId = authenticated.tokens.idToken?.payload.sub as string;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // 2. Get session data from request
    const sessionData = await request.json();
    const { module_type, task_name, scores, user_input, ai_feedback } = sessionData;

    if (!module_type || !user_input || !ai_feedback) {
      return NextResponse.json({ error: 'Missing required session data.' }, { status: 400 });
    }

    // 3. Insert into DynamoDB
    const savedSession = await insertPracticeSession({
      userId,
      moduleType: module_type,
      taskName: task_name || undefined,
      scores: scores || undefined,
      userInput: user_input,
      aiFeedback: ai_feedback,
    });

    // 4. Return success response
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