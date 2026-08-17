'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ProgressData {
  totalSessions: number;
  moduleCounts: Record<string, number>;
  scoreTrends: { date: string; [key: string]: number | string }[];
  heatmapData: { day: string; value: number }[];
  analysis: {
    strongestArea: { name: string; score: number };
    weakestArea: { name: string; score: number };
  };
  recentActivity: { module: string; date: string; score?: number | null }[];
}

const emptyData: ProgressData = {
  totalSessions: 0,
  moduleCounts: {},
  scoreTrends: [],
  heatmapData: [],
  analysis: {
    strongestArea: { name: 'No data yet', score: 0 },
    weakestArea: { name: 'No data yet', score: 0 },
  },
  recentActivity: [],
};

const trendKeys = [
  { key: 'clarity', label: 'Clarity', color: '#71717a' },
  { key: 'correctness', label: 'Correctness', color: '#52525b' },
  { key: 'tone', label: 'Tone', color: '#a1a1aa' },
  { key: 'overall', label: 'Overall', color: '#18181b' },
];

function formatModuleName(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreAverage(data: ProgressData) {
  const values = data.scoreTrends.flatMap((point) =>
    Object.entries(point)
      .filter(([key, value]) => key !== 'date' && typeof value === 'number')
      .map(([, value]) => value as number)
  );
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function heatLevel(value: number) {
  if (value >= 4) return 'bg-foreground';
  if (value === 3) return 'bg-foreground/70';
  if (value === 2) return 'bg-foreground/40';
  if (value === 1) return 'bg-foreground/20';
  return 'bg-muted';
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
      <p className="mb-2 font-semibold">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.name} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/progress-data', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Progress data could not be loaded.');
        if (payload.message === 'No practice sessions found.') {
          setData(emptyData);
        } else {
          setData({
            totalSessions: payload.totalSessions ?? 0,
            moduleCounts: payload.moduleCounts ?? {},
            scoreTrends: payload.scoreTrends ?? [],
            heatmapData: payload.heatmapData ?? [],
            analysis: payload.analysis ?? emptyData.analysis,
            recentActivity: (payload.recentActivity ?? []).map((item: { module: string; date: string; score?: number | null }) => ({
              module: item.module,
              date: item.date,
              score: item.score,
            })),
          });
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Progress data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const overallScore = useMemo(() => scoreAverage(data), [data]);
  const technicalDepth = data.analysis.strongestArea.score;
  const focusArea = formatModuleName(data.analysis.weakestArea.name);
  const topModule = Object.entries(data.moduleCounts).sort((a, b) => b[1] - a[1])[0];
  const heatmapCells = data.heatmapData.length
    ? data.heatmapData.slice(-120)
    : Array.from({ length: 120 }, (_, index) => ({ day: `empty-${index}`, value: 0 }));
  const hasData = data.totalSessions > 0;
  const radarData = [
    { skill: 'Overall', score: Math.round(overallScore) },
    { skill: 'Strongest', score: technicalDepth },
    { skill: 'Focus', score: data.analysis.weakestArea.score || 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">Completed practice sessions and score trends from your account data.</p>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!hasData && !loading && !error && (
          <p className="mt-3 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
            No practice data yet. Metrics appear after your first completed session.
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Overall score', value: hasData ? overallScore.toFixed(1) : '—', icon: BarChart3 },
          { label: 'Strongest area', value: hasData ? `${technicalDepth}/100` : '—', icon: Target },
          { label: 'Total sessions', value: hasData ? String(data.totalSessions) : '—', icon: Zap },
          { label: 'Focus area', value: hasData ? focusArea : '—', icon: Trophy },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-lg border border-border bg-card p-5">
              <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Icon className="size-4" />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{loading ? '...' : card.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Score trends</h2>
          <p className="mt-1 text-sm text-muted-foreground">Category averages from completed evaluations.</p>
          <div className="mt-6 h-[280px]">
            {mounted && data.scoreTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoreTrends} margin={{ top: 10, right: 12, left: -16, bottom: 8 }}>
                  <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {trendKeys.map((item) => (
                    <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                {loading ? 'Loading trends...' : 'No trend data yet.'}
              </div>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Skill snapshot</h2>
          <p className="mt-1 text-sm text-muted-foreground">High-level scores from recent practice evaluations.</p>
          <div className="mt-6 h-[280px]">
            {mounted && hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="currentColor" className="opacity-20" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <Radar dataKey="score" stroke="currentColor" fill="currentColor" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                {loading ? 'Loading skills...' : 'No skill data yet.'}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Practice intensity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sessions completed per day.</p>
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-4" />
            {data.totalSessions} sessions
          </span>
        </div>
        <div className="mt-6 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5">
          {heatmapCells.slice(-100).map((item) => (
            <span key={item.day} title={`${item.day}: ${item.value} sessions`} className={`aspect-square rounded-sm ${heatLevel(item.value)}`} />
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-medium">Top module</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {topModule ? `${formatModuleName(topModule[0])} · ${topModule[1]} sessions` : 'No module activity yet.'}
            </p>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-medium">Focus area</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasData ? focusArea : 'Complete a session to identify a focus area.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {data.recentActivity.map((item, index) => (
              <article key={`${item.module}-${item.date}-${index}`} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{formatModuleName(item.module)}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <span className="text-sm font-medium">{item.score == null ? '—' : `${item.score}/100`}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent">
          Back to dashboard
        </Link>
        <Link href="/modules/standup" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Start practice
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
