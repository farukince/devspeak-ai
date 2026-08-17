'use client';

import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Code2,
  MessageSquare,
  Mic2,
  PenTool,
  Sparkles,
  Users,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const modules = [
  {
    href: '/modules/standup',
    title: 'Daily Stand-up',
    description: 'Practice Yesterday / Today / Blockers updates in written or voice mode, then get AI feedback.',
    icon: MessageSquare,
  },
  {
    href: '/modules/interview',
    title: 'Technical Interview',
    description: 'Answer role-based interview questions and receive technical and communication scores.',
    icon: BookOpen,
  },
  {
    href: '/modules/writing',
    title: 'Technical Writing',
    description: 'Improve PR descriptions, bug reports, READMEs, documentation, and Slack messages.',
    icon: PenTool,
  },
  {
    href: '/modules/code-review',
    title: 'Code Review',
    description: 'Practice reviewer comments or author responses with structured AI feedback.',
    icon: Code2,
  },
  {
    href: '/modules/pair-programming',
    title: 'Pair Programming',
    description: 'Practice driver and navigator communication around real coding tasks.',
    icon: Users,
  },
  {
    href: '/modules/progress',
    title: 'Progress',
    description: 'Track completed sessions, score trends, and coaching focus areas.',
    icon: BarChart3,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4" />
            DevSpeak AI
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
            <Mic2 className="size-3.5" />
            Practice developer English with structured AI feedback
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Communicate clearly at stand-ups, interviews, and code reviews.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            DevSpeak AI helps developers practice professional English in realistic work scenarios.
            Submit an answer, get scored feedback, retry with improvements, and track progress over time.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
              Start practicing
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-accent">
              Open dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Available practice modules</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Frontend surfaces match backend capabilities only. Voice transcription is available in Stand-up and Interview.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="rounded-lg border border-border bg-card p-5 transition-theme hover:bg-accent"
                >
                  <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-4 font-semibold">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 DevSpeak AI</p>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}
