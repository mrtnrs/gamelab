import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Creates a Supabase admin client with service role permissions
 * This bypasses RLS policies and should only be used in server-side code
 */
export function createAdminClient() {
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
