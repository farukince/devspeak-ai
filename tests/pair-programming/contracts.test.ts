import { describe, expect, it } from 'vitest';
import { driverResponseSchema, navigatorResponseSchema } from '../../lib/ai/schemas';
import { buildPairProgrammingPrompt } from '../../lib/ai/prompts/pairProgramming';
import { pairProgrammingAnswerSchema, pairProgrammingRequestSchema } from '../../lib/validation/pairProgramming';

const communicationTips = [{
  title: 'State the intent',
  description: 'Explain why the next step is necessary.',
  type: 'tip' as const,
}];

describe('pair programming contracts', () => {
  it('accepts driver and navigator requests', () => {
    expect(pairProgrammingRequestSchema.parse({
      role: 'driver',
      task: 'Implement JWT error handling.',
      code: 'const handler = () => true;',
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      durationSeconds: 45,
    }).role).toBe('driver');
    expect(pairProgrammingRequestSchema.parse({
      role: 'navigator',
      instruction: 'Handle expired tokens with a 401 response.',
      code: 'const handler = () => true;',
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      durationSeconds: 30,
    }).role).toBe('navigator');
  });

  it('rejects empty or unknown request data', () => {
    expect(() => pairProgrammingRequestSchema.parse({
      role: 'navigator',
      instruction: ' ',
      code: 'const handler = () => true;',
      clientRequestId: 'invalid',
      durationSeconds: 0,
      injected: true,
    })).toThrow();
  });

  it('parses persisted role-specific answers', () => {
    expect(pairProgrammingAnswerSchema.parse({
      role: 'navigator',
      instruction: 'Add a safe error branch.',
      code: 'const handler = () => true;',
    }).role).toBe('navigator');
  });

  it('requires common feedback for both roles', () => {
    const common = {
      summary: 'Clear direction with one missing edge case.',
      strengths: ['Explains the intent'],
      improvements: ['Mention the expired-token branch'],
      improvedAnswer: 'Handle TokenExpiredError with a 401 response.',
      communication_tips: communicationTips,
    };
    expect(driverResponseSchema.parse({
      ...common,
      correctness: 80,
      efficiency: 75,
      readability: 90,
    }).summary).toBe(common.summary);
    expect(navigatorResponseSchema.parse({
      ...common,
      clarity: 80,
      effectiveness: 75,
      precision: 90,
      generatedCode: 'const handler = () => true;',
    }).summary).toBe(common.summary);
  });

  it('includes current code in navigator prompts', () => {
    const prompt = buildPairProgrammingPrompt({
      role: 'navigator',
      instruction: 'Add an error branch.',
      code: 'const handler = () => true;',
    });
    expect(prompt).toContain('Current code');
    expect(prompt).toContain('Add an error branch.');
  });
});
