import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge';

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID
const CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`

// Helper function to generate random string
function generateRandomString(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Simple base64 encoding function
function base64encode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Start X.com OAuth flow
export async function GET(request: NextRequest) {
  try {
    // Generate a random state for CSRF protection
    const state = generateRandomString(32);
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = generateRandomString(64);
    const codeChallenge = base64encode(codeVerifier);
    
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
    
    // Validate and construct redirect URL
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const redirectUrl = redirectParam && redirectParam.startsWith('/') 
      ? redirectParam
      : '/';

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
    authUrl.searchParams.append('code_challenge_method', 'plain')
    
    // Redirect to X.com for authentication
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Error starting X.com auth:', {
      error,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      clientId: CLIENT_ID ? 'present' : 'missing',
      redirectUri: REDIRECT_URI
    });
    return NextResponse.json(
      { error: 'Failed to start authentication' },
      { status: 500 }
    )
  }
}
