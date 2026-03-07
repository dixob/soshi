import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Required by @supabase/ssr.
 *
 * Without this, the Supabase client has no way to refresh an expiring access
 * token on the server side. After the 1-hour access token window the session
 * silently dies: getUser() returns null, the dashboard redirects to /login, and
 * the user gets stuck even though their refresh token is still valid.
 *
 * This middleware:
 * 1. Reads auth cookies from the incoming request
 * 2. Calls getUser() — which triggers a token refresh if the access token is
 *    about to expire and writes the new tokens back via setAll()
 * 3. Forwards the (potentially updated) cookies on both the request and response
 * 4. Redirects unauthenticated requests to /login (server-side, no flash)
 */
export async function middleware(request: NextRequest) {
  // Start with a plain next() response; setAll() will replace this if cookies change.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror updated cookies onto the request so downstream server
          // components see them within the same render pass.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Rebuild the response so the browser receives the new cookies.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not put any logic between createServerClient and getUser().
  // Anything that could throw before getUser() completes will break the token
  // refresh cycle and cause intermittent logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages to dashboard
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  // Public paths that don't require authentication
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/api/') ||
    pathname === '/';

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the original URL so we can redirect back after login
    if (pathname !== '/dashboard') {
      loginUrl.searchParams.set('redirectTo', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except static assets and the favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
