'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Globe2,
  Mail,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/authHelpers';
import { createClient } from '@/lib/auth/client';
import { isSupabaseConfigured } from '@/lib/auth/config';
import { getSafeRedirectPath, getSiteUrl } from '@/lib/auth/redirect';

type AuthMode = 'signin' | 'signup' | 'check-email';

function AuthContent() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeRedirectPath(searchParams.get('next'));

  useEffect(() => {
    const checkExistingAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.push('/dashboard');
        return;
      }
      setCheckingAuth(false);
    };

    checkExistingAuth();

    const errorMsg = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const message = searchParams.get('message');
    if (errorMsg) {
      setError(
        errorMsg === 'supabase_not_configured'
          ? 'Supabase is not configured. Add the project URL and publishable key to .env.local.'
          : errorDescription || errorMsg
      );
    } else if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Add the project URL and publishable key to .env.local.');
    }
    if (message === 'password_updated') {
      setSuccess('Your password was updated. You can now sign in.');
    }
  }, [router, searchParams]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace(next);
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in.');
      setLoading(false);
    }
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl(window.location.origin)}/auth/confirm`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.replace('/onboarding');
        router.refresh();
        return;
      }

      setAuthMode('check-email');
      setSuccess(`We sent a confirmation link to ${email}.`);
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const callbackUrl = new URL('/auth/callback', getSiteUrl(window.location.origin));
      callbackUrl.searchParams.set('next', next);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      });
      if (oauthError) throw oauthError;
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'Unable to start Google sign in.');
      setLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setSuccess(null);
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-5 size-12 animate-spin rounded-full border-4 border-border border-t-transparent" />
          <p className="text-sm font-bold text-muted-foreground">Checking authentication...</p>
        </div>
      </main>
    );
  }

  const title = authMode === 'signin' ? 'Welcome back, Dev' : authMode === 'signup' ? 'Create your cockpit' : 'Check your email';
  const description = authMode === 'signin'
    ? "Master the art of technical communication. Log in to your 'flight simulator' and start practicing."
    : authMode === 'signup'
      ? 'Set up your DevSpeak terminal and start training with AI communication simulations.'
      : 'Open the confirmation link we sent to finish creating your account.';

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.08),transparent_36%)]" />
      <div className="absolute inset-6 rounded-lg border border-border" />

      <section className="relative z-10 flex min-h-screen flex-col items-center px-5 py-10">
        <Link href="/" className="mt-2 flex items-center gap-5">
          <span className="flex size-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-9" />
          </span>
          <span className="text-3xl font-black tracking-wide text-foreground">DevSpeak AI</span>
        </Link>

        <div className="mt-5 max-w-[420px] text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-5 text-sm font-bold leading-7 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-10 w-full max-w-[430px] rounded-lg border border-border bg-card p-8 shadow-2xl shadow-black/50">
          {authMode !== 'check-email' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleOAuthSignIn}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-background text-sm font-black text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Globe2 className="size-5" />
                Continue with Google
              </button>
            </div>
          )}

          {authMode !== 'check-email' && (
            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-700" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Or use credentials</span>
              <div className="h-px flex-1 bg-zinc-700" />
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold leading-6 text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold leading-6 text-emerald-200">
              {success}
            </div>
          )}

          {authMode !== 'check-email' && (
            <form
              className="space-y-4"
              onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}
            >
              <>
                <InputField label="Work Email" value={email} onChange={setEmail} type="email" placeholder="name@company.com" icon={<Mail className="size-4" />} required />
                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">Password</span>
                    {authMode === 'signin' && (
                      <Link href="/forgot-password" className="text-xs font-black text-foreground hover:text-foreground">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-12 w-full rounded-md border border-border bg-card px-4 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
                  />
                </label>
              </>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-primary text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Connecting...' : authMode === 'signin' ? 'Sign In to Dashboard' : 'Create Account'}
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm font-bold text-muted-foreground">
            {authMode === 'signin' ? (
              <>
                New to DevSpeak?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-black text-foreground hover:text-foreground">
                  Create an account
                </button>
              </>
            ) : authMode === 'signup' ? (
              <>
                Already have access?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="font-black text-foreground hover:text-foreground">
                  Sign in
                </button>
              </>
            ) : (
              <button type="button" onClick={() => switchMode('signin')} className="font-black text-foreground hover:text-foreground">
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 grid w-full max-w-[430px] grid-cols-2 gap-x-8 gap-y-4 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-2"><Terminal className="size-4 text-foreground" /> CLI Integration</span>
          <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-foreground" /> SOC2 Compliant</span>
          <span className="flex items-center gap-2"><Sparkles className="size-4 text-foreground" /> AI-Powered</span>
          <span className="flex items-center gap-2"><Server className="size-4 text-foreground" /> Server: US-East-1</span>
        </div>

        <div className="mt-auto flex flex-col items-center gap-5 pt-12">
          <span className="rounded-md border border-border bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
            DEVSPEAK_CORE_v1.0.42_STABLE
          </span>
          <footer className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Documentation</span>
            <span className="text-zinc-700">|</span>
            <span>Privacy</span>
            <span className="text-zinc-700">|</span>
            <span>Support</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon,
  required,
  disabled,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="relative">
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={`h-12 w-full rounded-md border border-border bg-card px-4 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground disabled:opacity-60 ${icon ? 'pl-11' : ''}`}
        />
      </div>
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <div className="mx-auto mb-5 size-12 animate-spin rounded-full border-4 border-border border-t-transparent" />
            <p className="text-sm font-bold text-muted-foreground">Loading terminal...</p>
          </div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
