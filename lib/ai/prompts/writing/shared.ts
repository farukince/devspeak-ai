import { practiceMaterial } from '../shared';
import type { WritingTaskType } from '@/lib/validation/writing';

export const WRITING_PROMPT_VERSION = 'writing-v3';

const taskLabels: Record<WritingTaskType, string> = {
  readme: 'README',
  pull_request: 'pull request description',
  bug_report: 'bug report',
  slack_message: 'technical Slack message',
  technical_documentation: 'technical documentation',
};

export function writingEvaluationPrompt(taskType: WritingTaskType, content: string, taskGuidance: string) {
  return [
    `Evaluate this developer's ${taskLabels[taskType]}.`,
    'Score clarity, structure, tone, completeness, and professional technical terminology from 0 to 100.',
    'Return an overall score, concise summary, strengths, improvements, and a complete improved answer.',
    'Give exactly three actionable suggestions. Copy original_text exactly from the material when a direct replacement is possible; otherwise use an empty string.',
    taskGuidance,
    practiceMaterial('Writing sample', content),
  ].join('\n\n');
}
