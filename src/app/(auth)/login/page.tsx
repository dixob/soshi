'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
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

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [magicSent, setMagicSent] = useState(false);

  // Show errors from auth callback redirect
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const msg = getErrorMessage(errorParam, errorDescription);
    if (msg) setError(msg);
  }, [searchParams]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Invalid email or password. Please try again.'
        : error.message);
    } else {
      // BUG-044: Redirect to the originally requested page if redirectTo param exists
      const redirectTo = searchParams.get('redirectTo');
      window.location.href = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';
      return;
    }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    // BUG-044: Pass redirectTo through magic link callback
    const redirectTo = searchParams.get('redirectTo');
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (redirectTo && redirectTo.startsWith('/')) callbackUrl.searchParams.set('redirectTo', redirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    });
    if (error) setError(error.message);
    else setMagicSent(true);
    setLoading(false);
  }

  if (magicSent) {
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
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => { setMode('password'); setError(''); }}
          className={`flex-1 pb-2.5 text-sm font-medium border-b-2 transition-colors ${
            mode === 'password'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => { setMode('magic'); setError(''); }}
          className={`flex-1 pb-2.5 text-sm font-medium border-b-2 transition-colors ${
            mode === 'magic'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Magic Link
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@yourfuneralhome.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-stone-400">
              Forgot your password? Use the <button type="button" onClick={() => setMode('magic')} className="underline hover:text-stone-600">Magic Link</button> tab to sign in without one.
            </p>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="magic-email" className="block text-sm font-medium text-stone-700 mb-1">
              Email address
            </label>
            <input
              id="magic-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@yourfuneralhome.com"
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
      )}

      <p className="text-sm text-stone-500 text-center">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-stone-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
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
