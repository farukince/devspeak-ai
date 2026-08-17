import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from './config';

const protectedPrefixes = [
  '/dashboard',
  '/analytics',
  '/profile',
  '/settings',
  '/onboarding',
  '/update-password',
  '/modules',
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function copyAuthState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));

  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }

  return target;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    if (isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      loginUrl.searchParams.set('error', 'supabase_not_configured');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const isAuthenticated = !error && Boolean(userId);

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return copyAuthState(response, NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && userId && (isProtectedPath(pathname) || pathname === '/login')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, job_title, experience_level, english_level, native_language, timezone, onboarding_completed_at')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError) {
      const onboardingComplete = Boolean(
        profile?.onboarding_completed_at
        && profile.display_name?.trim()
        && profile.job_title?.trim()
        && profile.experience_level?.trim()
        && profile.english_level?.trim()
        && profile.native_language?.trim()
        && profile.timezone?.trim()
      );

      if (!onboardingComplete && pathname !== '/onboarding' && pathname !== '/update-password') {
        const onboardingUrl = request.nextUrl.clone();
        onboardingUrl.pathname = '/onboarding';
        onboardingUrl.search = '';
        return copyAuthState(response, NextResponse.redirect(onboardingUrl));
      }

      if (onboardingComplete && (pathname === '/login' || pathname === '/onboarding')) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = '/dashboard';
        dashboardUrl.search = '';
        return copyAuthState(response, NextResponse.redirect(dashboardUrl));
      }
    } else if (pathname === '/login') {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      dashboardUrl.search = '';
      return copyAuthState(response, NextResponse.redirect(dashboardUrl));
    }
  }

  return response;
}
