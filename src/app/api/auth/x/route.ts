import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const redirectUrl = 'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=X194VzJIMF9KUnd4OUNiZUZYZzg6MTpjaQ&redirect_uri=https://gamelab.fun/api/auth/x/callback&scope=tweet.read+users.read&state=hardcoded-state&code_challenge=hardcoded-challenge&code_challenge_method=plain';
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('x_auth_state', 'hardcoded-state', {
      httpOnly: true,
      secure: true, // Set to false if testing locally
      maxAge: 600, // 10 minutes
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('X auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
}}
