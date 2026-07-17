'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bot,
  ChevronRight,
  Code2,
  Github,
  Linkedin,
  MessageSquare,
  Mic2,
  PenTool,
  Play,
  Quote,
  Sparkles,
  Terminal,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    href: '/modules/interview',
    title: 'Technical Interview',
    badge: 'Beta',
    description: 'Simulate real-world coding scenarios with AI proctoring that gives contextual hints without spoiling solutions.',
    icon: Terminal,
  },
  {
    href: '/modules/standup',
    title: 'Smart Stand-up',
    description: 'Auto-summarize your Jira tasks and Git commits into concise, spoken updates for the whole team.',
    icon: Mic2,
  },
  {
    href: '/modules/code-review',
    title: 'Code Review AI',
    description: 'Deep semantic analysis of your PRs that catches architectural flaws, not just linting errors.',
    icon: Code2,
  },
  {
    href: '/modules/pair-programming',
    title: 'Pair Programming',
    description: 'A voice-active partner that helps you debug and brainstorm in real-time while you stay in the editor.',
    icon: Users,
  },
  {
    href: '/modules/progress',
    title: 'Progress Analytics',
    description: 'Visualize your team velocity and burnout risk with data-driven insights from every commit.',
    icon: BarChart3,
  },
  {
    href: '/modules/writing',
    title: 'Technical Writing',
    badge: 'New',
    description: 'Auto-generate documentation, READMEs, and API specs directly from your codebase.',
    icon: PenTool,
  },
];

const testimonials = [
  {
    quote: 'DevPulse has fundamentally shifted how our team handles stand-ups. We save at least 3 hours a week on status updates alone.',
    name: 'Sarah Jenkins',
    role: 'VP of Engineering @ CloudScale',
    initials: 'SJ',
  },
  {
    quote: 'The voice demo blew me away. It is like having a senior engineer sitting right next to you, ready to brainstorm at any moment.',
    name: 'Marcus Chen',
    role: 'Senior Architect @ FinTech Solutions',
    initials: 'MC',
  },
  {
    quote: 'The code review AI caught a potential race condition in our distributed cache that three human reviewers missed. Impressive.',
    name: 'Elena Rodriguez',
    role: 'Lead Dev @ Global Logics',
    initials: 'ER',
  },
];

