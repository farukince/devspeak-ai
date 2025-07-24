import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/geminiClient';

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

          Evaluate their review based on these criteria, providing a score from 0-100 for each:
          1. Constructiveness: Is the feedback helpful and solution-oriented?
          2. Specificity: Does it point to specific parts of the code?
          3. Tone: Is the tone professional and collaborative?

          Your response MUST be a valid JSON object with the keys: "constructiveness" (number), "specificity" (number), "tone" (number), and "feedback" (string).
          Example: { "constructiveness": 80, "specificity": 90, "tone": 85, "feedback": "Your review is excellent because..." }
        `;
        break;

      case 'author':
        prompt = `
          You are a Senior Software Engineer reviewing code written by a developer.
          The code they wrote is:
          \`\`\`javascript
          ${codeToReview}
          \`\`\`

          Evaluate their code based on these criteria, providing a score from 0-100 for each:
          1. Correctness: Does the code work as expected? Are there bugs?
          2. Readability: Is the code clean and easy to understand?
          3. Best Practices: Does the code follow common best practices?

          Your response MUST be a valid JSON object with the keys: "correctness" (number), "readability" (number), "bestPractices" (number), and "feedback" (string).
          Example: { "correctness": 95, "readability": 75, "bestPractices": 80, "feedback": "The code is functionally correct, which is great. For readability..." }
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid role selected.' }, { status: 400 });
    }

    const rawResponse = await getGeminiResponse(prompt);
    let evaluation;

    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse Gemini's JSON response:", rawResponse);
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