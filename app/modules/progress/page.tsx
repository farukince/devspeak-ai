'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Code2,
  Filter,
  Grid2X2,
  LogOut,
  MessageSquare,
  PenTool,
  Search,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Users,
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

interface DashboardData {
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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { href: '/modules/interview', label: 'Interview', icon: BookOpen },
  { href: '/modules/standup', label: 'Stand-up', icon: MessageSquare },
  { href: '/modules/code-review', label: 'Code Review', icon: Code2 },
  { href: '/modules/writing', label: 'Writing', icon: PenTool },
  { href: '/modules/pair-programming', label: 'Pair Programming', icon: Users },
  { href: '/modules/progress', label: 'Progress', icon: BarChart3 },
];

const demoData: DashboardData = {
  totalSessions: 342,
  moduleCounts: {
    interview: 86,
    standup: 54,
    code_review: 63,
    writing: 48,
    pair_programming: 91,
  },
  scoreTrends: [
    { date: 'Oct 01', clarity: 65, correctness: 70, tone: 60 },
    { date: 'Oct 02', clarity: 68, correctness: 72, tone: 62 },
    { date: 'Oct 03', clarity: 67, correctness: 75, tone: 65 },
    { date: 'Oct 04', clarity: 71, correctness: 74, tone: 68 },
    { date: 'Oct 05', clarity: 75, correctness: 78, tone: 70 },
    { date: 'Oct 06', clarity: 74, correctness: 80, tone: 72 },
    { date: 'Oct 07', clarity: 79, correctness: 82, tone: 75 },
    { date: 'Oct 08', clarity: 81, correctness: 85, tone: 74 },
    { date: 'Oct 09', clarity: 83, correctness: 84, tone: 78 },
    { date: 'Oct 10', clarity: 86, correctness: 88, tone: 80 },
    { date: 'Oct 11', clarity: 85, correctness: 90, tone: 82 },
    { date: 'Oct 12', clarity: 89, correctness: 92, tone: 86 },
    { date: 'Oct 13', clarity: 91, correctness: 91, tone: 89 },
    { date: 'Oct 14', clarity: 94, correctness: 94, tone: 91 },
  ],
  heatmapData: Array.from({ length: 120 }, (_, index) => ({
    day: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`,
    value: [0, 1, 2, 3, 4][(index * 7 + index) % 5],
  })),
  analysis: {
    strongestArea: { name: 'technical depth', score: 92 },
    weakestArea: { name: 'vocabulary expansion', score: 76 },
  },
  recentActivity: [
    { module: 'pair_programming', date: 'Today', score: 94 },
    { module: 'interview', date: 'Yesterday', score: 91 },
    { module: 'code_review', date: 'Jul 12', score: 88 },
  ],
};

const trendKeys = [
  { key: 'clarity', label: 'Clarity', color: '#a78bfa' },
  { key: 'correctness', label: 'Correctness', color: '#14b8a6' },
  { key: 'tone', label: 'Tone', color: '#38bdf8' },
];

function formatModuleName(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreAverage(data: DashboardData) {
  const values = data.scoreTrends.flatMap((point) =>
    Object.entries(point)
      .filter(([key, value]) => key !== 'date' && typeof value === 'number')
      .map(([, value]) => value as number)
  );

  if (!values.length) return 84.2;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function heatLevel(value: number) {
  if (value >= 4) return 'bg-violet-400';
  if (value === 3) return 'bg-violet-500/80';
  if (value === 2) return 'bg-violet-600/60';
  if (value === 1) return 'bg-violet-900/70';
  return 'bg-zinc-800';
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs shadow-2xl">
      <p className="mb-2 font-bold text-zinc-100">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.name} className="flex items-center gap-2 text-zinc-300">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [data, setData] = useState<DashboardData>(demoData);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('14d');
  const [isDemo, setIsDemo] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/progress-data?userId=anonymous');
        if (!response.ok) throw new Error('Progress provider is not ready yet.');

        const result = await response.json();
        if (result.message === 'No practice sessions found.') {
          setIsDemo(true);
          setData(demoData);
        } else {
          setIsDemo(false);
          setData(result);
        }
      } catch (error) {
        console.warn(error);
        setIsDemo(true);
        setData(demoData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const overallScore = useMemo(() => scoreAverage(data), [data]);
  const technicalDepth = data.analysis.strongestArea.score || 92;
  const focusArea = formatModuleName(data.analysis.weakestArea.name || 'Vocabulary Expansion');
  const heatmapCells = data.heatmapData.length ? data.heatmapData.slice(-120) : demoData.heatmapData;
  const topModules = Object.entries(data.moduleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const radarData = [
    { skill: 'Fluency', score: Math.max(70, Math.round(overallScore)) },
    { skill: 'Tech Depth', score: technicalDepth },
    { skill: 'Vocabulary', score: Math.max(58, 100 - data.analysis.weakestArea.score + 46) },
    { skill: 'Speed', score: 78 },
    { skill: 'Grammar', score: 82 },
    { skill: 'Confidence', score: Math.min(96, Math.round(overallScore) + 5) },
  ];

  return (
    <main className="min-h-screen bg-black text-zinc-100 font-mono">
      <div className="flex min-h-screen border border-zinc-800 bg-black">
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-zinc-800 bg-[#18191b]">
          <div className="flex h-24 items-center px-10">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-violet-400 text-black">
                <Sparkles className="size-5" />
              </span>
              <span className="text-xl font-black tracking-tight text-violet-300">DevSpeak AI</span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-2 px-5 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/modules/progress';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-800 px-5 py-6">
            <Link href="/settings" className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
              <Settings className="size-4" />
              Settings
            </Link>
            <Link href="/" className="mt-2 flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10">
              <LogOut className="size-4" />
              Logout
            </Link>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-5 lg:px-10">
            <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-md bg-zinc-900 px-4 text-sm text-zinc-400 ring-1 ring-zinc-800">
              <Search className="size-4" />
              <span className="truncate">Search simulations, docs...</span>
              <kbd className="ml-auto hidden rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 sm:inline">⌘ K</kbd>
            </div>

            <div className="flex items-center gap-5">
              <button type="button" className="relative rounded-md p-2 text-zinc-300 hover:bg-zinc-900">
                <Bell className="size-5" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-violet-400" />
              </button>
              <div className="hidden h-7 w-px bg-zinc-800 sm:block" />
              <div className="hidden items-center gap-3 text-right sm:flex">
                <div>
                  <p className="text-sm font-black text-white">Alex Dev</p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">Lvl 24 Senior Eng</p>
                </div>
                <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-300 to-teal-300 text-lg">
                  🧑🏻‍💻
                  <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-black bg-emerald-400" />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-5 py-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">Progress Analytics</h1>
                <p className="mt-2 text-zinc-400">Visualize your journey to technical oral fluency.</p>
                {isDemo && !loading && (
                  <p className="mt-3 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-200">
                    Demo metrics shown until the next data provider is connected.
                  </p>
                )}
              </div>

              <div className="flex rounded-lg bg-zinc-900 p-1 text-sm font-black ring-1 ring-zinc-800">
                {['7d', '14d', '30d', '90d'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRange(item)}
                    className={`rounded-md px-5 py-2 transition ${
                      range === item ? 'bg-black text-white shadow' : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Overall Fluency', value: overallScore.toFixed(1), delta: '↗ +12.4%', icon: BarChart3 },
                { label: 'Technical Depth', value: `${technicalDepth}/100`, delta: '↗ +5.2%', icon: Target },
                { label: 'Practice Streak', value: '18 Days', delta: '↗ Best', icon: Zap },
                { label: 'Confidence Score', value: overallScore > 82 ? 'Elite' : 'Rising', delta: '↗ +8.1%', icon: Trophy },
              ].map((card) => {
                const Icon = card.icon;

                return (
                  <article key={card.label} className="rounded-lg border border-zinc-800 bg-[#18191b] p-6 shadow-2xl shadow-black/20">
                    <div className="mb-6 flex items-start justify-between">
                      <span className="flex size-10 items-center justify-center rounded-md bg-zinc-800 text-violet-400">
                        <Icon className="size-5" />
                      </span>
                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-white">{card.delta}</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-400">{card.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-white">{loading ? '...' : card.value}</p>
                  </article>
                );
              })}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <article className="rounded-lg border border-zinc-800 bg-[#18191b] p-6">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">Performance Trends</h2>
                    <p className="mt-2 text-sm text-zinc-400">Fluency, correctness, and tone metrics over {range}</p>
                  </div>
                  <button type="button" className="rounded-lg border border-zinc-700 bg-black p-2 text-white hover:border-violet-400">
                    <Filter className="size-5" />
                  </button>
                </div>

                <div className="h-[330px]">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.scoreTrends} margin={{ top: 10, right: 18, left: -16, bottom: 12 }}>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#d4d4d8', fontSize: 12, fontFamily: 'monospace' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[60, 105]}
                          ticks={[60, 75, 90, 105]}
                          tick={{ fill: '#d4d4d8', fontSize: 12, fontFamily: 'monospace' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {trendKeys.map((item) => (
                          <Line
                            key={item.key}
                            type="monotone"
                            dataKey={item.key}
                            name={item.label}
                            stroke={item.color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5, fill: item.color, stroke: '#000' }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-lg bg-zinc-900/50" />
                  )}
                </div>

                <div className="mt-2 flex flex-wrap justify-center gap-8 text-sm font-black text-zinc-200">
                  {trendKeys.map((item) => (
                    <span key={item.key} className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-zinc-800 bg-[#18191b] p-6">
                <h2 className="text-2xl font-black text-white">Skill Distribution</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Multi-dimensional analysis of your speech profile</p>

                <div className="mt-8 h-[270px]">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#3f3f46" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#d4d4d8', fontSize: 11, fontFamily: 'monospace' }} />
                        <Radar dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-lg bg-zinc-900/50" />
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-xs font-black">
                  <span className="flex items-center gap-2 text-white">
                    <span className="size-2 rounded-full bg-violet-400" />
                    FOCUS AREA
                  </span>
                  <span className="text-violet-300">{focusArea}</span>
                </div>
              </article>
            </section>

            <section className="mt-8 rounded-lg border border-zinc-800 bg-[#18191b]">
              <div className="flex flex-col gap-4 border-b border-zinc-800 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Practice Intensity</h2>
                  <p className="mt-2 text-sm text-zinc-400">Your consistency contribution graph for the last 20 weeks</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <span key={level} className={`size-3 rounded-sm ${heatLevel(level)}`} />
                    ))}
                  </div>
                  <span>More</span>
                  <span className="hidden h-5 w-px bg-zinc-700 sm:block" />
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    {data.totalSessions} Total Sessions
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto px-6 py-8">
                <div className="grid min-w-[760px] grid-cols-[34px_repeat(20,1fr)] gap-2">
                  {['Mon', 'Wed', 'Fri', 'Sun'].map((day) => (
                    <span key={day} className="col-start-1 text-xs font-bold text-zinc-400" style={{ gridRow: ['Mon', 'Wed', 'Fri', 'Sun'].indexOf(day) + 1 }}>
                      {day}
                    </span>
                  ))}
                  {Array.from({ length: 20 }).map((_, week) =>
                    Array.from({ length: 6 }).map((__, day) => {
                      const item = heatmapCells[(week * 6 + day) % heatmapCells.length];

                      return (
                        <span
                          key={`${week}-${day}`}
                          title={`${item.day}: ${item.value} sessions`}
                          className={`size-3 rounded-sm ${heatLevel(item.value)} ${day % 2 === 0 ? 'opacity-100' : 'opacity-80'}`}
                          style={{ gridColumn: week + 2, gridRow: day + 1 }}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid gap-5 border-t border-zinc-900 px-6 pb-7 pt-2 lg:grid-cols-3">
                <div className="rounded-lg p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-white">
                    <BarChart3 className="size-4 text-violet-400" />
                    WEEKLY GROWTH
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Average session length increased by <span className="font-black text-violet-300">+4m</span> since last month.
                  </p>
                </div>
                <div className="rounded-lg p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-white">
                    <Target className="size-4 text-teal-400" />
                    TOP MODULE
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    You&apos;ve practiced <span className="font-black text-teal-300">{formatModuleName(topModules[0]?.[0] || 'Interview')}</span> most often.
                  </p>
                </div>
                <div className="rounded-lg p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-white">
                    <ChevronRight className="size-4 text-sky-400" />
                    NEXT MILESTONE
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Complete <span className="font-black text-sky-300">3 more</span> Stand-ups to reach Lvl 25 Senior Eng.
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard" className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-black text-white hover:border-violet-400">
                Back to Dashboard
              </Link>
              <Link href="/modules" className="inline-flex items-center gap-3 rounded-lg bg-violet-400 px-6 py-3 text-sm font-black text-black hover:bg-violet-300">
                Start New Practice Session
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          <footer className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-5 text-xs text-zinc-400 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <span>© 2024 DevSpeak AI • System Status: Operational</span>
            <div className="flex gap-6">
              <span>Documentation</span>
              <span>API Reference</span>
              <span>Privacy Policy</span>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
