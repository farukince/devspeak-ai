import { describe, expect, it } from 'vitest';
import { standupAnswerSchema, standupRequestSchema } from '../../lib/validation/standup';

describe('stand-up request contract', () => {
  it('accepts the three stand-up fields with an idempotency id', () => {
    const input = {
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      yesterday: 'Fixed the authentication callback.',
      today: 'I will add integration tests.',
      blockers: '',
    };
    expect(standupRequestSchema.parse(input)).toEqual({ ...input, inputMode: 'written', transcript: null });
  });

  it('accepts optional durationSeconds and voice mode with transcript', () => {
    const input = {
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      yesterday: 'Shipped the fix.',
      today: 'Write tests.',
      blockers: '',
      inputMode: 'voice' as const,
      transcript: 'Yesterday shipped the fix. Today write tests.',
      durationSeconds: 42,
    };
    expect(standupRequestSchema.parse(input)).toEqual(input);
  });

  it('rejects voice mode without a transcript', () => {
    expect(() => standupRequestSchema.parse({
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      yesterday: 'Shipped the fix.',
      today: '',
      blockers: '',
      inputMode: 'voice',
      transcript: null,
    })).toThrow();
  });

  it('rejects an entirely empty stand-up', () => {
    expect(() => standupRequestSchema.parse({
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      yesterday: ' ',
      today: '',
      blockers: '',
    })).toThrow();
  });

  it('rejects unknown request fields and malformed ids', () => {
    expect(() => standupRequestSchema.parse({
      clientRequestId: 'not-a-uuid',
      yesterday: 'Worked on tests.',
      today: '',
      blockers: '',
      injected: true,
    })).toThrow();
  });

  it('parses persisted stand-up answers without a request id', () => {
    expect(standupAnswerSchema.parse({ yesterday: 'Done', today: 'Next', blockers: '' })).toEqual({
      yesterday: 'Done',
      today: 'Next',
      blockers: '',
    });
  });
});
