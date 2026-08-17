import { describe, expect, it } from 'vitest';
import {
  evaluationResultSchema,
  interviewResponseSchema,
  standupResponseSchema,
  writingResponseSchema,
} from '../../lib/ai/schemas';

const poorEvaluation = {
  overallScore: 18,
  categoryScores: { clarity: 20, conciseness: 16 },
  summary: 'The answer is difficult to follow.',
  strengths: ['It attempts to answer the question.'],
  improvements: ['Use a clear structure.'],
  improvedAnswer: 'Yesterday I fixed the authentication bug. Today I will add tests. I have no blockers.',
};

describe('AI structured output schemas', () => {
  it('accepts a valid common evaluation', () => {
    expect(evaluationResultSchema.parse(poorEvaluation)).toEqual(poorEvaluation);
  });

  it('rejects scores outside the 0-100 range', () => {
    expect(() => evaluationResultSchema.parse({ ...poorEvaluation, overallScore: 101 })).toThrow();
  });

  it('rejects missing or extra stand-up fields', () => {
    expect(() => standupResponseSchema.parse({ clarity: 80, conciseness: 70, impact: 60 })).toThrow();
    expect(() => standupResponseSchema.parse({ clarity: 80, conciseness: 70, impact: 60, feedback: 'Good', extra: true })).toThrow();
  });

  it('accepts a complete stand-up evaluation', () => {
    expect(standupResponseSchema.parse({
      ...poorEvaluation,
      categoryScores: { clarity: 82, conciseness: 74, impact: 68 },
    }).overallScore).toBe(18);
  });

  it('requires exactly three writing suggestions', () => {
    expect(() => writingResponseSchema.parse({
      clarity: 80,
      structure: 80,
      tone: 80,
      completeness: 80,
      feedback: 'Clear.',
      suggestions: [],
    })).toThrow();
  });

  it('accepts all five writing evaluation categories', () => {
    const suggestion = {
      title: 'Use a direct verb',
      description: 'Make the action explicit.',
      type: 'tip' as const,
      original_text: 'We made a fix.',
      replacement_text: 'We fixed the callback.',
    };
    expect(writingResponseSchema.parse({
      ...poorEvaluation,
      categoryScores: { clarity: 80, structure: 75, tone: 85, completeness: 70, terminology: 78 },
      suggestions: [suggestion, suggestion, suggestion],
    }).categoryScores.terminology).toBe(78);
  });

  it('requires two or three interview strengths and improvements', () => {
    expect(() => interviewResponseSchema.parse({
      accuracy: 80,
      depth: 80,
      clarity: 80,
      feedback: 'Good.',
      key_strengths: ['One'],
      areas_for_growth: ['One'],
      recommended_phrasing: 'Try this.',
    })).toThrow();
  });

  it('accepts separate technical and communication interview scores', () => {
    const result = interviewResponseSchema.parse({
      ...poorEvaluation,
      categoryScores: {
        technicalAccuracy: 82,
        depth: 76,
        clarity: 80,
        communication: 78,
        terminology: 74,
      },
      technicalScore: 79,
      communicationScore: 77,
      recommendedPhrasing: 'I would begin by measuring the event-loop delay.',
    });
    expect(result.technicalScore).toBe(79);
  });
});
