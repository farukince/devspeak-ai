import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error) {
    // Redirect to login with error
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${error}&error_description=${error_description || ''}`
    );
  }

  if (code) {
    // OAuth callback - Amplify handles this automatically
    // Just redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  }

  // No code or error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
