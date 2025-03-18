"use server";

import { createClient, createServiceClient } from "@/utils/supabase-server";
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
    const supabase = await createClient();
    
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
      console.error('Error getting game:', error);
      return { 
        success: false, 
        error: "game_not_found",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("game_not_found")}`
      };
    }
    
    // Check if the game is already claimed
    if (game.claimed) {
      return { 
        success: false, 
        error: "already_claimed",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("already_claimed")}`
      };
    }
    
    // Extract the Twitter/X handle from the developer URL
    const developerUrl = game.developer_url || '';
    const developerHandle = getDeveloperHandle(developerUrl);
    
    if (!developerHandle) {
      return { 
        success: false, 
        error: "invalid_developer_url",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("invalid_developer_url")}`
      };
    }
    
    // Check if the handles match (case insensitive)
    if (xHandle.toLowerCase() !== developerHandle.toLowerCase()) {
      return { 
        success: false, 
        error: "handle-mismatch",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("handle-mismatch")}`
      };
    }
    
    // All checks pass - claim the game using the service role client for admin operations
    const serviceClient = await createServiceClient();
    const claimResult = await claimGame(serviceClient, gameId, user.id);
    
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

    // Successfully claimed
    return { 
      success: true,
      redirect: `/games/${gameSlug}?success=game-claimed`
    };
  } catch (error) {
    console.error('Error claiming game:', error);
    return { 
      success: false, 
      error: "unexpected_error",
      redirect: `/games/${gameSlug}?error=${encodeURIComponent("unexpected_error")}`
    };
  }
}

/**
 * Helper function to extract the Twitter/X handle from a developer URL
 */
function getDeveloperHandle(url: string): string | null {
  if (!url) return null;
  
  try {
    // Match Twitter/X URLs in various formats
    const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i;
    const match = url.match(twitterRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing developer URL:', error);
    return null;
  }
}

/**
 * Check if the current authenticated user is the developer of a game
 * This is a server-side function that can be used in server components
 */
export async function isGameDeveloper(gameId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    // Check if the game is claimed by the current user
    const { data, error } = await supabase
      .from('games')
      .select('claimed, claimed_by')
      .eq('id', gameId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.claimed && data.claimed_by === session.user.id;
  } catch (error) {
    console.error('Error checking game developer:', error);
    return false;
  }
}
