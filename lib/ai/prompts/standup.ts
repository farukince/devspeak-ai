import { practiceMaterial } from './shared';

export const STANDUP_PROMPT_VERSION = 'standup-v3';

export function buildStandupPrompt(
  input: { yesterday: string; today: string; blockers: string },
  context?: { jobTitle: string | null; englishLevel: string | null }
) {
  const profileContext = context && (context.jobTitle || context.englishLevel)
    ? practiceMaterial(
        'Developer profile context',
        `Job title: ${context.jobTitle ?? 'Not provided'}\nEnglish level: ${context.englishLevel ?? 'Not provided'}`
      )
    : null;

  return [
    'Evaluate this daily stand-up update for clarity, conciseness, and impact.',
    'Score the overall response and each category from 0 to 100.',
    'Give a concise summary, concrete strengths and improvements, and a polished improved answer that preserves the original meaning.',
    'The improved answer must clearly retain the Yesterday, Today, and Blockers structure.',
    'Adapt the feedback language and suggested phrasing to the developer profile context when provided, without lowering technical communication standards.',
    profileContext,
    practiceMaterial('Yesterday', input.yesterday || 'Not provided'),
    practiceMaterial('Today', input.today || 'Not provided'),
    practiceMaterial('Blockers', input.blockers || 'None'),
  ].filter((section): section is string => section !== null).join('\n\n');
}
