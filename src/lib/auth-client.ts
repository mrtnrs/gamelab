"use client";

import { getSupabaseBrowserClient } from "@/utils/supabase-client";

/**
 * Start authentication with game context from the client side
 * @param gameId The ID of the game to claim
 * @param gameSlug The slug of the game for redirect
 * @returns Promise that resolves when the sign-in process is initiated
 */
export async function startAuthWithGameContext(gameId: string, gameSlug: string) {
  console.log('Starting auth with game context:', { gameId, gameSlug });

  // Store game context in cookies for the auth callback
  document.cookie = `game_claim_id=${encodeURIComponent(gameId)}; path=/;`;
  document.cookie = `game_claim_slug=${encodeURIComponent(gameSlug)}; path=/;`;

  // Get the Supabase browser client
  const supabase = await getSupabaseBrowserClient();
  
  // Start the Twitter OAuth flow
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'tweet.read users.read',
    },
  });

  if (error) {
    console.error('Error starting authentication:', error);
    throw error;
  }

  // Redirect to the authentication URL
  if (data.url) {
    window.location.href = data.url;
  }

  return data;
}

/**
 * Sign out the current user
 * @param callbackUrl Optional URL to redirect to after sign out
 * @returns Promise that resolves when the sign-out process is complete
 */
export async function signOutUser(callbackUrl?: string) {
  const supabase = await getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  if (callbackUrl) {
    window.location.href = callbackUrl;
  }
  
  return { success: true };
}
