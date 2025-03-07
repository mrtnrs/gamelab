import { NextResponse } from 'next/server';

export const runtime = 'edge';

const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = codeVerifier; // Simplified for now; use a hash in production

    const redirectUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=tweet.read+users.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
    const response = NextResponse.redirect(redirectUrl);
    
    response.cookies.set('x_auth_state', state); // Minimal options
    response.cookies.set('x_code_verifier', codeVerifier); // Minimal options
    
    return response;
  } catch (error) {
    console.error('X auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
}}

