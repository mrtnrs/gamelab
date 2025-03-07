
import { NextResponse, NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = Math.random().toString(36).substring(2); // Dynamic state for CSRF



  const redirectUrl = new URL('https://x.com/i/oauth2/authorize');
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_X_CLIENT_ID || '');
  redirectUrl.searchParams.set('redirect_uri', 'https://gamelab.fun/api/auth/x/callback');
  redirectUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
  redirectUrl.searchParams.set('state', state);
  redirectUrl.searchParams.set('code_challenge', 'challenge'); // Generate PKCE challenge
  redirectUrl.searchParams.set('code_challenge_method', 'plain'); // Use 'S256' in production

  return NextResponse.redirect(redirectUrl.toString());
}