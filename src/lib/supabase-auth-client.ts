// src/lib/supabase-auth-client.ts
"use client";

// Assuming signOut is needed and defined elsewhere, e.g., src/actions/supabase-auth-actions.ts
import { signOut } from '@/actions/supabase-auth-actions';
import { getSupabaseBrowserClient } from '@/utils/supabase-client'; // Use browser client utility

/**
 * Start authentication with game context from the client side
 * @param gameId The ID of the game to claim
 * @param gameSlug The slug of the game for redirect
 * @returns Promise that resolves when the sign-in process is initiated
 */
export async function startAuthWithGameContext(gameId: string, gameSlug: string) {
  console.log('Starting Supabase auth with game context:', { gameId, gameSlug });

  // Optional: Store game context in cookies as a backup - client-side cookies are fine
  document.cookie = `game_claim_id=${encodeURIComponent(gameId)}; path=/; max-age=600; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
  document.cookie = `game_claim_slug=${encodeURIComponent(gameSlug)}; path=/; max-age=600; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;

  try {
    const supabase = getSupabaseBrowserClient(); // Use browser client here

    // Get the base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    // This MUST point to the client-side page route
    const redirectUrl = new URL("/auth/supabase-callback", baseUrl);

    // Add game context as query parameters (these will persist)
    redirectUrl.searchParams.set("gameId", gameId);
    redirectUrl.searchParams.set("gameSlug", gameSlug);

    // Sign in with OAuth directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: redirectUrl.toString(),
        // Add scopes if needed by your app/X.com app config
        // scopes: 'tweet.read users.read offline.access',
      }
    });

    if (error) {
      console.error('Error starting Twitter auth:', error);
      throw new Error(error.message);
    }

    if (data?.url) {
      // Redirect the user's browser to the X.com authorization URL
      window.location.href = data.url;
      return; // Stop execution here
    }

    // Should not happen if Supabase provider is configured
    throw new Error('No authorization URL returned from authentication provider');
  } catch (error) {
    console.error('Error in startAuthWithGameContext:', error);
    // Consider showing an error toast to the user here
    throw error; // Re-throw for the calling component (e.g., button) to handle
  }
}

/**
 * Sign out the current user
 * @returns Promise that resolves when the sign-out process is complete
 */
export async function signOutUser() {
  try {
    const supabase = getSupabaseBrowserClient();
    // Sign out on client first
    await supabase.auth.signOut();
    // Optionally call server-side sign out if needed, but client-side is primary
    // await signOut(); // If signOut server action does more cleanup

    // Redirect to home or refresh
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
    const supabase = getSupabaseBrowserClient();
    // getSession is often preferred over getUser for checking auth state
    const { data } = await supabase.auth.getSession();
    return data?.session?.user || null;
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