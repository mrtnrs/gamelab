"use client";

import { getSupabaseBrowserClient } from "@/utils/supabase-client";

/**
 * Start the authentication process with Supabase using Twitter/X
 * @param gameId Optional game ID if authenticating to claim a game
 * @param gameSlug Optional game slug if authenticating to claim a game
 */
export async function startAuthWithGameContext(gameId?: string, gameSlug?: string) {
  try {
    const supabase = await getSupabaseBrowserClient();
    
    // Create the redirect URL with additional context if needed
    const redirectUrl = new URL('/auth/callback', window.location.origin);
    
    // Add game context to the URL if provided and not empty
    if (gameId && gameSlug && gameId.trim() !== '' && gameSlug.trim() !== '') {
      redirectUrl.searchParams.set('gameId', gameId);
      redirectUrl.searchParams.set('gameSlug', gameSlug);
    }
    
    // Start the OAuth flow with Twitter/X
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: redirectUrl.toString(),
        scopes: 'tweet.read users.read',
      },
    });
    
    if (error) {
      console.error('Error starting auth flow:', error);
      throw error;
    }
    
    if (data?.url) {
      // Redirect to the provider's authentication page
      window.location.href = data.url;
    } else {
      throw new Error('No URL returned from signInWithOAuth');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = await getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    
    // Redirect to homepage after sign out
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}
