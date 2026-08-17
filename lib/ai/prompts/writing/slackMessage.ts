import { writingEvaluationPrompt } from './shared';

export function buildSlackMessagePrompt(content: string) {
  return writingEvaluationPrompt('slack_message', content, 'Check whether the message is concise, professional, contextual, and ends with a clear request or next step when appropriate.');
}
