'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, Zap } from 'lucide-react';
import { createClient } from '@/lib/auth/client';
import { isSupabaseConfigured } from '@/lib/auth/config';
import { getSiteUrl } from '@/lib/auth/redirect';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Add its URL and publishable key to .env.local.');
      }

      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl(window.location.origin)}/auth/confirm`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to send the reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-xl font-black text-foreground">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Zap className="size-5" /></span>
          DevSpeak AI
        </Link>
        <h1 className="text-2xl font-black text-foreground">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter your account email and we&apos;ll send you a secure reset link.</p>

        {error && <p className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {sent ? (
          <div className="mt-6">
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">
              If an account exists for that email, a password reset link has been sent.
            </p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-foreground">
              <ArrowLeft className="size-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-muted-foreground">Work Email</span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="h-12 w-full rounded-md border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-foreground" />
              </span>
            </label>
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-black text-primary-foreground disabled:opacity-50">
              <Send className="size-4" /> {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Back to sign in
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
