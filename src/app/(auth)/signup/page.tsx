'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function SignupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [magicSent, setMagicSent] = useState(false);

  // Show errors from redirect
  const errorParam = searchParams.get('error');
  const displayError = error || (errorParam ? 'Something went wrong. Please try again.' : '');

  async function handlePasswordSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setMagicSent(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
        <p className="text-emerald-800 font-medium">Check your email</p>
        <p className="text-emerald-600 text-sm mt-1">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    );
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
        <form onSubmit={handlePasswordSignup} className="space-y-4">
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
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-stone-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>
          {displayError && <p className="text-red-600 text-sm">{displayError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
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
          {displayError && <p className="text-red-600 text-sm">{displayError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
          <p className="text-xs text-stone-400 text-center">
            No password needed — we&apos;ll email you a secure link.
          </p>
        </form>
      )}

      <p className="text-sm text-stone-500 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-stone-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 mb-1">Create your account</h1>
          <p className="text-stone-500 text-sm">Get started with Soshi in under two minutes</p>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse bg-stone-100 rounded-lg" />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
