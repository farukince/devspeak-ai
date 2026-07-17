export interface PracticeSession {
  userId: string;
  sessionId: string;
  createdAt: string;
  moduleType: string;
  taskName?: string;
  scores?: Record<string, number>;
  userInput: string;
  aiFeedback: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  birthday?: string;
  englishLevel?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

function providerNotConfigured(): never {
  throw new Error('Data provider is not configured yet.');
}

export async function insertPracticeSession(
  _session: Omit<PracticeSession, 'sessionId' | 'createdAt'>
): Promise<PracticeSession> {
  providerNotConfigured();
}

export async function getUserPracticeSessions(_userId: string): Promise<PracticeSession[]> {
  providerNotConfigured();
}

export async function getUserSessionsByModule(
  _userId: string,
  _moduleType: string
): Promise<PracticeSession[]> {
  providerNotConfigured();
}

export async function getRecentSessions(
  _userId: string,
  _limit: number = 5
): Promise<PracticeSession[]> {
  providerNotConfigured();
}

export async function createUserProfile(
  _profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>
): Promise<UserProfile> {
  providerNotConfigured();
}

export async function getUserProfile(_userId: string): Promise<UserProfile | null> {
  providerNotConfigured();
}

export async function updateUserProfile(
  _userId: string,
  _updates: Partial<UserProfile>
): Promise<UserProfile> {
  providerNotConfigured();
}
