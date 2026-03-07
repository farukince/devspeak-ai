'use client';

import Link from "next/link";
import { ThemeToggle } from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      await getCurrentUser();
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      // User is not logged in, stay on landing page
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white dark:bg-background-dark">
        <div className="text-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-warm-white dark:bg-background-dark font-display text-foreground transition-colors duration-200 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-cream-dark/40 dark:border-border-dark bg-cream/90 dark:bg-surface-dark/90 backdrop-blur-md">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">DevSpeak AI</h2>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#modules" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors">
              Modules
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/login" className="hidden md:flex cursor-pointer items-center justify-center rounded-full h-9 px-4 text-sm font-semibold text-text-secondary hover:text-primary hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 transition-colors">
              Log In
            </Link>
            <Link href="/login" className="flex cursor-pointer items-center justify-center rounded-full h-9 px-5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white text-sm font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
              <span>Get Started</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full px-4 md:px-10 py-12 md:py-20 max-w-[1200px]">
          <div className="@container">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
              {/* Hero Content */}
              <div className="flex flex-col gap-6 flex-1 text-center lg:text-left items-center lg:items-start">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-cream-dark/50 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wide">
                  <span className="text-sm">🚀</span>
                  <span>v2.0 Now Available</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                  Master Professional <span className="bg-gradient-to-r from-primary via-primary-light to-primary-dark bg-clip-text text-transparent">English for Engineers</span>
                </h1>
                <p className="text-lg text-text-secondary max-w-xl leading-relaxed">
                  Stop struggling in stand-ups. Gain confidence in code reviews. The AI-powered English coach designed specifically for software developers.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link href="/login" className="h-12 px-6 rounded-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-bold text-base shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2">
                    <span>🎯</span> Start Practicing Free
                  </Link>
                  <button className="h-12 px-6 rounded-full bg-cream dark:bg-surface-dark border border-cream-dark/50 dark:border-border-dark text-foreground font-semibold text-base hover:bg-cream-dark/30 dark:hover:bg-border-dark/50 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
                    <span>▶️</span>
                    View Demo
                  </button>
                </div>
                <div className="pt-4 flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-dark border-2 border-cream dark:border-surface-dark flex items-center justify-center text-white text-xs font-bold">J</div>
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary-light to-primary border-2 border-cream dark:border-surface-dark flex items-center justify-center text-white text-xs font-bold">M</div>
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary-dark to-primary border-2 border-cream dark:border-surface-dark flex items-center justify-center text-white text-xs font-bold">K</div>
                  </div>
                  <p>Join 10,000+ devs from Google, Meta, & Amazon</p>
                </div>
              </div>

              {/* Hero Visual (Code Terminal) */}
              <div className="w-full flex-1 max-w-[600px] lg:max-w-none">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-cream-dark/50 dark:border-border-dark bg-surface-dark">
                  {/* Terminal Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-background-dark border-b border-border-dark">
                    <div className="size-3 rounded-full bg-red-400"></div>
                    <div className="size-3 rounded-full bg-yellow-400"></div>
                    <div className="size-3 rounded-full bg-green-400"></div>
                    <div className="ml-4 text-xs text-text-warm font-mono">standup_update.ts</div>
                  </div>
                  {/* Terminal Body */}
                  <div className="p-6 font-mono text-sm md:text-base leading-relaxed overflow-x-auto text-gray-300">
                    <div className="flex">
                      <span className="text-text-warm/50 select-none mr-4">1</span>
                      <span className="text-pink-400">const</span> <span className="text-cyan-400">dailyUpdate</span> = <span className="text-yellow-400">async</span> () <span className="text-pink-400">{`=>`}</span> {`{`}
                    </div>
                    <div className="flex">
                      <span className="text-text-warm/50 select-none mr-4">2</span>
                      <span className="text-green-400 pl-4">// AI Coach Suggestion: Be more concise</span>
                    </div>
                    <div className="flex bg-red-500/10 -mx-6 px-6 border-l-2 border-red-400">
                      <span className="text-text-warm/50 select-none mr-4">3</span>
                      <span className="text-red-300 line-through pl-4">I was mostly just working on fixing the API bug...</span>
                    </div>
                    <div className="flex bg-green-500/10 -mx-6 px-6 border-l-2 border-green-400">
                      <span className="text-text-warm/50 select-none mr-4">4</span>
                      <span className="text-primary-light pl-4">"Yesterday, I resolved the race condition in the auth API."</span>
                    </div>
                    <div className="flex">
                      <span className="text-text-warm/50 select-none mr-4">5</span>
                      <span className="text-pink-400 pl-4">await</span> <span className="text-yellow-400">team</span>.<span className="text-yellow-400">sync</span>();
                    </div>
                    <div className="flex">
                      <span className="text-text-warm/50 select-none mr-4">6</span>
                      <span className="text-pink-400 pl-4">return</span> <span className="text-primary-light">"No blockers."</span>;
                    </div>
                    <div className="flex">
                      <span className="text-text-warm/50 select-none mr-4">7</span>
                      {`}`}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-dark flex items-center gap-3">
                      <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm">
                        🤖
                      </div>
                      <p className="text-xs text-primary">Great job! That's 40% more concise and professionally phrased.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="modules" className="w-full px-4 md:px-10 py-16 bg-cream dark:bg-surface-dark relative border-t border-cream-dark/40 dark:border-border-dark">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-12 text-center">
              <span className="text-4xl mb-4 block">✨</span>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Practice Real-World Scenarios</h2>
              <p className="text-text-secondary max-w-2xl mx-auto text-lg">Don't just learn grammar. Master the specific situations that define your engineering career.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Link href="/modules/standup" className="group flex flex-col gap-4 rounded-2xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark p-6 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="size-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-2xl">
                  🎯
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Daily Stand-up</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Practice concise updates and blocker reporting. Learn to balance detail with brevity.</p>
                </div>
              </Link>
              {/* Feature 2 */}
              <Link href="/modules/interview" className="group flex flex-col gap-4 rounded-2xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark p-6 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="size-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-2xl">
                  💼
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Tech Interview</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Simulate behavioral and system design discussions. Nail the "Tell me about a time..." questions.</p>
                </div>
              </Link>
              {/* Feature 3 */}
              <Link href="/modules/code-review" className="group flex flex-col gap-4 rounded-2xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark p-6 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="size-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-2xl">
                  🔍
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Code Review</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Learn to give and receive feedback diplomatically. Defend your technical decisions clearly.</p>
                </div>
              </Link>
              {/* Feature 4 */}
              <Link href="/modules/writing" className="group flex flex-col gap-4 rounded-2xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark p-6 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="size-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-2xl">
                  ✍️
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Technical Writing</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Improve your documentation and PR descriptions. Write comments that future-you will understand.</p>
                </div>
              </Link>
              {/* Feature 5 */}
              <Link href="/modules/pair-programming" className="group flex flex-col gap-4 rounded-2xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark p-6 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="size-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Pair Programming</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">Master real-time communication while coding. Explain your thought process out loud.</p>
                </div>
              </Link>
              {/* Feature 6 */}
              {/* Feature 6 Removed */}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full px-4 py-20 bg-warm-white dark:bg-background-dark">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary-dark border border-primary/20 px-6 py-12 md:px-12 md:py-16 text-center shadow-2xl shadow-primary/20">
              {/* Decorative elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[300px] bg-white/10 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute top-4 left-4 text-4xl opacity-20">🚀</div>
              <div className="absolute bottom-4 right-4 text-4xl opacity-20">✨</div>
              <div className="relative z-10 flex flex-col items-center gap-6">
                <span className="text-5xl">🎉</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Ready to level up your career?
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto">
                  Join thousands of developers mastering their communication skills today. Get personalized feedback instantly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                  <Link href="/login" className="h-12 px-8 rounded-full bg-white hover:bg-cream text-primary font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2">
                    <span>🎯</span> Start Free Trial
                  </Link>
                  <button className="h-12 px-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-all border border-white/20">
                    View Pricing
                  </button>
                </div>
                <p className="text-sm text-white/60 mt-2">No credit card required. Cancel anytime.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-cream-dark/40 dark:border-border-dark bg-cream dark:bg-surface-dark py-10 px-4 md:px-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-sm bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">DevSpeak AI</span>
          </div>
          <div className="flex gap-8 text-sm text-text-secondary font-medium">
            <a href="#" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#" className="hover:text-primary transition-colors">Blog</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
          <div className="flex gap-4">
            {/* GitHub Icon */}
            <a href="#" className="text-text-secondary hover:text-primary transition-colors">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.66-3.795-1.455-3.795-1.455-.54-1.38-1.335-1.755-1.335-1.755-1.095-.75.075-.735.075-.735 1.2.075 1.83 1.23 1.83 1.23 1.08 1.86 2.805 1.32 3.495 1.005.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path></svg>
            </a>
            {/* Twitter Icon */}
            <a href="#" className="text-text-secondary hover:text-primary transition-colors">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path></svg>
            </a>
          </div>
        </div>
      </footer>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    </div>
  );
}
