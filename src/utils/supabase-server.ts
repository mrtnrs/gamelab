"use server"
// src/utils/supabase-server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

export async function createClient(): Promise<SupabaseClient> {
  // For security reasons, we need to ensure the URL and key are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const cookieStore = await cookies();
  
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Don't use localStorage in Edge
      autoRefreshToken: false, // We'll manually refresh the token
      detectSessionInUrl: false // We'll manually handle the URL
    },
    global: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        // Convert input to string if it's a URL
        const url = typeof input === 'string' ? input : input.toString();
        
        // Get cookies that start with sb- (Supabase cookies)
        const allCookies = cookieStore.getAll();
        const authCookies = allCookies
          .filter(cookie => cookie.name.startsWith('sb-'))
          .map(cookie => `${cookie.name}=${cookie.value}`)
          .join('; ');

        // Add the cookies to the request headers
        const options = init || {};
        options.headers = options.headers || {};
        
        if (authCookies) {
          Object.assign(options.headers, {
            Cookie: authCookies
          });
        }
        
        // Make the fetch request
        return fetch(url, options);
      }
    }
  });
}

// For administrative operations that require the service role
export async function createServiceClient(): Promise<SupabaseClient> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
