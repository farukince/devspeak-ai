import { writingEvaluationPrompt } from './shared';

export function buildReadmePrompt(content: string) {
  return writingEvaluationPrompt('readme', content, 'Check whether a developer can understand the project purpose, setup, usage, and important constraints. Preserve valid Markdown in the improved answer.');
}
