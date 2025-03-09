'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Create a Supabase client with the service role key (server-side only)
const createAdminSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Verify the user has admin access before allowing admin actions
 */
async function verifyAdminAccess() {
  // Get the session from cookies
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  // Create a regular client with the user's session
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
  
  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Check if the user has admin role
  const { data: user, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error || !user || user.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return session.user.id;
}

/**
 * Get recent game submissions for the admin dashboard
 */
export async function getGameSubmissions(limit: number = 5) {
  try {
    // Verify admin access first
    await verifyAdminAccess();
    
    const supabase = createAdminSupabaseClient();
    
    // Fetch submissions from the database
    const { data, error } = await supabase
      .from('game_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching game submissions:', error);
      return { error: 'Failed to fetch submissions' };
    }
    
    return { submissions: data };
  } catch (error) {
    console.error('Error in getGameSubmissions:', error);
    return { error: 'Failed to fetch submissions' };
  }
}

/**
 * Approve a game submission
 */
export async function approveGameSubmission(submissionId: string) {
  try {
    // Verify admin access first
    await verifyAdminAccess();
    
    const supabase = createAdminSupabaseClient();
    
    // Get the submission details
    const { data: submission, error: fetchError } = await supabase
      .from('game_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    
    if (fetchError || !submission) {
      console.error('Error fetching submission:', fetchError);
      return { error: 'Submission not found' };
    }
    
    // Update the game status to published
    const { error: updateError } = await supabase
      .from('games')
      .update({ status: 'published' })
      .eq('id', submission.game_id);
    
    if (updateError) {
      console.error('Error updating game status:', updateError);
      return { error: 'Failed to approve game' };
    }
    
    // Update the submission status
    const { error: submissionError } = await supabase
      .from('game_submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId);
    
    if (submissionError) {
      console.error('Error updating submission status:', submissionError);
      return { error: 'Failed to update submission status' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in approveGameSubmission:', error);
    return { error: 'Failed to approve submission' };
  }
}

/**
 * Reject a game submission
 */
export async function rejectGameSubmission(submissionId: string, reason: string) {
  try {
    // Verify admin access first
    await verifyAdminAccess();
    
    const supabase = createAdminSupabaseClient();
    
    // Update the submission status
    const { error } = await supabase
      .from('game_submissions')
      .update({ 
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', submissionId);
    
    if (error) {
      console.error('Error rejecting submission:', error);
      return { error: 'Failed to reject submission' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in rejectGameSubmission:', error);
    return { error: 'Failed to reject submission' };
  }
}
