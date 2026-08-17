'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Code2,
  MessageSquare,
  PenTool,
  RefreshCcw,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import type { DashboardData } from '@/lib/dashboard/metrics';

interface DashboardResponse extends DashboardData {
  displayName: string | null;
}

const coreModules = [
  { href: '/modules/standup', title: 'Daily Stand-up', description: 'Practice concise progress, plans, and blockers.', icon: MessageSquare },
  { href: '/modules/writing', title: 'Technical Writing', description: 'Improve READMEs, PRs, bug reports, Slack messages, and documentation.', icon: PenTool },
  { href: '/modules/interview', title: 'Technical Interview', description: 'Build technical depth and professional English communication.', icon: BookOpen },
  { href: '/modules/code-review', title: 'Code Review', description: 'Practice reviewer comments and author responses.', icon: Code2 },
  { href: '/modules/pair-programming', title: 'Pair Programming', description: 'Practice driver and navigator communication.', icon: Users },
];

function LoadingDashboard() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading dashboard">
      <div className="h-9 w-72 rounded bg-muted" />
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 rounded-lg bg-muted" />)}
      </div>
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Zap }) {
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <span className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground"><Icon className="size-5" /></span>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </article>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Dashboard data could not be loaded.');
      setData(payload as DashboardResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const refreshOnFocus = () => void loadDashboard();
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div />
        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          aria-label="Refresh dashboard"
          className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          <RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-6">
            {loading ? <LoadingDashboard /> : error ? (
              <section className="mx-auto mt-16 max-w-xl rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center">
                <h1 className="text-xl font-black text-red-200">Dashboard unavailable</h1>
                <p className="mt-3 text-sm text-red-100/80">{error}</p>
                <button type="button" onClick={loadDashboard} className="mt-6 rounded-md bg-red-200 px-5 py-3 text-sm font-black text-red-950">Try Again</button>
              </section>
            ) : data && (
              <div className="space-y-10">
                <section>
                  <h1 className="text-3xl font-black text-foreground">{data.displayName ? `Welcome back, ${data.displayName}.` : 'Welcome to DevSpeak AI.'}</h1>
                  <p className="mt-3 text-sm text-muted-foreground">Your dashboard contains only completed practice data.</p>
                </section>

                <section className="grid gap-5 md:grid-cols-3">
                  <StatCard label="Total Practices" value={String(data.totalPractices)} note="Completed sessions" icon={Zap} />
                  <StatCard label="Last 7 Days" value={String(data.lastSevenDays)} note="Recent completed practices" icon={CalendarDays} />
                  <StatCard label="Average Score" value={data.averageScore === null ? '—' : `${data.averageScore}/100`} note={data.averageScore === null ? 'Complete an evaluated practice' : 'Across evaluated sessions'} icon={Target} />
                </section>

                {data.totalPractices === 0 ? (
                  <section className="rounded-lg border border-dashed border-border bg-muted px-6 py-12 text-center">
                    <Sparkles className="mx-auto size-9 text-foreground" />
                    <h2 className="mt-5 text-xl font-black text-foreground">Complete your first practice</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Your scores, module averages, recent activity, and personalized recommendation will appear here.</p>
                    <Link href="/modules/standup" className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-black text-primary-foreground">Start Daily Stand-up <ChevronRight className="size-4" /></Link>
                  </section>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <section className="rounded-lg border border-border bg-card p-6">
                      <h2 className="text-lg font-black text-foreground">Module Averages</h2>
                      {data.moduleAverages.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Completed sessions do not have evaluations yet.</p> : (
                        <div className="mt-5 space-y-5">
                          {data.moduleAverages.map((module) => (
                            <div key={module.moduleType}>
                              <div className="flex justify-between text-sm font-bold"><span>{module.label}</span><span>{module.averageScore}/100 · {module.count}</span></div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${module.averageScore}%` }} /></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="rounded-lg border border-border bg-card p-6">
                      <h2 className="text-lg font-black text-foreground">Recent Practices</h2>
                      <div className="mt-4 divide-y divide-border">
                        {data.recentSessions.map((session) => (
                          <article key={session.id} className="flex items-center justify-between gap-4 py-4">
                            <div><p className="text-sm font-black text-foreground">{session.label}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</p></div>
                            <span className="rounded-full border border-border px-3 py-1 text-xs font-black text-foreground">{session.overallScore === null ? '—' : `${Math.round(session.overallScore)}/100`}</span>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                <section className="rounded-lg border border-border bg-muted p-6 lg:flex lg:items-center lg:justify-between">
                  <div><p className="text-xs font-black uppercase tracking-widest text-foreground">Recommended Next Practice</p><h2 className="mt-2 text-xl font-black text-foreground">{data.recommendation.label}</h2><p className="mt-3 max-w-2xl text-sm text-muted-foreground">{data.recommendation.reason}</p></div>
                  <Link href={data.recommendation.href} className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-black text-primary-foreground lg:mt-0">Practice Now <ChevronRight className="size-4" /></Link>
                </section>

                <section>
                  <h2 className="text-xl font-black text-foreground">Core Practice Modules</h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {coreModules.map((module) => {
                      const Icon = module.icon;
                      return <article key={module.href} className="rounded-lg border border-border bg-card p-6"><Icon className="size-6 text-foreground" /><h3 className="mt-5 font-black text-foreground">{module.title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{module.description}</p><Link href={module.href} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-foreground">Start Practice <ChevronRight className="size-4" /></Link></article>;
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
    </div>
  );
}
