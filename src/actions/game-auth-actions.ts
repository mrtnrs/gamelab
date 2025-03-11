"use server";

import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/utils/supabase-admin";

/**
 * Verify if the authenticated user matches the game developer and claim the game
 * This function should be called after the user has authenticated with Twitter
 */
export async function verifyAndClaimGame(gameId: string, gameSlug: string) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session?.user?.xId || !session?.user?.xHandle) {
      // User is not authenticated
      return { 
        success: false, 
        error: "auth_failed",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("auth_failed")}`
      };
    }

    // Get the game from the database
    const supabase = createServerSupabaseClient();
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

    // Check if the game is already claimed
    // if (game.claimed && game.developer_twitter_id !== session.user.xId) {
    //   return { 
    //     success: false, 
    //     error: "already_claimed",
    //     redirect: `/games/${gameSlug}?error=${encodeURIComponent("already_claimed")}`
    //   };
    // }

    // Extract the Twitter handle from the developer URL
    const developerUrl = game.developer_url || "";
    const isXUrl = developerUrl && 
      (developerUrl.includes("twitter.com/") || developerUrl.includes("x.com/"));
    
    if (!isXUrl) {
      return { 
        success: false, 
        error: "invalid_developer_url",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("invalid_developer_url")}`
      };
    }

    // Extract the handle from the URL
    const urlParts = developerUrl.split("/");
    const expectedHandle = urlParts[urlParts.length - 1].toLowerCase();
    const userHandle = session.user.xHandle.toLowerCase();

    // Verify that the authenticated user's handle matches the developer URL
    if (expectedHandle !== userHandle) {
      return { 
        success: false, 
        error: "handle-mismatch",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("handle-mismatch")}`
      };
    }

    // Update the game's claimed status
    const { error: updateError } = await supabase
      .from("games")
      .update({ 
        claimed: true,
      })
      .eq("id", gameId);

    if (updateError) {
      console.error('Error updating game claimed status:', updateError);
      return { 
        success: false, 
        error: "update_failed",
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("update_failed")}`
      };
    }

    // Success - return success object
    return { 
      success: true, 
      redirect: `/games/${gameSlug}?success=game-claimed`
    };
  } catch (error) {
    console.error('Error in verifyAndClaimGame:', error);
    return { 
      success: false, 
      error: "unexpected_error",
      redirect: `/games/${gameSlug}?error=${encodeURIComponent("unexpected_error")}`
    };
  }
}

/**
 * Check if the current authenticated user is the developer of a game
 * This is a server-side function that can be used in server components
 */
export async function isGameDeveloper(gameId: string): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.xId) {
      return false;
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('games')
      .select('developer_twitter_id, claimed')
      .eq('id', gameId)
      .single();

    if (error || !data || !data.claimed) {
      return false;
    }

    return data.developer_twitter_id === session.user.xId;
  } catch (error) {
    console.error('Error checking if user is game developer:', error);
    return false;
  }
}
