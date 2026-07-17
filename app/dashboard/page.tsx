'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  Clock3,
  Code2,
  Flame,
  Grid2X2,
  LogOut,
  MessageSquare,
  PenTool,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { href: '/modules/interview', label: 'Interview', icon: BookOpen },
  { href: '/modules/standup', label: 'Stand-up', icon: MessageSquare },
  { href: '/modules/code-review', label: 'Code Review', icon: Code2 },
  { href: '/modules/writing', label: 'Writing', icon: PenTool },
  { href: '/modules/pair-programming', label: 'Pair Programming', icon: Users },
  { href: '/modules/progress', label: 'Progress', icon: BarChart3 },
];

const stats = [
  {
    label: 'Practice Streak',
    value: '7 Days',
    note: 'Daily goal achieved',
    trend: '+2 from last week',
    icon: Flame,
    tone: 'orange',
  },
  {
    label: 'Avg. Score',
    value: '88%',
    note: 'Based on last 10 sessions',
    trend: '+4.2%',
    icon: Target,
    tone: 'purple',
  },
  {
    label: 'Total Sessions',
    value: '142',
    note: '48 hours of practice',
    trend: '',
    icon: Zap,
    tone: 'yellow',
  },
];

const modules = [
  {
    href: '/modules/interview',
    title: 'Technical Interview',
    description: 'Practice FAANG-style behavioral and system design questions with live AI feedback.',
    level: 'Advanced',
    duration: '25 min',
    icon: BookOpen,
  },
  {
    href: '/modules/standup',
    title: 'Stand-up Simulation',
    description: 'Master the art of concise daily updates. Practice reporting Yesterday, Today, and Blockers.',
    level: 'Beginner',
    duration: '5 min',
    icon: MessageSquare,
  },
  {
    href: '/modules/code-review',
    title: 'Code Review',
    description: 'Practice giving constructive, professional feedback on pull requests and technical debt.',
    level: 'Intermediate',
    duration: '15 min',
    icon: Code2,
  },
  {
    href: '/modules/writing',
    title: 'Technical Writing',
    description: 'Draft professional READMEs, RFCs, and engineering blogs with AI-assisted clarity.',
    level: 'Intermediate',
    duration: '20 min',
    icon: PenTool,
  },
  {
    href: '/modules/pair-programming',
    title: 'Pair Programming',
    description: 'Collaborative roleplay. Navigate through complex bugs and guide your AI driver.',
    level: 'Advanced',
    duration: '30 min',
    icon: Users,
  },
  {
    href: '/modules/progress',
    title: 'Progress Analytics',
    description: 'Review your detailed performance metrics, vocabulary growth, and fluency trends.',
    level: 'Beginner',
    duration: 'Analytics',
    icon: BarChart3,
  },
];

function levelClass(level: string) {
  if (level === 'Advanced') return 'border-red-500/40 bg-red-500/10 text-red-300';
  if (level === 'Intermediate') return 'border-violet-400/40 bg-violet-500/15 text-violet-300';
  return 'border-zinc-500 bg-zinc-900 text-zinc-200';
}

function statIconClass(tone: string) {
  if (tone === 'orange') return 'bg-orange-500/15 text-orange-300';
  if (tone === 'yellow') return 'bg-yellow-500/15 text-yellow-300';
  return 'bg-violet-500/15 text-violet-300';
}

export default function DashboardPage() {
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
              const isActive = item.href === '/dashboard';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition-colors ${
                    isActive
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
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black leading-none text-white">Alex Dev</p>
                <p className="mt-1 text-[11px] text-zinc-400">Lvl 24 Senior Eng</p>
              </div>
              <div className="relative size-10 rounded-full bg-gradient-to-br from-violet-300 to-emerald-300 p-0.5">
                <div className="flex size-full items-center justify-center rounded-full bg-zinc-900 text-sm font-black">AD</div>
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-black bg-emerald-400" />
              </div>
            </div>
          </header>

          <div className="flex-1 px-5 py-8 lg:px-10">
            <section className="mb-12">
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">Welcome back, Alex.</h1>
              <p className="mt-4 max-w-5xl text-base font-semibold leading-relaxed text-zinc-400 lg:text-lg">
                Ready to refine your professional English? Choose a module to start your next flight simulation.
              </p>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article key={stat.label} className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
                    <div className="flex items-start justify-between">
                      <span className={`flex size-10 items-center justify-center rounded-md ${statIconClass(stat.tone)}`}>
                        <Icon className="size-5" />
                      </span>
                      {stat.trend && <span className="text-xs font-bold text-zinc-300">{stat.trend}</span>}
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-zinc-400">
                      <Clock3 className="size-3" />
                      {stat.note}
                    </p>
                  </article>
                );
              })}
            </section>

            <section className="mt-12">
              <div className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Ready to Practice?</h2>
                  <p className="mt-2 text-sm font-semibold text-zinc-400">Select a specialized module to focus on specific communication skills.</p>
                </div>
                <Link href="/modules/progress" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-black text-white hover:bg-zinc-900">
                  View All Stats
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => {
                  const Icon = module.icon;

                  return (
                    <article key={module.href} className="overflow-hidden rounded-lg border border-zinc-700 bg-[#18191b]">
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex size-12 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <Icon className="size-6" />
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${levelClass(module.level)}`}>
                            {module.level}
                          </span>
                        </div>
                        <h3 className="mt-6 text-xl font-black tracking-tight text-white">{module.title}</h3>
                        <p className="mt-3 min-h-20 text-sm font-semibold leading-7 text-zinc-400">{module.description}</p>
                        <p className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3" />
                            {module.duration}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Target className="size-3" />
                            Focus: Oral Fluency
                          </span>
                        </p>
                      </div>
                      <div className="border-t border-zinc-700 bg-zinc-900/70 px-6 py-4">
                        <Link href={module.href} className="flex h-10 items-center justify-between rounded-md bg-zinc-800 px-4 text-sm font-black text-white hover:bg-violet-500/20 hover:text-violet-200">
                          Start Session
                          <ChevronRight className="size-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-12 rounded-lg border border-violet-500/30 bg-violet-950/10 p-6 lg:flex lg:items-center lg:justify-between lg:p-8">
              <div>
                <h2 className="text-xl font-black text-violet-300">New: System Design Interview v2</h2>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-zinc-300">
                  We&apos;ve updated the Interview module with 50+ new system design scenarios focused on microservices and distributed systems.
                  Practice explaining complex architectures fluently.
                </p>
              </div>
              <Link href="/modules/interview" className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-violet-400 px-8 text-sm font-black text-black hover:bg-violet-300 lg:mt-0">
                Try New Module
              </Link>
            </section>
          </div>

          <footer className="flex flex-col gap-4 border-t border-zinc-800 px-5 py-5 text-xs font-semibold text-zinc-400 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>© 2026 DevSpeak AI • System Status: Operational</p>
            <div className="flex flex-wrap gap-5">
              <Link href="#" className="hover:text-white">Documentation</Link>
              <Link href="#" className="hover:text-white">API Reference</Link>
              <Link href="#" className="hover:text-white">Privacy Policy</Link>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
