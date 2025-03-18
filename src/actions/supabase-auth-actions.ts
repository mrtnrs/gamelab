// src/actions/supabase-auth-actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase-client';
import { createServerSupabaseClient } from '@/utils/supabase-admin';
import { extractHandleFromUrl } from '@/utils/supabase-auth';

/**
 * Start the Twitter/X authentication flow
 */
export async function startTwitterAuth(gameId?: string, gameSlug?: string) {
  const supabase = await createServerClient();
  
  // Set up the auth redirect URL
  const redirectUrl = new URL('/auth/supabase-callback', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  
  // If we have game context, add it to the URL
  if (gameId && gameSlug) {
    redirectUrl.searchParams.set('gameId', gameId);
    redirectUrl.searchParams.set('gameSlug', gameSlug);
    
    // Also store in cookies as a backup
    try {
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'game_claim_id',
        value: gameId,
        path: '/',
        maxAge: 60 * 30, // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      cookieStore.set({
        name: 'game_claim_slug',
        value: gameSlug,
        path: '/',
        maxAge: 60 * 30, // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    } catch (error) {
      console.error('Error setting cookies:', error);
    }
  }
  
  // Start the auth flow with Supabase
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: redirectUrl.toString(),
      scopes: 'tweet.read users.read',
    },
  });
  
  if (error) {
    console.error('Error starting Twitter auth:', error);
    throw error;
  }
  
  // Redirect to the Supabase auth URL
  redirect(data.url);
}

/**
 * Handle the callback from Supabase auth
 */
export async function handleAuthCallback(code: string) {
  try {
    const cookieStore = await cookies();
    const gameId = cookieStore.get('game_claim_id')?.value;
    const gameSlug = cookieStore.get('game_claim_slug')?.value;
    
    // Exchange the code for a session
    const supabase = await createServerClient();
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
      const developerHandle = extractHandleFromUrl(game.developer_url);
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
      
      // Use the admin client to update the game
      const adminClient = await createServerSupabaseClient();
      const { error: updateError } = await adminClient
        .from('games')
        .update({ claimed: true })
        .eq('id', gameId);
      
      if (updateError) {
        console.error('Error updating game claimed status:', updateError);
        return {
          success: false,
          error: 'update_failed',
          redirect: `/games/${gameSlug}?error=${encodeURIComponent('update_failed')}`
        };
      }
      
      // Also run the RPC function as a backup
      try {
        await adminClient.rpc('update_game_claimed_status', {
          game_id: gameId,
        });
      } catch (rpcError) {
        console.error('Error running RPC function:', rpcError);
        // We don't fail the entire operation if just the RPC fails
      }
      
      // Clear the cookies
      try {
        cookieStore.set({
          name: 'game_claim_id',
          value: '',
          path: '/',
          maxAge: 0,
        });
        cookieStore.set({
          name: 'game_claim_slug',
          value: '',
          path: '/',
          maxAge: 0,
        });
        
        // Set a cookie to indicate the game is claimed
        cookieStore.set({
          name: 'claimed_game_id',
          value: gameId,
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
      } catch (error) {
        console.error('Error managing cookies:', error);
      }
      
      return {
        success: true,
        redirect: `/games/${gameSlug}?success=game-claimed`
      };
    }
    
    // If no game context, just redirect to home
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
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  
  // Clear any auth cookies
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'claimed_game_id',
      value: '',
      path: '/',
      maxAge: 0,
    });
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
  
  return { success: true };
}

/**
 * Check if the current user is a developer of the specified game
 * This is a server action that can be called from client components
 */
export async function checkIsGameDeveloper(gameId: string): Promise<boolean> {
  try {
    // Get the current session
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return false;
    
    // Get the game from the database
    const { data: game, error } = await supabase
      .from('games')
      .select('developer_url')
      .eq('id', gameId)
      .single();
    
    if (error || !game) return false;
    
    // Extract handle from developer URL
    const developerHandle = extractHandleFromUrl(game.developer_url);
    if (!developerHandle) return false;
    
    // Extract user handle from user metadata
    const userHandle = session.user.user_metadata?.user_name || 
                       session.user.user_metadata?.preferred_username;
    
    if (!userHandle) return false;
    
    // Compare handles (case insensitive)
    return developerHandle.toLowerCase() === userHandle.toLowerCase();
  } catch (error) {
    console.error('Error checking if user is game developer:', error);
    return false;
  }
}
