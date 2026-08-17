import { describe, expect, it } from 'vitest';
import { estimateTranscriptionCost } from '../../lib/ai/cost';

describe('voice transcription cost estimation', () => {
  it('estimates Gemini 3.1 Flash-Lite standard audio and text token cost', () => {
    expect(estimateTranscriptionCost('gemini-3.1-flash-lite', 1000, 1000)).toBe(0.002);
  });

  it('returns null when pricing or usage is unavailable', () => {
    expect(estimateTranscriptionCost('unknown-model', 1000, 1000)).toBeNull();
    expect(estimateTranscriptionCost('gemini-3.1-flash-lite', null, 1000)).toBeNull();
  });
});
