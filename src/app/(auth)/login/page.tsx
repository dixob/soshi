'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_failed:
    'The login link could not be verified — it may have expired or already been used. Please request a new one.',
  access_denied: 'Access was denied. Please try again.',
  otp_expired: 'Your login link has expired. Please request a new one.',
  default: 'Something went wrong during sign-in. Please try again.',
};

function getErrorMessage(
  errorParam: string | null,
  errorDescription: string | null
): string | null {
  if (!errorParam) return null;
  return (
    AUTH_ERROR_MESSAGES[errorParam] ??
    errorDescription ??
    AUTH_ERROR_MESSAGES.default
  );
}

// Isolated into its own component so Suspense can wrap it (required by
// Next.js 14 App Router when using useSearchParams in a Client Component).
function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show an error if the auth callback redirected back here with ?error=
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const msg = getErrorMessage(errorParam, errorDescription);
    if (msg) setError(msg);
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
        <p className="text-emerald-800 font-medium">Check your email</p>
        <p className="text-emerald-600 text-sm mt-1">
          We sent a login link to <strong>{email}</strong>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourfuneralhome.com"
          required
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Sending...' : 'Send login link'}
      </button>

      <p className="text-xs text-stone-400 text-center">
        No password needed — we&apos;ll email you a secure link.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 mb-1">Soshi</h1>
          <p className="text-stone-500 text-sm">Family care management for funeral homes</p>
        </div>
        <Suspense fallback={<div className="h-48 animate-pulse bg-stone-100 rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
