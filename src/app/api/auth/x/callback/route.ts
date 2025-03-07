import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

// Handle X.com OAuth callback
export async function GET(request: NextRequest) {
  try {
    // Get the authorization code and state from the request
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');

    // Get the stored state, code verifier, and redirect URL from cookies
    const storedState = request.cookies.get('x_auth_state')?.value;
    const codeVerifier = request.cookies.get('x_code_verifier')?.value;
    const redirectUrl = request.cookies.get('x_auth_redirect')?.value || '/';

    // Check for missing cookies
    if (!storedState || !codeVerifier) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=missing_cookies`
      );
    }

    // Validate the state to prevent CSRF attacks
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=invalid_state`
      );
    }

    // Prepare the Authorization header using btoa (simplified from custom base64)
    const authBase64 = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

    // Exchange the code for an access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authBase64}`,
      },
      body: new URLSearchParams({
        code: code || '',
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Get the user information
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('User info error:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=user_info_failed`
      );
    }

    const userData = await userResponse.json();
    const xHandle = userData.data.username;

    // Validate and sanitize redirect URL (prevent open redirect vulnerabilities)
    const safeRedirectUrl = redirectUrl.startsWith('/') ? redirectUrl : '/';

    // Create response with redirect back to the app
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${safeRedirectUrl}`
    );

    // Set the X handle in a cookie
    response.cookies.set('x_handle', xHandle, {
      httpOnly: false, // Accessible to client-side code
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Check if we need to claim a game
    const gameToClaimId = request.cookies.get('game_to_claim')?.value;
    const gameToClaimSlug = request.cookies.get('game_to_claim_slug')?.value;

    if (gameToClaimId && gameToClaimSlug) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/claim-game?gameId=${gameToClaimId}&gameSlug=${gameToClaimSlug}`
      );
    }

    // Remove temporary cookies
    response.cookies.set('x_auth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('x_code_verifier', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('x_auth_redirect', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('X auth callback error:', error);
    const errorType = error instanceof Error ? error.message : 'unknown';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=${encodeURIComponent(errorType)}`
    );
  }
}