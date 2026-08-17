import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

const emailOtpTypes: EmailOtpType[] = [
  'email',
  'signup',
  'recovery',
  'invite',
  'magiclink',
  'email_change',
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && emailOtpTypes.includes(value as EmailOtpType));
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  const requestedNext = request.nextUrl.searchParams.get('next');

  if (tokenHash && isEmailOtpType(type)) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

      if (!error) {
        const fallback = type === 'recovery' ? '/update-password' : '/onboarding';
        return NextResponse.redirect(
          new URL(getSafeRedirectPath(requestedNext, fallback), request.nextUrl.origin)
        );
      }
    } catch (confirmationError) {
      console.error('Email confirmation failed:', confirmationError);
    }
  }

  const loginUrl = new URL('/login', request.nextUrl.origin);
  loginUrl.searchParams.set('error', 'This email link is invalid or has expired.');
  return NextResponse.redirect(loginUrl);
}
