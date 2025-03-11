'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Direct database update function to fix the claimed status
 * This uses raw SQL to ensure the update works
 */
export async function fixGameClaimedStatus(gameId: string): Promise<boolean> {
  try {
   // console.log(`Attempting to fix claimed status for game ${gameId} using direct SQL`);
    
    // Use the service role client for administrative operations
    const serviceRoleSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Execute raw SQL to update the claimed status
    const { data, error } = await serviceRoleSupabase.rpc(
      'execute_sql',
      { 
        sql_query: `UPDATE games SET claimed = true WHERE id = '${gameId}' RETURNING id, claimed, developer_url;` 
      }
    );
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Fallback to regular update if RPC fails
     // console.log('Falling back to regular update');
      const { error: updateError } = await serviceRoleSupabase
        .from('games')
        .update({ claimed: true })
        .eq('id', gameId);
        
      if (updateError) {
        console.error('Error with fallback update:', updateError);
        return false;
      }
    } else {
     // console.log('SQL update result:', data);
    }
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await serviceRoleSupabase
      .from('games')
      .select('id, claimed, developer_url')
      .eq('id', gameId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return false;
    }
    
  //  console.log('Verification result:', verifyData);
    return verifyData?.claimed === true;
    
  } catch (error) {
    console.error('Unexpected error fixing claimed status:', error);
    return false;
  }
}
