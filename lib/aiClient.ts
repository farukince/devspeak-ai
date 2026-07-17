export type AiResponseMode = 'fast' | 'deep';

export async function getAiResponse(
  _prompt: string,
  _mode: AiResponseMode = 'deep'
): Promise<string> {
  throw new Error('AI provider is not configured yet.');
}
