import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { writingType, userContent } = body;

    if (!writingType || !userContent) {
      return NextResponse.json({ error: 'Writing type and content are required.' }, { status: 400 });
    }

    const prompt = `
      You are an expert technical writer and editor. Your task is to review a piece of writing from a developer and provide a structured evaluation with scores.

      The developer is practicing writing a piece of **"${writingType}"**.
      Here is the content they wrote:
      """
      ${userContent}
      """

      **Evaluation Criteria:**
      Evaluate the writing based on the following criteria, providing a score from 0 to 100 for each:
      1.  **Clarity:** Is the message clear, concise, and easy to understand?
      2.  **Structure:** Is the content well-organized with a logical flow?
      3.  **Tone:** Is the tone appropriate for the selected writing type?
      4.  **Completeness:** Does the writing achieve its goal and include all necessary information?

      **Output Format:**
      Your response MUST be a valid JSON object with the keys: "clarity" (number), "structure" (number), "tone" (number), "completeness" (number), and "feedback" (string).
      Example: { "clarity": 80, "structure": 85, "tone": 90, "completeness": 75, "feedback": "This is a good start..." }
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

    // Gelen veriyi doğrulayalım
    const requiredKeys = ['clarity', 'structure', 'tone', 'completeness', 'feedback'];
    for (const key of requiredKeys) {
      const value = evaluation[key];
      const type = typeof value;
      if (value === undefined || (type !== 'number' && type !== 'string')) {
         return NextResponse.json({ error: `AI response was missing or had an invalid type for '${key}'.` }, { status: 500 });
      }
      if (type === 'number') {
        evaluation[key] = Math.max(0, Math.min(100, value));
      }
    }
    
    return NextResponse.json(evaluation);

  } catch (error) {
    console.error('Error in /api/writing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}