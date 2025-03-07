import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

// Simple function to generate random string for Edge compatibility
function generateRandomString(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    // Generate a simple random state for CSRF protection
    const state = generateRandomString(32);
    
    // For simplicity, we'll use the same string for verifier and challenge
    const codeVerifier = generateRandomString(64);
    const codeChallenge = codeVerifier;
    
    // Get redirect path
    const redirectPath = request.nextUrl.searchParams.get('redirect') || '/';
    
    // Build the OAuth URL manually to avoid any issues
    const authUrl = 'https://twitter.com/i/oauth2/authorize' +
      '?response_type=code' +
      '&client_id=' + encodeURIComponent(CLIENT_ID || '') +
      '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
      '&scope=' + encodeURIComponent('tweet.read users.read') +
      '&state=' + encodeURIComponent(state) +
      '&code_challenge=' + encodeURIComponent(codeChallenge) +
      '&code_challenge_method=plain';
    
    // Create response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Set cookies with minimal options
    response.cookies.set('x_auth_state', state, { 
      path: '/',
      maxAge: 600 // 10 minutes
    });
    
    response.cookies.set('x_code_verifier', codeVerifier, {
      path: '/',
      maxAge: 600 // 10 minutes
    });
    
    response.cookies.set('x_auth_redirect', redirectPath, {
      path: '/',
      maxAge: 600 // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('X auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}