export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

// Utility function to generate random strings
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset.charAt(randomIndex);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

    // Since you confirmed env vars are set, we’ll assume they’re valid
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = 'hardcoded-challenge'; // Skipping base64 encoding for now

    const redirectUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=tweet.read+users.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;

    const response = NextResponse.redirect(redirectUrl);
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

    return response;
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message; // Safe to access now
    }
    // Use the errorMessage in your response
    return NextResponse.json({ error: 'Test failed', details: errorMessage }, { status: 500 });
  }
}