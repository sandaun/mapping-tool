// Server-side Supabase clients for API routes
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
