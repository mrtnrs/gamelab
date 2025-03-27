// src/app/auth/supabase-callback/route.ts
export const runtime = 'edge'; 
import { type NextRequest, NextResponse } from 'next/server';
// cookies() is used internally by createClient (via @supabase/ssr), no need to import here
import { createClient } from '@/utils/supabase-server'; // Your UPDATED async server client using @supabase/ssr
import { verifyAndClaimGame } from '@/actions/game-auth-actions'; // Your existing action

export const dynamic = 'force-dynamic'; // Keep this to ensure it runs dynamically

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const gameId = searchParams.get('gameId');
    const gameSlug = searchParams.get('gameSlug');

    // --- 1. Handle Errors from Provider/Supabase ---
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
        console.error('[Auth Callback Route] Error from Supabase/Provider:', { error, errorDescription });
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        // Map specific errors if needed, e.g., access denied
        const errorCode = error === 'access_denied' ? 'AccessDenied' : 'auth_failed';
        errorRedirectUrl.searchParams.set('error', errorCode);
        if (errorDescription) {
            errorRedirectUrl.searchParams.set('message', errorDescription); // Optional: pass message
        }
        // Use NextResponse.redirect to perform the redirect
        return NextResponse.redirect(errorRedirectUrl);
    }

    // --- 2. Check for Code ---
    if (!code) {
        console.error('[Auth Callback Route] No code found in URL.');
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        errorRedirectUrl.searchParams.set('error', 'no_code');
        return NextResponse.redirect(errorRedirectUrl);
    }

    // --- 3. Exchange Code for Session ---
    // Use the updated async createClient. It uses @supabase/ssr and handles cookies internally.
    const supabase = await createClient(); // Needs await because createClient is now async

    // exchangeCodeForSession with the @supabase/ssr client will automatically handle
    // setting the necessary auth cookie(s) on the response via the options passed to createServerClient
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
        console.error('[Auth Callback Route] Error exchanging code for session:', exchangeError);
        const errorRedirectUrl = new URL(gameSlug ? `/games/${gameSlug}` : '/auth-error', origin);
        errorRedirectUrl.searchParams.set('error', 'token_exchange_failed'); // Use a specific error code
        if (exchangeError.message) {
            errorRedirectUrl.searchParams.set('message', exchangeError.message); // Optional
        }
        return NextResponse.redirect(errorRedirectUrl);
    }

    // --- 4. Code Exchange Successful - Session cookie is implicitly handled by @supabase/ssr ---
    console.log('[Auth Callback Route] Code exchanged successfully. Session established.');

    let finalRedirectUrl: URL;

    // --- 5. Proceed with Game Claim (if applicable) ---
    // verifyAndClaimGame will use the same async createClient. Since the auth cookie was set
    // by exchangeCodeForSession via @supabase/ssr's mechanisms, createClient will correctly
    // read it when called inside the action (within the same logical request context).
    if (gameId && gameSlug) {
        try {
            // Call your existing server action to handle the game claim logic
            const result = await verifyAndClaimGame(gameId, gameSlug);
            console.log('[Auth Callback Route] verifyAndClaimGame result:', result);

            // Use the redirect URL provided by the action
            if (result?.redirect) {
                finalRedirectUrl = new URL(result.redirect, origin);
            } else {
                // Fallback logic based on action's success status (should ideally not be needed if action always returns redirect)
                console.warn('[Auth Callback Route] verifyAndClaimGame did not return redirect. Using fallback.');
                finalRedirectUrl = new URL(result.success ? `/games/${gameSlug}?success=game-claimed` : `/games/${gameSlug}?error=unknown_claim_error`, origin);
            }
        } catch (claimError) {
            // Catch errors specifically from calling the action itself
            console.error('[Auth Callback Route] Error calling verifyAndClaimGame action:', claimError);
            finalRedirectUrl = new URL(`/games/${gameSlug}?error=claim_action_failed`, origin);
        }
    } else {
        // --- 6. No Game Context - Redirect to Default Location (e.g., Home) ---
        console.log('[Auth Callback Route] No game context. Redirecting home.');
        finalRedirectUrl = new URL('/', origin);
    }

    // --- 7. Redirect to the final destination ---
    // *** No manual cookie setting needed here! ***
    // NextResponse.redirect() will automatically include the cookies set by
    // the supabase client (due to the @supabase/ssr setup).
    console.log(`[Auth Callback Route] Redirecting to ${finalRedirectUrl}`);
    return NextResponse.redirect(finalRedirectUrl);
}