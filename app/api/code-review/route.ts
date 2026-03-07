import { NextRequest, NextResponse } from 'next/server';
import { getNovaProResponse } from '@/lib/bedrockClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, userReview, codeToReview } = body;

    if (!role || !codeToReview) {
      return NextResponse.json({ error: 'Role and code are required.' }, { status: 400 });
    }

    let prompt = '';

    switch (role) {
      case 'reviewer':
        if (!userReview) {
          return NextResponse.json({ error: 'User review is required for the reviewer role.' }, { status: 400 });
        }
        prompt = `
          You are a Staff Software Engineer evaluating a junior developer's code review skills.
          The code they reviewed is:
          \`\`\`javascript
          ${codeToReview}
          \`\`\`
          Their review is: "${userReview}"

          Evaluate their review clearly and constructively.
          
          **Output Format:**
          Your response MUST be a valid JSON object with the following structure:
          {
            "constructiveness": number (0-100),
            "specificity": number (0-100),
            "tone": number (0-100),
            "feedback": string (concise summary),
            "suggestions": [
              {
                "title": string (short title),
                "description": string (detailed advice),
                "type": "tip" | "warning" | "refactor",
                "icon": "lightbulb" | "warning" | "auto_fix_high"
              }
            ]
          }
          Provide exactly 3 items in the "suggestions" array.
        `;
        break;

      case 'author':
        prompt = `
          You are a Senior Software Engineer reviewing code written by a developer.
          The code they wrote is:
          \`\`\`javascript
          ${codeToReview}
          \`\`\`

          Evaluate their code quality.

          **Output Format:**
          Your response MUST be a valid JSON object with the following structure:
          {
            "correctness": number (0-100),
            "readability": number (0-100),
            "bestPractices": number (0-100),
            "feedback": string (concise summary),
            "suggestions": [
              {
                "title": string (short title),
                "description": string (detailed advice),
                "type": "tip" | "warning" | "refactor",
                "icon": "lightbulb" | "warning" | "auto_fix_high"
              }
            ]
          }
          Provide exactly 3 items in the "suggestions" array.
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid role selected.' }, { status: 400 });
    }

    const rawResponse = await getNovaProResponse(prompt);
    let evaluation;

    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse Nova's JSON response:", rawResponse);
      return NextResponse.json({ error: "AI failed to return a valid JSON format." }, { status: 500 });
    }

    const requiredKeys = role === 'reviewer'
      ? ['constructiveness', 'specificity', 'tone']
      : ['correctness', 'readability', 'bestPractices'];

    for (const key of requiredKeys) {
      if (typeof evaluation[key] !== 'number') {
        console.error(`Invalid or missing key '${key}' in AI response:`, evaluation);
        return NextResponse.json({ error: `AI response was missing or had an invalid type for '${key}'.` }, { status: 500 });
      }
      evaluation[key] = Math.max(0, Math.min(100, evaluation[key]));
    }

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error('Error in /api/code-review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}