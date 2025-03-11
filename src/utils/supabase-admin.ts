// src/utils/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the service role key (server-side only)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
    throw new Error('Supabase URL or service key is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
