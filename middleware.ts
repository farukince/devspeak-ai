import { NextResponse, type NextRequest } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { awsConfig } from './lib/awsConfig';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  try {
    const { pathname } = request.nextUrl;

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/modules', '/profile', '/settings', '/analytics', '/onboarding'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Public routes - allow access
    if (!isProtectedRoute) {
      // Redirect authenticated users from login to dashboard
      if (pathname === '/login') {
        try {
          // Simple check - if we can get cookies, user might be authenticated
          const authCookie = request.cookies.get('amplify-signin-with-hostedUI');
          if (authCookie) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        } catch (error) {
          // Continue to login page
        }
      }
      return response;
    }

    // For protected routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);

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