const footerGroups = [
  {
    title: 'Product',
    links: ['Features', 'Voice Assistant', 'Integrations', 'Changelog'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'API Reference', 'Community', 'Open Source'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Privacy Policy', 'Security'],
  },
];

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500 text-white shadow-lg shadow-violet-500/30">
        <Zap className="size-4" />
      </span>
      <span className="text-base font-black tracking-tight text-violet-300">DevSpeak AI</span>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 font-mono">
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />

          <div className="hidden items-center gap-9 text-xs font-black text-zinc-400 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#solutions" className="hover:text-white">Solutions</a>
            <a href="#enterprise" className="hover:text-white">Enterprise</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden h-9 items-center px-3 text-xs font-black text-zinc-300 hover:text-white sm:flex">
              Log In
            </Link>
            <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-md bg-violet-500 px-5 text-xs font-black text-white shadow-lg shadow-violet-500/25 hover:bg-violet-400">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[660px] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-[11px] font-black text-violet-300">
            <Sparkles className="size-3.5" />
            Next-Gen Engineering Intelligence
          </div>

          <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl lg:text-7xl">
            Build software with <span className="italic text-violet-400">human</span> speed.
          </h1>

          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-zinc-400 md:text-lg">
            The first AI collaborator that understands the flow of your day. From stand-ups to code reviews,
            automate the friction and focus on the craft.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-violet-500 px-8 text-sm font-black text-white shadow-xl shadow-violet-500/25 hover:bg-violet-400">
              Get Started Free
              <ChevronRight className="size-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-800 px-8 text-sm font-black text-zinc-200 hover:bg-zinc-950">
              View Demo
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-4 text-xs font-black text-zinc-500">
            <span>1.2k+ Teams Online</span>
            <div className="flex -space-x-2">
              {['S', 'M', 'E', 'A', 'J'].map((initial, index) => (
                <span
                  key={initial}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br from-violet-300 to-zinc-700 text-[10px] text-white"
                  style={{ opacity: 1 - index * 0.08 }}
                >
                  {initial}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#202229] p-6 shadow-2xl shadow-violet-950/30">
          <div className="mb-5 size-2.5 rounded-full bg-red-500/70" />
          <div className="space-y-3 text-xs font-black text-zinc-400">
            <p><span className="text-zinc-500">01</span> # dev-pulse analyze --pr 1402</p>
            <p><span className="text-zinc-500">02</span> Analyzing architecture patterns...</p>
            <p><span className="text-zinc-500">03</span> Potential circular dependency in /utils</p>
            <p><span className="text-zinc-500">04</span> Generating voice summary for stand-up...</p>
          </div>
          <div className="my-5 h-px bg-zinc-700" />
          <p className="text-xs font-black text-zinc-300">
            PulseAI: <span className="text-white">I&apos;ve drafted the review. Ready to sync?</span>
          </p>
          <div className="mt-5 flex h-20 items-center justify-center rounded-lg bg-violet-500/10">
            <div className="flex items-center gap-1">
              {[18, 30, 45, 24, 54, 36, 64, 32, 46, 28, 40].map((height, index) => (
                <span key={index} className="w-1 rounded-full bg-violet-400" style={{ height }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-zinc-950 bg-[#070809] px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">Everything you need to ship faster</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-zinc-400">
              Stop juggling multiple tools. DevPulse brings everything into a single, cohesive intelligence platform.
            </p>
          </div>

          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link key={feature.title} href={feature.href} className="group rounded-lg border border-zinc-800 bg-[#202229] p-6 transition hover:border-violet-500/50 hover:bg-zinc-900">
                  <span className="mb-7 flex size-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <Icon className="size-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{feature.title}</h3>
                    {feature.badge && <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[8px] font-black uppercase text-zinc-400">{feature.badge}</span>}
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-6 text-zinc-400">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="solutions" className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-violet-500/20 bg-violet-950/50 p-8 shadow-2xl shadow-violet-950/30 md:p-14">
          <div className="grid items-center gap-10 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
            <div className="relative mx-auto flex size-40 items-center justify-center rounded-full border border-violet-400/40 bg-white text-zinc-900 shadow-2xl shadow-violet-500/30 md:size-44">
              <Bot className="size-16 text-zinc-700" />
              <span className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full bg-violet-900 text-violet-200">
                <Mic2 className="size-4" />
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">The Voice of Productivity</h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-violet-100/70 md:text-base">
                Experience the world&apos;s most advanced AI voice assistant for developers. Low latency,
                context-aware, and built to handle technical jargon.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/modules/pair-programming" className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-violet-400 px-7 text-sm font-black text-white shadow-xl shadow-violet-400/30 hover:bg-violet-300">
                  <Play className="size-4 fill-current" />
                  Try Voice Demo
                </Link>
                <div className="inline-flex h-12 items-center justify-center gap-4 rounded-full bg-violet-900/70 px-6 text-xs font-black text-violet-200">
                  <span className="size-2 rounded-full bg-violet-300" />
                  Listening...
                  <div className="flex items-center gap-1">
                    {[14, 26, 36, 22, 44, 30, 50, 24].map((height, index) => (
                      <span key={index} className="w-1 rounded-full bg-violet-300" style={{ height }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="enterprise" className="border-y border-zinc-900 px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black text-white">Trusted by engineering leaders</h2>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-zinc-400">
                From stealth startups to the Fortune 500, we&apos;re changing how software is built.
              </p>
            </div>
            <Link href="#" className="inline-flex items-center gap-2 text-xs font-black text-violet-400 hover:text-violet-300">
              View all case studies
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg border border-zinc-800 bg-[#202229] p-6">
                <Quote className="mb-6 size-5 text-violet-500/60" />
                <p className="min-h-28 text-sm font-black italic leading-7 text-zinc-300">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="mt-7 flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-300 to-zinc-700 text-xs font-black text-white">
                    {testimonial.initials}
                  </span>
                  <div>
                    <p className="text-xs font-black text-white">{testimonial.name}</p>
                    <p className="mt-1 text-[10px] font-semibold text-zinc-500">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-24 text-center lg:px-8">
        <h2 className="mx-auto max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
          Ready to pulse-check your development?
        </h2>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-lg bg-violet-500 px-10 text-sm font-black text-white shadow-xl shadow-violet-500/25 hover:bg-violet-400">
            Get Started for Free
          </Link>
          <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-800 px-10 text-sm font-black text-zinc-200 hover:bg-zinc-950">
            Schedule a Demo
          </Link>
        </div>
        <p className="mt-8 text-xs font-semibold italic text-zinc-500">No credit card required. Setup in less than 2 minutes.</p>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-6 max-w-sm text-xs font-semibold leading-6 text-zinc-400">
              Empowering developers to build the future with human-centric AI intelligence. Designed in SF, built for the world.
            </p>
            <div className="mt-8 flex gap-3">
              {[Twitter, Github, Linkedin].map((Icon, index) => (
                <a key={index} href="#" className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">{group.title}</h3>
                <div className="mt-6 space-y-4">
                  {group.links.map((link) => (
                    <a key={link} href="#" className="block text-xs font-semibold text-zinc-400 hover:text-white">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-4 border-t border-zinc-900 pt-6 text-[11px] font-semibold text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DevPulse AI Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Systems Operational</span>
            <span>v2.4.0-stable</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
