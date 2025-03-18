"use server"
// src/utils/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create a Supabase client for server components
export async function createServerClient() {
  const cookieStore = cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
}

// Create a Supabase client for client components
export async function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Create a singleton instance for client-side usage
let browserClient: SupabaseClient | null = null;

export async function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = await createBrowserSupabaseClient();
  }
  return browserClient;
}
