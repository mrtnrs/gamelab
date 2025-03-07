import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Generate a secure random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    
    // Use the verifier as the challenge with plain method for simplicity
    // In a production environment, you'd use S256 with proper hashing
    const codeChallenge = codeVerifier;
    
    // Get the redirect path from query parameters
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
    
    // Create response to redirect to Twitter OAuth
    const response = NextResponse.redirect(
      `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=tweet.read+users.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`
    );
    
    // Set the necessary cookies
    response.cookies.set('x_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });
    
    response.cookies.set('x_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });
    
    response.cookies.set('x_auth_redirect', redirectUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('X auth error:', error);
    
    // Return a more detailed error for debugging
    return NextResponse.json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : String(error),
      env: process.env.NODE_ENV
    }, { status: 500 });
  }
}