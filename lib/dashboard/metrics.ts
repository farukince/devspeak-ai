import type { DashboardSessionRecord, ModuleType } from '@/lib/database/types';

const moduleMetadata: Record<ModuleType, { label: string; href: string }> = {
  standup: { label: 'Daily Stand-up', href: '/modules/standup' },
  writing: { label: 'Technical Writing', href: '/modules/writing' },
  interview: { label: 'Technical Interview', href: '/modules/interview' },
  code_review: { label: 'Code Review', href: '/modules/code-review' },
  pair_programming: { label: 'Pair Programming', href: '/modules/pair-programming' },
};

export interface DashboardData {
  totalPractices: number;
  lastSevenDays: number;
  averageScore: number | null;
  moduleAverages: Array<{ moduleType: ModuleType; label: string; averageScore: number; count: number }>;
  recentSessions: Array<DashboardSessionRecord & { label: string }>;
  recommendation: { moduleType: ModuleType; label: string; href: string; reason: string };
}

function roundedAverage(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildDashboardData(sessions: DashboardSessionRecord[], now = new Date()): DashboardData {
  const scoredSessions = sessions.filter(
    (session): session is DashboardSessionRecord & { overallScore: number } => typeof session.overallScore === 'number'
  );
  const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
  const grouped = new Map<ModuleType, number[]>();
  for (const session of scoredSessions) {
    const scores = grouped.get(session.moduleType) ?? [];
    scores.push(session.overallScore);
    grouped.set(session.moduleType, scores);
  }
  const moduleAverages = Array.from(grouped.entries())
    .map(([moduleType, scores]) => ({
      moduleType,
      label: moduleMetadata[moduleType].label,
      averageScore: roundedAverage(scores),
      count: scores.length,
    }))
    .sort((left, right) => left.averageScore - right.averageScore);

  const weakest = moduleAverages[0];
  const recommendedType: ModuleType = weakest?.moduleType ?? 'standup';
  const recommended = moduleMetadata[recommendedType];

  return {
    totalPractices: sessions.length,
    lastSevenDays: sessions.filter((session) => new Date(session.createdAt).getTime() >= sevenDaysAgo).length,
    averageScore: scoredSessions.length ? roundedAverage(scoredSessions.map((session) => session.overallScore)) : null,
    moduleAverages,
    recentSessions: sessions.slice(0, 5).map((session) => ({ ...session, label: moduleMetadata[session.moduleType].label })),
    recommendation: {
      moduleType: recommendedType,
      label: recommended.label,
      href: recommended.href,
      reason: weakest
        ? `${recommended.label} is currently your lowest module average at ${weakest.averageScore}/100.`
        : 'Start with a concise daily stand-up to establish your first communication baseline.',
    },
  };
}
