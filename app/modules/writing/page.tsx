'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bug,
  Check,
  FileText,
  GitPullRequest,
  History,
  MessageSquare,
  RefreshCcw,
  Sparkles,
  Wand2,
  Zap } from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { WritingEvaluation } from '@/lib/ai/schemas';
import type { WritingAnswer, WritingTaskType } from '@/lib/validation/writing';

type WriterSuggestion = WritingEvaluation['suggestions'][number];

interface WritingAttempt {
  id: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  answer: WritingAnswer | null;
  evaluation: Omit<WritingEvaluation, 'suggestions'> | null;
}


const writingTypes = [
  {
    value: 'readme',
    label: 'README.md',
    helper: 'Clearly describe your project',
    icon: FileText,
    title: 'README.md',
    placeholder: `# Project Title

## Overview
This project aims to...

## Features
- Feature 1
- Feature 2

## Getting Started
To set up the project locally, follow these steps:
1. Clone the repository.
2. Install dependencies: \`npm install\`
3. Run the application: \`npm start\``,
  },
  {
    value: 'pull_request',
    label: 'PR Description',
    helper: 'Communicate changes and risks',
    icon: GitPullRequest,
    title: 'Pull Request Description',
    placeholder: `## Summary
Describe what changed and why.

## Testing
- [ ] Unit tests
- [ ] Manual QA

## Risk
Call out any migration or rollout concerns.`,
  },
  {
    value: 'bug_report',
    label: 'Bug Report',
    helper: 'Make issues reproducible',
    icon: Bug,
    title: 'Bug Report',
    placeholder: `## Actual behavior
The login callback returns a blank page.

## Expected behavior
The user should be redirected to the dashboard.

## Steps to reproduce
1. Sign in with Google.
2. Approve access.
3. Observe the callback page.

## Environment
Chrome 126, macOS`,
  },
  {
    value: 'slack_message',
    label: 'Slack Message',
    helper: 'Communicate technical updates',
    icon: MessageSquare,
    title: 'Technical Slack Message',
    placeholder: `Hi team — the authentication deployment is blocked because the callback URL is missing from the production allow list. Could someone with Supabase access add it before 15:00 UTC?`,
  },
  {
    value: 'technical_documentation',
    label: 'Technical Docs',
    helper: 'Explain systems precisely',
    icon: BookOpen,
    title: 'Technical Documentation',
    placeholder: `# Authentication callback

The callback endpoint exchanges the OAuth authorization code for a Supabase session.

## Prerequisites
- A configured Supabase project
- An allowed callback URL

## Failure handling
Invalid or expired codes redirect users to the login page with a safe error message.`,
  },
] as const;

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

async function fetchWritingAttempts() {
  const response = await fetch('/api/writing', { cache: 'no-store' });
  if (!response.ok) throw new Error('Writing history could not be loaded.');
  return (await response.json() as { attempts: WritingAttempt[] }).attempts;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-black text-foreground">{value}%</p>
    </div>
  );
}

function SuggestionCard({ suggestion, onApply }: { suggestion: WriterSuggestion; onApply: () => void }) {
  const toneClass = suggestion.type === 'warning' ? 'text-orange-300' : suggestion.type === 'refactor' ? 'text-sky-300' : 'text-foreground';

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <span className={`rounded-md border border-border px-2 py-1 text-[10px] font-black uppercase ${toneClass}`}>{suggestion.title}</span>
      {suggestion.original_text && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground line-through decoration-zinc-600">{suggestion.original_text}</p>
      )}
      <p className="mt-3 text-sm font-bold leading-6 text-foreground">{suggestion.description}</p>
      {suggestion.replacement_text && suggestion.original_text && (
        <button
          type="button"
          onClick={onApply}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-muted px-3 py-2 text-xs font-black text-foreground hover:bg-muted hover:text-foreground"
        >
          <Check className="size-3" />
          Apply Fix
        </button>
      )}
    </div>
  );
}

