// src/actions/auth-actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { generateRandomString, generateCodeChallenge } from '@/utils/crypto-utils';

interface RedirectError extends Error {
  digest: string;
}

// Type guard
function isRedirectError(error: unknown): error is { digest: string } {
  return (
    error instanceof Error &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT')
  );
}

// Create a Supabase client with the service role key (server-side only)
const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
    throw new Error('Supabase URL or service key is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export type AuthResult = {
  success: boolean;
  xHandle?: string;
  error?: string;
  gameSlug?: string;
  developerHandle?: string;
  tokenError?: string;
  userInfoError?: string;
};

export type CallbackResult = {
  error?: string;
  redirect?: string;
  errorDetails?: any;
  errorType?: string;
};

export async function startXAuth(gameId: string, gameSlug: string) {
  const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;

  if (!CLIENT_ID) {
    console.error('X.com client ID is not configured');
    throw new Error('X.com client ID is not configured');
  }

  // console.log('Starting X.com authentication', { gameId, gameSlug });

  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const fullState = `${state}|${gameId}|${gameSlug}`;

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 30, // 30 minutes
    path: '/',
    sameSite: 'lax' as const,
  };

  const cookieStore = await cookies();
  cookieStore.set('x_auth_state', fullState, cookieOptions);
  cookieStore.set('x_code_verifier', codeVerifier, cookieOptions);
  // console.log('Cookies set', {
  //   x_auth_state: fullState.substring(0, 20) + '...',
  //   x_code_verifier: codeVerifier.substring(0, 20) + '...',
  // });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'tweet.read users.read',
    state: fullState,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
 // console.log('Redirecting to X.com auth URL', { authUrl: authUrl.substring(0, 100) + '...' });
  redirect(authUrl);
}

export async function getAuthUrl(gameId: string, gameSlug: string): Promise<string> {
  const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;

  if (!CLIENT_ID) {
    throw new Error('X.com client ID is not configured');
  }

  // Generate state and code verifier
  const state = generateRandomString(32); // Assume this function exists
  const codeVerifier = generateRandomString(64); // Assume this function exists
  const codeChallenge = generateCodeChallenge(codeVerifier); // Assume this function exists
  const fullState = `${state}|${gameId}|${gameSlug}`;

  // Set cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 30, // 30 minutes
    path: '/',
    sameSite: 'lax' as const,
  };

  const cookieStore = await cookies();
  cookieStore.set('x_auth_state', fullState, cookieOptions);
  cookieStore.set('x_code_verifier', codeVerifier, cookieOptions);

  // console.log('Cookies set in getAuthUrl', {
  //   x_auth_state: fullState.substring(0, 20) + '...',
  //   x_code_verifier: codeVerifier.substring(0, 20) + '...',
  // });

  // Construct Twitter auth URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'tweet.read users.read',
    state: fullState,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  return authUrl;
}

