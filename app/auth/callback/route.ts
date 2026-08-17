import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'), '/onboarding');

  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (callbackError) {
      console.error('Auth callback failed:', callbackError);
    }
  }

  const loginUrl = new URL('/login', requestUrl.origin);
  loginUrl.searchParams.set('error', 'Authentication callback could not be completed. Please try again.');
  return NextResponse.redirect(loginUrl);
}
