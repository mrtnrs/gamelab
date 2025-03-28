// src/utils/supabase-server.ts
// Use the standard @supabase/ssr setup for server clients
// Assumes this doesn't cause the Edge error when called from Server Actions
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SupabaseClient } from '@supabase/supabase-js';

// Use this for Server Components, Server Actions, Route Handlers (if any were used)
export async function createClient(): Promise<SupabaseClient> {
  // Must be async to await cookies() in newer Next.js
  const cookieStore = await cookies()

  // Create and return the Supabase client configured for server-side rendering/actions
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Function to get a cookie by name
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Function to set a cookie (important for session refresh, etc.)
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
            console.warn(`Failed to set cookie '${name}' from server component/action. Middleware might be needed for reliable refresh. Error: ${error}`);
          }
        },
        // Function to remove a cookie
        remove(name: string, options: CookieOptions) {
          try {
            // Set value to empty string with expiry in the past to delete
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // The `delete` method was called from a Server Component.
             console.warn(`Failed to remove cookie '${name}' from server component/action. Error: ${error}`);
          }
        },
      },
    }
  )
}

// Client for administrative operations using the Service Role Key
// This does not need cookie handling as it authenticates with the secret key.
export async function createServiceClient(): Promise<SupabaseClient> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key for service client');
  }

  // Need to import the base client directly here to avoid cookie logic
  const { createClient: createBaseSupabaseClient } = await import('@supabase/supabase-js');

  // Create client configured with service role key
  return createBaseSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Service role client doesn't persist sessions via cookies
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}