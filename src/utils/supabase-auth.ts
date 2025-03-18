// src/utils/supabase-auth.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './supabase-client';

/**
 * Extract Twitter/X handle from a URL
 */
export function extractHandleFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting handle from URL:', error);
    return null;
  }
}

/**
 * Get the current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<any> {
  const supabase = await getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

/**
 * Check if the current user is a developer of the specified game
 */
export async function isGameDeveloper(gameId: string): Promise<boolean> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) return false;
    
    // Get user provider data to extract Twitter/X handle
    const providerData = user.app_metadata?.provider_data;
    if (!providerData) return false;
    
    // For Twitter auth, we need to extract the handle from user metadata
    let userHandle: string | null = null;
    
    // Extract Twitter handle from user metadata
    if (user.app_metadata?.provider === 'twitter') {
      userHandle = user.user_metadata?.user_name || 
                   user.user_metadata?.preferred_username;
    }
    
    if (!userHandle) return false;
    
    // Get the game's developer URL
    const supabase = await getSupabaseBrowserClient();
    const { data: game, error } = await supabase
      .from('games')
      .select('developer_url')
      .eq('id', gameId)
      .single();
    
    if (error || !game) return false;
    
    // Extract handle from developer URL
    const developerHandle = extractHandleFromUrl(game.developer_url as string);
    if (!developerHandle) return false;
    
    // Compare handles (case insensitive)
    return developerHandle.toLowerCase() === userHandle.toLowerCase();
  } catch (error) {
    console.error('Error checking if user is game developer:', error);
    return false;
  }
}

/**
 * Claim a game for the authenticated user - now accepts a client for Edge compatibility
 */
export async function claimGame(
  supabase: SupabaseClient,
  gameId: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!gameId || !userId) {
      return { success: false, error: 'missing_required_parameters' };
    }
    
    // Check if the game exists and is not already claimed
    const { data: game, error } = await supabase
      .from('games')
      .select('claimed')
      .eq('id', gameId)
      .single();
    
    if (error || !game) {
      return { success: false, error: 'game_not_found' };
    }
    
    if (game.claimed) {
      return { success: false, error: 'already_claimed' };
    }
    
    // Update the game as claimed by this user
    const { error: updateError } = await supabase
      .from('games')
      .update({ 
        claimed: true,
        claimed_by: userId,
        claimed_at: new Date().toISOString()
      })
      .eq('id', gameId);
    
    if (updateError) {
      console.error('Error updating game claimed status:', updateError);
      return { success: false, error: 'update_failed' };
    }
    
    // Also run the RPC function as a backup if available
    try {
      await supabase.rpc('update_game_claimed_status', {
        game_id: gameId as string,
        user_id: userId
      });
    } catch (rpcError) {
      console.error('Error running RPC function:', rpcError);
      // We don't fail the entire operation if just the RPC fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error claiming game:', error);
    return { success: false, error: 'unexpected_error' };
  }
}
