import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { bedrockConfig } from './awsConfig';

const client = new BedrockRuntimeClient(bedrockConfig);

/**
 * Get AI response from Amazon Bedrock (Nova Pro)
 * Replaces Google Gemini - optimized for AWS ecosystem
 * @param {string} prompt - The prompt to send to the AI model
 * @param {boolean} useLite - Use Nova Lite for simpler tasks (default: false)
 * @return {Promise<string>} - The AI-generated response
 */
export async function getBedrockResponse(prompt: string, useLite: boolean = false): Promise<string> {
  try {
    // Amazon Nova Pro: High-performance multimodal model
    // Amazon Nova Lite: Cost-effective for simpler tasks
    // Using EU inference profiles for eu-central-1 region
    const modelId = useLite 
      ? 'eu.amazon.nova-lite-v1:0'
      : 'eu.amazon.nova-pro-v1:0';

    const payload = {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: prompt,
            },
          ],
        },
      ],
      inferenceConfig: {
        max_new_tokens: 4096,
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract text from Nova's response format
    const text = responseBody.output.message.content[0].text;
    return text;
  } catch (error) {
    console.error('Bedrock API Error:', error);
    return "Sorry, I couldn't process your request at the moment. Please try again later.";
  }
}

/**
 * Use Nova Pro for complex tasks requiring deep analysis
 * Best for: Technical interviews, code reviews, detailed feedback
 */
export async function getNovaProResponse(prompt: string): Promise<string> {
  return getBedrockResponse(prompt, false);
}

/**
 * Use Nova Lite for simpler tasks to optimize costs
 * Best for: Stand-ups, simple writing checks, quick feedback
 */
export async function getNovaLiteResponse(prompt: string): Promise<string> {
  return getBedrockResponse(prompt, true);
}
