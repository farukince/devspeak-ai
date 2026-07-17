'use client';

import { useMemo, useState } from 'react';
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
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

interface Suggestion {
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'refactor';
  icon: string;
}

interface ReviewerFeedback {
  constructiveness: number;
  specificity: number;
  tone: number;
  feedback: string;
  suggestions: Suggestion[];
}

interface AuthorFeedback {
  correctness: number;
  readability: number;
  bestPractices: number;
  feedback: string;
  suggestions: Suggestion[];
}

type AiFeedbackType = ReviewerFeedback | AuthorFeedback;
type Role = 'reviewer' | 'author';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { href: '/modules/interview', label: 'Interview', icon: BookOpen },
  { href: '/modules/standup', label: 'Stand-up', icon: MessageSquare },
  { href: '/modules/code-review', label: 'Code Review', icon: Code2 },
  { href: '/modules/writing', label: 'Writing', icon: PenTool },
  { href: '/modules/pair-programming', label: 'Pair Programming', icon: Users },
  { href: '/modules/progress', label: 'Progress', icon: BarChart3 },
];

const SAMPLE_CODE_REVIEWER = `export const calculateTotal = (items) => {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
};`;

const SAMPLE_CODE_AUTHOR_DEFAULT = `export const calculateTotal = (items) => {
  const total = items.reduce((acc, item) => {
    if (!item.price) throw new Error("Missing price");
    return acc + item.price;
  }, 0);

  return total;
};`;

const diffRows = [
  { line: '12', mark: ' ', code: 'export const calculateTotal = (items) => {', type: 'context' },
  { line: '13', mark: '-', code: 'let total = 0;', type: 'remove' },
  { line: '14', mark: '-', code: 'for (let i = 0; i < items.length; i++) {', type: 'remove' },
  { line: '15', mark: '-', code: '  total += items[i].price;', type: 'remove' },
  { line: '16', mark: '-', code: '}', type: 'remove' },
  { line: '13', mark: '+', code: 'const total = items.reduce((acc, item) => {', type: 'add' },
  { line: '14', mark: '+', code: '  if (!item.price) throw new Error("Missing price");', type: 'add' },
  { line: '15', mark: '+', code: '  return acc + item.price;', type: 'add' },
  { line: '16', mark: '+', code: '}, 0);', type: 'add' },
  { line: '17', mark: ' ', code: 'return total;', type: 'context' },
  { line: '18', mark: ' ', code: '};', type: 'context' },
] as const;

const guidelines = [
  "Avoid 'You' language (e.g., 'You forgot...')",
  "Explain the 'Why' behind every suggestion",
  'Differentiate between nitpicks and blockers',
  'Check for edge cases in logic',
  'Suggest exact code snippets where possible',
];

function isReviewerFeedback(feedback: AiFeedbackType): feedback is ReviewerFeedback {
  return 'constructiveness' in feedback;
}

