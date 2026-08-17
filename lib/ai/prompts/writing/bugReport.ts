import { writingEvaluationPrompt } from './shared';

export function buildBugReportPrompt(content: string) {
  return writingEvaluationPrompt('bug_report', content, 'Check whether expected behavior, actual behavior, reproduction steps, environment, and impact are actionable for engineers.');
}
