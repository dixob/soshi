import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use implicit flow so magic links work cross-device.
        // PKCE requires the link to be opened in the same browser that
        // requested it (code verifier stored in cookie), which fails
        // when users open the email on a different device (e.g. phone).
        flowType: 'implicit',
      },
    }
  );
}
