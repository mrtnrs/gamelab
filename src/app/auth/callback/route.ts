import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase-server';

export const runtime = 'edge';

/**
 * Handle the callback from Supabase auth
 * This route is hit after the user authenticates with Twitter
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the code from the URL and validate it exists
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    // Get other query parameters to pass along
    const gameId = requestUrl.searchParams.get('gameId');
    const gameSlug = requestUrl.searchParams.get('gameSlug');
    
    if (!code) {
      console.error('No code provided in callback');
      // Redirect to the error page
      return NextResponse.redirect(new URL('/auth-error?error=no_code', request.nextUrl.origin));
    }
    
    // Exchange the code for a session using server-side client
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL(`/auth-error?error=${encodeURIComponent(error.message || 'exchange_failed')}`, request.nextUrl.origin)
      );
    }
    
    // Construct the redirect URL
    let redirectTo = '/';
    
    // If we have game context, redirect to the game page
    if (gameId && gameSlug) {
      redirectTo = `/games/${gameSlug}`;
    }
    
    // Redirect to the final destination
    const finalUrl = new URL(redirectTo, request.nextUrl.origin);
    if (gameId) finalUrl.searchParams.set('gameId', gameId);
    
    return NextResponse.redirect(finalUrl);
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(
      new URL('/auth-error?error=unexpected', request.nextUrl.origin)
    );
  }
}
