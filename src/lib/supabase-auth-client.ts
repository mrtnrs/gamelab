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
  
  // Call the server action to start the auth flow
  return startTwitterAuth(gameId, gameSlug);
}

/**
 * Sign out the current user
 * @returns Promise that resolves when the sign-out process is complete
 */
export async function signOutUser() {
  // Call the server action to sign out
  await signOut();
  
  // Also sign out on the client side
  const supabase = await getSupabaseBrowserClient();
  await supabase.auth.signOut();
  
  // Refresh the page to update UI
  window.location.href = '/';
}

/**
 * Get the current user from the client side
 * @returns Promise that resolves to the current user or null
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if the current user is authenticated
 * @returns Promise that resolves to true if the user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
