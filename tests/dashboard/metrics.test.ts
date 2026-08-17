import { describe, expect, it } from 'vitest';
import { buildDashboardData } from '../../lib/dashboard/metrics';
import type { DashboardSessionRecord, ModuleType } from '../../lib/database/types';

function session(
  id: string,
  moduleType: ModuleType,
  createdAt: string,
  overallScore: number | null
): DashboardSessionRecord {
  return { id, moduleType, createdAt, completedAt: createdAt, durationSeconds: 60, overallScore, summary: null };
}

describe('dashboard metrics', () => {
  it('returns a genuine empty state and stand-up recommendation', () => {
    const result = buildDashboardData([], new Date('2026-07-23T12:00:00Z'));
    expect(result.totalPractices).toBe(0);
    expect(result.averageScore).toBeNull();
    expect(result.recentSessions).toEqual([]);
    expect(result.recommendation.moduleType).toBe('standup');
  });

  it('calculates totals, last seven days, overall and module averages', () => {
    const result = buildDashboardData([
      session('1', 'standup', '2026-07-23T10:00:00Z', 80),
      session('2', 'standup', '2026-07-20T10:00:00Z', 60),
      session('3', 'writing', '2026-07-01T10:00:00Z', 90),
    ], new Date('2026-07-23T12:00:00Z'));
    expect(result.totalPractices).toBe(3);
    expect(result.lastSevenDays).toBe(2);
    expect(result.averageScore).toBe(77);
    expect(result.moduleAverages.find((item) => item.moduleType === 'standup')).toMatchObject({ averageScore: 70, count: 2 });
  });

  it('recommends the module with the weakest evaluated average', () => {
    const result = buildDashboardData([
      session('1', 'interview', '2026-07-23T10:00:00Z', 55),
      session('2', 'writing', '2026-07-22T10:00:00Z', 88),
    ], new Date('2026-07-23T12:00:00Z'));
    expect(result.recommendation.moduleType).toBe('interview');
    expect(result.recommendation.reason).toContain('55/100');
  });

  it('returns only the five most recent sessions', () => {
    const sessions = Array.from({ length: 7 }, (_, index) => session(
      String(index),
      'standup',
      `2026-07-${String(23 - index).padStart(2, '0')}T10:00:00Z`,
      70 + index
    ));
    expect(buildDashboardData(sessions).recentSessions.map((item) => item.id)).toEqual(['0', '1', '2', '3', '4']);
  });
});
