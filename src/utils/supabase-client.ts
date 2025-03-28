// src/utils/supabase-client.ts
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js';

// Cached instance to avoid creating multiple clients
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  // Ensure Supabase URL and Anon Key are available in the browser context
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // This error should be caught during development if env vars are missing
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Create a singleton instance for the browser
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient(
      supabaseUrl,
      supabaseAnonKey
      // @supabase/ssr handles browser storage (localStorage by default)
    );
    console.log("Supabase browser client created."); // Log creation
  }

  return browserClient;
}