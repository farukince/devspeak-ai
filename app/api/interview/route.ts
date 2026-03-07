import { NextRequest, NextResponse } from 'next/server';
import { getNovaProResponse } from '@/lib/bedrockClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, question, answer } = body;

    if (!role || !question || !answer) {
      return NextResponse.json({ error: 'Role, question, and answer are required.' }, { status: 400 });
    }

    const prompt = `
      You are a senior technical interviewer for a top tech company, evaluating a candidate for a "${role}" position.
      Your task is to analyze the candidate's answer to a specific interview question and provide a structured evaluation.

      **Interview Question:**
      "${question}"

      **Candidate's Answer:**
      "${answer}"

      **Evaluation Criteria:**
      Evaluate the answer based on the following three criteria. For each, provide a score from 0 (poor) to 100 (excellent).
      1.  **Technical Accuracy:** Is the answer technically correct and precise?
      2.  **Depth of Understanding:** Does the answer demonstrate a deep understanding of the topic, including nuances and trade-offs, or is it superficial?
      3.  **Clarity of Expression:** Is the answer well-structured, easy to understand, and communicated clearly?

      **Output Format:**
      Your response MUST be a valid JSON object. Do not add any text, explanation, or markdown formatting before or after the JSON object.
      The JSON object must have exactly these keys:
      - "accuracy" (number)
      - "depth" (number)
      - "clarity" (number)
      - "feedback" (string): A concise summary evaluation.
      - "key_strengths" (array of strings): 2-3 specific strengths in the answer.
      - "areas_for_growth" (array of strings): 2-3 specific areas to improve.
      - "recommended_phrasing" (string): A better way to phrase a key part of the answer.

      Example:
      {
        "accuracy": 85,
        "depth": 70,
        "clarity": 90,
        "feedback": "Good answer...",
        "key_strengths": ["Correct usage of terms", "Clear structure"],
        "areas_for_growth": ["Missed edge case X", "Could be more concise"],
        "recommended_phrasing": "Instead of saying X, try Y..."
      }
    `;

    const rawResponse = await getNovaProResponse(prompt);
    let evaluation;

    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      evaluation = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse Nova's JSON response:", rawResponse);
      return NextResponse.json({ error: "AI failed to return a valid JSON format." }, { status: 500 });
    }

    // Basic validation
    if (typeof evaluation.accuracy !== 'number') evaluation.accuracy = 0;
    if (typeof evaluation.depth !== 'number') evaluation.depth = 0;
    if (typeof evaluation.clarity !== 'number') evaluation.clarity = 0;
    if (!Array.isArray(evaluation.key_strengths)) evaluation.key_strengths = [];
    if (!Array.isArray(evaluation.areas_for_growth)) evaluation.areas_for_growth = [];

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error('Error in /api/interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}