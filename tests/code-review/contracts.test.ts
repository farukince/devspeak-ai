import { describe, expect, it } from 'vitest';
import { authorResponseSchema, reviewerResponseSchema } from '../../lib/ai/schemas';
import { buildCodeReviewPrompt } from '../../lib/ai/prompts/codeReview';
import { codeReviewAnswerSchema, codeReviewRequestSchema } from '../../lib/validation/codeReview';

const suggestions = Array.from({ length: 3 }, (_, index) => ({
  title: `Suggestion ${index + 1}`,
  description: 'Explain the reason and offer a concrete alternative.',
  type: 'tip' as const,
  icon: 'lightbulb' as const,
}));

describe('code review contracts', () => {
  it('accepts reviewer and author requests with idempotency and duration', () => {
    expect(codeReviewRequestSchema.parse({
      role: 'reviewer',
      userReview: 'Consider using reduce here because it makes the aggregation explicit.',
      codeToReview: 'let total = 0;',
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      durationSeconds: 45,
    }).role).toBe('reviewer');
    expect(codeReviewRequestSchema.parse({
      role: 'author',
      codeToReview: 'const total = items.reduce((sum, item) => sum + item.price, 0);',
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      durationSeconds: 60,
    }).role).toBe('author');
  });

  it('rejects empty input and unknown fields', () => {
    expect(() => codeReviewRequestSchema.parse({
      role: 'reviewer',
      userReview: ' ',
      codeToReview: 'const value = 1;',
      clientRequestId: 'invalid',
      durationSeconds: 0,
      injected: true,
    })).toThrow();
  });

  it('parses persisted role-specific answers', () => {
    expect(codeReviewAnswerSchema.parse({
      role: 'author',
      codeToReview: 'const value = 1;',
    }).role).toBe('author');
  });

  it('requires common reference feedback for both roles', () => {
    const common = {
      summary: 'Clear direction with room for more detail.',
      strengths: ['Professional tone'],
      improvements: ['Reference the exact behavior'],
      improvedAnswer: 'Consider using reduce because it makes the aggregation explicit.',
      suggestions,
    };
    expect(reviewerResponseSchema.parse({
      ...common,
      constructiveness: 80,
      specificity: 75,
      tone: 90,
    }).improvedAnswer).toBe(common.improvedAnswer);
    expect(authorResponseSchema.parse({
      ...common,
      correctness: 80,
      readability: 75,
      bestPractices: 90,
    }).improvedAnswer).toBe(common.improvedAnswer);
  });

  it('builds role-specific protected prompts', () => {
    expect(buildCodeReviewPrompt({
      role: 'reviewer',
      code: 'const value = 1;',
      review: 'Please explain this name.',
    })).toContain('Developer review');
    expect(buildCodeReviewPrompt({
      role: 'author',
      code: 'const value = 1;',
    })).toContain('improved code');
  });
});
