import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/geminiClient';

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
      The JSON object must have exactly these four keys: "accuracy" (number), "depth" (number), "clarity" (number), and "feedback" (string).
      The "feedback" string should be a concise, constructive evaluation of the answer, explaining the reasoning behind the scores.
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

    if (
      typeof evaluation.accuracy !== 'number' ||
      typeof evaluation.depth !== 'number' ||
      typeof evaluation.clarity !== 'number' ||
      typeof evaluation.feedback !== 'string'
    ) {
      console.error('Invalid evaluation structure from AI:', evaluation);
      return NextResponse.json({ error: 'Invalid evaluation response structure' }, { status: 500 });
    }

    evaluation.accuracy = Math.max(0, Math.min(100, Number(evaluation.accuracy) || 0));
    evaluation.depth = Math.max(0, Math.min(100, Number(evaluation.depth) || 0));
    evaluation.clarity = Math.max(0, Math.min(100, Number(evaluation.clarity) || 0));

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error('Error in /api/interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}