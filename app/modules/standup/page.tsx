'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  History,
  Info,
  RefreshCcw,
  Send,
  Sparkles,
  Timer,
  Volume2,
  VolumeX } from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { StandupEvaluation } from '@/lib/ai/schemas';
import type { StandupAnswer } from '@/lib/validation/standup';

interface StandupAttempt {
  id: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  answer: StandupAnswer | null;
  evaluation: StandupEvaluation | null;
}


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

function scoreLabel(feedback: StandupEvaluation | null) {
  if (!feedback) return 'Ready';
  if (feedback.overallScore >= 85) return 'Excellent';
  if (feedback.overallScore >= 70) return 'Solid';
  return 'Needs Focus';
}

function standupFieldsFromTranscript(transcript: string) {
  const match = transcript.match(/yesterday[,:]?\s*([\s\S]*?)\s+today[,:]?\s*([\s\S]*?)(?:\s+blockers?[,:]?\s*([\s\S]*))?$/i);
  if (!match) return { yesterday: '', today: transcript.trim(), blockers: '' };
  return { yesterday: match[1].trim(), today: match[2].trim(), blockers: match[3]?.trim() ?? '' };
}

async function fetchStandupAttempts() {
  const response = await fetch('/api/standup', { cache: 'no-store' });
  if (!response.ok) throw new Error('Previous attempts could not be loaded.');
  return (await response.json() as { attempts: StandupAttempt[] }).attempts;
}

