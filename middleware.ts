import { NextResponse, type NextRequest } from 'next/server';
import { runWithAmplifyServerContext } from '@aws-amplify/adapter-nextjs';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { awsConfig } from './lib/awsConfig';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  try {
    // Check if user is authenticated using Amplify
    const authenticated = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec, {});
          return session.tokens !== undefined;
        } catch (error) {
          console.log('Auth check error:', error);
          return false;
        }
      },
    });

    const { pathname } = request.nextUrl;

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/modules', '/profile', '/settings', '/analytics', '/onboarding'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !authenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing login while authenticated
    if (pathname === '/login' && authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
