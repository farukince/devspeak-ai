'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock3, History, MessageSquare, Mic, RefreshCcw, Send, Sparkles } from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import type { InterviewEvaluation } from '@/lib/ai/schemas';
import type {
  InterviewDifficulty,
  InterviewExperience,
  InterviewInputMode,
  InterviewRole,
  InterviewTechnology,
} from '@/lib/validation/interview';

interface InterviewScenario {
  id: string;
  question: string;
  role: InterviewRole;
  experienceLevel: InterviewExperience;
  technologyArea: InterviewTechnology;
  difficulty: InterviewDifficulty;
}

interface InterviewAttempt {
  id: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  answer: {
    scenarioId: string | null;
    content: string;
    inputMode: InterviewInputMode;
    durationSeconds: number;
  };
  scenario: InterviewScenario | null;
  evaluation: InterviewEvaluation | null;
}

const roles: Array<{ value: InterviewRole; label: string }> = [
  { value: 'frontend_engineer', label: 'Frontend Engineer' },
  { value: 'backend_engineer', label: 'Backend Engineer' },
  { value: 'devops_engineer', label: 'DevOps Engineer' },
];
const experiences: Array<{ value: InterviewExperience; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];
const difficulties: Array<{ value: InterviewDifficulty; label: string }> = [
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];
const technologies: Record<InterviewRole, Array<{ value: InterviewTechnology; label: string }>> = {
  frontend_engineer: [
    { value: 'react', label: 'React' },
    { value: 'web_performance', label: 'Web Performance' },
  ],
  backend_engineer: [
    { value: 'nodejs', label: 'Node.js' },
    { value: 'api_design', label: 'API Design' },
  ],
  devops_engineer: [
    { value: 'containers', label: 'Docker & Kubernetes' },
    { value: 'cicd', label: 'CI/CD' },
  ],
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function ScoreCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <article className={`rounded-lg border p-5 ${accent ? 'border-border bg-muted' : 'border-border bg-card'}`}>
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-black ${accent ? 'text-foreground' : 'text-foreground'}`}>{Math.round(value)}<span className="text-sm text-muted-foreground">/100</span></p>
    </article>
  );
}

async function fetchInterviewAttempts() {
  const response = await fetch('/api/interview?view=attempts', { cache: 'no-store' });
  if (!response.ok) throw new Error('Interview history could not be loaded.');
  return (await response.json() as { attempts: InterviewAttempt[] }).attempts;
}

export default function InterviewModule() {
  const [role, setRole] = useState<InterviewRole>('backend_engineer');
  const [experienceLevel, setExperienceLevel] = useState<InterviewExperience>('mid');
  const [technologyArea, setTechnologyArea] = useState<InterviewTechnology>('nodejs');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('medium');
  const [inputMode, setInputMode] = useState<InterviewInputMode>('written');
  const [scenario, setScenario] = useState<InterviewScenario | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<InterviewEvaluation | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const [scenarioRefreshKey, setScenarioRefreshKey] = useState(0);
  const clientRequestIdRef = useRef<string | null>(null);
  const scenarioOverrideRef = useRef<InterviewScenario | null>(null);
  const scenarioToExcludeRef = useRef<string | null>(null);
  const answerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!timerActive) return;
    const interval = window.setInterval(() => setDurationSeconds((value) => Math.min(value + 1, 3600)), 1000);
    return () => window.clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    const override = scenarioOverrideRef.current;
    if (
      override
      && override.role === role
      && override.experienceLevel === experienceLevel
      && override.technologyArea === technologyArea
      && override.difficulty === difficulty
    ) {
      scenarioOverrideRef.current = null;
      setScenario(override);
      setScenarioLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams({ role, experienceLevel, technologyArea, difficulty });
    const excludeScenarioId = scenarioToExcludeRef.current;
    scenarioToExcludeRef.current = null;
    if (excludeScenarioId) params.set('excludeScenarioId', excludeScenarioId);
    setScenarioLoading(true);
    setScenario(null);
    setAnswer('');
    setFeedback(null);
    setError(null);
    setDurationSeconds(0);
    setTimerActive(false);
    setVoiceConfirmed(false);
    clientRequestIdRef.current = null;
    fetch(`/api/interview?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Scenario could not be loaded.');
        if (active) setScenario((payload as { scenario: InterviewScenario }).scenario);
      })
      .catch((requestError) => {
        if (active && requestError instanceof Error && requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (active) setScenarioLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [role, experienceLevel, technologyArea, difficulty, scenarioRefreshKey]);

  useEffect(() => {
    let active = true;
    fetchInterviewAttempts()
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

  const changeRole = (nextRole: InterviewRole) => {
    setRole(nextRole);
    setTechnologyArea(technologies[nextRole][0].value);
  };

  const changeInputMode = (mode: InterviewInputMode) => {
    if (mode === inputMode) return;
    setInputMode(mode);
    setAnswer('');
    setFeedback(null);
    setError(null);
    setDurationSeconds(0);
    setTimerActive(false);
    setVoiceConfirmed(false);
    clientRequestIdRef.current = null;
  };

  const prepareRetry = (nextAnswer: string, mode: InterviewInputMode = inputMode) => {
    setAnswer(nextAnswer);
    setInputMode(mode);
    setFeedback(null);
    setError(null);
    setDurationSeconds(0);
    setTimerActive(mode === 'written' && Boolean(nextAnswer));
    setVoiceConfirmed(mode === 'voice');
    clientRequestIdRef.current = null;
    setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const loadAttempt = (attempt: InterviewAttempt) => {
    if (!attempt.scenario) return;
    const sameContext = (
      attempt.scenario.role === role
      && attempt.scenario.experienceLevel === experienceLevel
      && attempt.scenario.technologyArea === technologyArea
      && attempt.scenario.difficulty === difficulty
    );
    scenarioOverrideRef.current = sameContext ? null : attempt.scenario;
    setRole(attempt.scenario.role);
    setExperienceLevel(attempt.scenario.experienceLevel);
    setTechnologyArea(attempt.scenario.technologyArea);
    setDifficulty(attempt.scenario.difficulty);
    setScenario(attempt.scenario);
    setInputMode(attempt.answer.inputMode);
    setAnswer(attempt.answer.content);
    setFeedback(null);
    setError(null);
    setDurationSeconds(0);
    setTimerActive(attempt.answer.inputMode === 'written');
    setVoiceConfirmed(attempt.answer.inputMode === 'voice');
    clientRequestIdRef.current = null;
    setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const submitAnswer = async () => {
    if (!scenario || !answer.trim() || (inputMode === 'voice' && !voiceConfirmed)) return;
    setSubmitting(true);
    setTimerActive(false);
    setFeedback(null);
    setError(null);
    try {
      const clientRequestId = clientRequestIdRef.current ?? crypto.randomUUID();
      clientRequestIdRef.current = clientRequestId;
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientRequestId,
          scenarioId: scenario.id,
          answer,
          inputMode,
          durationSeconds,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Interview evaluation failed.');
      setFeedback((payload as { evaluation: InterviewEvaluation }).evaluation);
      clientRequestIdRef.current = null;
      fetchInterviewAttempts().then(setAttempts).catch((attemptError) => console.warn(attemptError));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Interview evaluation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-foreground">Technical Interview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a scenario, answer naturally, and receive separate technical and communication feedback.</p>
        </div>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">1. Choose interview context</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your selections determine the interview question and evaluation depth.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-black uppercase text-muted-foreground">Role
            <select value={role} onChange={(event) => changeRole(event.target.value as InterviewRole)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-black uppercase text-muted-foreground">Experience
            <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as InterviewExperience)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {experiences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-black uppercase text-muted-foreground">Technology
            <select value={technologyArea} onChange={(event) => setTechnologyArea(event.target.value as InterviewTechnology)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {technologies[role].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-black uppercase text-muted-foreground">Difficulty
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as InterviewDifficulty)} className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {difficulties.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div className="text-xs font-black uppercase text-muted-foreground">Input Mode
            <div className="mt-2 grid h-11 grid-cols-2 rounded-md border border-border bg-background p-1">
              {(['written', 'voice'] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => changeInputMode(mode)} className={`rounded text-xs ${inputMode === mode ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
                  {mode === 'written' ? <MessageSquare className="mx-auto size-4" /> : <Mic className="mx-auto size-4" />}
                </button>
              ))}
            </div>
          </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article ref={answerRef} className="scroll-mt-6 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">2. Interview Question</p>
              <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><Clock3 className="size-4" /> {formatTime(durationSeconds)}</span>
            </div>
            <h2 className="mt-5 text-xl font-black leading-8 text-foreground">
              {scenarioLoading ? 'Loading an appropriate question...' : scenario?.question ?? 'No scenario available.'}
            </h2>
            {!scenarioLoading && scenario && (
              <button
                type="button"
                onClick={() => {
                  scenarioToExcludeRef.current = scenario.id;
                  setScenarioRefreshKey((value) => value + 1);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-black text-muted-foreground hover:border-foreground"
              >
                <RefreshCcw className="size-3" /> Try another question
              </button>
            )}
            {!scenarioLoading && !scenario && (
              <button
                type="button"
                onClick={() => setScenarioRefreshKey((value) => value + 1)}
                className="mt-4 rounded-md border border-border px-4 py-2 text-xs font-black text-foreground"
              >
                Retry scenario
              </button>
            )}
            {inputMode === 'voice' && (
              <div className="mt-6">
                <VoiceRecorder
                  moduleType="interview"
                  scenarioId={scenario?.id}
                  maxDurationSeconds={300}
                  onTranscript={(result) => {
                    setAnswer(result.transcript);
                    setDurationSeconds(result.durationSeconds);
                    setTimerActive(false);
                    setVoiceConfirmed(true);
                    clientRequestIdRef.current = result.clientRequestId;
                    setError(null);
                  }}
                />
              </div>
            )}
            <label className="mt-8 block text-xs font-black uppercase tracking-wide text-muted-foreground">
              {inputMode === 'voice' ? 'Voice transcript (editable)' : 'Your answer'}
              <textarea
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setError(null);
                  clientRequestIdRef.current = null;
                  if (inputMode === 'voice') setVoiceConfirmed(false);
                  if (inputMode === 'written' && event.target.value && !timerActive) setTimerActive(true);
                }}
                disabled={!scenario}
                placeholder={inputMode === 'voice' ? 'Your recorded transcript will appear here. Review and edit it before evaluation.' : 'Explain your reasoning and include a concrete example...'}
                className="mt-3 min-h-64 w-full resize-y rounded-lg border border-border bg-background/40 p-4 text-sm font-semibold normal-case leading-7 text-foreground outline-none focus:border-border disabled:opacity-50"
              />
            </label>
            {inputMode === 'voice' && answer && (
              <button
                type="button"
                onClick={() => {
                  setVoiceConfirmed(true);
                  setTimerActive(false);
                }}
                className="mt-3 rounded-md border border-border px-4 py-2 text-xs font-black text-foreground"
              >
                Confirm voice transcript
              </button>
            )}
            {inputMode === 'voice' && voiceConfirmed && (
              <p className="mt-2 text-xs font-bold text-teal-300">Voice transcript confirmed.</p>
            )}
            {error && <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => { setAnswer(''); setFeedback(null); setDurationSeconds(0); setTimerActive(false); setVoiceConfirmed(false); clientRequestIdRef.current = null; }} className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground">
                <RefreshCcw className="size-4" /> Reset
              </button>
              <button type="button" onClick={submitAnswer} disabled={submitting || !scenario || !answer.trim() || (inputMode === 'voice' && !voiceConfirmed)} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-black text-primary-foreground disabled:opacity-50">
                <Send className="size-4" /> {submitting ? 'Evaluating...' : 'Evaluate Answer'}
              </button>
            </div>
          </article>

          <aside className="space-y-4">
            {feedback ? (
              <>
                <ScoreCard label="Overall Score" value={feedback.overallScore} />
                <ScoreCard label="Technical Score" value={feedback.technicalScore} accent />
                <ScoreCard label="Communication Score" value={feedback.communicationScore} accent />
              </>
            ) : (
              <div className="rounded-lg border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
                Scores will appear after you submit an answer.
              </div>
            )}
          </aside>
        </section>

        {feedback && (
          <section className="space-y-6">
            <article className="rounded-lg border border-border bg-muted p-6">
              <h2 className="text-sm font-black uppercase text-foreground">Evaluation Summary</h2>
              <p className="mt-3 text-sm leading-7 text-foreground">{feedback.summary}</p>
            </article>
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-lg border border-teal-500/25 bg-teal-500/5 p-6"><h3 className="font-black text-teal-300">Strengths</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{feedback.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></article>
              <article className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-6"><h3 className="font-black text-orange-300">Improvements</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{feedback.improvements.map((item) => <li key={item}>• {item}</li>)}</ul></article>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-lg border border-border bg-card p-6"><h3 className="font-black text-foreground">Recommended Phrasing</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{feedback.recommendedPhrasing}</p></article>
              <article className="rounded-lg border border-border bg-card p-6"><h3 className="font-black text-foreground">Improved Answer</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{feedback.improvedAnswer}</p></article>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => prepareRetry(feedback.improvedAnswer, 'written')}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground"
              >
                <Sparkles className="size-4" /> Use improved answer
              </button>
              <button
                type="button"
                onClick={() => prepareRetry(answer)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-black text-foreground"
              >
                <RefreshCcw className="size-4" /> Edit and try again
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              <ScoreCard label="Accuracy" value={feedback.categoryScores.technicalAccuracy} />
              <ScoreCard label="Depth" value={feedback.categoryScores.depth} />
              <ScoreCard label="Clarity" value={feedback.categoryScores.clarity} />
              <ScoreCard label="Communication" value={feedback.categoryScores.communication} />
              <ScoreCard label="Terminology" value={feedback.categoryScores.terminology} />
            </div>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <History className="size-5 text-foreground" /> Previous Interviews
          </h2>
          {attemptsLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading interview attempts...</p>
          ) : attempts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No interview attempts yet. Answer your first scenario to begin tracking progress.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {attempts.map((attempt) => (
                <details key={attempt.id} className="rounded-md border border-border bg-background/30 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                    <span>{attempt.scenario?.question ?? 'Interview scenario'} · {new Date(attempt.createdAt).toLocaleString()}</span>
                    <span className={attempt.status === 'completed' ? 'text-teal-300' : attempt.status === 'failed' ? 'text-red-300' : 'text-orange-300'}>
                      {attempt.evaluation ? `${Math.round(attempt.evaluation.overallScore)}/100` : attempt.status}
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                    <p className="whitespace-pre-wrap text-muted-foreground">{attempt.answer.content}</p>
                    {attempt.evaluation && <p>{attempt.evaluation.summary}</p>}
                    {attempt.status === 'failed' && !attempt.evaluation && (
                      <p className="text-red-300">This evaluation failed. Load the answer and submit it as a new attempt.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => loadAttempt(attempt)}
                      disabled={!attempt.scenario}
                      className="rounded-md border border-border px-4 py-2 text-xs font-black text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Load into interview
                    </button>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
    </div>
  );
}
