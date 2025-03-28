// src/app/auth/supabase-callback/page.tsx
'use client'; // VERY IMPORTANT: This must be a Client Component

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/utils/supabase-client'; // Use the browser client utility
import { verifyAndClaimGame } from '@/actions/game-auth-actions'; // Your server action

// Define expected shape of hash params
interface HashParams {
    access_token?: string;
    refresh_token?: string;
    expires_in?: string;
    token_type?: string;
    provider_token?: string; // X.com specific
    error?: string;
    error_description?: string;
}

export default function SupabaseCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // For query params like gameId, gameSlug
  const [status, setStatus] = useState<'initializing' | 'processing' | 'error' | 'success'>('initializing');
  const [message, setMessage] = useState<string>('Initializing authentication...');

  const handleCallback = useCallback(async () => {
    try {
      setMessage('Processing authentication callback...');

      // 1. Check for errors in query parameters (might be passed if initial redirect failed)
      const queryError = searchParams.get('error');
      const queryErrorDesc = searchParams.get('error_description');
      if (queryError) {
          console.error('Error in query params:', queryError, queryErrorDesc);
          setMessage(queryErrorDesc || queryError || 'Authentication failed.');
          setStatus('error');
          // Provide fallback for queryError
          setTimeout(() => router.replace(`/auth-error?error=${encodeURIComponent(queryError || 'unknown_query_error')}&message=${encodeURIComponent(queryErrorDesc || '')}`), 3000);
          return;
      }

      // 2. Parse the hash fragment
      const hash = window.location.hash.substring(1); // Remove the '#'
      const params = new URLSearchParams(hash);
      const hashData: HashParams = Object.fromEntries(params.entries());

      // 3. Check for errors in hash fragment
      if (hashData.error) {
          console.error('Error in URL hash:', hashData.error, hashData.error_description);
          setMessage(hashData.error_description || hashData.error || 'Authentication failed.');
          setStatus('error');
          // *** THIS IS THE CORRECTED LINE ***
          setTimeout(() => router.replace(`/auth-error?error=${encodeURIComponent(hashData.error || 'unknown_hash_error')}&message=${encodeURIComponent(hashData.error_description || '')}`), 3000);
          // *** END CORRECTION ***
          return;
      }

      // 4. Check for essential tokens
      if (!hashData.access_token || !hashData.refresh_token) {
          console.error('Missing tokens in URL hash:', hashData);
          setMessage('Authentication incomplete. Required tokens not found.');
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=missing_tokens'), 3000);
          return;
      }

      // 5. Set the session using the browser client
      const supabase = getSupabaseBrowserClient();
      const { error: sessionError } = await supabase.auth.setSession({
          access_token: hashData.access_token,
          refresh_token: hashData.refresh_token,
      });

      if (sessionError) {
          console.error('Error setting session:', sessionError);
          setMessage(`Failed to establish session: ${sessionError.message}`);
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=session_error'), 3000);
          return;
      }

      // --- Session is now set client-side ---
      console.log('Supabase session established client-side.');
      setStatus('processing');
      setMessage('Session established. Verifying game claim...');

      // 6. Get game context from query parameters
      const gameId = searchParams.get('gameId');
      const gameSlug = searchParams.get('gameSlug');

      // 7. Call the server action to verify and claim (if applicable)
      if (gameId && gameSlug) {
          const result = await verifyAndClaimGame(gameId, gameSlug);

          if (!result.success) {
              console.error('Game claim failed:', result.error);
              setMessage(result.error || 'Failed to claim the game.');
              setStatus('error');
              // Use redirect URL from action or construct one
              const redirectUrl = result.redirect || `/games/${gameSlug}?error=${encodeURIComponent(result.error || 'claim_failed')}`;
              setTimeout(() => router.replace(redirectUrl), 2000);
              return;
          }

          // Game claim successful
          console.log('Game claimed successfully via server action.');
          setMessage('Game claimed successfully!');
          setStatus('success');
          const successUrl = result.redirect || `/games/${gameSlug}?success=game-claimed`;
          // Redirect immediately on success
          router.replace(successUrl);
          return;

      } else {
          // No game context, just redirect home after setting session
          console.log('No game context found. Redirecting home.');
          setStatus('success');
          setMessage('Authentication successful.');
          router.replace('/');
          return;
      }

    } catch (error) {
      console.error('Unhandled error during callback processing:', error);
      setMessage(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error');
      setTimeout(() => router.replace('/auth-error?error=unexpected_callback_error'), 3000);
    }
  }, [router, searchParams]);

  useEffect(() => {
    // Run the callback logic once when the component mounts
    handleCallback();
  }, [handleCallback]); // Dependency array ensures it runs once

  // Render loading/status UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md border border-border text-center">
        <h1 className="text-2xl font-bold mb-6">
          {status === 'initializing' && 'Finalizing Authentication'}
          {status === 'processing' && 'Processing Request'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Error'}
        </h1>

        <div className="flex justify-center mb-6">
          {status === 'initializing' || status === 'processing' ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          ) : status === 'success' ? (
             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             </div>
          ) : ( // Error state
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          )}
        </div>

        <p className="text-muted-foreground">{message}</p>
        {(status === 'initializing' || status === 'processing') && <p className="text-sm text-muted-foreground mt-2">Please wait...</p>}
        {status === 'error' && <p className="text-sm text-muted-foreground mt-2">You will be redirected shortly.</p>}
      </div>
    </div>
  );
}