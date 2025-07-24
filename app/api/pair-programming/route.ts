import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/geminiClient';

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
        responseKeys = ['correctness', 'efficiency', 'readability', 'feedback'];
        prompt = `
          You are a "Navigator" in a pair programming session. Your partner, the "Driver", has written code for the task: "${task}".
          Their Code:
          \`\`\`javascript
          ${code}
          \`\`\`
          Evaluate their code on these criteria (0-100):
          1. Correctness: Does the code work? Are there bugs?
          2. Efficiency: Is the code performant?
          3. Readability: Is the code clean and understandable?
          Your response MUST be a valid JSON object with keys: "correctness", "efficiency", "readability", and "feedback" (string for textual feedback).
        `;
        break;

      case 'navigator':
        if (!instruction) {
          return NextResponse.json({ error: 'Instruction is required for the navigator role.' }, { status: 400 });
        }
        responseKeys = ['clarity', 'effectiveness', 'precision', 'generatedCode'];
        prompt = `
          You are a "Driver" in a pair programming session. Your "Navigator" gave you an instruction: "${instruction}".
          Your task is twofold:
          1. Write the code that implements the instruction.
          2. Evaluate the quality of the instruction itself on these criteria (0-100):
              - Clarity: Was the instruction easy to understand?
              - Effectiveness: Did it lead to good code?
              - Precision: Was it specific enough?
          Your response MUST be a valid JSON object with keys: "clarity", "effectiveness", "precision", and "generatedCode" (string containing ONLY the generated code block).
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 });
    }

    const rawResponse = await getGeminiResponse(prompt);
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