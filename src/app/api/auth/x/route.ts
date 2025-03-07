import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

// Custom base64 encoding function
function base64EncodeBytes(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  let i = 0;
  while (i < bytes.length) {
    const a = bytes[i++] || 0;
    const b = bytes[i++] || 0;
    const c = bytes[i++] || 0;
    base64 += chars[a >> 2];
    base64 += chars[((a & 3) << 4) | (b >> 4)];
    base64 += b !== 0 ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    base64 += c !== 0 ? chars[c & 63] : '=';
  }
  return base64;
}

// Base64 URL encoding without btoa
function base64URLEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const base64 = base64EncodeBytes(bytes);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper function to generate random string
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset.charAt(randomIndex);
  }
  return result;
}

// Start X.com OAuth flow
export async function GET(request: NextRequest) {
  try {
    // Generate state for CSRF protection
    const state = generateRandomString(32);
    
    // Generate code verifier for PKCE
    const codeVerifier = generateRandomString(64);
    
    // Generate code challenge using custom base64 encoding
    const codeChallenge = base64URLEncode(codeVerifier);
    
    // Get redirect path from query parameters or default to home
    const redirectPath = request.nextUrl.searchParams.get('redirect') || '/';
    
    // Create response with redirect to X.com OAuth
    const response = NextResponse.redirect(
      `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=tweet.read+users.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`
    );
    
    // Set cookies with state, code verifier, and redirect path
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
    
    if (redirectPath) {
      response.cookies.set('x_auth_redirect', redirectPath, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/'
      });
    }
    
    return response;
  } catch (error) {
    console.error('X auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}