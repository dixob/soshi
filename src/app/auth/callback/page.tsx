'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/**
 * Client-side auth callback handler.
 *
 * Supabase magic-link flow (PKCE):
 *   1. User clicks magic link -> Supabase verifies -> redirects here with ?code=…
 *   2. Browser client exchanges the code for a session (reads the code-verifier
 *      cookie it stored earlier during signInWithOtp).
 *   3. On success, full-page navigate to /dashboard so middleware + server
 *      components pick up the fresh session cookies.
 *
 * Using a client-side page (instead of a Route Handler) avoids a known issue
 * where Set-Cookie headers on a NextResponse.redirect() can be dropped by
 * some browsers / Next.js versions, causing a redirect loop.
 */
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');

    if (errorParam) {
      const p = new URLSearchParams({ error: errorParam });
      if (errorDesc) p.set('error_description', errorDesc);
      router.replace(`/login?${p}`);
      return;
    }

    const code = searchParams.get('code');

    if (!code) {
      // No code and no error — check if there's already a session
      // (handles edge cases like implicit flow or repeat visits).
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        window.location.href = session ? '/dashboard' : '/login';
      });
      return;
    }

    // PKCE flow — exchange the authorization code for a session.
    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error('[auth/callback] Code exchange failed:', error.message);
          router.replace('/login?error=auth_failed');
        } else {
          // Full-page reload so middleware sees the new cookies.
          window.location.href = '/dashboard';
        }
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto" />
        <p className="mt-4 text-sm text-stone-500">Signing you in&hellip;</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
