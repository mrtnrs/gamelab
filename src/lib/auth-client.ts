"use client";

import { signIn, signOut } from "next-auth/react";

/**
 * Start authentication with game context from the client side
 * @param gameId The ID of the game to claim
 * @param gameSlug The slug of the game for redirect
 * @returns Promise that resolves when the sign-in process is initiated
 */
export async function startAuthWithGameContext(gameId: string, gameSlug: string) {
  console.log('Starting auth with game context:', { gameId, gameSlug });

  document.cookie = `game_claim_id=${encodeURIComponent(gameId)}; path=/;`;
  document.cookie = `game_claim_slug=${encodeURIComponent(gameSlug)}; path=/;`;

  return signIn("twitter", { 
    callbackUrl: `/auth/callback?gameId=${encodeURIComponent(gameId)}&gameSlug=${encodeURIComponent(gameSlug)}`,
  });
}

/**
 * Sign out the current user
 * @param callbackUrl Optional URL to redirect to after sign out
 * @returns Promise that resolves when the sign-out process is complete
 */
export async function signOutUser(callbackUrl?: string) {
  return signOut({ 
    callbackUrl: callbackUrl || '/',
    redirect: true
  });
}
