import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  // Extract any query parameters if needed (e.g., for dynamic state)
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'hardcoded-state'; // CSRF protection

  // Construct the OAuth 2.0 authorize URL per X's documentation
  const redirectUrl = new URL('https://x.com/i/oauth2/authorize');
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_X_CLIENT_ID || '');
  redirectUrl.searchParams.set('redirect_uri', 'https://<your-domain>.pages.dev/api/auth/x/callback');
  redirectUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
  redirectUrl.searchParams.set('state', state);
  redirectUrl.searchParams.set('code_challenge', 'hardcoded-challenge'); // Replace with PKCE-generated value
  redirectUrl.searchParams.set('code_challenge_method', 'plain'); // Use 'S256' for production

  return NextResponse.redirect(redirectUrl.toString());
}