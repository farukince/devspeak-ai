'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  Code2,
  Grid2X2,
  LogOut,
  MessageSquare,
  Mic,
  MoreVertical,
  PauseCircle,
  PenTool,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';

const SAMPLE_QUESTIONS = {
  Frontend: [
    "Explain the difference between React's useState and useEffect hooks.",
    'What is the Virtual DOM in React and how does it improve performance?',
    "Describe the CSS Box Model and how it differs from 'box-sizing: border-box'.",
    'How do you optimize a React application for performance?',
  ],
  Backend: [
    'What is the difference between a process and a thread in modern operating systems?',
    'Explain RESTful API design principles.',
    'How would you handle authentication and authorization in a microservices architecture?',
    'Describe the concept of database sharding.',
  ],
  Fullstack: [
    'How does CORS work and why is it important?',
    'Explain the difference between Server-Side Rendering and Client-Side Rendering.',
    'How would you design a rate limiter for an API?',
    'What are WebSockets and when should you use them?',
  ],
  DevOps: [
    'What is the difference between Docker and a Virtual Machine?',
    'Explain the concept of CI/CD pipelines.',
    'How do you ensure zero-downtime deployments?',
    'What is Infrastructure as Code?',
  ],
};

interface InterviewFeedback {
  accuracy: number;
  depth: number;
  clarity: number;
  feedback: string;
  key_strengths: string[];
  areas_for_growth: string[];
  recommended_phrasing: string;
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

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function averageScore(feedback: InterviewFeedback | null) {
  if (!feedback) return 84;
  return Math.round((feedback.accuracy + feedback.depth + feedback.clarity) / 3);
}

export default function InterviewModule() {
  const [selectedRole, setSelectedRole] = useState<keyof typeof SAMPLE_QUESTIONS>('Backend');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(252);
  const [timerActive, setTimerActive] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  const currentQuestion = SAMPLE_QUESTIONS[selectedRole][questionIndex];
  const score = averageScore(feedback);

  const transcript = useMemo(() => [
    {
      speaker: 'SYSTEM AI',
      time: '09:00 AM',
      text: `Welcome to your mock interview at TechFlow. I'm Sarah, your technical assessor today. Let's start with a foundational question: ${currentQuestion}`,
      tone: 'system',
    },
    {
      speaker: 'YOU',
      time: '09:01 AM',
      text: answer || 'A process is an independent execution unit with its own memory space. A thread is a subset of a process, sharing memory with other threads in the same process.',
      tone: 'user',
    },
    {
      speaker: 'SYSTEM AI',
      time: '09:02 AM',
      text: feedback?.feedback || 'Good. Now, how would you handle a race condition between two threads accessing a shared variable in a high-concurrency environment?',
      tone: 'system',
    },
  ], [answer, currentQuestion, feedback]);

  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  useEffect(() => {
    setQuestionIndex(0);
    setAnswer('');
    setFeedback(null);
    setTimer(252);
    setTimerActive(false);
  }, [selectedRole]);

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % SAMPLE_QUESTIONS[selectedRole].length);
    setAnswer('');
    setFeedback(null);
    setTimer(300);
    setTimerActive(false);
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setTimerActive(false);
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, question: currentQuestion, answer }),
      });

      if (!response.ok) throw new Error('API request failed');
      const result: InterviewFeedback = await response.json();
      setFeedback(result);

      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          moduleType: 'interview',
          taskName: currentQuestion,
          scores: {
            accuracy: result.accuracy,
            depth: result.depth,
            clarity: result.clarity,
            overall: averageScore(result),
          },
          userInput: answer,
          aiFeedback: result.feedback,
        }),
      }).catch(console.warn);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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
              const active = item.href === '/modules/interview';

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

          <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_384px]">
            <section className="relative flex min-h-[calc(100vh-64px)] flex-col border-r border-zinc-800 px-5 py-8 lg:px-10">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value as keyof typeof SAMPLE_QUESTIONS)}
                    className="h-9 rounded-full border border-zinc-700 bg-zinc-950 px-4 text-xs font-black uppercase text-white outline-none"
                  >
                    <option value="Backend">Scenario: Senior Backend Engineer</option>
                    <option value="Frontend">Scenario: Frontend Engineer</option>
                    <option value="Fullstack">Scenario: Fullstack Developer</option>
                    <option value="DevOps">Scenario: DevOps Engineer</option>
                  </select>
                  <span className="inline-flex items-center gap-2 text-sm font-black text-zinc-400">
                    <PauseCircle className="size-4 text-violet-300" />
                    Time Elapsed: {formatTime(300 - timer)}
                  </span>
                </div>
                <span className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-700 px-4 text-xs font-black uppercase text-zinc-300">
                  <span className="size-2 rounded-full bg-zinc-500" />
                  {timerActive ? 'Live' : 'Ready'}
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
                <div className="relative mb-12">
                  <div className="flex size-44 items-center justify-center rounded-full border-[10px] border-zinc-800 bg-[#f8ffc2] text-6xl font-black text-zinc-900 shadow-2xl shadow-black md:size-48">
                    S
                  </div>
                  <span className="absolute bottom-3 right-3 size-12 rounded-full border-2 border-black bg-yellow-300" />
                </div>

                <h1 className="max-w-4xl text-3xl font-black tracking-tight text-white md:text-4xl">
                  Ready to start the technical screening
                </h1>
                <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-zinc-400 md:text-base">
                  Sarah is evaluating your technical depth and clarity of communication. Speak clearly and use technical terminology appropriately.
                </p>

                <div className="my-20 flex items-center gap-1">
                  {Array.from({ length: 28 }).map((_, index) => (
                    <span key={index} className="h-2 w-1 rounded-full bg-zinc-900" />
                  ))}
                </div>

                <div className="mb-8 grid h-11 w-full max-w-xs grid-cols-2 rounded-md border border-zinc-700 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => setMode('voice')}
                    className={`inline-flex items-center justify-center gap-2 rounded text-sm font-black ${
                      mode === 'voice' ? 'bg-violet-500/25 text-violet-300' : 'text-zinc-400'
                    }`}
                  >
                    <Mic className="size-4" />
                    Voice Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className={`inline-flex items-center justify-center gap-2 rounded text-sm font-black ${
                      mode === 'text' ? 'bg-violet-500/25 text-violet-300' : 'text-zinc-400'
                    }`}
                  >
                    <MessageSquare className="size-4" />
                    Text Mode
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setTimerActive((active) => !active)}
                  className="flex size-24 items-center justify-center rounded-full bg-violet-400 text-black shadow-2xl shadow-violet-500/20 hover:bg-violet-300 md:size-28"
                >
                  <Mic className="size-11" />
                </button>
                <p className="mt-5 text-sm font-black uppercase text-zinc-400">Tap Space to Record</p>

                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={handleNextQuestion} className="h-10 rounded-md border border-zinc-700 px-5 text-xs font-black text-white hover:bg-zinc-900">
                    Next Question
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !answer.trim()}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-violet-400 px-5 text-xs font-black text-black hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? <span className="size-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <Send className="size-4" />}
                    Analyze
                  </button>
                </div>
              </div>

              {mode === 'text' && (
                <div className="mx-auto mb-8 w-full max-w-4xl rounded-lg border border-zinc-700 bg-zinc-950 p-4">
                  <textarea
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      if (!timerActive && event.target.value) setTimerActive(true);
                    }}
                    placeholder="Type your answer here..."
                    className="min-h-32 w-full resize-none bg-transparent text-sm font-semibold leading-7 text-zinc-100 outline-none placeholder:text-zinc-600"
                  />
                </div>
              )}
            </section>

            <aside className="flex min-h-[calc(100vh-64px)] flex-col bg-[#18191b]">
              <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
                <h2 className="flex items-center gap-3 text-base font-black uppercase tracking-wider text-white">
                  <span className="text-violet-300">›_</span>
                  Live Transcription
                </h2>
                <MoreVertical className="size-5 text-zinc-400" />
              </div>

              <div className="flex-1 space-y-7 overflow-y-auto p-6">
                {transcript.map((entry, index) => (
                  <div key={`${entry.speaker}-${index}`} className={entry.tone === 'user' ? 'ml-8' : ''}>
                    <div className={`mb-3 flex items-center gap-2 text-[10px] font-black uppercase ${entry.tone === 'user' ? 'justify-end text-cyan-300' : 'text-violet-300'}`}>
                      <span>{entry.speaker}</span>
                      <span className="text-zinc-500">{entry.time}</span>
                    </div>
                    <div className={`rounded-md border p-4 text-sm font-black leading-7 ${
                      entry.tone === 'user'
                        ? 'border-violet-500/30 bg-violet-500/10 text-violet-200'
                        : 'border-zinc-700 bg-zinc-950 text-white'
                    }`}>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 p-5">
                <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <span>Predicted Score</span>
                  <span>{score}% Accurate</span>
                </div>
                <div className="mb-4 h-2 rounded-full bg-zinc-700">
                  <div className="h-full rounded-full bg-violet-400" style={{ width: `${score}%` }} />
                </div>
                <Link href="/modules/progress" className="flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-700 text-xs font-black uppercase text-white hover:bg-zinc-900">
                  View Live Feedback
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </aside>
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
