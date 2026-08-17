import type { WritingAnswer } from '@/lib/validation/writing';
import { practiceMaterial } from '../shared';
import { buildBugReportPrompt } from './bugReport';
import { buildPullRequestPrompt } from './pullRequest';
import { buildReadmePrompt } from './readme';
import { buildSlackMessagePrompt } from './slackMessage';
import { WRITING_PROMPT_VERSION } from './shared';
import { buildTechnicalDocumentationPrompt } from './technicalDocumentation';

export { WRITING_PROMPT_VERSION };

export function buildWritingPrompt(
  input: WritingAnswer,
  context?: { jobTitle: string | null; englishLevel: string | null }
) {
  const taskPrompt = (() => {
    switch (input.taskType) {
      case 'readme': return buildReadmePrompt(input.content);
      case 'pull_request': return buildPullRequestPrompt(input.content);
      case 'bug_report': return buildBugReportPrompt(input.content);
      case 'slack_message': return buildSlackMessagePrompt(input.content);
      case 'technical_documentation': return buildTechnicalDocumentationPrompt(input.content);
    }
  })();
  if (!context || (!context.jobTitle && !context.englishLevel)) return taskPrompt;

  return [
    'Adapt feedback and suggested phrasing to this developer profile without lowering professional technical writing standards.',
    practiceMaterial(
      'Developer profile context',
      `Job title: ${context.jobTitle ?? 'Not provided'}\nEnglish level: ${context.englishLevel ?? 'Not provided'}`
    ),
    taskPrompt,
  ].join('\n\n');
}
