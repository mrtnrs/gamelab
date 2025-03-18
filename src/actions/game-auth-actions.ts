"use server";

import { createServerSupabaseClient } from "@/utils/supabase-server";
import { claimGame } from "@/utils/supabase-auth";
import { cookies } from "next/headers";

// Define the response type for consistency
type GameAuthResponse = {
  success: boolean;
  error?: string;
  redirect?: string;
};

/**
 * Verify if the authenticated user matches the game developer and claim the game
 * This function should be called after the user has authenticated with Twitter
 */
export async function verifyAndClaimGame(gameId: string, gameSlug: string): Promise<GameAuthResponse> {
  try {
    // Get the Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get the current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session:', sessionError);
      return { 
        success: false, 
        error: "auth_failed",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("auth_failed")}`
      };
    }

    // Get the user's Twitter/X information from the session
    const user = session.user;
    const userMetadata = user.user_metadata || {};
    const xHandle = userMetadata.preferred_username || userMetadata.user_name;
    
    if (!xHandle) {
      return { 
        success: false, 
        error: "auth_failed",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("auth_failed")}`
      };
    }

    // Get the game from the database
    const { data: game, error } = await supabase
      .from('games')
      .select('developer_url, claimed')
      .eq('id', gameId)
      .single();

    if (error || !game) {
      console.error('Error fetching game:', error);
      return { 
        success: false, 
        error: "game_not_found",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("game_not_found")}`
      };
    }

    // Extract the Twitter handle from the developer URL
    const developerUrl = game.developer_url || "";
    const match = developerUrl.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    const developerHandle = match ? match[1] : null;

    if (!developerHandle) {
      return { 
        success: false, 
        error: "invalid_developer_url",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("invalid_developer_url")}`
      };
    }

    // Compare the handles (case insensitive)
    if (developerHandle.toLowerCase() !== xHandle.toLowerCase()) {
      return { 
        success: false, 
        error: "not_your_game",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("not_your_game")}`
      };
    }

    // Claim the game using the utility function
    const claimResult = await claimGame(gameId);
    
    if (!claimResult.success) {
      return { 
        success: false, 
        error: claimResult.error || "claim_failed",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent(claimResult.error || "claim_failed")}`
      };
    }
    
    // Set a cookie to remember the claimed game
    try {
      // In a server action, cookies() returns the cookie store directly, not a Promise
      const cookieStore = await cookies();
      cookieStore.set('claimed_game_id', gameId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      // Continue even if cookie setting fails
    }

    // Return success with a redirect URL as a plain object
    return {
      success: true,
      redirect: `/games/${gameSlug}?success=game-claimed`
    };
  } catch (error) {
    console.error('Error verifying and claiming game:', error);
    return { 
      success: false, 
      error: "update_failed",
      redirect: `/games/${gameSlug}?error=${encodeURIComponent("update_failed")}`
    };
  }
}

/**
 * Check if the current authenticated user is the developer of a game
 * This is a server-side function that can be used in server components
 */
export async function isGameDeveloper(gameId: string): Promise<boolean> {
  try {
    // Get the Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get the current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return false;
    }

    // Get the user's Twitter/X information from the session
    const user = session.user;
    const userMetadata = user.user_metadata || {};
    const xHandle = userMetadata.preferred_username || userMetadata.user_name;
    
    if (!xHandle) {
      return false;
    }

    // Get the game from the database
    const { data: game, error } = await supabase
      .from('games')
      .select('developer_url, claimed')
      .eq('id', gameId)
      .single();

    if (error || !game) {
      return false;
    }

    // Extract the Twitter handle from the developer URL
    const developerUrl = game.developer_url || "";
    const match = developerUrl.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    const developerHandle = match ? match[1] : null;

    if (!developerHandle) {
      return false;
    }

    // Compare the handles (case insensitive)
    return developerHandle.toLowerCase() === xHandle.toLowerCase();
  } catch (error) {
    console.error('Error checking if user is game developer:', error);
    return false;
  }
}
