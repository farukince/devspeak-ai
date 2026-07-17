'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Grid2X2,
  Info,
  LogOut,
  MessageSquare,
  Mic,
  PenTool,
  Play,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';

interface FeedbackItem {
  title: string;
  description: string;
  type?: 'tip' | 'warning' | 'refactor';
  code?: string;
}

interface DriverFeedback {
  correctness: number;
  efficiency: number;
  readability: number;
  feedback: string;
  communication_tips?: FeedbackItem[];
  refactoring_suggestions?: FeedbackItem[];
  strategy_alerts?: FeedbackItem[];
}

interface NavigatorFeedback {
  clarity: number;
  effectiveness: number;
  precision: number;
  generatedCode: string;
  communication_tips?: FeedbackItem[];
}

type AiFeedbackType = DriverFeedback | NavigatorFeedback;
type Role = 'driver' | 'navigator';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const DEFAULT_CODE = `// Navigator's Goal: Implement JWT validation
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing Token' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    // AI Driver is waiting for your next instruction...
    req.user = user;
    next();
  });
};`;

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { href: '/modules/interview', label: 'Interview', icon: BookOpen },
  { href: '/modules/standup', label: 'Stand-up', icon: MessageSquare },
  { href: '/modules/code-review', label: 'Code Review', icon: Code2 },
  { href: '/modules/writing', label: 'Writing', icon: PenTool },
  { href: '/modules/pair-programming', label: 'Pair Programming', icon: Users },
  { href: '/modules/progress', label: 'Progress', icon: BarChart3 },
];

function isDriverFeedback(feedback: AiFeedbackType): feedback is DriverFeedback {
  return 'correctness' in feedback;
}

