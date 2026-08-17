import { practiceMaterial } from './shared';

export const INTERVIEW_PROMPT_VERSION = 'interview-v3';

export function buildInterviewPrompt(input: {
  role: string;
  experienceLevel: string;
  technologyArea: string;
  difficulty: string;
  question: string;
  answer: string;
  profile?: { jobTitle: string | null; englishLevel: string | null };
}) {
  const profileContext = input.profile && (input.profile.jobTitle || input.profile.englishLevel)
    ? practiceMaterial(
        'Candidate profile context',
        `Job title: ${input.profile.jobTitle ?? 'Not provided'}\nEnglish level: ${input.profile.englishLevel ?? 'Not provided'}`
      )
    : null;

  return [
    `Evaluate this ${input.experienceLevel} ${input.role} candidate answering a ${input.difficulty} ${input.technologyArea} interview question.`,
    'Score technical accuracy, depth, clarity, communication, and professional terminology from 0 to 100.',
    'Return separate technicalScore and communicationScore values, plus an overall score.',
    'Give concrete strengths, improvements, a complete improved answer, and concise recommended professional phrasing.',
    'Adapt communication feedback to the candidate profile when provided, without lowering technical standards.',
    profileContext,
    practiceMaterial('Interview question', input.question),
    practiceMaterial('Candidate answer', input.answer),
  ].filter((section): section is string => section !== null).join('\n\n');
}
