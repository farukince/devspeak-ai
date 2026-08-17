import 'server-only';

export type AiResponseMode = 'fast' | 'deep';

export interface AiConfig {
  provider: 'gemini';
  apiKey: string;
  models: Record<AiResponseMode, string>;
  timeoutMs: number;
  maxRetries: number;
}

export function getAiConfig(): AiConfig {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.GEMINI_API_KEY;
  const fastModel = process.env.AI_MODEL_FAST;
  const deepModel = process.env.AI_MODEL_DEEP;

  if (provider !== 'gemini') throw new Error('AI_PROVIDER must be set to gemini.');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  if (!fastModel || !deepModel) throw new Error('AI_MODEL_FAST and AI_MODEL_DEEP must be configured.');

  return {
    provider,
    apiKey,
    models: { fast: fastModel, deep: deepModel },
    timeoutMs: 30_000,
    maxRetries: 2,
  };
}
