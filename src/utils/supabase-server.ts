// src/utils/supabase-server.ts
"use server"; // Keep this if you need to call these functions from client components via Server Actions

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

// Creates a Supabase client for server-side use (Route Handlers, Server Actions)
// Reads cookies using a custom fetch wrapper but does NOT automatically set them.
export async function createClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }

  const cookieStore = await cookies(); // Needs await

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      // Custom fetch wrapper to inject auth cookies into outgoing Supabase requests
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const allCookies = cookieStore.getAll();
        // Find the standard Supabase auth token cookie format
        const sbAuthCookie = allCookies.find(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));
        const headers = new Headers(init?.headers);

        if (sbAuthCookie) {
          headers.set('Cookie', `${sbAuthCookie.name}=${sbAuthCookie.value}`);
        }

        const finalInit = { ...init, headers };
        return fetch(url, finalInit);
      }
    }
  });
}

// For administrative operations that require the service role key
export async function createServiceClient(): Promise<SupabaseClient> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}