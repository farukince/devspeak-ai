import { writingEvaluationPrompt } from './shared';

export function buildPullRequestPrompt(content: string) {
  return writingEvaluationPrompt('pull_request', content, 'Check whether the change, motivation, testing evidence, risks, and rollout considerations are clear to reviewers.');
}
