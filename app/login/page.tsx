'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Github,
  Globe2,
  Mail,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/authHelpers';

type AuthMode = 'signin' | 'signup' | 'confirm';
type OAuthProvider = 'GitHub' | 'Google';

function AuthContent() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [birthday, setBirthday] = useState('');
  const [englishLevel, setEnglishLevel] = useState('Intermediate');
  const [rememberTerminal, setRememberTerminal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

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
    if (errorMsg) {
      setError(errorDescription || errorMsg);
    }
  }, [router, searchParams]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    setError('Authentication provider is not configured yet.');
    setLoading(false);
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    setError('Authentication provider is not configured yet.');
    setLoading(false);
  };

  const handleConfirmSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    setError('Authentication provider is not configured yet.');
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    setError(`${provider} sign in is not configured yet.`);
    setLoading(false);
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setSuccess(null);
    if (mode !== 'confirm') setConfirmationCode('');
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black font-mono text-zinc-100">
        <div className="text-center">
          <div className="mx-auto mb-5 size-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="text-sm font-bold text-zinc-400">Checking authentication...</p>
        </div>
      </main>
    );
  }

  const title = authMode === 'signin' ? 'Welcome back, Dev' : authMode === 'signup' ? 'Create your cockpit' : 'Verify your email';
  const description = authMode === 'signin'
    ? "Master the art of technical communication. Log in to your 'flight simulator' and start practicing."
    : authMode === 'signup'
      ? 'Set up your DevSpeak terminal and start training with AI communication simulations.'
      : 'Enter the verification code sent to your work email.';

  return (
    <main className="relative min-h-screen overflow-hidden bg-black font-mono text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.08),transparent_36%)]" />
      <div className="absolute inset-6 rounded-lg border border-violet-950/60 shadow-[0_0_80px_rgba(124,58,237,0.18)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center px-5 py-10">
        <Link href="/" className="mt-2 flex items-center gap-5">
          <span className="flex size-16 items-center justify-center rounded-xl bg-violet-400 text-black shadow-2xl shadow-violet-500/20">
            <Zap className="size-9" />
          </span>
          <span className="text-3xl font-black tracking-wide text-violet-300">DevSpeak AI</span>
        </Link>

        <div className="mt-5 max-w-[420px] text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-5 text-sm font-bold leading-7 text-zinc-400">{description}</p>
        </div>

        <div className="mt-10 w-full max-w-[430px] rounded-lg border border-zinc-700 bg-[#18191b] p-8 shadow-2xl shadow-black/50">
          {authMode !== 'confirm' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('GitHub')}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-zinc-700 bg-black text-sm font-black text-white transition hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Github className="size-5" />
                Continue with GitHub
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignIn('Google')}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-zinc-700 bg-black text-sm font-black text-white transition hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Globe2 className="size-5" />
                Continue with Google
              </button>
            </div>
          )}

          {authMode !== 'confirm' && (
            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-700" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Or use credentials</span>
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

          <form
            className="space-y-4"
            onSubmit={authMode === 'signin' ? handleSignIn : authMode === 'signup' ? handleSignUp : handleConfirmSignUp}
          >
            {authMode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="First Name" value={firstName} onChange={setFirstName} placeholder="Alex" required />
                  <InputField label="Last Name" value={lastName} onChange={setLastName} placeholder="Dev" required />
                </div>
                <InputField label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="Senior Engineer" required />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Birthday" value={birthday} onChange={setBirthday} type="date" required />
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-400">English Level</span>
                    <select
                      value={englishLevel}
                      onChange={(event) => setEnglishLevel(event.target.value)}
                      className="h-12 w-full rounded-md border border-zinc-700 bg-[#18191b] px-4 text-sm font-bold text-zinc-100 outline-none focus:border-violet-400"
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Fluent'].map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            {authMode === 'confirm' ? (
              <>
                <InputField label="Work Email" value={email} onChange={setEmail} type="email" disabled />
                <InputField
                  label="Verification Code"
                  value={confirmationCode}
                  onChange={setConfirmationCode}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </>
            ) : (
              <>
                <InputField label="Work Email" value={email} onChange={setEmail} type="email" placeholder="name@company.com" icon={<Mail className="size-4" />} required />
                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-zinc-400">Password</span>
                    {authMode === 'signin' && <button type="button" className="text-xs font-black text-violet-300 hover:text-violet-100">Forgot password?</button>}
                  </div>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-12 w-full rounded-md border border-zinc-700 bg-[#18191b] px-4 text-sm font-bold text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-400"
                  />
                </label>
              </>
            )}

            {authMode === 'signin' && (
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberTerminal}
                  onChange={(event) => setRememberTerminal(event.target.checked)}
                  className="size-4 rounded border-zinc-700 bg-black accent-violet-400"
                />
                Remember this terminal for 30 days
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-violet-400 text-sm font-black text-black transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? authMode === 'confirm' ? 'Verifying...' : 'Connecting...'
                : authMode === 'signin' ? 'Sign In to Dashboard' : authMode === 'signup' ? 'Create Account' : 'Verify Email'}
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-bold text-zinc-400">
            {authMode === 'signin' ? (
              <>
                New to DevSpeak?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-black text-violet-300 hover:text-violet-100">
                  Create an account
                </button>
              </>
            ) : authMode === 'signup' ? (
              <>
                Already have access?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="font-black text-violet-300 hover:text-violet-100">
                  Sign in
                </button>
              </>
            ) : (
              <button type="button" onClick={() => switchMode('signin')} className="font-black text-violet-300 hover:text-violet-100">
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 grid w-full max-w-[430px] grid-cols-2 gap-x-8 gap-y-4 text-xs font-bold text-zinc-300">
          <span className="flex items-center gap-2"><Terminal className="size-4 text-violet-400" /> CLI Integration</span>
          <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-violet-400" /> SOC2 Compliant</span>
          <span className="flex items-center gap-2"><Sparkles className="size-4 text-violet-400" /> AI-Powered</span>
          <span className="flex items-center gap-2"><Server className="size-4 text-violet-400" /> Server: US-East-1</span>
        </div>

        <div className="mt-auto flex flex-col items-center gap-5 pt-12">
          <span className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-300">
            DEVSPEAK_CORE_v1.0.42_STABLE
          </span>
          <footer className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-300">
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
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-400">{label}</span>
      <div className="relative">
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={`h-12 w-full rounded-md border border-zinc-700 bg-[#18191b] px-4 text-sm font-bold text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-400 disabled:opacity-60 ${icon ? 'pl-11' : ''}`}
        />
      </div>
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black font-mono text-zinc-100">
          <div className="text-center">
            <div className="mx-auto mb-5 size-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
            <p className="text-sm font-bold text-zinc-400">Loading terminal...</p>
          </div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
