import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { yesterday, today, blockers } = body;

    if (!yesterday || !today) {
      return NextResponse.json(
        { error: 'Yesterday and Today fields are required.' },
        { status: 400 }
      );
    }

    // Gemini için detaylı ve JSON çıktısı isteyen yeni prompt
    const prompt = `
      You are an experienced Senior Software Engineer and a helpful team lead reviewing a daily stand-up update.
      Your goal is to provide a structured evaluation with scores and constructive feedback.

      Here is the team member's update:
      - **Yesterday's Accomplishments:** "${yesterday}"
      - **Today's Plan:** "${today}"
      - **Current Blockers:** "${blockers || 'None mentioned'}"

      **Your Task:**
      Evaluate the update based on three criteria and provide a score from 0 to 100 for each. Also, provide overall textual feedback.

      **Evaluation Criteria:**
      1.  **Clarity (0-100):** How clear and easy to understand is the update?
      2.  **Conciseness (0-100):** Is the update brief and to the point, without unnecessary details?
      3.  **Impact (0-100):** Does the update effectively communicate the impact of the work done and the goals for today?

      **Output Format:**
      Your response MUST be a valid JSON object with the following keys: "clarity" (number), "conciseness" (number), "impact" (number), and "feedback" (string).
      Example: { "clarity": 85, "conciseness": 90, "impact": 75, "feedback": "Great update! Your goals for today are very clear..." }
    `;

    const rawResponse = await getGeminiResponse(prompt);
    let evaluation;

    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse Gemini's JSON response:", rawResponse);
      return NextResponse.json({ error: "AI failed to return a valid JSON format." }, { status: 500 });
    }
    
    return NextResponse.json(evaluation);

  } catch (error) {
    console.error('Error in /api/standup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}