function averageScore(feedback: AiFeedbackType | null) {
  if (!feedback) return 84;
  if (isReviewerFeedback(feedback)) {
    return Math.round((feedback.constructiveness + feedback.specificity + feedback.tone) / 3);
  }
  return Math.round((feedback.correctness + feedback.readability + feedback.bestPractices) / 3);
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value / 20);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-4 ${index < filled ? 'fill-violet-400 text-violet-400' : 'fill-zinc-500 text-zinc-500'}`}
        />
      ))}
    </div>
  );
}

export default function CodeReviewModule() {
  const [role, setRole] = useState<Role>('reviewer');
  const [inputContent, setInputContent] = useState('');
  const [authorCode, setAuthorCode] = useState(SAMPLE_CODE_AUTHOR_DEFAULT);
  const [feedback, setFeedback] = useState<AiFeedbackType | null>(null);
  const [loading, setLoading] = useState(false);
  const score = averageScore(feedback);

  const intelligence = useMemo(() => {
    if (!feedback) {
      return [
        {
          label: 'Constructiveness',
          score: 82,
          note: 'Feedback provides clear alternative solutions and explains the reasoning.',
        },
        {
          label: 'Tone & Empathy',
          score: 78,
          note: "Uses 'I' statements but occasionally sounds slightly prescriptive.",
        },
        {
          label: 'Specificity',
          score: 92,
          note: 'Directly references line numbers and specific logic patterns.',
        },
      ];
    }

    if (isReviewerFeedback(feedback)) {
      return [
        { label: 'Constructiveness', score: feedback.constructiveness, note: feedback.feedback },
        { label: 'Tone & Empathy', score: feedback.tone, note: feedback.feedback },
        { label: 'Specificity', score: feedback.specificity, note: feedback.feedback },
      ];
    }

    return [
      { label: 'Correctness', score: feedback.correctness, note: feedback.feedback },
      { label: 'Readability', score: feedback.readability, note: feedback.feedback },
      { label: 'Best Practices', score: feedback.bestPractices, note: feedback.feedback },
    ];
  }, [feedback]);

  const handleSubmit = async () => {
    const content = role === 'reviewer' ? inputContent : authorCode;
    if (!content.trim()) return;

    setLoading(true);
    setFeedback(null);

    const payload = role === 'reviewer'
      ? { role: 'reviewer', userReview: inputContent, codeToReview: SAMPLE_CODE_REVIEWER }
      : { role: 'author', codeToReview: authorCode };

    try {
      const response = await fetch('/api/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setFeedback(data);

      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          moduleType: 'code_review',
          taskName: role === 'reviewer' ? 'Pull Request #128' : 'Code Authoring',
          scores: data,
          userInput: content,
          aiFeedback: data.feedback,
        }),
      }).catch(console.warn);
    } catch (error) {
      console.error(error);
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
              const active = item.href === '/modules/code-review';

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
            <div className="mb-9 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-white">Code Review Practice</h1>
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-black text-emerald-300">
                    Scenario #42: Refactoring
                  </span>
                </div>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-zinc-400">
                  Practice giving constructive feedback on complex logic changes. Focus on specificity and tone.
                </p>
              </div>

              <div className="grid h-11 w-full max-w-sm grid-cols-2 rounded-md border border-zinc-700 bg-zinc-950 p-1">
                {(['reviewer', 'author'] as Role[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setRole(item);
                      setFeedback(null);
                    }}
                    className={`rounded text-sm font-black capitalize transition ${
                      role === item ? 'bg-violet-400 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-7">
                <section className="overflow-hidden rounded-lg border border-zinc-700 bg-[#18191b]">
                  <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-5">
                    <div className="flex items-center gap-4">
                      <span className="flex size-10 items-center justify-center rounded-md bg-violet-500/15 text-violet-300">
                        <Code2 className="size-5" />
                      </span>
                      <div>
                        <h2 className="text-base font-black text-white">Pull Request #128</h2>
                        <p className="mt-1 text-xs font-semibold text-zinc-400">Refactor cart calculation logic for performance</p>
                      </div>
                    </div>
                    <div className="hidden -space-x-2 sm:flex">
                      <span className="flex size-7 items-center justify-center rounded-full border border-black bg-zinc-700 text-[10px] font-black">JD</span>
                      <span className="flex size-7 items-center justify-center rounded-full border border-black bg-violet-400 text-[10px] font-black text-black">AD</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-5 py-3">
                    <div className="flex items-center gap-3 text-xs font-black text-zinc-400">
                      <Code2 className="size-4 text-violet-300" />
                      src/utils/cart.ts
                    </div>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">Typescript</span>
                  </div>

                  {role === 'reviewer' ? (
                    <div className="overflow-auto bg-[#0d1117] py-3 text-sm">
                      {diffRows.map((row, index) => (
                        <div
                          key={`${row.line}-${index}`}
                          className={`grid grid-cols-[44px_28px_minmax(620px,1fr)] px-4 font-mono leading-7 ${
                            row.type === 'remove'
                              ? 'bg-red-500/10 text-red-300'
                              : row.type === 'add'
                                ? 'bg-emerald-500/5 text-zinc-100'
                                : 'text-zinc-200'
                          }`}
                        >
                          <span className="text-right text-zinc-600">{row.line}</span>
                          <span className={row.type === 'remove' ? 'text-red-400' : row.type === 'add' ? 'text-white' : 'text-zinc-500'}>
                            {row.mark}
                          </span>
                          <code>{row.code}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={authorCode}
                      onChange={(event) => setAuthorCode(event.target.value)}
                      spellCheck={false}
                      className="min-h-[340px] w-full resize-none bg-[#0d1117] p-5 font-mono text-sm leading-7 text-zinc-100 outline-none"
                    />
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-black text-white">
                      <MessageSquare className="size-5 text-violet-300" />
                      Your Feedback
                    </h2>
                    <span className="rounded-full bg-violet-500/15 px-3 py-1 text-[10px] font-black text-violet-300">Voice Mode Enabled</span>
                  </div>

                  <div className="rounded-lg border border-zinc-700 bg-black p-5">
                    <textarea
                      value={inputContent}
                      onChange={(event) => setInputContent(event.target.value)}
                      disabled={role === 'author'}
                      className="min-h-32 w-full resize-none bg-transparent text-sm font-semibold leading-7 text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60"
                      placeholder={
                        role === 'reviewer'
                          ? "e.g., I suggest using a more descriptive variable name here to improve clarity..."
                          : 'Author mode analyzes the code editor above. Switch to Reviewer to write a review comment.'
                      }
                    />
                    <div className="mt-4 flex justify-end gap-3">
                      <button type="button" className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-400 px-5 text-sm font-black text-black hover:bg-violet-300">
                        <Mic className="size-4" />
                        Speak
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || (role === 'reviewer' ? !inputContent.trim() : !authorCode.trim())}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-800 px-5 text-sm font-black text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send className="size-4" />}
                        {loading ? 'Analyzing' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </section>

                <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 p-4 text-sm font-semibold leading-7 text-zinc-300">
                  <span className="mr-2 inline-flex items-center gap-2 font-black text-violet-300">
                    <Zap className="inline size-4" />
                    AI Tip:
                  </span>
                  {feedback?.feedback || 'Try to be more specific. Mention line 14 and suggest the exact alternative to reduce cognitive load.'}
                </div>

                {feedback?.suggestions?.length ? (
                  <section className="grid gap-3 md:grid-cols-3">
                    {feedback.suggestions.map((suggestion, index) => (
                      <article key={`${suggestion.title}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-sm font-black text-white">{suggestion.title}</p>
                        <p className="mt-2 text-xs font-semibold leading-6 text-zinc-400">{suggestion.description}</p>
                      </article>
                    ))}
                  </section>
                ) : null}
              </div>

              <aside className="space-y-7">
                <section className="rounded-lg bg-[#18191b] p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-lg font-black text-white">
                    <BarChart3 className="size-5 text-emerald-300" />
                    Practice Intelligence
                  </h2>

                  <div className="space-y-6">
                    {intelligence.map((item, index) => (
                      <div key={item.label} className={index === intelligence.length - 1 ? '' : 'border-b border-zinc-700 pb-6'}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <h3 className="font-black text-white">{item.label}</h3>
                          <Stars value={item.score} />
                        </div>
                        <p className="line-clamp-2 text-xs font-semibold italic leading-5 text-zinc-400">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-md border border-zinc-700 bg-zinc-950 p-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-300">
                      <span>Overall Fluency</span>
                      <span className="text-violet-300">{score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-violet-400" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg bg-violet-950/10 p-6">
                  <h2 className="mb-5 text-sm font-black uppercase tracking-[0.25em] text-violet-300">Reviewer Guidelines</h2>
                  <div className="space-y-4">
                    {guidelines.map((guideline) => (
                      <p key={guideline} className="flex gap-3 text-sm font-semibold leading-6 text-zinc-300">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                        {guideline}
                      </p>
                    ))}
                  </div>
                  <button type="button" className="mt-7 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-700 text-xs font-black text-white hover:bg-zinc-900">
                    <Info className="size-4" />
                    View Full Review Guide
                  </button>
                </section>

                <section>
                  <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Recent Practice Session</h2>
                  <article className="rounded-lg border border-zinc-700 bg-[#18191b] p-4">
                    <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
                      <span>2 hours ago</span>
                      <ChevronRight className="size-4" />
                    </div>
                    <p className="text-sm font-semibold italic leading-6 text-zinc-300">
                      &quot;I think we could simplify this loop using an array reduction. It might help with...&quot;
                    </p>
                    <div className="mt-5 flex gap-4 text-[10px] font-black text-white">
                      <span>Positive Tone</span>
                      <span>Technical</span>
                    </div>
                  </article>
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
