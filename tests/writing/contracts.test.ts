import { describe, expect, it } from 'vitest';
import { buildWritingPrompt } from '../../lib/ai/prompts/writing/index';
import { writingAnswerSchema, writingRequestSchema, writingTaskTypeSchema } from '../../lib/validation/writing';

const taskTypes = [
  'readme',
  'pull_request',
  'bug_report',
  'slack_message',
  'technical_documentation',
] as const;

describe('technical writing contracts', () => {
  it.each(taskTypes)('accepts and routes the %s task', (taskType) => {
    expect(writingTaskTypeSchema.parse(taskType)).toBe(taskType);
    const prompt = buildWritingPrompt({ taskType, content: 'A technical writing sample.' });
    expect(prompt).toContain('A technical writing sample.');
    expect(prompt).toContain('terminology');
  });

  it('requires a non-empty answer and UUID request id', () => {
    expect(() => writingRequestSchema.parse({
      clientRequestId: 'invalid',
      taskType: 'readme',
      content: ' ',
    })).toThrow();
  });

  it('accepts an optional writing duration', () => {
    const input = {
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      taskType: 'pull_request' as const,
      content: 'Adds validation and explains the rollout risk.',
      durationSeconds: 125,
    };
    expect(writingRequestSchema.parse(input)).toEqual(input);
  });

  it('rejects unsupported task types and unknown fields', () => {
    expect(() => writingRequestSchema.parse({
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      taskType: 'email',
      content: 'Hello.',
      injected: true,
    })).toThrow();
  });

  it('parses persisted writing answers', () => {
    expect(writingAnswerSchema.parse({ taskType: 'bug_report', content: 'Steps to reproduce...' })).toEqual({
      taskType: 'bug_report',
      content: 'Steps to reproduce...',
    });
  });
});
