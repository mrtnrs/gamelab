// src/app/auth/supabase-callback/route.ts
export const runtime = 'edge'; // REQUIRED for Cloudflare Pages

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase-server'; // Use the manual fetch wrapper client
import { verifyAndClaimGame } from '@/actions/game-auth-actions';
import { type Session } from '@supabase/supabase-js'; // Import Session type

export const dynamic = 'force-dynamic'; // Keep this

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const gameId = searchParams.get('gameId');
    const gameSlug = searchParams.get('gameSlug');

    // --- 1. Handle Errors from Provider/Supabase (if sent in query) ---
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
    // THIS IS WHERE THE PREVIOUS LOGIC FAILED when expecting hash tokens
    if (!code) {
        console.error('[Auth Callback Route - Manual] No code found in URL. SearchParams:', searchParams.toString());
        // This is the path that was likely *incorrectly* taken before
        // Now, if Supabase sends code=..., this check should PASS.
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        errorRedirectUrl.searchParams.set('error', 'no_code');
        return NextResponse.redirect(errorRedirectUrl);
    }

    console.log('[Auth Callback Route - Manual] Found code:', code);

    // --- 3. Exchange Code for Session ---
    const supabase = await createClient(); // Use the manual fetch wrapper client

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

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
    if (!projectRef) {
        console.error("FATAL ERROR: NEXT_PUBLIC_SUPABASE_PROJECT_REF environment variable is not set!");
        // Return a plain response to avoid potential redirect loops if cookie setting fails
        return new NextResponse('Server configuration error', { status: 500 });
    }

    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = JSON.stringify([session]); // Standard format [Session]
    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: session.expires_in ?? 3600,
        sameSite: 'lax' as const
    };

    let finalRedirectUrl: URL;

    // --- 5. Proceed with Game Claim (if applicable) ---
    if (gameId && gameSlug) {
        try {
            console.log('[Auth Callback Route - Manual] Attempting game claim before final redirect.');
            // IMPORTANT: We need to ensure verifyAndClaimGame can access the session.
            // Since the cookie is being set on the *response*, getSession within the action might fail.
            // Consider refactoring verifyAndClaimGame to accept the user object if this step fails.
            const result = await verifyAndClaimGame(gameId, gameSlug);
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
    const response = NextResponse.redirect(finalRedirectUrl);
    response.cookies.set(cookieName, cookieValue, cookieOptions);
    return response;
}