async function exchangeTokenWithRetry(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  retries: number = 3
) {
  const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  const CLIENT_SECRET = process.env.X_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('X.com client credentials missing', { clientId: !!CLIENT_ID, clientSecret: !!CLIENT_SECRET });
    throw new Error('X.com client credentials are not configured');
  }

  // console.log('Starting token exchange', { code: code.substring(0, 10) + '...', redirectUri });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // console.log(`Token exchange attempt ${attempt} of ${retries}`);
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (response.status === 429) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`Rate limited (429), retrying in ${delay}ms`, { attempt });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error('token_exchange_failed');
      }

      const tokenData = await response.json();
      // console.log('Token exchange successful', {
      //   accessToken: tokenData.access_token.substring(0, 10) + '...',
      //   tokenType: tokenData.token_type,
      // });
      return tokenData;
    } catch (error) {
      console.error(`Token exchange attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt === retries) {
        console.error('All token exchange retries exhausted');
        throw error;
      }
    }
  }
}

export async function handleXCallback(
  code: string,
  state: string,
  storedState?: string,
  codeVerifier?: string
): Promise<AuthResult> {
  const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
  const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;

  try {
    // console.log('Handling callback', {
    //   code: code.substring(0, 10) + '...',
    //   state: state.substring(0, 20) + '...',
    // });
    // console.log('Provided values', {
    //   storedState: storedState?.substring(0, 20) + '...',
    //   codeVerifier: codeVerifier?.substring(0, 20) + '...',
    // });

    if (!storedState || !codeVerifier) {
      console.error('Missing required values', { storedState, codeVerifier });
      return { success: false, error: 'missing_cookies' };
    }

    if (state !== storedState) {
      console.error('Invalid state parameter');
      return { success: false, error: 'invalid_state' };
    }

    const tokenData = await exchangeTokenWithRetry(code, codeVerifier, REDIRECT_URI);

    // Fetch user info (example)
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return { success: false, error: 'user_info_failed' };
    }

    const userData = await userResponse.json();
    const xHandle = userData.data.username;

    // Extract gameSlug from state if needed (e.g., state is "random|gameId|gameSlug")
    const [, , gameSlug] = state.split('|');
   // console.log(xHandle, gameSlug);
    return {
      success: true,
      xHandle,
      gameSlug,
      developerHandle: xHandle,
    };
  } catch (error) {
    console.error('X.com callback error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'unknown_error' 
    };
  }
}

export async function processCallback(
  code: string,
  state: string,
  storedState?: string,
  codeVerifier?: string
): Promise<CallbackResult> {
  try {
    const result = await handleXCallback(code, state, storedState, codeVerifier);

    if (!result.success) {
      let errorMessage = 'Authentication failed. Please try again.';
      switch (result.error) {
        case 'missing_cookies':
          errorMessage = 'Authentication session expired. Please try again.';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid authentication state. Please try again.';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange token with X.com. Please try again.';
          break;
        case 'user_info_failed':
          errorMessage = 'Failed to retrieve user information from X.com. Please try again.';
          break;
        case 'already_claimed':
          return { redirect: `/games?info=already_claimed` };
        case 'not_your_game':
          const gameSlug = result.gameSlug || (await cookies()).get('game_to_claim_slug')?.value;
          if (gameSlug) {
            return {
              redirect: `/games/${gameSlug}?error=not_your_game&developer=${encodeURIComponent(
                result.developerHandle || ''
              )}`,
            };
          }
          return { redirect: `/games?error=not_your_game` };
      }
      return { error: errorMessage };
    }

    const gameSlug = result.gameSlug || (await cookies()).get('game_to_claim_slug')?.value;
    if (gameSlug) {
      return {
        redirect: `/games/${gameSlug}?success=game-claimed&handle=${encodeURIComponent(
          result.xHandle || ''
        )}`,
      };
    }

    return {
      redirect: `/?auth=success&handle=${encodeURIComponent(result.xHandle || '')}`,
    };
  } catch (error) {
    console.error('Error processing callback:', error);
    return { 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication.' 
    };
  }
}

/**
 * Sets cookies for game claiming during the authentication flow
 * This should be called before redirecting to the Twitter auth page
 */
export async function setGameClaimCookies(gameId: string, gameSlug: string) {
  const cookieStore = await cookies();
  
  // Set cookies with game information to be used after authentication
  cookieStore.set("game_claim_id", gameId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  
  cookieStore.set("game_claim_slug", gameSlug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  
  return { success: true };
}

export async function claimGame(gameId: string, xId: string, xHandle: string): Promise<{ success: boolean; error?: string }> {
  try {
  //  console.log('Claiming game', { gameId, xId, xHandle });
    const supabase = createServerSupabaseClient();

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, title, claimed, developer_url')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game', { error: gameError.message });
      return { success: false, error: 'Game not found' };
    }

    // If the game is already claimed, check if it's claimed by the same developer
    if (game.claimed) {
     // console.log('Game already claimed, checking developer', { gameId, title: game.title });
      
      // Extract the handle from the developer URL
      const expectedHandle = extractHandleFromUrl(game.developer_url || '');
      
      // If the handles match, consider this a success (re-authentication)
      if (expectedHandle && expectedHandle.toLowerCase() === xHandle.toLowerCase()) {
       // console.log('Game already claimed by the same developer, updating timestamp', { gameId, xHandle });
        
        // Update the updated_at timestamp to show recent activity
        const { error: updateError } = await supabase
          .from('games')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', gameId);
          
        if (updateError) {
          console.error('Error updating timestamp', { error: updateError.message });
          // Not a critical error, still consider it a success
        }
        
        return { success: true };
      } else {
        console.error('Game already claimed by another developer', { gameId, title: game.title });
        return { success: false, error: 'already_claimed_by_another' };
      }
    }

    // If not claimed yet, claim it
    const { error: updateError } = await supabase
      .from('games')
      .update({ claimed: true })
      .eq('id', gameId);

    if (updateError) {
      console.error('Error updating game', { error: updateError.message });
      return { success: false, error: 'Failed to claim game' };
    }

   // console.log('Game claimed successfully', { gameId, xHandle });
    return { success: true };
  } catch (error) {
    console.error('Error claiming game', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

function extractHandleFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    let urlObj: URL = url.startsWith('http://') || url.startsWith('https://') ? new URL(url) : new URL(`https://${url}`);
    const path = urlObj.pathname.replace(/^\//, '');
    return path.split('/')[0] || null;
  } catch (error) {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    return match ? match[1] : null;
  }
}

export async function verifyAndClaimGame(gameId: string, gameSlug: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.xId || !session?.user?.xHandle) {
      return {
        success: false,
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("auth_failed")}`
      };
    }

    const xId = session.user.xId as string;
    const xHandle = session.user.xHandle as string;

    const supabase = createServerSupabaseClient();
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('developer_url, claimed')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return {
        success: false,
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("game_not_found")}`
      };
    }

    const developerUrl = game.developer_url || "";
    const expectedHandle = extractHandleFromUrl(developerUrl);
    
    if (!expectedHandle) {
      return {
        success: false,
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("invalid_developer_url")}`
      };
    }

    if (expectedHandle.toLowerCase() !== xHandle.toLowerCase()) {
      return {
        success: false,
        redirect: `/games/${gameSlug}?error=${encodeURIComponent("not_your_game")}`
      };
    }

    const claimResult = await claimGame(gameId, xId, xHandle);
    
    if (!claimResult.success) {
      if (claimResult.error === 'already_claimed_by_another') {
        return {
          success: false,
          redirect: `/games/${gameSlug}?error=${encodeURIComponent("already_claimed_by_another")}`
        };
      }
      return {
        success: false,
        redirect: `/games/${gameSlug}?error=${encodeURIComponent(claimResult.error || "update_failed")}`
      };
    }

    const { error: functionError } = await supabase.rpc('update_game_claimed_status', {
      game_id: gameId
    });

    if (functionError) {
      console.error('Error in update_game_claimed_status:', functionError);
    }

    // Store the developer status in a cookie for the session
    const cookieStore = await cookies();
    cookieStore.set('developer_for_game_id', gameId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax'
    });

    return {
      success: true,
      redirect: `/games/${gameSlug}?success=game-claimed`
    };
  } catch (error) {
    console.error('Error in verifyAndClaimGame:', error);
    return {
      success: false,
      redirect: `/games/${gameSlug}?error=${encodeURIComponent("unexpected_error")}`
    };
  }
}