const standardPricingPerMillion: Record<string, { audioInput: number; textOutput: number }> = {
  'gemini-3.1-flash-lite': { audioInput: 0.5, textOutput: 1.5 },
};

export function estimateTranscriptionCost(model: string, inputTokens: number | null, outputTokens: number | null) {
  const pricing = standardPricingPerMillion[model];
  if (!pricing || inputTokens === null || outputTokens === null) return null;
  return ((inputTokens * pricing.audioInput) + (outputTokens * pricing.textOutput)) / 1_000_000;
}
