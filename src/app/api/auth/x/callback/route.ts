import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge';
// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID
const CLIENT_SECRET = process.env.X_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`

// Handle X.com OAuth callback
export async function GET(request: NextRequest) {
  try {
    // Get the authorization code and state from the request
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    
    // Get the stored state and code verifier from cookies
    const cookieStore = await cookies()
    const storedState = cookieStore.get('x_auth_state')?.value
    const codeVerifier = cookieStore.get('x_code_verifier')?.value
    const redirectUrl = cookieStore.get('x_auth_redirect')?.value || '/'
    
    // Validate the state to prevent CSRF attacks
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=invalid_state`
      )
    }
    
    // Exchange the code for an access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code: code || '',
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier || ''
      })
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=token_exchange_failed`
      )
    }
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    // Get the user's information
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      console.error('User info error:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=user_info_failed`
      )
    }
    
    const userData = await userResponse.json()
    const userId = userData.data.id
    const username = userData.data.username
    
    // Store the X.com handle in a cookie for the client
    await cookieStore.set('x_handle', username, {
      httpOnly: false, // Accessible from JavaScript
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 30, // 30 minutes
      path: '/'
    })
    
    // Clear the auth cookies
    await cookieStore.delete('x_auth_state')
    await cookieStore.delete('x_code_verifier')
    await cookieStore.delete('x_auth_redirect')
    
    // Check if we need to claim a game
    const gameToClaimId = request.cookies.get('game_to_claim')?.value
    const gameToClaimSlug = request.cookies.get('game_to_claim_slug')?.value
    
    if (gameToClaimId && gameToClaimSlug) {
      // Redirect to the claim-game API
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/api/claim-game?gameId=${gameToClaimId}&gameSlug=${gameToClaimSlug}`)
    }
    
    // Redirect back to the original page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}${redirectUrl}`)
  } catch (error) {
    console.error('Error in X.com callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth-error?error=unexpected_error`
    )
  }
}
