'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Code2,
  History,
  MessageSquare,
  RefreshCcw,
  Send,
  Sparkles,
  Terminal,
  Users } from 'lucide-react';
import type {
  DriverPairProgrammingEvaluation,
  NavigatorPairProgrammingEvaluation,
} from '@/lib/ai/schemas';
import type { PairProgrammingAnswer } from '@/lib/validation/pairProgramming';

type AiFeedbackType = DriverPairProgrammingEvaluation | NavigatorPairProgrammingEvaluation;
type Role = 'driver' | 'navigator';

interface PairProgrammingAttempt {
  id: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  answer: PairProgrammingAnswer | null;
  evaluation: AiFeedbackType | null;
}

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


function isDriverFeedback(feedback: AiFeedbackType): feedback is DriverPairProgrammingEvaluation {
  return 'correctness' in feedback;
}

function sessionScore(feedback: AiFeedbackType | null) {
  if (!feedback) return null;
  if (isDriverFeedback(feedback)) {
    return ((feedback.correctness + feedback.efficiency + feedback.readability) / 3).toFixed(1);
  }
  return ((feedback.clarity + feedback.effectiveness + feedback.precision) / 3).toFixed(1);
}

async function fetchPairProgrammingAttempts() {
  const response = await fetch('/api/pair-programming', { cache: 'no-store' });
  if (!response.ok) throw new Error('Pair programming history could not be loaded.');
  return (await response.json() as { attempts: PairProgrammingAttempt[] }).attempts;
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PairProgrammingModule() {
  const [role, setRole] = useState<Role>('navigator');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<AiFeedbackType | null>(null);
  const [lastAnswer, setLastAnswer] = useState<PairProgrammingAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<PairProgrammingAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const task = 'Implement JWT Error Handling';
  const clientRequestIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const practiceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    fetchPairProgrammingAttempts()
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

  const handleSubmit = async () => {
    if (role === 'navigator' && !chatInput.trim()) return;
    if (role === 'driver' && (!code.trim() || code === DEFAULT_CODE)) return;

    setLoading(true);
    setFeedback(null);
    setError(null);
    const userMessage = role === 'navigator' ? chatInput : (chatInput || 'Please analyze the current implementation.');
    setLastAnswer(role === 'driver'
      ? { role: 'driver', task, code }
      : { role: 'navigator', instruction: userMessage, code });

    setChatHistory((prev) => [...prev, { role: 'user', text: userMessage, timestamp: timestamp() }]);
    setChatInput('');

    const clientRequestId = clientRequestIdRef.current ?? crypto.randomUUID();
    clientRequestIdRef.current = clientRequestId;
    const durationSeconds = startedAtRef.current === null
      ? 0
      : Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000));
    const payload = role === 'driver'
      ? { role: 'driver', task, code, clientRequestId, durationSeconds }
      : { role: 'navigator', instruction: userMessage, code, clientRequestId, durationSeconds };

    try {
      const response = await fetch('/api/pair-programming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json();
      if (!response.ok) throw new Error(responsePayload.error || 'Pair programming evaluation failed.');
      const data = (responsePayload as { evaluation: AiFeedbackType }).evaluation;
      setFeedback(data);
      clientRequestIdRef.current = null;

      const aiResponseText = data.summary;

      if (!isDriverFeedback(data) && data.generatedCode) {
        setCode(data.generatedCode);
      }

      setChatHistory((prev) => [...prev, { role: 'ai', text: aiResponseText, timestamp: timestamp() }]);
      fetchPairProgrammingAttempts().then(setAttempts).catch((attemptError) => console.warn(attemptError));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Pair programming evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    setCode(DEFAULT_CODE);
    setChatInput('');
    setChatHistory([]);
    setFeedback(null);
    setLastAnswer(null);
    setError(null);
    clientRequestIdRef.current = null;
    startedAtRef.current = null;
  };

  const loadAnswer = (answer: PairProgrammingAnswer) => {
    setRole(answer.role);
    setCode(answer.code);
    setChatInput(answer.role === 'navigator' ? answer.instruction : '');
    setChatHistory([]);
    setFeedback(null);
    setLastAnswer(null);
    setError(null);
    clientRequestIdRef.current = null;
    startedAtRef.current = Date.now();
    setTimeout(() => practiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="space-y-6">

          <div className="space-y-6">
            <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Pair Programming Simulation</h1>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Users className="size-4 text-foreground" />
                  Starter task: <span className="font-black text-foreground">{task}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {feedback && (
                  <div className="mr-2 text-right">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Overall Score</p>
                    <p className="text-2xl font-black text-foreground">{sessionScore(feedback)}</p>
                  </div>
                )}
                <div className="grid h-11 grid-cols-2 rounded-md border border-border bg-background p-1">
                  {(['navigator', 'driver'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeRole(item)}
                      className={`rounded px-4 text-xs font-black capitalize ${role === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
              <section ref={practiceRef} className="scroll-mt-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
                  <Terminal className="size-4 text-foreground" />
                  {role === 'navigator' ? 'Driver Code (read-only context)' : 'Driver Code (your implementation)'}
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-[#0d1117]">
                  <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Code2 className="size-4 text-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">auth_middleware.ts</span>
                      <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-black text-foreground">TypeScript</span>
                    </div>
                    <span className="text-xs font-black capitalize text-muted-foreground">{role} context</span>
                  </div>

                  <div className="relative min-h-[570px] overflow-auto p-6">
                    <textarea
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value);
                        setFeedback(null);
                        setError(null);
                        clientRequestIdRef.current = null;
                        if (startedAtRef.current === null) startedAtRef.current = Date.now();
                      }}
                      readOnly={role === 'navigator'}
                      spellCheck={false}
                      className="min-h-[500px] w-[920px] resize-none bg-transparent text-sm font-semibold leading-7 text-foreground outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-5 py-3 text-xs font-semibold text-muted-foreground">
                    <div className="flex gap-5">
                      <span>UTF-8</span>
                      <span>Spaces: 2</span>
                    </div>
                    <div className="flex gap-5">
                      <span>{code.split('\n').length} lines</span>
                      <span className="font-black text-muted-foreground">{role === 'navigator' ? 'Context only' : 'Editable draft'}</span>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
                  <MessageSquare className="size-4 text-foreground" />
                  {role === 'navigator' ? 'Navigator Instruction' : 'Driver Explanation'}
                </div>

                <section className="rounded-lg bg-card p-6">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1 text-foreground">Current Goal</span>
                  </p>
                  <h2 className="text-xl font-black text-foreground">{task}</h2>
                  <p className="mt-4 text-sm font-semibold leading-7 text-muted-foreground">
                    Explain to the Driver how to handle expired tokens versus malformed tokens specifically using a 401 vs 403 status code.
                  </p>
                </section>

                <section className="rounded-lg border border-border bg-background p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">AI</span>
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">Practice Console</span>
                  </div>

                  <div className="space-y-4">
                    {chatHistory.length === 0 && (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {role === 'navigator'
                          ? 'Write one clear instruction for the driver.'
                          : 'Edit the code, then optionally explain your implementation.'}
                      </p>
                    )}
                    {chatHistory.map((message, index) => (
                      <div key={`${message.timestamp}-${index}`} className={message.role === 'user' ? 'text-right' : ''}>
                        {message.role === 'user' && (
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">You (Navigator)</p>
                        )}
                        <div className={`inline-block max-w-[92%] rounded-md p-4 text-left text-sm font-black leading-7 ${
                          message.role === 'user'
                            ? 'border border-border bg-muted text-foreground'
                            : 'bg-card text-foreground'
                        }`}>
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={chatInput}
                    onChange={(event) => {
                      setChatInput(event.target.value);
                      setFeedback(null);
                      setError(null);
                      clientRequestIdRef.current = null;
                      if (startedAtRef.current === null) startedAtRef.current = Date.now();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={role === 'navigator' ? 'Tell the driver what to do next...' : 'Explain your implementation or ask for feedback...'}
                    className="mt-5 min-h-24 w-full resize-none rounded-md border border-border bg-background p-4 text-sm font-semibold leading-6 text-foreground outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || (role === 'navigator' ? !chatInput.trim() : !code.trim() || code === DEFAULT_CODE)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-4" /> {loading ? 'Evaluating...' : 'Submit practice'}
                  </button>
                </section>
                {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
              </aside>
            </div>

            {feedback && (
              <section className="mt-8 space-y-6">
                <article className="rounded-lg border border-border bg-muted p-6">
                  <h2 className="text-sm font-black uppercase text-foreground">Summary</h2>
                  <p className="mt-3 text-sm leading-7 text-foreground">{feedback.summary}</p>
                </article>
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
                    {isDriverFeedback(feedback) ? 'Improved Code' : 'Improved Navigator Instruction'}
                  </h3>
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{feedback.improvedAnswer}</pre>
                </article>
                <div className="grid gap-3 md:grid-cols-3">
                  {feedback.communication_tips.map((tip, index) => (
                    <article key={`${tip.title}-${index}`} className="rounded-lg border border-border bg-background p-4">
                      <p className="text-sm font-black text-foreground">{tip.title}</p>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">{tip.description}</p>
                    </article>
                  ))}
                </div>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => loadAnswer(isDriverFeedback(feedback)
                      ? { role: 'driver', task, code: feedback.improvedAnswer }
                      : { role: 'navigator', instruction: feedback.improvedAnswer, code })}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground"
                  >
                    <Sparkles className="size-4" /> Use improved answer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (lastAnswer) loadAnswer(lastAnswer);
                    }}
                    disabled={!lastAnswer}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground"
                  >
                    <RefreshCcw className="size-4" /> Edit and try again
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {(isDriverFeedback(feedback)
                    ? [
                        ['Correctness', feedback.correctness],
                        ['Efficiency', feedback.efficiency],
                        ['Readability', feedback.readability],
                      ]
                    : [
                        ['Clarity', feedback.clarity],
                        ['Effectiveness', feedback.effectiveness],
                        ['Precision', feedback.precision],
                      ]).map(([label, value]) => (
                    <article key={label} className="rounded-lg border border-border bg-card p-5">
                      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
                      <p className="mt-2 text-3xl font-black text-foreground">{value}<span className="text-sm text-muted-foreground">/100</span></p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
                <History className="size-5 text-foreground" /> Previous Pair Practices
              </h2>
              {attemptsLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading pair programming attempts...</p>
              ) : attempts.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No attempts yet. Complete the starter task to begin tracking progress.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {attempts.map((attempt) => (
                    <details key={attempt.id} className="rounded-md border border-border bg-background/30 p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                        <span className="capitalize">{attempt.answer?.role ?? 'Pair practice'} · {new Date(attempt.createdAt).toLocaleString()}</span>
                        <span className={attempt.status === 'completed' ? 'text-teal-300' : attempt.status === 'failed' ? 'text-red-300' : 'text-orange-300'}>
                          {attempt.evaluation ? `${sessionScore(attempt.evaluation)}/100` : attempt.status}
                        </span>
                      </summary>
                      <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                        {attempt.answer && (
                          <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-muted-foreground">
                            {attempt.answer.role === 'driver' ? attempt.answer.code : attempt.answer.instruction}
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
