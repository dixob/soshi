'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, initialize } = useStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Redirect new users to onboarding (blank full_name = first sign-in)
    if (profile && !profile.full_name) {
      router.push('/onboarding');
    }
  }, [loading, user, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex bg-stone-50">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-52 flex-col bg-white border-r border-stone-100 p-4 gap-2 animate-pulse">
          <div className="h-6 w-20 bg-stone-100 rounded mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-stone-100 rounded" />
          ))}
        </div>
        {/* Content skeleton */}
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4 max-w-5xl">
            <div className="h-7 w-32 bg-stone-200 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-stone-200 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-48 bg-stone-200 rounded-xl" />
              <div className="h-48 bg-stone-200 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-stone-50">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-0">
        <div className="pt-14 md:pt-0 p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
