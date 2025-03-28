// src/utils/supabase-server.ts
"use server" // Keep this if you need to call these functions from client components via Server Actions

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

// Creates a Supabase client for server-side use (Route Handlers, Server Actions)
// Reads cookies using a custom fetch wrapper but does NOT automatically set them.
export async function createClient(): Promise<SupabaseClient> {
  // For security reasons, we need to ensure the URL and key are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }

  // Need to await cookies() in newer Next.js versions
  const cookieStore = await cookies();

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      // We are handling session persistence manually via HTTP cookies
      persistSession: false,
      // Auto refresh is managed manually or via middleware if needed
      autoRefreshToken: false,
      // We handle the code exchange explicitly in the callback route
      detectSessionInUrl: false
    },
    global: {
      // Custom fetch wrapper to inject auth cookies into outgoing Supabase requests
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        // Resolve the URL input
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        // Get only Supabase-specific cookies from the store
        const allCookies = cookieStore.getAll();
        const sbAuthCookie = allCookies.find(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));

        // Prepare request headers
        const headers = new Headers(init?.headers);

        // Add the Supabase auth cookie if found
        if (sbAuthCookie) {
          headers.set('Cookie', `${sbAuthCookie.name}=${sbAuthCookie.value}`);
          // Potentially set Authorization header if needed, though cookie is usually sufficient
          // headers.set('Authorization', `Bearer ${YOUR_ACCESS_TOKEN_EXTRACTION_LOGIC_IF_NEEDED}`);
        }

        // Merge custom headers with existing ones, prioritizing custom ones
        const finalInit = { ...init, headers };

        // Make the actual fetch request
        return fetch(url, finalInit);
      }
    }
  });
}

// For administrative operations that require the service role key
// This doesn't need cookie handling as it uses the service key.
export async function createServiceClient(): Promise<SupabaseClient> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
  }

  // Use the base client, no special config needed for service role
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}