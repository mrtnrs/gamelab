// src/actions/supabase-auth-actions.ts
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/utils/supabase-client';
import { createClient, createServiceClient } from '@/utils/supabase-server';
import { extractHandleFromUrl, claimGame } from '@/utils/supabase-auth';

/**
 * Start the Twitter/X authentication flow
 */
export async function startTwitterAuth(gameId?: string, gameSlug?: string) {
  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let redirectUrl = new URL("/auth/supabase-callback", origin);
    
    if (gameId && gameSlug) {
      // If we have gameId and gameSlug, add them as query parameters
      redirectUrl.searchParams.set("gameId", gameId);
      redirectUrl.searchParams.set("gameSlug", gameSlug);
    }
    
    // Set the game_claim_id cookie if we have a gameId
    // This is a backup in case the URL parameters get lost
    if (gameId) {
      try {
        const cookieStore = await cookies();
        cookieStore.set("game_claim_id", gameId, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 20, // 20 minutes
        });
      } catch (cookieError) {
        console.error("Error setting game_claim_id cookie:", cookieError);
      }
    }
    
    // Include email scope to request email access
    // Twitter requires this for Supabase authentication
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: redirectUrl.toString(),
        scopes: 'tweet.read users.read email',
        queryParams: {
          username: 'true',
          email: 'true'
        }
      },
    });

    if (error) {
      console.error('Error starting Twitter auth:', error);
      const errorUrl = gameSlug 
        ? `/games/${gameSlug}?error=${encodeURIComponent('auth_failed')}` 
        : '/auth-error?error=auth_failed';
      return redirect(errorUrl);
    }

    if (data?.url) {
      return redirect(data.url);
    }
  } catch (error) {
    // Check if it's a Next.js redirect (this means we've already redirected)
    if (error instanceof Error && error.name === 'Redirect') {
      throw error;
    }
    
    console.error('Unexpected error in Twitter auth:', error);
    const errorUrl = gameSlug 
      ? `/games/${gameSlug}?error=${encodeURIComponent('unexpected_error')}` 
      : '/auth-error?error=unexpected_error';
    return redirect(errorUrl);
  }
}

/**
 * Handle the callback from Supabase auth
 */
export async function handleAuthCallback(code: string) {
  try {
    // Get query parameters from the URL if possible
    let gameId: string | null = null;
    let gameSlug: string | null = null;
    
    try {
      const headersList = await headers();
      const referer = headersList.get('referer');
      if (referer) {
        const url = new URL(referer);
        gameId = url.searchParams.get('gameId');
        gameSlug = url.searchParams.get('gameSlug');
      }
    } catch (error) {
      console.warn('Could not get headers, continuing without them:', error);
    }
    
    // Fallback to cookies if URL params aren't available
    if (!gameId || !gameSlug) {
      const cookieStore = await cookies();
      gameId = gameId || cookieStore.get('game_claim_id')?.value || null;
      gameSlug = gameSlug || cookieStore.get('game_claim_slug')?.value || null;
    }
    
    // Exchange the code for a session
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return {
        success: false,
        error: 'auth_failed',
        redirect: gameSlug 
          ? `/games/${gameSlug}?error=${encodeURIComponent('auth_failed')}`
          : '/auth-error?error=auth_failed'
      };
    }
    
    // If we have game context, try to claim the game
    if (gameId && gameSlug) {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        return {
          success: false,
          error: 'not_authenticated',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent('not_authenticated')}`
        };
      }
      
      // Get the game from the database
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('developer_url, claimed')
        .eq('id', gameId)
        .single();
      
      if (gameError || !game) {
        return {
          success: false,
          error: 'game_not_found',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent('game_not_found')}`
        };
      }
      
      // Extract handle from developer URL
      const developerHandle = extractHandleFromUrl(game.developer_url as string);
      if (!developerHandle) {
        return {
          success: false,
          error: 'invalid_developer_url',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent('invalid_developer_url')}`
        };
      }
      
      // Extract user handle from user metadata
      const userHandle = user.user_metadata?.user_name || 
                        user.user_metadata?.preferred_username;
      
      if (!userHandle) {
        return {
          success: false,
          error: 'missing_user_handle',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent('missing_user_handle')}`
        };
      }
      
      // Compare handles (case insensitive)
      if (developerHandle.toLowerCase() !== userHandle.toLowerCase()) {
        return {
          success: false,
          error: 'not_your_game',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent('not_your_game')}`
        };
      }
      
      // Use the service client for admin operations
      const serviceClient = await createServiceClient();
      const claimResult = await claimGame(serviceClient, gameId as string, user.id);
      
      if (!claimResult.success) {
        return {
          success: false,
          error: claimResult.error || 'claim_failed',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent(claimResult.error || 'claim_failed')}`
        };
      }
      
      // Successfully claimed the game
      return {
        success: true,
        redirect: `/games/${gameSlug}?success=game-claimed`
      };
    }
    
    // No game context, just redirect to home
    return {
      success: true,
      redirect: '/'
    };
  } catch (error) {
    console.error('Error in handleAuthCallback:', error);
    return {
      success: false,
      error: 'unexpected_error',
      redirect: '/auth-error?error=unexpected_error'
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = await getSupabaseBrowserClient();
    await supabase.auth.signOut();
    
    return {
      success: true,
      redirect: '/'
    };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: 'sign_out_failed'
    };
  }
}

/**
 * Check if the current user is a developer of the specified game
 * This is a server action that can be called from client components
 */
export async function checkIsGameDeveloper(gameId: string): Promise<boolean> {
  try {
    if (!gameId) return false;
    
    const supabase = await createClient();
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    // Check if the game exists and is claimed by the current user
    const { data, error } = await supabase
      .from('games')
      .select('claimed, claimed_by')
      .eq('id', gameId as string)
      .single();
    
    if (error || !data) return false;
    
    return !!data.claimed && data.claimed_by === session.user.id;
  } catch (error) {
    console.error('Error checking game developer status:', error);
    return false;
  }
}
