import { practiceMaterial } from './shared';

export const CODE_REVIEW_PROMPT_VERSION = 'code-review-v2';

export function buildCodeReviewPrompt(input: {
  role: 'reviewer' | 'author';
  code: string;
  review?: string;
  profile?: { jobTitle: string | null; englishLevel: string | null };
}) {
  const instruction = input.role === 'reviewer'
    ? 'Evaluate the developer’s review for constructiveness, specificity, and professional tone.'
    : 'Evaluate the code for correctness, readability, and best practices.';
  const profileContext = input.profile && (input.profile.jobTitle || input.profile.englishLevel)
    ? practiceMaterial(
        'Developer profile context',
        `Job title: ${input.profile.jobTitle ?? 'Not provided'}\nEnglish level: ${input.profile.englishLevel ?? 'Not provided'}`
      )
    : null;

  return [
    instruction,
    'Return a concise summary, concrete strengths and improvements, a complete improved answer, and exactly three actionable suggestions.',
    'For reviewer mode, improvedAnswer is a polished review comment. For author mode, improvedAnswer is improved code.',
    'Adapt communication feedback to the developer profile when provided, without lowering technical standards.',
    profileContext,
    practiceMaterial('Code under review', input.code),
    ...(input.review ? [practiceMaterial('Developer review', input.review)] : []),
  ].filter((section): section is string => section !== null).join('\n\n');
}
