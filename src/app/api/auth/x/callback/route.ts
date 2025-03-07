import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

// Web API base64 encoding function for Edge compatibility
function base64Encode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Handle X.com OAuth callback
export async function GET(request: NextRequest) {
  try {
    // Get authorization code and state from the request
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    
    // Get stored values from cookies
    const storedState = request.cookies.get('x_auth_state')?.value;
    const codeVerifier = request.cookies.get('x_code_verifier')?.value;
    const redirectUrl = request.cookies.get('x_auth_redirect')?.value || '/';
    
    // Validation checks
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=missing_parameters`
      );
    }
    
    if (!storedState || !codeVerifier) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=missing_cookies`
      );
    }
    
    if (state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=invalid_state`
      );
    }
    
    // Create Basic auth header using web API
    const authBase64 = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    
    // Exchange code for token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authBase64}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      }).toString()
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=token_exchange_failed`
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info error:', errorText);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=user_info_failed`
      );
    }
    
    const userData = await userResponse.json();
    const xHandle = userData.data.username;
    
    // Sanitize the redirect URL
    const safeRedirectUrl = redirectUrl.startsWith('/') ? redirectUrl : '/';
    
    // Create redirect response
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${safeRedirectUrl}`
    );
    
    // Set X handle cookie
    response.cookies.set('x_handle', xHandle, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Check for game claiming
    const gameToClaimId = request.cookies.get('game_to_claim')?.value;
    const gameToClaimSlug = request.cookies.get('game_to_claim_slug')?.value;
    
    if (gameToClaimId && gameToClaimSlug) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/claim-game?gameId=${gameToClaimId}&gameSlug=${gameToClaimSlug}`
      );
    }
    
    // Clear auth cookies
    response.cookies.set('x_auth_state', '', { path: '/', maxAge: 0 });
    response.cookies.set('x_code_verifier', '', { path: '/', maxAge: 0 });
    response.cookies.set('x_auth_redirect', '', { path: '/', maxAge: 0 });
    
    return response;
  } catch (error) {
    console.error('X auth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=unexpected_error`
    );
  }
}