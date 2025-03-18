// src/utils/supabase-auth.ts
import { createServerClient } from './supabase-client';
import { createServerSupabaseClient } from './supabase-admin';
import { cookies } from 'next/headers';

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
  const supabase = await createServerClient();
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
    const supabase = await createServerClient();
    const { data: game, error } = await supabase
      .from('games')
      .select('developer_url')
      .eq('id', gameId)
      .single();
    
    if (error || !game) return false;
    
    // Extract handle from developer URL
    const developerHandle = extractHandleFromUrl(game.developer_url);
    if (!developerHandle) return false;
    
    // Compare handles (case insensitive)
    return developerHandle.toLowerCase() === userHandle.toLowerCase();
  } catch (error) {
    console.error('Error checking if user is game developer:', error);
    return false;
  }
}

/**
 * Claim a game for the current authenticated user
 */
export async function claimGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'not_authenticated' };
    }
    
    // Get user provider data to extract Twitter/X handle
    const providerData = user.app_metadata?.provider_data;
    if (!providerData) {
      return { success: false, error: 'missing_provider_data' };
    }
    
    // For Twitter auth, we need to extract the handle from user metadata
    let userHandle: string | null = null;
    
    // Extract Twitter handle from user metadata
    if (user.app_metadata?.provider === 'twitter') {
      userHandle = user.user_metadata?.user_name || 
                   user.user_metadata?.preferred_username;
    }
    
    if (!userHandle) {
      return { success: false, error: 'missing_user_handle' };
    }
    
    // Get the game's developer URL
    const supabase = await createServerClient();
    const { data: game, error } = await supabase
      .from('games')
      .select('developer_url, claimed')
      .eq('id', gameId)
      .single();
    
    if (error || !game) {
      return { success: false, error: 'game_not_found' };
    }
    
    // Extract handle from developer URL
    const developerHandle = extractHandleFromUrl(game.developer_url);
    if (!developerHandle) {
      return { success: false, error: 'invalid_developer_url' };
    }
    
    // Compare handles (case insensitive)
    if (developerHandle.toLowerCase() !== userHandle.toLowerCase()) {
      return { success: false, error: 'not_your_game' };
    }
    
    // Use the admin client to update the game
    const adminClient = await createServerSupabaseClient();
    const { error: updateError } = await adminClient
      .from('games')
      .update({ claimed: true })
      .eq('id', gameId);
    
    if (updateError) {
      console.error('Error updating game claimed status:', updateError);
      return { success: false, error: 'update_failed' };
    }
    
    // Also run the RPC function as a backup
    try {
      await adminClient.rpc('update_game_claimed_status', {
        game_id: gameId,
      });
    } catch (rpcError) {
      console.error('Error running RPC function:', rpcError);
      // We don't fail the entire operation if just the RPC fails
    }
    
    // Store the game ID in a cookie for the current session
    try {
      // Use the synchronous cookies() function
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'claimed_game_id',
        value: gameId,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    } catch (error) {
      console.error('Error setting cookie:', error);
      // Continue even if cookie setting fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error claiming game:', error);
    return { success: false, error: 'unexpected_error' };
  }
}
