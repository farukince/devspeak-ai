'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  FileText,
  GitPullRequest,
  Grid2X2,
  Languages,
  LogOut,
  Mail,
  MessageSquare,
  PenLine,
  PenTool,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface WriterSuggestion {
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'refactor';
  original_text?: string;
  replacement_text?: string;
}

interface WriterFeedback {
  clarity: number;
  structure: number;
  tone: number;
  completeness: number;
  feedback: string;
  suggestions: WriterSuggestion[];
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
    value: 'pr-description',
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
    value: 'pro-email',
    label: 'Pro Email',
    helper: 'Professional tone for stakeholders',
    icon: Mail,
    title: 'Professional Email',
    placeholder: `Subject: API Deprecation Timeline

Hi team,

I wanted to share the migration plan for the deprecated endpoint...`,
  },
  {
    value: 'technical-blog',
    label: 'Technical Blog',
    helper: 'Share knowledge with the team',
    icon: BookOpen,
    title: 'Technical Blog',
    placeholder: `# How to Optimize React Performance

Performance issues often come from unnecessary re-renders. In this post...`,
  },
];

const demoSuggestions: WriterSuggestion[] = [
  { title: 'Tone', description: 'Use more active voice in the summary section.', type: 'tip' },
  { title: 'Clarity', description: 'Avoid technical jargon in the overview for better readability.', type: 'warning' },
  { title: 'Grammar', description: 'Consider replacing “is able to” with “can” for conciseness.', type: 'refactor' },
];

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-[#18191b] p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}%</p>
    </div>
  );
}

function SuggestionCard({ suggestion, onApply }: { suggestion: WriterSuggestion; onApply: () => void }) {
  const toneClass = suggestion.type === 'warning' ? 'text-orange-300' : suggestion.type === 'refactor' ? 'text-sky-300' : 'text-violet-300';

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4">
      <span className={`rounded-md border border-zinc-700 px-2 py-1 text-[10px] font-black uppercase ${toneClass}`}>{suggestion.title}</span>
      {suggestion.original_text && (
        <p className="mt-3 text-xs leading-5 text-zinc-500 line-through decoration-zinc-600">{suggestion.original_text}</p>
      )}
      <p className="mt-3 text-sm font-bold leading-6 text-white">{suggestion.description}</p>
      {suggestion.replacement_text && suggestion.original_text && (
        <button
          type="button"
          onClick={onApply}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-xs font-black text-zinc-100 hover:bg-violet-500/20 hover:text-violet-200"
        >
          <Check className="size-3" />
          Apply Fix
        </button>
      )}
    </div>
  );
}

