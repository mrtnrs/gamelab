import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

export async function GET(request: NextRequest) {
  try {
    const state = 'hardcoded-state';
    const codeChallenge = 'hardcoded-challenge';

    const redirectUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=tweet.read+users.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('x_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10,
      path: '/',
    });
    response.cookies.set('x_code_verifier', 'hardcoded-verifier', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}