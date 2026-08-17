export type ModuleType = 'standup' | 'writing' | 'interview' | 'code_review' | 'pair_programming';
export type InputMode = 'written' | 'voice';
export type SessionStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface ProfileRecord {
  id: string;
  displayName: string | null;
  jobTitle: string | null;
  experienceLevel: string | null;
  englishLevel: string | null;
  nativeLanguage: string | null;
  timezone: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSessionRecord {
  id: string;
  userId: string;
  moduleType: ModuleType;
  scenarioId: string | null;
  clientRequestId: string;
  inputMode: InputMode;
  userAnswer: string;
  transcript: string | null;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioRecord {
  id: string;
  moduleType: ModuleType;
  title: string;
  description: string | null;
  promptContext: Record<string, unknown>;
  difficulty: string | null;
  isActive: boolean;
}

export interface DashboardSessionRecord {
  id: string;
  moduleType: ModuleType;
  createdAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  overallScore: number | null;
  summary: string | null;
}

export interface EvaluationRecord {
  id: string;
  sessionId: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  summary: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  nextExercise: string | null;
  promptVersion: string;
  schemaVersion: string;
  modelName: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface CreateProfileInput {
  displayName?: string | null;
  jobTitle?: string | null;
  experienceLevel?: string | null;
  englishLevel?: string | null;
  nativeLanguage?: string | null;
  timezone?: string | null;
  onboardingCompletedAt?: string | null;
}

export interface CreatePracticeSessionInput {
  moduleType: ModuleType;
  scenarioId?: string | null;
  clientRequestId: string;
  inputMode?: InputMode;
  userAnswer: string;
  transcript?: string | null;
  status?: SessionStatus;
  startedAt?: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
}

export type UpdatePracticeSessionInput = Partial<
  Pick<PracticeSessionRecord, 'status' | 'userAnswer' | 'transcript' | 'completedAt' | 'durationSeconds'>
>;

export interface CreateEvaluationInput {
  sessionId: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  summary: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  nextExercise?: string | null;
  promptVersion: string;
  schemaVersion: string;
  modelName: string;
  details?: Record<string, unknown>;
}

export interface CreateAiRunInput {
  sessionId: string;
  provider: string;
  model: string;
  promptVersion: string;
  status: 'started' | 'completed' | 'failed';
  providerRequestId?: string | null;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCost?: number | null;
  errorCode?: string | null;
}
