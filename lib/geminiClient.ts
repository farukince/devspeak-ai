import {GoogleGenerativeAI} from '@google/generative-ai'

const genAI = new GoogleGenerativeAI (process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});
/** 
@param {string} prompt
@return {Promise<string>}
*/
export async function getGeminiResponse(prompt: string): Promise<string> {
  try{
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't process your request at the moment. Please try again later.";
  }
}
