"use client";

import { startTwitterAuth, signOut } from '@/actions/supabase-auth-actions';
import { getSupabaseBrowserClient } from '@/utils/supabase-client';

/**
 * Start authentication with game context from the client side
 * @param gameId The ID of the game to claim
 * @param gameSlug The slug of the game for redirect
 * @returns Promise that resolves when the sign-in process is initiated
 */
export async function startAuthWithGameContext(gameId: string, gameSlug: string) {
  console.log('Starting Supabase auth with game context:', { gameId, gameSlug });
  
  // Store game context in cookies on the client side as a backup
  document.cookie = `game_claim_id=${encodeURIComponent(gameId)}; path=/;`;
  document.cookie = `game_claim_slug=${encodeURIComponent(gameSlug)}; path=/;`;
  
  try {
    // Create a direct Supabase client instead of calling server action
    const supabase = await getSupabaseBrowserClient();
    
    // Get the base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const redirectUrl = new URL("/auth/supabase-callback", baseUrl);
    
    // Add game context as query parameters
    redirectUrl.searchParams.set("gameId", gameId);
    redirectUrl.searchParams.set("gameSlug", gameSlug);
    
    // Sign in with OAuth directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: redirectUrl.toString(),
        scopes: 'tweet.read users.read email',
        queryParams: {
          username: 'true',
          email: 'true'
        }
      }
    });
    
    if (error) {
      console.error('Error starting Twitter auth:', error);
      throw new Error(error.message);
    }
    
    if (data?.url) {
      // Redirect to the auth URL
      window.location.href = data.url;
      return;
    }
    
    throw new Error('No URL returned from authentication provider');
  } catch (error) {
    console.error('Error starting Twitter auth:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns Promise that resolves when the sign-out process is complete
 */
export async function signOutUser() {
  try {
    // Call the server action to sign out
    await signOut();
    
    // Also sign out on the client side for complete session cleanup
    const supabase = await getSupabaseBrowserClient();
    await supabase.auth.signOut();
    
    // Reload the page to update the UI
    window.location.href = '/';
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get the current user from the client side
 * @returns Promise that resolves to the current user or null
 */
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 * @returns Promise that resolves to true if the user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
