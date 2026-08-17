import { createClient } from '@/lib/auth/server';
import {
  createEvaluation,
  createAiRun,
  createPracticeSession,
  createProfile,
  listPracticeSessions,
  listCompletedDashboardSessions,
  listInterviewScenarios,
  readEvaluationBySession,
  readProfile,
  readInterviewScenario,
  updatePracticeSession,
  updateProfile,
} from './repository';

export async function getServerDatabase() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Authentication required.');

  return {
    client,
    user: data.user,
    profiles: {
      create: (input: Parameters<typeof createProfile>[2]) => createProfile(client, data.user.id, input),
      read: () => readProfile(client, data.user.id),
      update: (input: Parameters<typeof updateProfile>[2]) => updateProfile(client, data.user.id, input),
    },
    sessions: {
      create: (input: Parameters<typeof createPracticeSession>[2]) => createPracticeSession(client, data.user.id, input),
      list: (options?: Parameters<typeof listPracticeSessions>[2]) => listPracticeSessions(client, data.user.id, options),
      update: (sessionId: string, input: Parameters<typeof updatePracticeSession>[3]) =>
        updatePracticeSession(client, data.user.id, sessionId, input),
      listCompletedForDashboard: () => listCompletedDashboardSessions(client, data.user.id),
    },
    scenarios: {
      listInterview: (filters: Parameters<typeof listInterviewScenarios>[1]) => listInterviewScenarios(client, filters),
      readInterview: (scenarioId: string) => readInterviewScenario(client, scenarioId),
    },
    evaluations: {
      create: (input: Parameters<typeof createEvaluation>[2]) => createEvaluation(client, data.user.id, input),
      readBySession: (sessionId: string) => readEvaluationBySession(client, data.user.id, sessionId),
    },
    aiRuns: {
      create: (input: Parameters<typeof createAiRun>[2]) => createAiRun(client, data.user.id, input),
    },
  };
}
