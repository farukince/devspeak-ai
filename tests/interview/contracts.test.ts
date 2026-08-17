import { describe, expect, it } from 'vitest';
import { buildInterviewPrompt } from '../../lib/ai/prompts/interview';
import {
  interviewRequestSchema,
  interviewScenarioQuerySchema,
  interviewTechnologySchema,
} from '../../lib/validation/interview';

describe('technical interview contracts', () => {
  it('accepts a complete scenario selection', () => {
    expect(interviewScenarioQuerySchema.parse({
      role: 'backend_engineer',
      experienceLevel: 'mid',
      technologyArea: 'nodejs',
      difficulty: 'hard',
    }).difficulty).toBe('hard');
  });

  it('accepts an optional scenario exclusion for question refresh', () => {
    expect(interviewScenarioQuerySchema.parse({
      role: 'backend_engineer',
      experienceLevel: 'mid',
      technologyArea: 'nodejs',
      difficulty: 'hard',
      excludeScenarioId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    }).excludeScenarioId).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  });

  it('accepts all configured technology areas', () => {
    for (const technology of ['react', 'web_performance', 'nodejs', 'api_design', 'containers', 'cicd']) {
      expect(interviewTechnologySchema.parse(technology)).toBe(technology);
    }
  });

  it('requires scenario, answer, input mode, duration and request id', () => {
    expect(interviewRequestSchema.parse({
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      scenarioId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      answer: 'The event loop coordinates asynchronous callbacks.',
      inputMode: 'written',
      durationSeconds: 42,
    }).durationSeconds).toBe(42);
  });

  it('rejects empty answers and excessive durations', () => {
    expect(() => interviewRequestSchema.parse({
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      scenarioId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      answer: ' ',
      inputMode: 'written',
      durationSeconds: 3601,
    })).toThrow();
  });

  it('builds a prompt with selection context and protected answer material', () => {
    const prompt = buildInterviewPrompt({
      role: 'backend_engineer',
      experienceLevel: 'senior',
      technologyArea: 'api_design',
      difficulty: 'hard',
      question: 'Design a rate limiter.',
      answer: 'I would use a distributed token bucket.',
    });
    expect(prompt).toContain('technicalScore');
    expect(prompt).toContain('distributed token bucket');
  });
});
