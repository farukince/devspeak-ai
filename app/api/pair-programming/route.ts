import { NextRequest, NextResponse } from 'next/server';
import { getNovaProResponse } from '@/lib/bedrockClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, task, code, instruction } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role is required.' }, { status: 400 });
    }

    let prompt = '';
    let responseKeys: string[] = [];

    switch (role) {
      case 'driver':
        if (!code || !task) {
          return NextResponse.json({ error: 'Code and task are required for the driver role.' }, { status: 400 });
        }
        responseKeys = ['correctness', 'efficiency', 'readability', 'feedback', 'communication_tips'];
        prompt = `
          You are a "Navigator" in a pair programming session. Your partner, the "Driver", has written code for the task: "${task}".
          Their Code:
          \`\`\`javascript
          ${code}
          \`\`\`
          Evaluate their code quality and communication style.

          **Output Format:**
          Your response MUST be a valid JSON object with:
          - "correctness" (number 0-100)
          - "efficiency" (number 0-100)
          - "readability" (number 0-100)
          - "feedback" (string): Concise summary.
          - "communication_tips": Array of objects { "title": string, "description": string, "type": "tip"|"warning" }.
          - "refactoring_suggestions": Array of objects { "title": string, "description": string, "code": string }.
          - "strategy_alerts": Array of objects { "title": string, "description": string, "type": "warning" }.
        `;
        break;

      case 'navigator':
        if (!instruction) {
          return NextResponse.json({ error: 'Instruction is required for the navigator role.' }, { status: 400 });
        }
        responseKeys = ['clarity', 'effectiveness', 'precision', 'generatedCode', 'communication_tips'];
        prompt = `
          You are a "Driver" in a pair programming session. Your "Navigator" gave you an instruction: "${instruction}".
          Your task is twofold:
          1. Write the code that implements the instruction.
          2. Evaluate the quality of the instruction itself.

          **Output Format:**
          Your response MUST be a valid JSON object with:
          - "clarity" (number 0-100)
          - "effectiveness" (number 0-100)
          - "precision" (number 0-100)
          - "generatedCode" (string): The code block.
          - "communication_tips": Array of objects { "title": string, "description": string, "type": "tip"|"warning" }.
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 });
    }

    const rawResponse = await getNovaProResponse(prompt);
    let evaluation;
    try {
      evaluation = JSON.parse(rawResponse.replace(/```(json|javascript|js)?/g, '').replace(/```/g, '').trim());
    } catch (e) {
      return NextResponse.json({ error: "AI failed to return a valid JSON format." }, { status: 500 });
    }

    // Validate response
    for (const key of responseKeys) {
      if (typeof evaluation[key] === 'undefined') {
        return NextResponse.json({ error: `AI response missing key: ${key}` }, { status: 500 });
      }
      if (typeof evaluation[key] === 'number') {
        evaluation[key] = Math.max(0, Math.min(100, evaluation[key]));
      }
    }

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error('Error in /api/pair-programming:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}