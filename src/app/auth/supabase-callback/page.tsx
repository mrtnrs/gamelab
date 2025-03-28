// src/app/auth/supabase-callback/page.tsx
'use client'; // VERY IMPORTANT: This must be a Client Component

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/utils/supabase-client'; // Use the browser client utility
import { verifyAndClaimGame } from '@/actions/game-auth-actions'; // Your server action

// Define expected shape of hash params from Implicit Grant flow
interface HashParams {
    access_token?: string;
    refresh_token?: string;
    expires_in?: string;
    token_type?: string;
    provider_token?: string; // X.com specific
    error?: string;            // Error code if auth failed
    error_description?: string; // Error description if auth failed
}

export default function SupabaseCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // For reading query params like gameId, gameSlug
  const [status, setStatus] = useState<'initializing' | 'processing' | 'error' | 'success'>('initializing');
  const [message, setMessage] = useState<string>('Initializing authentication...');

  const handleCallback = useCallback(async () => {
    try {
      setMessage('Processing authentication callback...');
      console.log("Callback page loaded. Current URL:", window.location.href); // Log entry point

      // 1. Check for errors in query parameters (less likely now, but good practice)
      const queryError = searchParams.get('error');
      const queryErrorDesc = searchParams.get('error_description');
      if (queryError) {
          console.error('Error found in query parameters:', { queryError, queryErrorDesc });
          setMessage(queryErrorDesc || queryError || 'Authentication failed early.');
          setStatus('error');
          const queryErrorCode = queryError ? encodeURIComponent(queryError) : 'unknown_query_error';
          const queryErrorMessage = encodeURIComponent(queryErrorDesc || '');
          setTimeout(() => router.replace(`/auth-error?error=${queryErrorCode}&message=${queryErrorMessage}`), 3000);
          return;
      }

      // 2. Parse the hash fragment (#) where tokens should be
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const hashData: HashParams = Object.fromEntries(params.entries());
      console.log("Parsed hash data:", hashData); // Log parsed hash

      // 3. Check for errors provided in the hash fragment
      if (hashData.error) {
          console.error('Error found in URL hash:', { error: hashData.error, description: hashData.error_description });
          setMessage(hashData.error_description || hashData.error || 'Authentication failed.');
          setStatus('error');
          const errorCode = hashData.error ? encodeURIComponent(hashData.error) : 'unknown_hash_error';
          const errorMessage = encodeURIComponent(hashData.error_description || '');
          setTimeout(() => router.replace(`/auth-error?error=${errorCode}&message=${errorMessage}`), 3000);
          return;
      }

      // 4. Check for essential tokens (access_token, refresh_token) in HASH
      if (!hashData.access_token || !hashData.refresh_token) {
          // Check if maybe code was sent accidentally in query (shouldn't happen if Implicit Grant is used)
          if(searchParams.get('code')) {
              console.error('Received code in query params, but expected tokens in hash. Flow mismatch.');
              setMessage('Authentication flow mismatch. Please ensure Supabase settings are correct and try again.');
              setStatus('error');
              setTimeout(() => router.replace('/auth-error?error=auth_flow_mismatch'), 3000);
          } else {
              console.error('Missing required tokens (access_token or refresh_token) in URL hash fragment.');
              setMessage('Authentication incomplete. Required tokens not found in URL.');
              setStatus('error');
              setTimeout(() => router.replace('/auth-error?error=missing_tokens'), 3000);
          }
          return;
      }

      // 5. Set the session using the browser client with tokens from HASH
      console.log("Attempting to set session with received tokens...");
      const supabase = getSupabaseBrowserClient();
      const { error: sessionError } = await supabase.auth.setSession({
          access_token: hashData.access_token,
          refresh_token: hashData.refresh_token,
      });

      if (sessionError) {
          console.error('Error setting session using supabase.auth.setSession:', sessionError);
          setMessage(`Failed to establish local session: ${sessionError.message}`);
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=session_error'), 3000);
          return;
      }

      // --- Session is now established client-side ---
      console.log('Supabase session established successfully client-side.');
      setStatus('processing');
      setMessage('Session established. Checking game claim status...');

      // 6. Get game context from query parameters (passed along by Supabase redirect)
      const gameId = searchParams.get('gameId');
      const gameSlug = searchParams.get('gameSlug');
      console.log("Game context found:", { gameId, gameSlug });

      // 7. Call the server action to verify and claim (if game context exists)
      if (gameId && gameSlug) {
          console.log(`Calling verifyAndClaimGame server action for game ${gameId}...`);
          const result = await verifyAndClaimGame(gameId, gameSlug);
          console.log("Server action 'verifyAndClaimGame' result:", result);

          if (!result.success) {
              console.error('Server action verifyAndClaimGame failed:', result.error);
              setMessage(result.error || 'Failed to verify or claim the game.');
              setStatus('error');
              const redirectUrl = result.redirect || `/games/${gameSlug}?error=${encodeURIComponent(result.error || 'claim_failed')}`;
              console.log("Redirecting due to claim failure:", redirectUrl);
              setTimeout(() => router.replace(redirectUrl), 2000); // Give user time to read message
              return;
          }

          // Game claim successful
          console.log('Game claimed successfully according to server action.');
          setMessage('Game claimed successfully!');
          setStatus('success');
          const successUrl = result.redirect || `/games/${gameSlug}?success=game-claimed`;
          console.log("Redirecting after successful claim:", successUrl);
          router.replace(successUrl); // Redirect immediately on success
          return;

      } else {
          // No game context, just redirect home after setting session
          console.log('No game context found in URL query params. Redirecting home.');
          setStatus('success');
          setMessage('Authentication successful.');
          router.replace('/');
          return;
      }

    } catch (error) {
      console.error('Unhandled exception during callback processing:', error);
      setMessage(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error');
      setTimeout(() => router.replace('/auth-error?error=unexpected_callback_error'), 3000);
    }
  }, [router, searchParams]);

  useEffect(() => {
    // Run the callback logic once when the component mounts and dependencies are ready
    handleCallback();
  }, [handleCallback]); // useCallback ensures handleCallback identity is stable

  // --- Render loading/status UI ---
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