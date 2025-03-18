"use client"
// src/utils/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

// Create a singleton instance of the Supabase client for browser use
let supabaseBrowserClient: ReturnType<typeof createClient> | null = null;

export async function getSupabaseBrowserClient() {
  if (supabaseBrowserClient === null) {
    // For security reasons, ensure the URL and key are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseBrowserClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  
  return supabaseBrowserClient;
}

// Helper function to get current user without passing around the client
export async function getCurrentUser() {
  const supabase = await getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper function to get current session without passing around the client
export async function getCurrentSession() {
  const supabase = await getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return !!session;
}
