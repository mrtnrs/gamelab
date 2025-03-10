// src/actions/auth-actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { setTimeout } from 'timers/promises';

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

// Helper function to generate a random string
function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Helper function to create a SHA-256 hash and base64url encode it
function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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

  console.log('Starting X.com authentication', { gameId, gameSlug });

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
  console.log('Cookies set', {
    x_auth_state: fullState.substring(0, 20) + '...',
    x_code_verifier: codeVerifier.substring(0, 20) + '...',
  });

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
  console.log('Redirecting to X.com auth URL', { authUrl: authUrl.substring(0, 100) + '...' });
  redirect(authUrl);
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

  console.log('Starting token exchange', { code: code.substring(0, 10) + '...', redirectUri });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Token exchange attempt ${attempt} of ${retries}`);
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
        await setTimeout(delay);
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
      console.log('Token exchange successful', {
        accessToken: tokenData.access_token.substring(0, 10) + '...',
        tokenType: tokenData.token_type,
      });
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

export async function handleXCallback(code: string, state: string): Promise<AuthResult> {
  try {
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;
    const cookieStore = await cookies();
    const storedStateCookie = cookieStore.get('x_auth_state')?.value;
    const storedCodeVerifier = cookieStore.get('x_code_verifier')?.value;

    console.log('Handling callback', {
      code: code.substring(0, 10) + '...',
      state: state.substring(0, 20) + '...',
    });
    console.log('Stored cookies', {
      x_auth_state: storedStateCookie?.substring(0, 20) + '...',
      x_code_verifier: storedCodeVerifier?.substring(0, 20) + '...',
    });

    if (!storedCodeVerifier || !storedStateCookie) {
      console.error('Missing required cookies', { storedStateCookie, storedCodeVerifier });
      return { success: false, error: 'missing_cookies' };
    }

    if (storedStateCookie !== state) {
      console.error('State validation failed', { receivedState: state, storedState: storedStateCookie });
      return { success: false, error: 'invalid_state' };
    }

    const [, gameId, gameSlug] = state.split('|');
    console.log('Parsed state', { gameId, gameSlug });

    console.log('Initiating token exchange');
    const tokenData = await exchangeTokenWithRetry(code, storedCodeVerifier, REDIRECT_URI);

    console.log('Fetching user info from X.com');
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info retrieval failed', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        errorText,
      });
      return { success: false, error: 'user_info_failed', userInfoError: errorText };
    }

    const userData = await userResponse.json();
    console.log('User info retrieved', { userId: userData.data.id, username: userData.data.username });

    const xId = userData.data.id;
    const xHandle = userData.data.username;

    if (gameId && gameSlug) {
      console.log('Attempting to claim game', { gameId, gameSlug, xHandle });
      const claimResult = await claimGame(gameId, xId, xHandle);
      if (!claimResult.success) {
        console.error('Game claim failed', { error: claimResult.error });
        return { success: false, error: claimResult.error, gameSlug };
      }
      console.log('Game claimed successfully');
      return { success: true, xHandle, gameSlug };
    }

    console.log('Authentication completed successfully', { xHandle });
    return { success: true, xHandle };
  } catch (error) {
    console.error('Error in handleXCallback', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { success: false, error: 'callback_exception' };
  }
}

export async function processCallback(code: string, state: string): Promise<CallbackResult> {
  try {
    console.log('Processing callback', { code: code.substring(0, 10) + '...', state: state.substring(0, 20) + '...' });
    const result = await handleXCallback(code, state);

    if (!result.success) {
      let errorMessage = 'Authentication failed. Please try again.';
      let errorType = result.error || 'unknown_error';
      let errorDetails: any = {
        originalError: result.error,
        timestamp: new Date().toISOString(),
        code: code.substring(0, 10) + '...',
        state: state.substring(0, 20) + '...',
      };

      console.error('Callback processing failed', { errorType, errorDetails });

      switch (result.error) {
        case 'missing_cookies':
          errorMessage = 'Authentication session expired. Please try again.';
          errorDetails.cookieInfo = 'Required cookies for authentication were not found';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid authentication state. Please try again.';
          errorDetails.stateInfo = 'The state parameter did not match the expected value';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange token with X.com. Please try again.';
          errorDetails.tokenInfo = result.tokenError || 'Unknown token exchange error';
          break;
        case 'user_info_failed':
          errorMessage = 'Failed to retrieve user information from X.com. Please try again.';
          errorDetails.userInfoError = result.userInfoError || 'Unknown user info error';
          break;
        case 'already_claimed':
          return { redirect: `/games?info=already_claimed`, errorType, errorDetails };
        case 'not_your_game':
          errorDetails.gameSlug = result.gameSlug;
          errorDetails.developerHandle = result.developerHandle;
          if (result.gameSlug) {
            return {
              redirect: `/games/${result.gameSlug}?error=not_your_game&developer=${encodeURIComponent(result.developerHandle || '')}`,
              errorType,
              errorDetails,
            };
          }
          return { redirect: `/games?error=not_your_game`, errorType, errorDetails };
      }

      return { error: errorMessage, errorType, errorDetails };
    }

    const gameSlug = result.gameSlug || (await cookies()).get('game_to_claim_slug')?.value;
    const redirectUrl = gameSlug
      ? `/games/${gameSlug}?success=game-claimed&handle=${encodeURIComponent(result.xHandle || '')}`
      : `/?auth=success&handle=${encodeURIComponent(result.xHandle || '')}`;
    console.log('Callback processed successfully, redirecting', { redirectUrl });
    return { redirect: redirectUrl };
  } catch (error) {
    console.error('Error processing callback', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString(),
      code: code.substring(0, 10) + '...',
      state: state.substring(0, 20) + '...',
    };
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication.',
      errorType: 'callback_exception',
      errorDetails,
    };
  }
}

export async function claimGame(gameId: string, xId: string, xHandle: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Claiming game', { gameId, xId, xHandle });
    const supabase = createServerSupabaseClient();

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, title, claimed')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game', { error: gameError.message });
      return { success: false, error: 'Game not found' };
    }

    if (game.claimed) {
      console.error('Game already claimed', { gameId, title: game.title });
      return { success: false, error: 'already_claimed' };
    }

    const { error: updateError } = await supabase
      .from('games')
      .update({ claimed: true, developer_handle: xHandle, updated_at: new Date().toISOString() })
      .eq('id', gameId);

    if (updateError) {
      console.error('Error updating game', { error: updateError.message });
      return { success: false, error: 'Failed to claim game' };
    }

    console.log('Game claimed successfully', { gameId, xHandle });
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

// // src/actions/auth-actions.ts
// 'use server';

// import { cookies } from 'next/headers';
// import { redirect } from 'next/navigation';
// import { createClient } from '@supabase/supabase-js';
// import crypto from 'crypto';
// import { setTimeout } from 'timers/promises';

// // Create a Supabase client with the service role key (server-side only)
// const createServerSupabaseClient = () => {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
//   const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

//   if (!supabaseUrl || !supabaseServiceKey) {
//     throw new Error('Supabase URL or service key is not configured');
//   }

//   return createClient(supabaseUrl, supabaseServiceKey, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//     },
//   });
// };

// // Helper function to generate a random string
// function generateRandomString(length: number): string {
//   return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
// }

// // Helper function to create a SHA-256 hash and base64url encode it
// function generateCodeChallenge(verifier: string): string {
//   const hash = crypto.createHash('sha256').update(verifier).digest();
//   return hash
//     .toString('base64')
//     .replace(/\+/g, '-')
//     .replace(/\//g, '_')
//     .replace(/=+$/, '');
// }

// export type AuthResult = {
//   success: boolean;
//   xHandle?: string;
//   error?: string;
//   gameSlug?: string;
//   developerHandle?: string;
//   tokenError?: string;
//   userInfoError?: string;
// };

// // interface AuthResult {
// //   success: boolean;
// //   xHandle?: string;
// //   gameSlug?: string;
// //   error?: string;
// //   userInfoError?: string;
// // }

// export type CallbackResult = {
//   error?: string;
//   redirect?: string;
//   errorDetails?: any;
//   errorType?: string;
// };

// export async function startXAuth(gameId: string, gameSlug: string) {
//   const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
//   const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;

//   if (!CLIENT_ID) {
//     throw new Error('X.com client ID is not configured');
//   }

//   // Generate random state and codeVerifier
//   const state = generateRandomString(32);
//   const codeVerifier = generateRandomString(64);
//   const codeChallenge = generateCodeChallenge(codeVerifier);

//   // Define cookie options
//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 60 * 30, // 30 minutes
//     path: '/',
//     sameSite: 'lax' as const,
//   };

//   // Store the full state (including gameId and gameSlug)
//   const fullState = `${state}|${gameId}|${gameSlug}`;
//   const cookieStore = await cookies();
//   cookieStore.set('x_auth_state', fullState, cookieOptions);
//   cookieStore.set('x_code_verifier', codeVerifier, cookieOptions);

//   // Construct the authorization URL
//   const params = new URLSearchParams({
//     response_type: 'code',
//     client_id: CLIENT_ID,
//     redirect_uri: REDIRECT_URI,
//     scope: 'tweet.read users.read',
//     state: fullState,
//     code_challenge: codeChallenge,
//     code_challenge_method: 'S256',
//   });

//   const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
//   redirect(authUrl);
// }

// /**
//  * Start X.com authentication flow
//  */
// // export async function startXAuth(gameId: string, gameSlug: string) {
// //   const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
// //   const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;

// //   if (!CLIENT_ID) {
// //     throw new Error('X.com client ID is not configured');
// //   }

// //   const state = generateRandomString(32);
// //   const codeVerifier = generateRandomString(64);
// //   const codeChallenge = generateCodeChallenge(codeVerifier);

// //   const cookieOptions = {
// //     httpOnly: true,
// //     secure: process.env.NODE_ENV === 'production',
// //     maxAge: 60 * 30, // Increased to 30 minutes to prevent expiration
// //     path: '/',
// //     sameSite: 'lax' as const,
// //   };

// //   // Get the cookies store and await it
// //   const cookieStore = await cookies();
  
// //   // Set cookies using the resolved cookie store
// //   cookieStore.set('x_auth_state', state, cookieOptions);
// //   cookieStore.set('x_code_verifier', codeVerifier, cookieOptions);

// //   if (gameId && gameSlug) {
// //     cookieStore.set('game_to_claim', gameId, cookieOptions);
// //     cookieStore.set('game_to_claim_slug', gameSlug, cookieOptions);
// //   }

// //   const params = new URLSearchParams({
// //     response_type: 'code',
// //     client_id: CLIENT_ID,
// //     redirect_uri: REDIRECT_URI,
// //     scope: 'tweet.read users.read',
// //     state,
// //     code_challenge: codeChallenge,
// //     code_challenge_method: 'S256',
// //   });

// //   const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
// //   redirect(authUrl);
// // }


// /**
//  * Exchange token with retry logic for rate limiting
//  */
// async function exchangeTokenWithRetry(
//   code: string,
//   codeVerifier: string,
//   redirectUri: string,
//   retries: number = 3
// ) {
//   const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
//   const CLIENT_SECRET = process.env.X_CLIENT_SECRET;

//   if (!CLIENT_ID || !CLIENT_SECRET) {
//     throw new Error('X.com client credentials are not configured');
//   }

//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       const response = await fetch('https://api.twitter.com/2/oauth2/token', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
//         },
//         body: new URLSearchParams({
//           code,
//           grant_type: 'authorization_code',
//           redirect_uri: redirectUri,
//           code_verifier: codeVerifier,
//         }).toString(),
//       });

//       if (response.status === 429) {
//         const delay = 1000 * Math.pow(2, attempt);
//         console.log(`Rate limited, retrying in ${delay}ms...`);
//         await setTimeout(delay);
//         continue;
//       }

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Token exchange error:', errorText);
//         throw new Error('token_exchange_failed');
//       }

//       return await response.json();
//     } catch (error) {
//       console.error(`Token exchange attempt ${attempt} failed:`, error);
//       if (attempt === retries) throw error;
//     }
//   }
// }

// /**
//  * Handle X.com OAuth callback
//  */
// // export async function handleXCallback(code: string, state: string): Promise<AuthResult> {
// //   try {
// //     // Parse state to extract original state, gameId, and gameSlug
// //     const [storedState, gameId, gameSlug] = state.split('|');
// //     if (!storedState) {
// //       console.error('Invalid state format:', state);
// //       return { success: false, error: 'invalid_state' };
// //     }

// //     // Retrieve codeVerifier and state from cookies
// //     const cookieStore = await cookies();
// //     const storedCodeVerifier = cookieStore.get('x_code_verifier')?.value;
// //     const storedStateCookie = cookieStore.get('x_auth_state')?.value;

// //     // Validate cookies and state
// //     if (!storedCodeVerifier || !storedStateCookie) {
// //       console.error('Missing cookies:', { storedCodeVerifier, storedStateCookie });
// //       return { success: false, error: 'missing_cookies' };
// //     }

// //     if (storedStateCookie !== storedState) {
// //       console.error('State mismatch:', { storedStateCookie, storedState });
// //       return { success: false, error: 'invalid_state' };
// //     }

// //     // Exchange code for tokens
// //     const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/x-www-form-urlencoded',
// //         Authorization: `Basic ${Buffer.from(
// //           `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
// //         ).toString('base64')}`,
// //       },
// //       body: new URLSearchParams({
// //         code,
// //         grant_type: 'authorization_code',
// //         client_id: process.env.TWITTER_CLIENT_ID || '',
// //         redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
// //         code_verifier: storedCodeVerifier,
// //       }).toString(),
// //     });

// //     if (!tokenResponse.ok) {
// //       const errorText = await tokenResponse.text();
// //       let tokenError;
// //       try {
// //         // Try to parse the error as JSON
// //         tokenError = JSON.parse(errorText);
// //       } catch (e) {
// //         // If it's not valid JSON, use the raw text
// //         tokenError = errorText;
// //       }
      
// //       console.error('Token exchange error:', tokenError);
// //       return { 
// //         success: false, 
// //         error: 'token_exchange_failed',
// //         tokenError: typeof tokenError === 'object' ? JSON.stringify(tokenError) : String(tokenError)
// //       };
// //     }

// //     const tokenData = await tokenResponse.json();
// //     const accessToken = tokenData.access_token;

// //     // Get user info
// //     const userResponse = await fetch('https://api.twitter.com/2/users/me', {
// //       headers: {
// //         Authorization: `Bearer ${accessToken}`,
// //       },
// //     });

// //     if (!userResponse.ok) {
// //       const errorText = await userResponse.text();
// //       console.error('User info error:', errorText);
// //       return { success: false, error: 'user_info_failed', userInfoError: errorText };
// //     }

// //     const userData = await userResponse.json();
// //     const xId = userData.data.id;
// //     const xHandle = userData.data.username;

// //     // If gameId is provided, attempt to claim the game
// //     if (gameId && gameSlug) {
// //       const claimResult = await claimGame(gameId, xId, xHandle);
      
// //       if (!claimResult.success) {
// //         console.error('Game claim error:', claimResult.error);
// //         return {
// //           success: false,
// //           error: claimResult.error,
// //           gameSlug,
// //         };
// //       }
      
// //       return {
// //         success: true,
// //         xHandle,
// //         gameSlug,
// //       };
// //     }

// //     return {
// //       success: true,
// //       xHandle,
// //     };
// //   } catch (error) {
// //     console.error('Error in handleXCallback:', error);
// //     return { 
// //       success: false, 
// //       error: error instanceof Error ? error.name : 'unknown_error',
// //     };
// //   }
// // }

// export async function handleXCallback(code: string, state: string): Promise<AuthResult> {
//   try {
//     const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;
//     const cookieStore = await cookies();
//     const storedStateCookie = cookieStore.get('x_auth_state')?.value;
//     const storedCodeVerifier = cookieStore.get('x_code_verifier')?.value;

//     // Log for debugging
//     console.log('Callback received:', { code: code?.substring(0, 10) + '...', state });

//     // Validate cookies
//     if (!storedCodeVerifier || !storedStateCookie) {
//       console.error('Missing required cookies:', { storedStateCookie, storedCodeVerifier });
//       return { success: false, error: 'missing_cookies' };
//     }

//     // Validate state
//     if (storedStateCookie !== state) {
//       console.error('State validation failed:', { receivedState: state, storedState: storedStateCookie });
//       return { success: false, error: 'invalid_state' };
//     }

//     // Extract gameId and gameSlug from state
//     const [, gameId, gameSlug] = state.split('|');

//     // Exchange code for access token
//     const tokenData = await exchangeTokenWithRetry(code, storedCodeVerifier, REDIRECT_URI);

//     // Fetch user information
//     const userResponse = await fetch('https://api.twitter.com/2/users/me', {
//       headers: {
//         Authorization: `Bearer ${tokenData.access_token}`,
//       },
//     });

//     if (!userResponse.ok) {
//       const errorText = await userResponse.text();
//       console.error('User info error:', errorText);
//       return { success: false, error: 'user_info_failed', userInfoError: errorText };
//     }

//     const userData = await userResponse.json();
//     const xId = userData.data.id;
//     const xHandle = userData.data.username;

//     // Claim game if applicable
//     if (gameId && gameSlug) {
//       const claimResult = await claimGame(gameId, xId, xHandle);
//       if (!claimResult.success) {
//         console.error('Game claim error:', claimResult.error);
//         return { success: false, error: claimResult.error, gameSlug };
//       }
//       return { success: true, xHandle, gameSlug };
//     }

//     return { success: true, xHandle };
//   } catch (error) {
//     console.error('Error in handleXCallback:', error);
//     return { success: false, error: 'callback_exception' };
//   }
// }

// /**
//  * Process the OAuth callback
//  */
// export async function processCallback(code: string, state: string): Promise<CallbackResult> {
//   try {
//     const result = await handleXCallback(code, state);

//     if (!result.success) {
//       let errorMessage = 'Authentication failed. Please try again.';
//       let errorType = result.error || 'unknown_error';
//       let errorDetails: any = { 
//         originalError: result.error,
//         timestamp: new Date().toISOString(),
//         code: code ? `${code.substring(0, 10)}...` : 'Missing',
//         state: state ? `${state.substring(0, 10)}...` : 'Missing',
//       };

//       switch (result.error) {
//         case 'missing_cookies':
//           errorMessage = 'Authentication session expired. Please try again.';
//           errorDetails.cookieInfo = 'Required cookies for authentication were not found';
//           break;
//         case 'invalid_state':
//           errorMessage = 'Invalid authentication state. Please try again.';
//           errorDetails.stateInfo = 'The state parameter did not match the expected value';
//           break;
//         case 'token_exchange_failed':
//           errorMessage = 'Failed to exchange token with X.com. Please try again.';
//           errorDetails.tokenInfo = result.tokenError || 'Unknown token exchange error';
//           break;
//         case 'user_info_failed':
//           errorMessage = 'Failed to retrieve user information from X.com. Please try again.';
//           errorDetails.userInfoError = result.userInfoError || 'Unknown user info error';
//           break;
//         case 'already_claimed':
//           return { 
//             redirect: `/games?info=already_claimed`,
//             errorType,
//             errorDetails
//           };
//         case 'not_your_game':
//           const gameSlug = result.gameSlug || (await cookies()).get('game_to_claim_slug')?.value;
//           errorDetails.gameSlug = gameSlug;
//           errorDetails.developerHandle = result.developerHandle;
          
//           if (gameSlug) {
//             return {
//               redirect: `/games/${gameSlug}?error=not_your_game&developer=${encodeURIComponent(
//                 result.developerHandle || ''
//               )}`,
//               errorType,
//               errorDetails
//             };
//           }
//           return { 
//             redirect: `/games?error=not_your_game`,
//             errorType,
//             errorDetails
//           };
//       }

//       return { 
//         error: errorMessage,
//         errorType,
//         errorDetails
//       };
//     }

//     const gameSlug = result.gameSlug || (await cookies()).get('game_to_claim_slug')?.value;
//     if (gameSlug) {
//       return {
//         redirect: `/games/${gameSlug}?success=game-claimed&handle=${encodeURIComponent(
//           result.xHandle || ''
//         )}`,
//       };
//     }

//     return {
//       redirect: `/?auth=success&handle=${encodeURIComponent(result.xHandle || '')}`,
//     };
//   } catch (error) {
//     console.error('Error processing callback:', error);
    
//     // Create detailed error information
//     const errorDetails = {
//       message: error instanceof Error ? error.message : String(error),
//       stack: error instanceof Error ? error.stack : undefined,
//       name: error instanceof Error ? error.name : 'Unknown',
//       timestamp: new Date().toISOString(),
//       code: code ? `${code.substring(0, 10)}...` : 'Missing',
//       state: state ? `${state.substring(0, 10)}...` : 'Missing'
//     };
    
//     return { 
//       error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication.',
//       errorType: error instanceof Error ? error.name : 'UnknownError',
//       errorDetails
//     };
//   }
// }

// /**
//  * Claim a game as the developer
//  */
// export async function claimGame(
//   gameId: string,
//   xHandle: string,
//   gameSlug: string
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     console.log(`Attempting to claim game ${gameId} for developer ${xHandle}`);
    
//     // Use the service role client for administrative operations
//     const supabase = createServerSupabaseClient();
    
//     // First, check if the game exists and is not already claimed
//     const { data: game, error: gameError } = await supabase
//       .from('games')
//       .select('id, title, claimed')
//       .eq('id', gameId)
//       .single();
    
//     if (gameError) {
//       console.error('Error fetching game:', gameError);
//       return { success: false, error: 'Game not found' };
//     }
    
//     if (game.claimed) {
//       console.error('Game already claimed:', game);
//       return { success: false, error: 'This game has already been claimed by a developer' };
//     }
    
//     // Update the game's claimed status and developer handle
//     const { error: updateError } = await supabase
//       .from('games')
//       .update({
//         claimed: true,
//         developer_handle: xHandle,
//         updated_at: new Date().toISOString(),
//       })
//       .eq('id', gameId);
    
//     if (updateError) {
//       console.error('Error updating game:', updateError);
//       return { success: false, error: 'Failed to claim game' };
//     }
    
//     // As a backup, also call the direct database function to ensure claimed status is set
//     const { error: functionError } = await supabase.rpc('update_game_claimed_status', {
//       p_game_id: gameId,
//       p_developer_handle: xHandle
//     });
    
//     if (functionError) {
//       console.error('Error calling update function:', functionError);
//       // Don't return error here, as the previous update might have succeeded
//     }
    
//     console.log(`Successfully claimed game ${gameId} for developer ${xHandle}`);
//     return { success: true };
//   } catch (error) {
//     console.error('Error claiming game:', error);
//     return { 
//       success: false, 
//       error: error instanceof Error ? error.message : 'An unexpected error occurred' 
//     };
//   }
// }

// /**
//  * Extract X handle from URL
//  */
// function extractHandleFromUrl(url: string): string | null {
//   if (!url) return null;

//   try {
//     let urlObj: URL;
//     if (!url.startsWith('http://') && !url.startsWith('https://')) {
//       urlObj = new URL(`https://${url}`);
//     } else {
//       urlObj = new URL(url);
//     }
//     const path = urlObj.pathname.replace(/^\//, '');
//     return path.split('/')[0] || null;
//   } catch (error) {
//     const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
//     return match ? match[1] : null;
//   }
// }