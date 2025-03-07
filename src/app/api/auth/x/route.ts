import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge';
// X.com OAuth configuration
// These would come from environment variables in production
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID
const CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`

// Helper function to generate random string
async function generateRandomString(length: number): Promise<string> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to create base64url encoded SHA-256 hash
async function createSHA256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  // Convert base64 to base64url format
  return hashBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Start X.com OAuth flow
export async function GET(request: NextRequest) {
  try {
    // Generate a random state for CSRF protection
    const state = await generateRandomString(16);
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = await generateRandomString(32);
    const codeChallenge = await createSHA256Hash(codeVerifier);
    
    // Store the state and code verifier in cookies
    const cookieStore = await cookies()
    
    await cookieStore.set('x_auth_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    })
    
    await cookieStore.set('x_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    })
    
    // Store the redirect URL after successful authentication
    const redirectUrl = request.nextUrl.searchParams.get('redirect')
    if (redirectUrl) {
      await cookieStore.set('x_auth_redirect', redirectUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/'
      })
    }
    
    // Build the X.com OAuth URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', CLIENT_ID || '')
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.append('scope', 'tweet.read users.read')
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')
    
    // Redirect to X.com for authentication
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Error starting X.com auth:', error)
    return NextResponse.json(
      { error: 'Failed to start authentication' },
      { status: 500 }
    )
  }
}
