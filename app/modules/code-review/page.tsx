'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Code2,
  History,
  MessageSquare,
  RefreshCcw,
  Send,
  Sparkles,
  Star,
  Zap } from 'lucide-react';
import type {
  AuthorCodeReviewEvaluation,
  ReviewerCodeReviewEvaluation,
} from '@/lib/ai/schemas';
import type { CodeReviewAnswer } from '@/lib/validation/codeReview';

type AiFeedbackType = ReviewerCodeReviewEvaluation | AuthorCodeReviewEvaluation;
type Role = 'reviewer' | 'author';

interface CodeReviewAttempt {
  id: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  answer: CodeReviewAnswer | null;
  evaluation: AiFeedbackType | null;
}


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

function isReviewerFeedback(feedback: AiFeedbackType): feedback is ReviewerCodeReviewEvaluation {
  return 'constructiveness' in feedback;
}

function averageScore(feedback: AiFeedbackType | null) {
  if (!feedback) return null;
  if (isReviewerFeedback(feedback)) {
    return Math.round((feedback.constructiveness + feedback.specificity + feedback.tone) / 3);
  }
  return Math.round((feedback.correctness + feedback.readability + feedback.bestPractices) / 3);
}

async function fetchCodeReviewAttempts() {
  const response = await fetch('/api/code-review', { cache: 'no-store' });
  if (!response.ok) throw new Error('Code review history could not be loaded.');
  return (await response.json() as { attempts: CodeReviewAttempt[] }).attempts;
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value / 20);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-4 ${index < filled ? 'fill-foreground text-foreground' : 'fill-muted-foreground text-muted-foreground'}`}
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
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<CodeReviewAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const clientRequestIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const formRef = useRef<HTMLElement>(null);
  const score = averageScore(feedback);

  useEffect(() => {
    let active = true;
    fetchCodeReviewAttempts()
      .then((items) => {
        if (active) setAttempts(items);
      })
      .catch((attemptError) => console.warn(attemptError))
      .finally(() => {
        if (active) setAttemptsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const intelligence = useMemo(() => {
    if (!feedback) {
      return [];
    }

    if (isReviewerFeedback(feedback)) {
      return [
        { label: 'Constructiveness', score: feedback.constructiveness, note: feedback.summary },
        { label: 'Tone & Empathy', score: feedback.tone, note: feedback.summary },
        { label: 'Specificity', score: feedback.specificity, note: feedback.summary },
      ];
    }

    return [
      { label: 'Correctness', score: feedback.correctness, note: feedback.summary },
      { label: 'Readability', score: feedback.readability, note: feedback.summary },
      { label: 'Best Practices', score: feedback.bestPractices, note: feedback.summary },
    ];
  }, [feedback]);

  const handleSubmit = async () => {
    const content = role === 'reviewer' ? inputContent : authorCode;
    if (!content.trim() || (role === 'author' && authorCode === SAMPLE_CODE_AUTHOR_DEFAULT)) return;

    setLoading(true);
    setFeedback(null);
    setError(null);

    const clientRequestId = clientRequestIdRef.current ?? crypto.randomUUID();
    clientRequestIdRef.current = clientRequestId;
    const durationSeconds = startedAtRef.current === null
      ? 0
      : Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000));
    const payload = role === 'reviewer'
      ? { role: 'reviewer', userReview: inputContent, codeToReview: SAMPLE_CODE_REVIEWER, clientRequestId, durationSeconds }
      : { role: 'author', codeToReview: authorCode, clientRequestId, durationSeconds };

    try {
      const response = await fetch('/api/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json();
      if (!response.ok) throw new Error(responsePayload.error || 'Code review evaluation failed.');
      setFeedback((responsePayload as { evaluation: AiFeedbackType }).evaluation);
      clientRequestIdRef.current = null;
      fetchCodeReviewAttempts().then(setAttempts).catch((attemptError) => console.warn(attemptError));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Code review evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    setInputContent('');
    setAuthorCode(SAMPLE_CODE_AUTHOR_DEFAULT);
    setFeedback(null);
    setError(null);
    clientRequestIdRef.current = null;
    startedAtRef.current = null;
  };

  const loadAnswer = (answer: CodeReviewAnswer) => {
    setRole(answer.role);
    if (answer.role === 'reviewer') {
      setInputContent(answer.userReview);
    } else {
      setAuthorCode(answer.codeToReview);
    }
    setFeedback(null);
    setError(null);
    clientRequestIdRef.current = null;
    startedAtRef.current = Date.now();
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="space-y-6">

          <div className="space-y-6">
            <div className="mb-9 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-foreground">Code Review Practice</h1>
                </div>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-muted-foreground">
                  Practice giving constructive feedback on complex logic changes. Focus on specificity and tone.
                </p>
              </div>

              <div className="grid h-11 w-full max-w-sm grid-cols-2 rounded-md border border-border bg-background p-1">
                {(['reviewer', 'author'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeRole(item)}
                    className={`rounded text-sm font-black capitalize transition ${
                      role === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-7">
                <section ref={formRef} className="scroll-mt-6 overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-6 py-5">
                    <div className="flex items-center gap-4">
                      <span className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
                        <Code2 className="size-5" />
                      </span>
                      <div>
                        <h2 className="text-base font-black text-foreground">Starter Scenario: Cart Calculation</h2>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {role === 'reviewer' ? 'Practice a constructive review comment.' : 'Improve the starter implementation.'}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-black capitalize text-muted-foreground">{role} context</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3">
                    <div className="flex items-center gap-3 text-xs font-black text-muted-foreground">
                      <Code2 className="size-4 text-foreground" />
                      src/utils/cart.ts
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-black text-muted-foreground">Typescript</span>
                  </div>

                  {role === 'reviewer' ? (
                    <div className="overflow-auto bg-[#0d1117] py-3 text-sm">
                      {diffRows.map((row, index) => (
                        <div
                          key={`${row.line}-${index}`}
                          className={`grid grid-cols-[44px_28px_minmax(620px,1fr)] px-4  leading-7 ${
                            row.type === 'remove'
                              ? 'bg-red-500/10 text-red-300'
                              : row.type === 'add'
                                ? 'bg-emerald-500/5 text-foreground'
                                : 'text-foreground'
                          }`}
                        >
                          <span className="text-right text-zinc-600">{row.line}</span>
                          <span className={row.type === 'remove' ? 'text-red-400' : row.type === 'add' ? 'text-foreground' : 'text-muted-foreground'}>
                            {row.mark}
                          </span>
                          <code>{row.code}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={authorCode}
                      onChange={(event) => {
                        setAuthorCode(event.target.value);
                        setFeedback(null);
                        setError(null);
                        clientRequestIdRef.current = null;
                        if (startedAtRef.current === null) startedAtRef.current = Date.now();
                      }}
                      spellCheck={false}
                      className="min-h-[340px] w-full resize-none bg-[#0d1117] p-5 text-sm leading-7 text-foreground outline-none"
                    />
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                      <MessageSquare className="size-5 text-foreground" />
                      Your Feedback
                    </h2>
                    <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black text-foreground">Written practice</span>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-5">
                    <textarea
                      value={inputContent}
                      onChange={(event) => {
                        setInputContent(event.target.value);
                        setFeedback(null);
                        setError(null);
                        clientRequestIdRef.current = null;
                        if (startedAtRef.current === null) startedAtRef.current = Date.now();
                      }}
                      disabled={role === 'author'}
                      className="min-h-32 w-full resize-none bg-transparent text-sm font-semibold leading-7 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
                      placeholder={
                        role === 'reviewer'
                          ? "e.g., I suggest using a more descriptive variable name here to improve clarity..."
                          : 'Author mode analyzes the code editor above. Switch to Reviewer to write a review comment.'
                      }
                    />
                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || (role === 'reviewer' ? !inputContent.trim() : !authorCode.trim() || authorCode === SAMPLE_CODE_AUTHOR_DEFAULT)}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-muted px-5 text-sm font-black text-foreground hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send className="size-4" />}
                        {loading ? 'Analyzing' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </section>
                {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

                {!feedback && (
                <div className="rounded-lg border border-border bg-muted p-4 text-sm font-semibold leading-7 text-muted-foreground">
                  <span className="mr-2 inline-flex items-center gap-2 font-black text-foreground">
                    <Zap className="inline size-4" />
                    AI Tip:
                  </span>
                  Try to be specific, explain why a change helps, and distinguish blockers from optional suggestions.
                </div>
                )}

                {feedback && (
                  <article className="rounded-lg border border-border bg-muted p-5">
                    <h2 className="text-sm font-black uppercase text-foreground">Summary</h2>
                    <p className="mt-3 text-sm leading-7 text-foreground">{feedback.summary}</p>
                  </article>
                )}

                {feedback && (
                  <>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <article className="rounded-lg border border-teal-500/25 bg-teal-500/5 p-5">
                        <h3 className="font-black text-teal-300">Strengths</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {feedback.strengths.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </article>
                      <article className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-5">
                        <h3 className="font-black text-orange-300">Improvements</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {feedback.improvements.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </article>
                    </div>
                    <article className="rounded-lg border border-border bg-card p-6">
                      <h3 className="font-black text-foreground">
                        {role === 'reviewer' ? 'Improved Review' : 'Improved Code'}
                      </h3>
                      <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{feedback.improvedAnswer}</pre>
                    </article>
                    <section className="grid gap-3 md:grid-cols-3">
                      {feedback.suggestions.map((suggestion, index) => (
                        <article key={`${suggestion.title}-${index}`} className="rounded-lg border border-border bg-background p-4">
                          <p className="text-sm font-black text-foreground">{suggestion.title}</p>
                          <p className="mt-2 text-xs font-semibold leading-6 text-muted-foreground">{suggestion.description}</p>
                        </article>
                      ))}
                    </section>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => loadAnswer(role === 'reviewer'
                          ? { role: 'reviewer', userReview: feedback.improvedAnswer, codeToReview: SAMPLE_CODE_REVIEWER }
                          : { role: 'author', codeToReview: feedback.improvedAnswer })}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground"
                      >
                        <Sparkles className="size-4" /> Use improved answer
                      </button>
                      <button
                        type="button"
                        onClick={() => loadAnswer(role === 'reviewer'
                          ? { role: 'reviewer', userReview: inputContent, codeToReview: SAMPLE_CODE_REVIEWER }
                          : { role: 'author', codeToReview: authorCode })}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground"
                      >
                        <RefreshCcw className="size-4" /> Edit and try again
                      </button>
                    </div>
                  </>
                )}
              </div>

              <aside className="space-y-7">
                <section className="rounded-lg bg-card p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-lg font-black text-foreground">
                    <BarChart3 className="size-5 text-emerald-300" />
                    Practice Intelligence
                  </h2>

                  {feedback ? (
                    <>
                      <div className="space-y-6">
                        {intelligence.map((item, index) => (
                          <div key={item.label} className={index === intelligence.length - 1 ? '' : 'border-b border-border pb-6'}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <h3 className="font-black text-foreground">{item.label}</h3>
                              <Stars value={item.score} />
                            </div>
                            <p className="line-clamp-2 text-xs font-semibold italic leading-5 text-muted-foreground">{item.note}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-7 rounded-md border border-border bg-background p-4">
                        <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                          <span>Overall Score</span>
                          <span className="text-foreground">{score ?? 0}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${score ?? 0}%` }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">Scores will appear after you submit this practice.</p>
                  )}
                </section>

                <section className="rounded-lg bg-muted p-6">
                  <h2 className="mb-5 text-sm font-black uppercase tracking-[0.25em] text-foreground">Reviewer Guidelines</h2>
                  <div className="space-y-4">
                    {guidelines.map((guideline) => (
                      <p key={guideline} className="flex gap-3 text-sm font-semibold leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                        {guideline}
                      </p>
                    ))}
                  </div>
                </section>

              </aside>
            </div>

            <section className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
                <History className="size-5 text-foreground" /> Previous Code Reviews
              </h2>
              {attemptsLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading code review attempts...</p>
              ) : attempts.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No attempts yet. Complete the starter scenario to begin tracking progress.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {attempts.map((attempt) => (
                    <details key={attempt.id} className="rounded-md border border-border bg-background/30 p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                        <span className="capitalize">{attempt.answer?.role ?? 'Code review'} · {new Date(attempt.createdAt).toLocaleString()}</span>
                        <span className={attempt.status === 'completed' ? 'text-teal-300' : attempt.status === 'failed' ? 'text-red-300' : 'text-orange-300'}>
                          {attempt.evaluation ? `${averageScore(attempt.evaluation)}/100` : attempt.status}
                        </span>
                      </summary>
                      <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                        {attempt.answer && (
                          <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-muted-foreground">
                            {attempt.answer.role === 'reviewer' ? attempt.answer.userReview : attempt.answer.codeToReview}
                          </pre>
                        )}
                        {attempt.evaluation && <p>{attempt.evaluation.summary}</p>}
                        {attempt.status === 'failed' && !attempt.evaluation && (
                          <p className="text-red-300">This evaluation failed. Load it and submit as a new attempt.</p>
                        )}
                        {attempt.answer && (
                          <button
                            type="button"
                            onClick={() => {
                              if (attempt.answer) loadAnswer(attempt.answer);
                            }}
                            className="rounded-md border border-border px-4 py-2 text-xs font-black text-foreground hover:border-foreground"
                          >
                            Load into practice
                          </button>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="flex flex-col gap-4 border-t border-border px-5 py-5 text-xs font-semibold text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>© 2026 DevSpeak AI • System Status: Operational</p>
            <div className="flex flex-wrap gap-5">
              <span>Documentation</span>
              <span>API Reference</span>
              <span>Privacy Policy</span>
            </div>
          </footer>
    </div>
  );
}
