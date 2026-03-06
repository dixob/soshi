'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, initialize } = useStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-4 flex items-center">
        <span className="text-stone-900 font-semibold text-lg">Soshi</span>
      </header>
      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        {children}
      </main>
    </div>
  );
}
