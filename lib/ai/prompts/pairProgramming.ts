import { practiceMaterial } from './shared';

export const PAIR_PROGRAMMING_PROMPT_VERSION = 'pair-programming-v2';

export function buildPairProgrammingPrompt(input:
  | { role: 'driver'; task: string; code: string; profile?: { jobTitle: string | null; englishLevel: string | null } }
  | { role: 'navigator'; instruction: string; code: string; profile?: { jobTitle: string | null; englishLevel: string | null } }
) {
  const profileContext = input.profile && (input.profile.jobTitle || input.profile.englishLevel)
    ? practiceMaterial(
        'Developer profile context',
        `Job title: ${input.profile.jobTitle ?? 'Not provided'}\nEnglish level: ${input.profile.englishLevel ?? 'Not provided'}`
      )
    : null;
  const common = [
    'Return a concise summary, strengths, improvements, a complete improved answer, and actionable communication tips.',
    'Adapt communication feedback to the developer profile when provided, without lowering technical standards.',
    profileContext,
  ].filter((section): section is string => section !== null);

  if (input.role === 'driver') {
    return [
      'Act as the navigator. Evaluate the driver’s correctness, efficiency, readability, and technical communication.',
      'Return correctness, efficiency, and readability scores from 0 to 100.',
      'The improvedAnswer must be an improved version of the driver code.',
      ...common,
      practiceMaterial('Task', input.task),
      practiceMaterial('Driver code', input.code),
    ].join('\n\n');
  }
  return [
    'Act as the driver. Implement the navigator instruction, then evaluate its clarity, effectiveness, and precision.',
    'Return clarity, effectiveness, and precision scores from 0 to 100.',
    'The improvedAnswer must be a clearer, more precise navigator instruction. Return the implementation separately as generatedCode.',
    ...common,
    practiceMaterial('Navigator instruction', input.instruction),
    practiceMaterial('Current code', input.code),
  ].join('\n\n');
}