export default function StandupModule() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [feedback, setFeedback] = useState<StandupEvaluation | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);
  const [voiceDurationSeconds, setVoiceDurationSeconds] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<StandupAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLElement>(null);
  const clientRequestIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    let active = true;
    fetchStandupAttempts()
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

  const values: Record<StandupKey, string> = useMemo(() => ({ yesterday, today, blockers }), [yesterday, today, blockers]);
  const setters: Record<StandupKey, (value: string) => void> = {
    yesterday: setYesterday,
    today: setToday,
    blockers: setBlockers,
  };
  const totalWords = wordCount(yesterday) + wordCount(today) + wordCount(blockers);
  const hasDraft = Boolean(yesterday.trim() || today.trim() || blockers.trim());
  const inputMode: 'written' | 'voice' = voiceConfirmed ? 'voice' : 'written';
  const completedAttempts = attempts.filter((attempt) => attempt.status === 'completed').length;

  const loadAnswerIntoForm = (answer: StandupAnswer) => {
    setYesterday(answer.yesterday);
    setToday(answer.today);
    setBlockers(answer.blockers);
    setFeedback(null);
    setVoiceTranscript('');
    setVoiceConfirmed(false);
    setVoiceDurationSeconds(null);
    setError(null);
    clientRequestIdRef.current = null;
    stop();
    setTimeout(() => fieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const handleFeedback = async () => {
    if (!yesterday.trim() && !today.trim() && !blockers.trim()) return;

    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const clientRequestId = clientRequestIdRef.current ?? crypto.randomUUID();
      clientRequestIdRef.current = clientRequestId;
      const response = await fetch('/api/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientRequestId,
          yesterday,
          today,
          blockers,
          inputMode,
          transcript: inputMode === 'voice' ? (voiceTranscript || null) : null,
          durationSeconds: voiceDurationSeconds,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'API request failed');

      const result = (payload as { evaluation: StandupEvaluation }).evaluation;
      setFeedback(result);
      clientRequestIdRef.current = null;

      if (ttsSupported && autoReadEnabled && result.summary) {
        speak(result.summary);
      }

      fetchStandupAttempts().then(setAttempts).catch((attemptError) => console.warn(attemptError));

      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (requestError) {
      console.error('Error getting AI feedback:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Evaluation failed. Your stand-up draft is safe here.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setYesterday('');
    setToday('');
    setBlockers('');
    setFeedback(null);
    setVoiceTranscript('');
    setVoiceConfirmed(false);
    setVoiceDurationSeconds(null);
    setError(null);
    clientRequestIdRef.current = null;
    stop();
  };

  return (
    <div className="space-y-6">

          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Daily Stand-up Simulation</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Practice Yesterday / Today / Blockers. Write your update or use optional voice input below, then submit for AI feedback.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black uppercase tracking-wide text-foreground">
                  Mode: {inputMode}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-foreground">
                  {totalWords} words
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-foreground">
                  {attemptsLoading ? '…' : `${completedAttempts} completed`}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="mb-8 rounded-lg border border-border bg-muted/30 p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Optional voice input</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Record, then confirm the transcript to fill the fields below. Say “Yesterday… Today… Blockers…” for automatic separation.
              </p>
              <div className="mt-4">
                <VoiceRecorder
                  moduleType="standup"
                  maxDurationSeconds={120}
                  onTranscript={(result) => {
                    setVoiceTranscript(result.transcript);
                    setVoiceDurationSeconds(result.durationSeconds);
                    setVoiceConfirmed(false);
                    clientRequestIdRef.current = result.clientRequestId;
                    setError(null);
                  }}
                />
              </div>
              {voiceTranscript && (
                <div className="mt-4">
                  <label className="text-xs font-black uppercase text-muted-foreground">Editable Transcript
                    <textarea
                      value={voiceTranscript}
                      onChange={(event) => {
                        setVoiceTranscript(event.target.value);
                        setVoiceConfirmed(false);
                      }}
                      className="mt-2 min-h-28 w-full rounded-md border border-border bg-background/40 p-3 text-sm normal-case leading-6 text-foreground"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const fields = standupFieldsFromTranscript(voiceTranscript);
                      setYesterday(fields.yesterday);
                      setToday(fields.today);
                      setBlockers(fields.blockers);
                      setVoiceConfirmed(true);
                    }}
                    className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-black text-foreground"
                  >
                    Confirm Transcript & Fill Fields
                  </button>
                  {voiceConfirmed && (
                    <p className="mt-2 text-xs font-bold text-teal-300">
                      Voice input confirmed — mode is voice for the next submit.
                    </p>
                  )}
                </div>
              )}
            </section>
            <section ref={fieldsRef} className="grid gap-6 scroll-mt-6 xl:grid-cols-3">
              {standupFields.map((field) => {
                const Icon = field.icon;
                const value = values[field.key];

                return (
                  <article key={field.key} className="flex min-h-[360px] flex-col rounded-lg border border-border bg-card p-6">
                    <div className={`mb-4 flex size-10 items-center justify-center rounded-md ${field.tone === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-muted text-foreground'}`}>
                      <Icon className="size-5" />
                    </div>
                    <h2 className="text-xl font-black text-foreground">{field.title}</h2>
                    <p className="mt-2 min-h-10 text-sm font-bold text-muted-foreground">{field.prompt}</p>
                    <textarea
                      value={value}
                      onChange={(event) => {
                        setters[field.key](event.target.value);
                        setError(null);
                      }}
                      className="mt-4 flex-1 resize-none rounded-lg border border-zinc-900 bg-muted/35 p-4 text-base font-bold leading-7 text-foreground outline-none placeholder:text-foreground/80 focus:border-border"
                      placeholder={field.placeholder}
                    />
                    <div className="mt-4 flex justify-between text-xs font-bold text-muted-foreground">
                      <span>{wordCount(value)} words</span>
                      <span>Target: 15-30 words</span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="mt-8 border-t border-border pt-12" ref={feedbackRef}>
              <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-1 w-28 rounded-full bg-primary/40" />
                  <p className="text-sm font-bold text-muted-foreground">
                    Fill Yesterday / Today / Blockers above, then submit for evaluation.
                  </p>
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg border border-border px-6 py-3 text-sm font-black text-foreground hover:border-foreground"
                  >
                    <RefreshCcw className="mr-2 inline size-4" />
                    Reset All
                  </button>

                  {ttsSupported && (
                    <button
                      type="button"
                      onClick={() => setAutoReadEnabled((value) => !value)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-black transition ${
                        autoReadEnabled
                          ? 'border-border bg-muted text-foreground'
                          : 'border-border text-muted-foreground hover:border-zinc-500'
                      }`}
                      title={autoReadEnabled ? 'Auto-read enabled' : 'Auto-read disabled'}
                    >
                      {autoReadEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                      Auto-read feedback
                    </button>
                  )}

                  {ttsSupported && feedback && (
                    <button
                      type="button"
                      onClick={() => (speaking ? pause() : paused ? resume() : speak(feedback.summary))}
                      className="rounded-lg border border-border px-5 py-3 text-sm font-black text-foreground hover:border-foreground"
                    >
                      {speaking && !paused ? 'Pause Audio' : 'Listen to feedback'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleFeedback}
                    disabled={loading || !hasDraft}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-400 px-6 py-3 text-sm font-black text-primary-foreground transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Submit Stand-up'}
                    <Send className="size-4" />
                  </button>
                </div>

                {!feedback && (
                  <div className="w-full rounded-lg border border-border bg-muted p-5">
                    <p className="mb-3 flex items-center gap-2 text-sm font-black text-muted-foreground">
                      <Sparkles className="size-4 text-foreground" />
                      AI Tip for Clarity
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Try to use more action-oriented verbs. Instead of saying “I am working on…”, try “I am developing…” or “I am integrating…”.
                    </p>
                    {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}
                  </div>
                )}

                {feedback && (
                  <div className="w-full space-y-6">
                    <div className="rounded-lg border border-border bg-card p-5">
                      <p className="text-xs font-black uppercase text-muted-foreground">Overall score</p>
                      <p className="mt-2 text-3xl font-black text-foreground">
                        {Math.round(feedback.overallScore)}
                        <span className="text-base text-muted-foreground">/100</span>
                      </p>
                      <p className="mt-1 text-xs font-bold text-foreground">{scoreLabel(feedback)}</p>
                    </div>

                    <article className="rounded-lg border border-border bg-muted p-5">
                      <h3 className="text-sm font-black uppercase tracking-wide text-foreground">Summary</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{feedback.summary}</p>
                      {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}
                    </article>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <article className="rounded-lg border border-teal-500/25 bg-teal-500/5 p-5">
                        <h3 className="text-sm font-black uppercase tracking-wide text-teal-300">Strengths</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {feedback.strengths.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </article>
                      <article className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-5">
                        <h3 className="text-sm font-black uppercase tracking-wide text-orange-300">Improvements</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {feedback.improvements.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </article>
                    </div>

                    <article className="rounded-lg border border-border bg-card p-6">
                      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
                        <Sparkles className="size-4" /> Improved Answer
                      </h3>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">{feedback.improvedAnswer}</p>
                      {feedback.nextExercise && <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">Next: {feedback.nextExercise}</p>}
                    </article>

                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => loadAnswerIntoForm(standupFieldsFromTranscript(feedback.improvedAnswer))}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-black text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        <RefreshCcw className="size-4" />
                        Use improved answer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          clientRequestIdRef.current = null;
                          setTimeout(() => fieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-black text-foreground hover:border-foreground"
                      >
                        <RefreshCcw className="size-4" />
                        Edit and try again
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        ['Clarity', feedback.categoryScores.clarity, 'bg-primary'],
                        ['Conciseness', feedback.categoryScores.conciseness, 'bg-orange-400'],
                        ['Impact', feedback.categoryScores.impact, 'bg-teal-400'],
                      ].map(([label, value, color]) => (
                        <div key={label} className="rounded-lg border border-border bg-card p-5">
                          <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
                            <span>{label}</span>
                            <span>{value}/100</span>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <section className="w-full rounded-lg border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
                    <History className="size-5 text-foreground" /> Previous Attempts
                  </h2>
                  {attemptsLoading ? (
                    <p className="mt-4 text-sm text-muted-foreground">Loading attempts...</p>
                  ) : attempts.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">
                      No attempts yet. Submit your first stand-up to start tracking progress.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {attempts.map((attempt) => (
                        <details key={attempt.id} className="rounded-md border border-border bg-background/30 p-4">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                            <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                            <span className={attempt.status === 'completed' ? 'text-teal-300' : attempt.status === 'failed' ? 'text-red-300' : 'text-orange-300'}>
                              {attempt.evaluation ? `${Math.round(attempt.evaluation.overallScore)}/100` : attempt.status}
                            </span>
                          </summary>
                          <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                            {attempt.answer && (
                              <div className="space-y-1 text-muted-foreground">
                                <p><strong className="text-foreground">Yesterday:</strong> {attempt.answer.yesterday || 'Not provided'}</p>
                                <p><strong className="text-foreground">Today:</strong> {attempt.answer.today || 'Not provided'}</p>
                                <p><strong className="text-foreground">Blockers:</strong> {attempt.answer.blockers || 'None'}</p>
                              </div>
                            )}
                            {attempt.evaluation && (
                              <>
                                <p>{attempt.evaluation.summary}</p>
                                <p className="text-foreground"><strong>Improved:</strong> {attempt.evaluation.improvedAnswer}</p>
                              </>
                            )}
                            {attempt.status === 'failed' && !attempt.evaluation && (
                              <p className="text-red-300">
                                This evaluation failed. Load the answer and submit it as a new attempt when ready.
                              </p>
                            )}
                            {attempt.answer && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (attempt.answer) loadAnswerIntoForm(attempt.answer);
                                }}
                                className="rounded-md border border-border px-4 py-2 text-xs font-black text-foreground hover:border-foreground"
                              >
                                Load into form
                              </button>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </section>

                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                  <Timer className="size-4" />
                  {totalWords} total words prepared for this stand-up
                </div>
              </div>
            </section>
          </div>
    </div>
  );
}
