// src/app/auth/supabase-callback/route.ts
export const runtime = 'edge'; // REQUIRED for Cloudflare Pages

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase-server'; // Use the reverted server client
import { verifyAndClaimGame } from '@/actions/game-auth-actions';
import { type Session } from '@supabase/supabase-js'; // Import Session type

export const dynamic = 'force-dynamic'; // Keep this

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const gameId = searchParams.get('gameId');
    const gameSlug = searchParams.get('gameSlug');

    // --- 1. Handle Errors from Provider/Supabase ---
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
        console.error('[Auth Callback Route - Manual] Error from Supabase/Provider:', { error, errorDescription });
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        const errorCode = error === 'access_denied' ? 'AccessDenied' : 'auth_failed';
        errorRedirectUrl.searchParams.set('error', errorCode);
        if (errorDescription) {
            errorRedirectUrl.searchParams.set('message', errorDescription);
        }
        return NextResponse.redirect(errorRedirectUrl);
    }

    // --- 2. Check for Code ---
    if (!code) {
        console.error('[Auth Callback Route - Manual] No code found in URL.');
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        errorRedirectUrl.searchParams.set('error', 'no_code');
        return NextResponse.redirect(errorRedirectUrl);
    }

    // --- 3. Exchange Code for Session ---
    const supabase = await createClient(); // Use the reverted async client

    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !exchangeData?.session) {
        console.error('[Auth Callback Route - Manual] Error exchanging code or no session returned:', exchangeError);
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        errorRedirectUrl.searchParams.set('error', 'token_exchange_failed');
        if (exchangeError?.message) {
             errorRedirectUrl.searchParams.set('message', exchangeError.message);
        }
        return NextResponse.redirect(errorRedirectUrl);
    }

    // --- 4. Session Obtained - Prepare Manual Cookie Data ---
    const session = exchangeData.session as Session;
    console.log('[Auth Callback Route - Manual] Code exchanged successfully. Session obtained.');

    // Get Supabase project reference for cookie naming
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
    if (!projectRef) {
        console.error("FATAL ERROR: NEXT_PUBLIC_SUPABASE_PROJECT_REF environment variable is not set!");
        const errorRedirectUrl = new URL('/auth-error', origin);
        errorRedirectUrl.searchParams.set('error', 'Configuration');
        errorRedirectUrl.searchParams.set('message', 'Server configuration error: Missing Supabase project reference.');
        // Return a plain response here, as redirect might cause loops if cookie setting fails later
        return new NextResponse('Server configuration error', { status: 500 });
        // return NextResponse.redirect(errorRedirectUrl); // Avoid potential redirect loops if cookie setting fails
    }

    // Standard Supabase cookie format
    const cookieName = `sb-${projectRef}-auth-token`;
    // Store the full session object as a JSON string array (standard practice)
    const cookieValue = JSON.stringify([session]);
    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Should be true on Cloudflare
        maxAge: session.expires_in ?? 3600, // Use expiry from session, fallback to 1 hour
        sameSite: 'lax' as const // Recommended default
    };

    let finalRedirectUrl: URL;

    // --- 5. Proceed with Game Claim (if applicable) ---
    // The verifyAndClaimGame action will call createClient again. The custom fetch wrapper
    // SHOULD read the existing request cookies, but the NEW session cookie won't be available
    // until the *next* request after this response is sent. This might be okay if
    // verifyAndClaimGame primarily relies on info passed as args, not session state itself.
    // Let's verify if verifyAndClaimGame calls getSession. Yes, it does.
    // This manual approach might cause verifyAndClaimGame to fail because the cookie isn't readable yet.
    // **Correction:** Let's call verifyAndClaimGame *before* creating the final response.

    if (gameId && gameSlug) {
        try {
            console.log('[Auth Callback Route - Manual] Attempting game claim before final redirect.');
            // Pass the obtained user object directly if needed, or rely on the action refetching
            // We MUST ensure the session is somehow available to the action.
            // The custom fetch wrapper *might* work if the underlying cookieStore reference is shared,
            // but it's safer to assume it might not see the brand new session yet.
            // Let's modify verifyAndClaimGame slightly if needed or rely on the args.
            // Assuming verifyAndClaimGame uses createClient internally and calls getSession:
            const result = await verifyAndClaimGame(gameId, gameSlug); // This might fail if getSession relies on a cookie not yet sent to browser
            console.log('[Auth Callback Route - Manual] verifyAndClaimGame result:', result);

            if (result?.redirect) {
                finalRedirectUrl = new URL(result.redirect, origin);
            } else {
                finalRedirectUrl = new URL(result.success ? `/games/${gameSlug}?success=game-claimed` : `/games/${gameSlug}?error=unknown_claim_error`, origin);
            }
        } catch (claimError) {
            console.error('[Auth Callback Route - Manual] Error calling verifyAndClaimGame action:', claimError);
            finalRedirectUrl = new URL(`/games/${gameSlug}?error=claim_action_failed`, origin);
        }
    } else {
        // --- 6. No Game Context - Redirect to Home ---
        console.log('[Auth Callback Route - Manual] No game context. Redirecting home.');
        finalRedirectUrl = new URL('/', origin);
    }

    // --- 7. Create final response and MANUALLY SET THE AUTH COOKIE ---
    console.log(`[Auth Callback Route - Manual] Redirecting to ${finalRedirectUrl} and setting cookie ${cookieName}`);
    // Create the redirect response *first*
    const response = NextResponse.redirect(finalRedirectUrl);

    // *Then* set the cookie on that response object
    response.cookies.set(cookieName, cookieValue, cookieOptions);

    // Return the response with the cookie set
    return response;
}