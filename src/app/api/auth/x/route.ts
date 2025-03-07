import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const redirectUrl = 'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://gamelab.fun/api/auth/x/callback&scope=tweet.read+users.read&state=hardcoded-state&code_challenge=hardcoded-challenge&code_challenge_method=plain';
  return NextResponse.redirect(redirectUrl);
}