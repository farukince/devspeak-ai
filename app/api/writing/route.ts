import { NextRequest, NextResponse } from 'next/server';
import { getNovaLiteResponse } from '@/lib/bedrockClient';

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
      Evaluate the writing quality based on the selected type ("${writingType}").
      
      **Output Format:**
      Your response MUST be a valid JSON object with:
      - "clarity" (number 0-100)
      - "structure" (number 0-100)
      - "tone" (number 0-100): Appropriateness for the type.
      - "completeness" (number 0-100)
      - "feedback" (string): Concise summary.
      - "suggestions": Array of exactly 3 objects:
        {
          "title": string (short title),
          "description": string (explanation),
          "type": "tip" | "warning" | "refactor",
          "original_text": string (exact text match from user content to highlight),
          "replacement_text": string (suggested replacement)
        }
    `;

    const rawResponse = await getNovaLiteResponse(prompt);
    let evaluation;

    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse Nova's JSON response:", rawResponse);
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