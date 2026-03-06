import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Supabase redirects here with ?error=... when something goes wrong upstream
  // (e.g. expired link, invalid token, or a database trigger failure on the
  // auth.users insert that rolls back the entire user creation).
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (errorParam) {
    console.error('[auth/callback] Supabase upstream error:', errorParam, errorDescription);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorParam);
    if (errorDescription) loginUrl.searchParams.set('error_description', errorDescription);
    return NextResponse.redirect(loginUrl.toString());
  }

  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // exchangeCodeForSession can fail if:
    // - the code verifier cookie is missing (different browser / incognito)
    // - the code was already used (user clicked the link twice)
    // - the Supabase project's auth settings have mismatched redirect URLs
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl.toString());
  }

  // No code, no error — shouldn't normally happen; send to login
  return NextResponse.redirect(`${origin}/login`);
}
