
import { NextRequest, NextResponse } from 'next/server';
import { getNovaLiteResponse } from '@/lib/bedrockClient';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { scenario, userResponse } = body;

        if (!scenario || !userResponse) {
            return NextResponse.json({ error: 'Scenario and user response are required.' }, { status: 400 });
        }

        const prompt = `
      You are a Communication Coach for software engineers.
      The user is practicing a networking scenario: **"${scenario}"**
      
      User's Response:
      "${userResponse}"

      **Evaluation Criteria:**
      Evaluate the response based on:
      1. **Approachability**: Is the user friendly and easy to talk to?
      2. **Professionalism**: Is the tone appropriate for a professional setting?
      3. **Clarity**: Is the introduction or question clear?

      **Output Format:**
      Your response MUST be a valid JSON object with the following structure:
      {
        "approachability": number (0-100),
        "professionalism": number (0-100),
        "clarity": number (0-100),
        "feedback": string (concise summary),
        "tips": [
          {
            "title": string (short title, e.g., "Body Language"),
            "description": string (actionable advice)
          },
          {
             "title": string,
             "description": string
          }
        ]
      }
      Provide exactly 2 tips.
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

        return NextResponse.json(evaluation);

    } catch (error) {
        console.error('Error in /api/networking:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