export default function WritingModule() {
  const [selectedType, setSelectedType] = useState('readme');
  const [content, setContent] = useState(writingTypes[0].placeholder);
  const [feedback, setFeedback] = useState<WriterFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLElement>(null);

  const { speak, pause, resume, stop, speaking, paused, supported: ttsSupported } = useSpeechSynthesis({ rate: 1, pitch: 1, volume: 1 });

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const selectedTemplate = useMemo(
    () => writingTypes.find((type) => type.value === selectedType) || writingTypes[0],
    [selectedType]
  );

  const activeSuggestions = feedback?.suggestions?.length ? feedback.suggestions : demoSuggestions;
  const clarity = feedback?.clarity ?? 85;
  const engagement = feedback ? Math.round((feedback.structure + feedback.tone + feedback.completeness) / 3) : 62;

  const selectTemplate = (value: string) => {
    const next = writingTypes.find((type) => type.value === value);
    if (!next) return;
    setSelectedType(value);
    setContent(next.placeholder);
    setFeedback(null);
    setError(null);
    stop();
  };

  const handleGetFeedback = async () => {
    if (!content.trim()) return;

    setLoading(true);
    setFeedback(null);
    setError(null);
    stop();

    try {
      const response = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writingType: selectedType, userContent: content }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data: WriterFeedback = await response.json();
      setFeedback(data);

      if (ttsSupported && data.feedback) {
        speak(data.feedback);
      }

      await fetch('/api/log-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          moduleType: 'writing',
          taskName: `Writing: ${selectedType}`,
          scores: data,
          userInput: { content },
          aiFeedback: data.feedback,
        }),
      }).catch(console.warn);
    } catch (requestError) {
      console.error(requestError);
      setError('AI provider is not ready yet. You can keep drafting and analyze again later.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (original: string, replacement: string) => {
    if (!original || !replacement) return;
    setContent((previous) => previous.replace(original, replacement));
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
              const active = item.href === '/modules/writing';

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

          <div className="flex-1 px-5 py-8 lg:px-10">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Technical Writing</h1>
                <p className="mt-2 text-sm font-bold text-zinc-400">Choose a template to start drafting your professional content.</p>
              </div>
              <button
                type="button"
                onClick={() => selectTemplate(selectedType)}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-700 px-4 py-3 text-sm font-black text-white hover:border-violet-400"
              >
                <RefreshCcw className="size-4" />
                Reset Editor
              </button>
            </div>

            <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {writingTypes.map((type) => {
                const Icon = type.icon;
                const active = type.value === selectedType;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => selectTemplate(type.value)}
                    className={`flex items-center gap-4 rounded-lg border p-4 text-left transition ${
                      active ? 'border-violet-400 bg-violet-500/10' : 'border-zinc-700 bg-[#18191b] hover:border-zinc-500'
                    }`}
                  >
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-violet-400 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                      <Icon className="size-6" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-white">{type.label}</span>
                      <span className="mt-1 block text-xs font-bold text-zinc-400">{type.helper}</span>
                    </span>
                  </button>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_340px]">
              <article className="rounded-lg border border-zinc-700 bg-[#18191b]">
                <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="flex size-9 items-center justify-center rounded-md bg-violet-500/15 text-violet-300">
                      <FileText className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-black text-white">{selectedTemplate.title}</h2>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Markdown Enabled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
                    <Copy className="size-4" />
                    <span className="rounded-full border border-zinc-700 px-3 py-1">Saved</span>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <textarea
                    value={content}
                    onChange={(event) => {
                      setContent(event.target.value);
                      setError(null);
                    }}
                    spellCheck={false}
                    className="min-h-[560px] w-full resize-none bg-transparent text-base font-bold leading-8 text-zinc-100 outline-none placeholder:text-zinc-500"
                    placeholder={selectedTemplate.placeholder}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-700 px-6 py-4 text-xs font-black uppercase tracking-wide text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-5">
                    <span>Chars: {content.length}</span>
                    <span>Words: {wordCount(content)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetFeedback}
                    disabled={loading || !content.trim()}
                    className="inline-flex items-center gap-2 text-violet-300 hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="size-4" />
                    {loading ? 'Analyzing...' : 'Ready for AI Analysis'}
                  </button>
                </div>
              </article>

              <aside ref={feedbackRef} className="rounded-lg border border-zinc-700 bg-[#18191b] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-black text-white">
                    <Sparkles className="size-5 text-violet-400" />
                    AI Assistant
                  </h2>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-200">Live</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Clarity" value={clarity} />
                  <MetricCard label="Engagement" value={engagement} />
                </div>

                {feedback && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MetricCard label="Structure" value={feedback.structure} />
                    <MetricCard label="Tone" value={feedback.tone} />
                  </div>
                )}

                <div className="mt-7 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <InfoDot />
                    Suggestions
                  </h3>
                  {ttsSupported && feedback && (
                    <button
                      type="button"
                      onClick={() => (speaking ? pause() : paused ? resume() : speak(feedback.feedback))}
                      className="text-xs font-black text-violet-300 hover:text-white"
                    >
                      {speaking && !paused ? 'Pause' : 'Listen'}
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {activeSuggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={`${suggestion.title}-${index}`}
                      suggestion={suggestion}
                      onApply={() => applySuggestion(suggestion.original_text || '', suggestion.replacement_text || '')}
                    />
                  ))}
                </div>

                {feedback?.feedback && (
                  <div className="mt-5 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-violet-300">Summary</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{feedback.feedback}</p>
                  </div>
                )}

                {error && <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</p>}

                <div className="mt-7">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Languages className="size-4" />
                    Dev Phrasing
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Leverage', 'Orchestrate', 'Robust', 'Seamless', 'Scalable'].map((word) => (
                      <span key={word} className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-200">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetFeedback}
                  disabled={loading || !content.trim()}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-400 px-5 py-3 text-sm font-black text-black hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wand2 className="size-4" />
                  {loading ? 'Analyzing...' : 'Apply All Improvements'}
                </button>
              </aside>
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

function InfoDot() {
  return <span className="flex size-4 items-center justify-center rounded-full border border-zinc-600 text-[10px] text-zinc-400">i</span>;
}
