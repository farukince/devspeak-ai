'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Code2,
  Grid2X2,
  Info,
  LogOut,
  MessageSquare,
  Mic,
  PenTool,
  RefreshCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface StandupFeedback {
  clarity: number;
  conciseness: number;
  impact: number;
  feedback: string;
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

const standupFields = [
  {
    key: 'yesterday',
    title: 'Yesterday',
    prompt: 'What did you complete since the last sync?',
    placeholder: 'Fixed the memory leak in the data processing pipeline and implemented unit tests for the new parser.',
    icon: RefreshCcw,
    tone: 'violet',
  },
  {
    key: 'today',
    title: 'Today',
    prompt: 'What are your goals for the current session?',
    placeholder: 'I am integrating the new API endpoints and updating the documentation for the frontend team.',
    icon: Calendar,
    tone: 'violet',
  },
  {
    key: 'blockers',
    title: 'Blockers',
    prompt: 'Any obstacles slowing your progress?',
    placeholder: 'Waiting for the DevOps team to provide staging environment credentials.',
    icon: Info,
    tone: 'red',
  },
] as const;

type StandupKey = (typeof standupFields)[number]['key'];

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function scoreLabel(feedback: StandupFeedback | null) {
  if (!feedback) return 'Ready';
  const average = (feedback.clarity + feedback.conciseness + feedback.impact) / 3;
  if (average >= 85) return 'Excellent';
  if (average >= 70) return 'Solid';
  return 'Needs Focus';
}

export default function StandupModule() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [feedback, setFeedback] = useState<StandupFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const {
    supported: ttsSupported,
    speaking,
    paused,
    speak,
    pause,
    resume,
    stop,
  } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  useEffect(() => {
    if (!ttsSupported) return;
    const handlePageHide = () => {
      stop();
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      stop();
    };
  }, [ttsSupported, stop]);

  const values: Record<StandupKey, string> = useMemo(() => ({ yesterday, today, blockers }), [yesterday, today, blockers]);
  const setters: Record<StandupKey, (value: string) => void> = {
    yesterday: setYesterday,
    today: setToday,
    blockers: setBlockers,
  };
  const totalWords = wordCount(yesterday) + wordCount(today) + wordCount(blockers);

  const handleFeedback = async () => {
    if (!yesterday.trim() && !today.trim() && !blockers.trim()) return;

    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yesterday: yesterday || 'Not provided',
          today: today || 'Not provided',
          blockers: blockers || 'None',
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const result: StandupFeedback = await response.json();
      setFeedback(result);

      if (ttsSupported && autoReadEnabled && result.feedback) {
        speak(result.feedback);
      }

      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          moduleType: 'standup',
          taskName: 'Daily Stand-up',
          scores: { clarity: result.clarity, conciseness: result.conciseness, impact: result.impact },
          userInput: { yesterday, today, blockers },
          aiFeedback: result.feedback,
        }),
      }).catch(console.warn);

      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (requestError) {
      console.error('Error getting AI feedback:', requestError);
      setError('AI provider is not ready yet. Your stand-up draft is safe here.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setYesterday('');
    setToday('');
    setBlockers('');
    setFeedback(null);
    setError(null);
    stop();
  };

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
              const active = item.href === '/modules/standup';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition-colors ${
                    active ? 'bg-violet-500/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
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

          <div className="border-b border-zinc-800 px-5 py-7 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Daily Stand-up Simulation</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-white">Session #482</span>
                  <span className="ml-2">Project: CloudScale Infrastructure • Sprint 42</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Elapsed Time</p>
                  <p className="text-xl font-black text-violet-300">01:45</p>
                </div>
                <button type="button" className="rounded-lg border border-zinc-700 p-3 text-zinc-200 hover:border-violet-400">
                  <Info className="size-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 py-8 lg:px-10">
            <section className="grid gap-6 xl:grid-cols-3">
              {standupFields.map((field) => {
                const Icon = field.icon;
                const value = values[field.key];

                return (
                  <article key={field.key} className="flex min-h-[360px] flex-col rounded-lg border border-zinc-800 bg-[#18191b] p-6">
                    <div className={`mb-4 flex size-10 items-center justify-center rounded-md ${field.tone === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/15 text-violet-300'}`}>
                      <Icon className="size-5" />
                    </div>
                    <h2 className="text-xl font-black text-white">{field.title}</h2>
                    <p className="mt-2 min-h-10 text-sm font-bold text-zinc-400">{field.prompt}</p>
                    <textarea
                      value={value}
                      onChange={(event) => {
                        setters[field.key](event.target.value);
                        setError(null);
                      }}
                      className="mt-4 flex-1 resize-none rounded-lg border border-zinc-900 bg-zinc-900/35 p-4 text-base font-bold leading-7 text-zinc-100 outline-none placeholder:text-zinc-200/80 focus:border-violet-400"
                      placeholder={field.placeholder}
                    />
                    <div className="mt-4 flex justify-between text-xs font-bold text-zinc-400">
                      <span>{wordCount(value)} words</span>
                      <span>Target: 15-30 words</span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="mt-8 border-t border-zinc-800 pt-12" ref={feedbackRef}>
              <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-1 w-28 rounded-full bg-violet-400/40" />
                  <p className="text-sm font-bold text-zinc-400">Click the microphone to start speaking</p>
                </div>

                <div className="grid w-full items-center gap-5 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="justify-self-center rounded-lg border border-zinc-700 px-6 py-3 text-sm font-black text-white hover:border-violet-400"
                  >
                    <RefreshCcw className="mr-2 inline size-4" />
                    Reset All
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoReadEnabled((value) => !value)}
                    className={`mx-auto flex size-20 items-center justify-center rounded-full shadow-2xl shadow-violet-500/30 transition ${
                      autoReadEnabled ? 'bg-violet-400 text-black' : 'bg-zinc-800 text-zinc-300'
                    }`}
                    title={autoReadEnabled ? 'Auto read enabled' : 'Auto read disabled'}
                  >
                    <Mic className="size-7" />
                  </button>

                  <div className="flex flex-col gap-3 justify-self-center sm:flex-row">
                    {ttsSupported && feedback && (
                      <button
                        type="button"
                        onClick={() => (speaking ? pause() : paused ? resume() : speak(feedback.feedback))}
                        className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-black text-zinc-200 hover:border-violet-400"
                      >
                        {speaking && !paused ? 'Pause Audio' : 'Listen'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleFeedback}
                      disabled={loading || (!yesterday.trim() && !today.trim() && !blockers.trim())}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-400 px-6 py-3 text-sm font-black text-black transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Analyzing...' : 'Submit Stand-up'}
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full rounded-lg border border-violet-500/30 bg-violet-500/5 p-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-500">
                    <Sparkles className="size-4 text-violet-400" />
                    AI Tip for Clarity
                  </p>
                  <p className="text-sm leading-6 text-zinc-300">
                    {feedback
                      ? feedback.feedback
                      : 'Try to use more action-oriented verbs. Instead of saying “I am working on…”, try “I am developing…” or “I am integrating…”.'}
                  </p>
                  {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}
                </div>

                {feedback && (
                  <div className="grid w-full gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-zinc-800 bg-[#18191b] p-5">
                      <p className="text-xs font-black uppercase text-zinc-400">Overall</p>
                      <p className="mt-2 text-2xl font-black text-white">{scoreLabel(feedback)}</p>
                    </div>
                    {[
                      ['Clarity', feedback.clarity, 'bg-violet-400'],
                      ['Conciseness', feedback.conciseness, 'bg-orange-400'],
                      ['Impact', feedback.impact, 'bg-teal-400'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-lg border border-zinc-800 bg-[#18191b] p-5">
                        <div className="flex justify-between text-xs font-black uppercase text-zinc-400">
                          <span>{label}</span>
                          <span>{value}/100</span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-900">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
                  <Timer className="size-4" />
                  {totalWords} total words prepared for this stand-up
                </div>
              </div>
            </section>
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
