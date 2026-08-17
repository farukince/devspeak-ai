import { writingEvaluationPrompt } from './shared';

export function buildTechnicalDocumentationPrompt(content: string) {
  return writingEvaluationPrompt('technical_documentation', content, 'Check conceptual accuracy, logical hierarchy, terminology consistency, prerequisites, examples, and operational clarity.');
}
