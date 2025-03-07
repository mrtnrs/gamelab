import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'crypto'

// X.com OAuth configuration
// These would come from environment variables in production
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID
const CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`

// Start X.com OAuth flow
export async function GET(request: NextRequest) {
  try {
    // Generate a random state for CSRF protection
    const state = randomBytes(16).toString('hex')
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = randomBytes(32).toString('hex')
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
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