export default function WritingModule() {
  const [selectedType, setSelectedType] = useState<WritingTaskType>('readme');
  const [content, setContent] = useState<string>(writingTypes[0].placeholder);
  const [evaluatedContent, setEvaluatedContent] = useState('');
  const [feedback, setFeedback] = useState<WritingEvaluation | null>(null);
  const [attempts, setAttempts] = useState<WritingAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const clientRequestIdRef = useRef<string | null>(null);
  const draftStartedAtRef = useRef<number | null>(null);

  const { speak, pause, resume, stop, speaking, paused, supported: ttsSupported } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  useEffect(() => {
    return () => stop();
  }, [stop]);

  useEffect(() => {
    let active = true;
    fetchWritingAttempts()
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

  const selectedTemplate = useMemo(
    () => writingTypes.find((type) => type.value === selectedType) || writingTypes[0],
    [selectedType]
  );

  const activeSuggestions = feedback?.suggestions ?? [];
  const isDirty = content !== selectedTemplate.placeholder;

  const selectTemplate = (value: WritingTaskType) => {
    const next = writingTypes.find((type) => type.value === value);
    if (!next) return;
    setSelectedType(value);
    setContent(next.placeholder);
    setFeedback(null);
    setEvaluatedContent('');
    setError(null);
    clientRequestIdRef.current = null;
    draftStartedAtRef.current = null;
    stop();
  };

  const handleGetFeedback = async () => {
    if (!content.trim() || !isDirty) return;

    setLoading(true);
    setFeedback(null);
    setError(null);
    stop();

    try {
      const clientRequestId = clientRequestIdRef.current ?? crypto.randomUUID();
      clientRequestIdRef.current = clientRequestId;
      const durationSeconds = draftStartedAtRef.current === null
        ? null
        : Math.max(1, Math.floor((Date.now() - draftStartedAtRef.current) / 1000));
      const response = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientRequestId, taskType: selectedType, content, durationSeconds }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'API request failed');

      const data = (payload as { evaluation: WritingEvaluation }).evaluation;
      setFeedback(data);
      setEvaluatedContent(content);
      clientRequestIdRef.current = null;

      if (ttsSupported && data.summary) {
        speak(data.summary);
      }

      fetchWritingAttempts().then(setAttempts).catch((attemptError) => console.warn(attemptError));
      setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : 'Evaluation failed. Your draft is safe here.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (original: string, replacement: string) => {
    if (!original || !replacement) return;
    setContent((previous) => previous.replace(original, replacement));
    setFeedback(null);
    setEvaluatedContent('');
    clientRequestIdRef.current = null;
    draftStartedAtRef.current = Date.now();
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const loadDraft = (taskType: WritingTaskType, nextContent: string) => {
    setSelectedType(taskType);
    setContent(nextContent);
    setFeedback(null);
    setEvaluatedContent('');
    setError(null);
    clientRequestIdRef.current = null;
    draftStartedAtRef.current = Date.now();
    stop();
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="space-y-6">

          <div className="space-y-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Technical Writing</h1>
                <p className="mt-2 text-sm font-bold text-muted-foreground">Choose a template to start drafting your professional content.</p>
              </div>
              <button
                type="button"
                onClick={() => selectTemplate(selectedType)}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-border px-4 py-3 text-sm font-black text-foreground hover:border-foreground"
              >
                <RefreshCcw className="size-4" />
                Reset Editor
              </button>
            </div>

            <section className="mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">1. Choose writing context</h2>
              <p className="mt-2 text-sm text-muted-foreground">Select the professional document you want to practice.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {writingTypes.map((type) => {
                  const Icon = type.icon;
                  const active = type.value === selectedType;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => selectTemplate(type.value)}
                      className={`flex items-center gap-4 rounded-lg border p-4 text-left transition ${
                        active ? 'border-border bg-muted' : 'border-border bg-card hover:border-zinc-500'
                      }`}
                    >
                      <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="size-6" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-foreground">{type.label}</span>
                        <span className="mt-1 block text-xs font-bold text-muted-foreground">{type.helper}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_340px]">
              <article ref={editorRef} className="scroll-mt-6 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                      <FileText className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-black text-foreground">{selectedTemplate.title}</h2>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        2. Edit the starter template · Markdown enabled
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                    isDirty ? 'border-teal-500/40 text-teal-300' : 'border-border text-muted-foreground'
                  }`}>
                    {isDirty ? 'Edited draft' : 'Starter template'}
                  </span>
                </div>

                <div className="px-6 py-6">
                  <textarea
                    value={content}
                    onChange={(event) => {
                      if (draftStartedAtRef.current === null) draftStartedAtRef.current = Date.now();
                      setContent(event.target.value);
                      setError(null);
                    }}
                    spellCheck={false}
                    className="min-h-[560px] w-full resize-none bg-transparent text-base font-bold leading-8 text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder={selectedTemplate.placeholder}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-border px-6 py-4 text-xs font-black uppercase tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-5">
                    <span>Chars: {content.length}</span>
                    <span>Words: {wordCount(content)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetFeedback}
                    disabled={loading || !content.trim() || !isDirty}
                    className="inline-flex items-center gap-2 text-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    title={!isDirty ? 'Edit the starter template before requesting feedback.' : undefined}
                  >
                    <Zap className="size-4" />
                    {loading ? 'Analyzing...' : 'Ready for AI Analysis'}
                  </button>
                </div>
              </article>

              <aside ref={feedbackRef} className="rounded-lg border border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                    <Sparkles className="size-5 text-foreground" />
                    AI Assistant
                  </h2>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-black text-muted-foreground">
                    {feedback ? 'Evaluation ready' : 'Waiting for draft'}
                  </span>
                </div>

                <MetricCard label="Overall" value={feedback?.overallScore ?? 0} />

                {feedback?.summary && (
                  <div className="mt-5 rounded-lg border border-border bg-muted p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest text-foreground">Summary</p>
                      {ttsSupported && (
                        <button
                          type="button"
                          onClick={() => (speaking ? pause() : paused ? resume() : speak(feedback.summary))}
                          className="text-xs font-black text-foreground hover:text-foreground"
                        >
                          {speaking && !paused ? 'Pause' : 'Listen'}
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{feedback.summary}</p>
                  </div>
                )}

                {error && <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</p>}

                <button
                  type="button"
                  onClick={() => {
                    if (feedback) loadDraft(selectedType, feedback.improvedAnswer);
                  }}
                  disabled={!feedback}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wand2 className="size-4" />
                  Use Improved Answer
                </button>
              </aside>
            </section>

            {feedback && (
              <section className="mt-8 space-y-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  <article className="rounded-lg border border-teal-500/25 bg-teal-500/5 p-5">
                    <h3 className="text-sm font-black uppercase text-teal-300">Strengths</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {feedback.strengths.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </article>
                  <article className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-5">
                    <h3 className="text-sm font-black uppercase text-orange-300">Improvements</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {feedback.improvements.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </article>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <article className="rounded-lg border border-border bg-card p-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Original Text</h2>
                    <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{evaluatedContent}</pre>
                  </article>
                  <article className="rounded-lg border border-border bg-muted p-6">
                    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                      <Sparkles className="size-4" /> Improved Text
                    </h2>
                    <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">{feedback.improvedAnswer}</pre>
                  </article>
                </div>

                <article className="rounded-lg border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
                    <InfoDot /> Actionable suggestions
                  </h2>
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    {activeSuggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={`${suggestion.title}-${index}`}
                        suggestion={suggestion}
                        onApply={() => applySuggestion(suggestion.original_text || '', suggestion.replacement_text || '')}
                      />
                    ))}
                  </div>
                </article>

                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => loadDraft(selectedType, feedback.improvedAnswer)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-black text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <Wand2 className="size-4" />
                    Use improved answer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback(null);
                      setEvaluatedContent('');
                      clientRequestIdRef.current = null;
                      draftStartedAtRef.current = Date.now();
                      setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-black text-foreground hover:border-foreground"
                  >
                    <RefreshCcw className="size-4" />
                    Edit and try again
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <MetricCard label="Clarity" value={feedback.categoryScores.clarity} />
                  <MetricCard label="Structure" value={feedback.categoryScores.structure} />
                  <MetricCard label="Tone" value={feedback.categoryScores.tone} />
                  <MetricCard label="Completeness" value={feedback.categoryScores.completeness} />
                  <MetricCard label="Terminology" value={feedback.categoryScores.terminology} />
                </div>
              </section>
            )}

            <section className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
                <History className="size-5 text-foreground" /> Writing History
              </h2>
              {attemptsLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading writing sessions...</p>
              ) : attempts.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No writing attempts yet. Edit a starter template and request feedback to begin tracking progress.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {attempts.map((attempt) => (
                    <details key={attempt.id} className="rounded-md border border-border bg-background/30 p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                        <span>
                          {attempt.answer
                            ? writingTypes.find((type) => type.value === attempt.answer?.taskType)?.label ?? attempt.answer.taskType
                            : 'Writing'} · {new Date(attempt.createdAt).toLocaleString()}
                        </span>
                        <span className={attempt.status === 'completed' ? 'text-teal-300' : attempt.status === 'failed' ? 'text-red-300' : 'text-orange-300'}>
                          {attempt.evaluation ? `${Math.round(attempt.evaluation.overallScore)}/100` : attempt.status}
                        </span>
                      </summary>
                      <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm text-muted-foreground">
                        {attempt.answer && <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-muted-foreground">{attempt.answer.content}</pre>}
                        {attempt.evaluation && (
                          <>
                            <p>{attempt.evaluation.summary}</p>
                            <div className="rounded-md border border-border bg-muted p-4">
                              <strong className="text-foreground">Improved text</strong>
                              <pre className="mt-2 whitespace-pre-wrap text-foreground">{attempt.evaluation.improvedAnswer}</pre>
                            </div>
                          </>
                        )}
                        {attempt.status === 'failed' && !attempt.evaluation && (
                          <p className="text-red-300">
                            This evaluation failed. Load the draft and submit it as a new attempt when ready.
                          </p>
                        )}
                        {attempt.answer && (
                          <button
                            type="button"
                            onClick={() => {
                              if (attempt.answer) loadDraft(attempt.answer.taskType, attempt.answer.content);
                            }}
                            className="rounded-md border border-border px-4 py-2 text-xs font-black text-foreground hover:border-foreground"
                          >
                            Load into editor
                          </button>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </div>
    </div>
  );
}

function InfoDot() {
  return <span className="flex size-4 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">i</span>;
}
