// Server-side Supabase clients for API routes
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Server read client — uses publishable key (RLS applied, read-only)
 */
export function getReadClient(): SupabaseClient {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
  return createClient(supabaseUrl, key);
}

/**
 * Server write client — uses secret/service role key (bypasses RLS)
 * Only use in API route handlers for inserts/updates.
 */
export function getWriteClient(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY!;
  return createClient(supabaseUrl, key);
}

/**
 * Returns the authenticated user from the request session cookie.
 * Use in API routes for additional defense-in-depth checks.
 * Primary auth enforcement is done by middleware.
 */
export async function getRequestUser(request: NextRequest) {
  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Response cookie updates handled by middleware — no-op here
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
