'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/**
 * Client-side auth callback handler.
 *
 * Supports two flows:
 *   Implicit (current): Supabase redirects here with tokens in the URL hash
 *     fragment (#access_token=…). The browser client auto-detects and sets the
 *     session. Works cross-device (magic link opened on phone after requesting
 *     on laptop).
 *   PKCE (legacy): Redirects here with ?code=… which is exchanged for a session
 *     using a code-verifier cookie. Kept for backward compat with in-flight links.
 *
 * Uses a client-side page (not a Route Handler) to avoid Set-Cookie headers
 * being dropped on NextResponse.redirect() in some browsers / Next.js versions.
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

    const supabase = createClient();
    const code = searchParams.get('code');

    // BUG-044: Preserve redirectTo parameter through callback
    const redirectTo = searchParams.get('redirectTo');
    const destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';

    if (code) {
      // PKCE flow (backward compat for any in-flight magic links
      // issued before the switch to implicit flow).
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error('[auth/callback] Code exchange failed:', error.message);
            router.replace('/login?error=auth_failed');
          } else {
            window.location.href = destination;
          }
        });
      return;
    }

    // Implicit flow: tokens arrive in the URL hash fragment.
    // createBrowserClient auto-detects and processes them.
    // onAuthStateChange fires INITIAL_SESSION once complete.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          subscription.unsubscribe();
          window.location.href = session ? destination : '/login';
        }
      }
    );

    // Safety timeout — if nothing fires within 10s, send to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      window.location.href = '/login';
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
