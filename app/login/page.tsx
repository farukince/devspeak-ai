'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { signIn, signUp, signInWithRedirect, confirmSignUp } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { awsConfig } from '@/lib/awsConfig';

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

function AuthContent() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  // New State Variables
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [birthday, setBirthday] = useState('');
  const [englishLevel, setEnglishLevel] = useState('Intermediate');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (errorMsg) {
      setError(errorDescription || errorMsg);
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            birthdate: birthday,
            // Note: job_title and english_level will be stored in DynamoDB user profile
            // Custom attributes require Cognito User Pool configuration
          },
        },
      });

      if (isSignUpComplete) {
        setSuccess('Account created successfully! Redirecting...');
        // Auto sign in
        setTimeout(async () => {
          await handleSignIn(e);
        }, 1000);
      } else if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setSuccess('Account created! Please enter the verification code sent to your email.');
        setAuthMode('confirm');
      } else {
        setSuccess('Please check your email to verify your account before signing in.');
      }

    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });

      setSuccess('Email verified successfully! Signing you in...');
      
      // Auto sign in after confirmation
      setTimeout(async () => {
        try {
          const { isSignedIn } = await signIn({
            username: email,
            password,
          });

          if (isSignedIn) {
            router.push('/dashboard');
            router.refresh();
          }
        } catch (error: any) {
          console.error('Auto sign in error:', error);
          setError('Verification successful! Please sign in manually.');
          setAuthMode('signin');
        }
      }, 1000);

    } catch (error: any) {
      console.error('Confirmation error:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'Google' | 'Facebook') => {
    setLoading(true);
    setError(null);
    try {
      await signInWithRedirect({ provider });
    } catch (error: any) {
      console.error('OAuth error:', error);
      setError(error.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-warm-white dark:bg-background-dark text-foreground antialiased overflow-x-hidden font-display h-screen flex w-full">
      {/* Left Panel: Visual Anchor */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary-dark to-primary-dark overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 text-8xl opacity-10">🚀</div>
        <div className="absolute bottom-20 left-20 text-8xl opacity-10">💬</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        {/* Logo Area */}
        <Link href="/" className="relative z-20 flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <span className="text-2xl font-bold tracking-tight text-white">DevSpeak AI</span>
        </Link>

        {/* Mission Statement Area */}
        <div className="relative z-20 max-w-lg">
          <h2 className="text-4xl font-black leading-tight tracking-tight text-white mb-3">
            Master Professional English for Engineers
          </h2>
          <p className="text-white/70 text-lg">
            Join thousands of developers improving their communication skills with intelligent AI-powered coaching.
          </p>
        </div>
      </div>

      {/* Right Panel: Authentication Form */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-cream dark:bg-surface-dark relative overflow-y-auto">
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 flex lg:hidden items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">DevSpeak AI</span>
        </div>
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[400px] flex flex-col gap-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <span className="text-3xl">
                {authMode === 'signin' ? '👋' : authMode === 'signup' ? '🎉' : '✉️'}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter">
              {authMode === 'signin' ? 'Welcome back' : authMode === 'signup' ? 'Create an account' : 'Verify your email'}
            </h1>
            <p className="text-text-secondary text-sm">
              {authMode === 'signin' 
                ? 'Enter your credentials to access your workspace.' 
                : authMode === 'signup'
                ? 'Get started with your free account today.'
                : 'Enter the verification code sent to your email.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl">
              {success}
            </div>
          )}

          {/* Social Login Buttons - Temporarily disabled until OAuth is configured */}
          {/* 
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuthSignIn('Google')}
              disabled={loading}
              className="relative flex w-full cursor-pointer items-center justify-center rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-3 text-sm font-semibold hover:bg-cream-dark/30 dark:hover:bg-border-dark/50 transition-all h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-4 flex items-center justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"></path>
                  <path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853"></path>
                  <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"></path>
                  <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335"></path>
                </svg>
              </span>
              Continue with Google
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-cream-dark/50 dark:border-border-dark"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Or {authMode === 'signin' ? 'sign in' : 'sign up'} with email</span>
            <div className="flex-grow border-t border-cream-dark/50 dark:border-border-dark"></div>
          </div>
          */}

          {/* Email Form */}
          <form className="flex flex-col gap-4" onSubmit={
            authMode === 'signin' ? handleSignIn : 
            authMode === 'signup' ? handleSignUp : 
            handleConfirmSignUp
          }>
            {authMode === 'confirm' ? (
              /* Verification Code Form */
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="email">Email address</label>
                  <input
                    className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="confirmationCode">Verification Code</label>
                  <input
                    className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    id="confirmationCode"
                    name="confirmationCode"
                    placeholder="Enter 6-digit code"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    required
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-text-secondary">Check your email for the verification code</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Email'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setConfirmationCode('');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  Back to Sign In
                </button>
              </>
            ) : (
              /* Sign In / Sign Up Form */
              <>
            {authMode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold" htmlFor="firstName">First Name</label>
                    <input
                      className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold" htmlFor="lastName">Last Name</label>
                    <input
                      className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="jobTitle">Current Role (Job Title)</label>
                  <input
                    className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    id="jobTitle"
                    name="jobTitle"
                    placeholder="e.g. Senior Frontend Engineer"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="birthday">Birthday</label>
                  <input
                    className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="englishLevel">English Level</label>
                  <select
                    className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
                    id="englishLevel"
                    name="englishLevel"
                    value={englishLevel}
                    onChange={(e) => setEnglishLevel(e.target.value)}
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Native">Native</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="email">Email address</label>
              <input
                className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold" htmlFor="password">Password</label>
                {authMode === 'signin' && (
                  <Link className="text-sm font-medium text-primary hover:text-primary-dark" href="#">Forgot password?</Link>
                )}
              </div>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-cream-dark/50 dark:border-border-dark bg-warm-white dark:bg-background-dark px-4 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {authMode === 'signup' && (
                <p className="text-xs text-text-secondary">Password must be at least 8 characters</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                authMode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
            </>
            )}
          </form>

          {/* Bottom Toggle */}
          {authMode !== 'confirm' && (
          <div className="mt-4 pt-2">
            <div className="flex w-full items-center justify-center rounded-full bg-cream-dark/30 dark:bg-border-dark/30 p-1">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 flex h-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${authMode === 'signin' ? 'bg-white dark:bg-background-dark text-foreground shadow-sm' : 'text-text-secondary hover:text-foreground'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 flex h-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${authMode === 'signup' ? 'bg-white dark:bg-background-dark text-foreground shadow-sm' : 'text-text-secondary hover:text-foreground'}`}
              >
                Create Account
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-text-secondary">
              By clicking continue, you agree to our <Link className="underline hover:text-primary" href="#">Terms of Service</Link> and <Link className="underline hover:text-primary" href="#">Privacy Policy</Link>.
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-warm-white dark:bg-background-dark">
        <span className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