function sessionScore(feedback: AiFeedbackType | null) {
  if (!feedback) return '92.4';
  if (isDriverFeedback(feedback)) {
    return ((feedback.correctness + feedback.efficiency + feedback.readability) / 3).toFixed(1);
  }
  return ((feedback.clarity + feedback.effectiveness + feedback.precision) / 3).toFixed(1);
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PairProgrammingModule() {
  const [role, setRole] = useState<Role>('navigator');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "I've set up the basic structure for the JWT middleware. How should we handle cases where the token is expired specifically?",
      timestamp: '09:24',
    },
  ]);
  const [feedback, setFeedback] = useState<AiFeedbackType | null>(null);
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState('Implement JWT Error Handling');
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  useEffect(() => {
    setFeedback(null);
    setChatInput('');
    setTask(role === 'driver' ? 'Refactor this legacy data processing script' : 'Implement JWT Error Handling');
  }, [role]);

  const tips = useMemo(() => {
    if (!feedback) {
      return [
        'Mention TokenExpiredError explicitly.',
        'Use 401 for expired credentials and 403 for malformed tokens.',
        'Ask the driver to keep error messages specific but safe.',
      ];
    }

    return [
      ...(feedback.communication_tips || []).map((item) => item.description),
      ...(isDriverFeedback(feedback) ? feedback.refactoring_suggestions || [] : []).map((item) => item.description),
      ...(isDriverFeedback(feedback) ? feedback.strategy_alerts || [] : []).map((item) => item.description),
    ].slice(0, 3);
  }, [feedback]);

  const handleSubmit = async () => {
    if (role === 'navigator' && !chatInput.trim()) return;
    if (role === 'driver' && !code.trim()) return;

    setLoading(true);
    const userMessage = role === 'navigator' ? chatInput : (chatInput || 'Please analyze the current implementation.');

    setChatHistory((prev) => [...prev, { role: 'user', text: userMessage, timestamp: timestamp() }]);
    setChatInput('');

    const payload = role === 'driver'
      ? { role: 'driver', task, code }
      : { role: 'navigator', instruction: userMessage };

    try {
      const response = await fetch('/api/pair-programming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('API request failed');
      const data: AiFeedbackType = await response.json();
      setFeedback(data);

      const aiResponseText = isDriverFeedback(data)
        ? data.feedback
        : "I've updated the code based on your instruction. How does this look?";

      if (!isDriverFeedback(data) && data.generatedCode) {
        setCode(data.generatedCode);
      }

      setChatHistory((prev) => [...prev, { role: 'ai', text: aiResponseText, timestamp: timestamp() }]);

      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          moduleType: 'pair_programming',
          taskName: role === 'driver' ? task : 'Navigator Session',
          scores: data,
          userInput: role === 'driver' ? code : userMessage,
          aiFeedback: aiResponseText,
        }),
      }).catch(console.warn);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [...prev, { role: 'ai', text: 'Sorry, something went wrong processing your request.', timestamp: timestamp() }]);
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
              const active = item.href === '/modules/pair-programming';

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

          <div className="flex-1 px-5 py-8 lg:px-10">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Pair Programming Simulation</h1>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
                  <Users className="size-4 text-violet-300" />
                  Collaborating with <span className="font-black text-white">Driver_AI_v2.4</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="mr-2 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Session Score</p>
                  <p className="text-2xl font-black text-violet-300">{sessionScore(feedback)}</p>
                </div>
                <button type="button" className="inline-flex h-11 items-center gap-2 rounded-md bg-zinc-800 px-5 text-sm font-black text-white hover:bg-zinc-700">
                  <Info className="size-4" />
                  Get Hint
                </button>
                <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-md bg-violet-400 px-6 text-sm font-black text-black hover:bg-violet-300 disabled:opacity-50">
                  <Play className="size-4 fill-current" />
                  {loading ? 'Analyzing...' : 'Analyze Performance'}
                </button>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
              <section>
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
                  <Terminal className="size-4 text-violet-300" />
                  Driver View <span className="text-zinc-500">(AI Managed)</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-700 bg-[#0d1117]">
                  <div className="flex items-center justify-between border-b border-zinc-700 bg-[#18191b] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Code2 className="size-4 text-violet-300" />
                      <span className="text-sm font-semibold text-zinc-300">auth_middleware.ts</span>
                      <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-[10px] font-black text-violet-300">TypeScript</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden items-center gap-2 text-xs font-black text-emerald-300 sm:flex">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        AI Driver: Ready
                      </span>
                      <SlidersHorizontal className="size-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="relative min-h-[570px] overflow-auto p-6">
                    <textarea
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      readOnly={role === 'navigator'}
                      spellCheck={false}
                      className="min-h-[500px] w-[920px] resize-none bg-transparent font-mono text-sm font-semibold leading-7 text-zinc-100 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-700 bg-[#18191b] px-5 py-3 text-xs font-semibold text-zinc-400">
                    <div className="flex gap-5">
                      <span>UTF-8</span>
                      <span>Spaces: 2</span>
                    </div>
                    <div className="flex gap-5">
                      <span>Ln 19, Col 1</span>
                      <span className="font-black text-emerald-300">DevSpeak Sync: Active</span>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
                  <Mic className="size-4 text-violet-300" />
                  Navigator Console <span className="text-zinc-500">(You)</span>
                </div>

                <section className="rounded-lg bg-[#18191b] p-6">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-zinc-400">
                    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-300">Current Goal</span>
                    <span className="ml-3">Pair Session #124</span>
                  </p>
                  <h2 className="text-xl font-black text-white">{task}</h2>
                  <p className="mt-4 text-sm font-semibold leading-7 text-zinc-400">
                    Explain to the Driver how to handle expired tokens versus malformed tokens specifically using a 401 vs 403 status code.
                  </p>
                </section>

                <section className="rounded-lg border border-zinc-700 bg-black p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#f8ffc2] text-sm text-black">AI</span>
                    <span className="text-xs font-black uppercase tracking-wider text-violet-300">AI Driver</span>
                  </div>

                  <div className="space-y-4">
                    {chatHistory.map((message, index) => (
                      <div key={`${message.timestamp}-${index}`} className={message.role === 'user' ? 'text-right' : ''}>
                        {message.role === 'user' && (
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">You (Navigator)</p>
                        )}
                        <div className={`inline-block max-w-[92%] rounded-md p-4 text-left text-sm font-black leading-7 ${
                          message.role === 'user'
                            ? 'border border-violet-500/30 bg-violet-500/10 text-white'
                            : 'bg-[#18191b] text-white'
                        }`}>
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={role === 'navigator' ? 'Tell the driver what to do next...' : 'Explain your implementation or ask for feedback...'}
                    className="mt-5 min-h-24 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 p-4 text-sm font-semibold leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
                  />
                </section>

                <section className="rounded-lg border border-zinc-800 bg-black p-4">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-xs font-black text-white">
                    <button type="button" onClick={() => setMode('text')} className={`h-9 rounded ${mode === 'text' ? 'bg-zinc-900 text-white' : 'text-zinc-400'}`}>
                      ›_ Text Mode
                    </button>
                    <button type="button" onClick={() => setMode('voice')} className={`h-9 rounded border border-zinc-700 px-4 uppercase ${mode === 'voice' ? 'bg-violet-500/20 text-violet-300' : 'text-white'}`}>
                      Push to Speak
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 text-zinc-300">
                      <CheckCircle2 className="size-4" />
                      End Session
                    </button>
                  </div>
                </section>

                <button type="button" className="mx-auto flex size-20 items-center justify-center rounded-full bg-violet-400 text-black shadow-2xl shadow-violet-500/20 hover:bg-violet-300">
                  <Mic className="size-9" />
                </button>

                <section className="space-y-3">
                  {tips.map((tip, index) => (
                    <div key={`${tip}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs font-semibold leading-5 text-zinc-400">
                      {tip}
                    </div>
                  ))}
                </section>
              </aside>
            </div>
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
