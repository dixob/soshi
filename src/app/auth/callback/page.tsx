'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    async function exchangeCode() {
      if (code) {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace('/dashboard');
          return;
        }
      }
      router.replace('/login');
    }

    exchangeCode();
  }, [searchParams, router]);

  return <p className="text-stone-500 text-sm">Signing you in…</p>;
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Suspense fallback={<p className="text-stone-500 text-sm">Loading…</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
