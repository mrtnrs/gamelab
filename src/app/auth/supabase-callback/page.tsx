// src/app/auth/supabase-callback/page.tsx
'use client'; // VERY IMPORTANT: This must be a Client Component

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/utils/supabase-client'; // Use the browser client utility
import { verifyAndClaimGame } from '@/actions/game-auth-actions'; // Your server action

// Define expected shape of the response from the Cloudflare Worker
interface WorkerExchangeResponse {
    session?: {
        access_token: string;
        refresh_token: string;
        expires_in?: number;
        token_type?: string;
    };
    user?: any; // Adjust based on what your worker returns for the user object
    error?: string;
    message?: string;
}


export default function SupabaseCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // For reading query params like gameId, gameSlug
  const [status, setStatus] = useState<'initializing' | 'processing' | 'error' | 'success'>('initializing');
  const [message, setMessage] = useState<string>('Initializing authentication...');

  const handleCallback = useCallback(async () => {
    try {
      setMessage('Processing authentication callback...');
      console.log("Callback page loaded. Current URL:", window.location.href);

      // --- Configuration ---
      const workerUrl = 'https://gamelabworker.pandabutcher.workers.dev/'; // Your worker URL

      // 1. Check for errors passed directly in query parameters by Supabase/Provider
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

      // 2. Get the authorization code and retrieve the PKCE code verifier
      const code = searchParams.get('code');

      // --- DEBUG: Log sessionStorage contents ---
      try {
        console.log('Session Storage Contents:', JSON.stringify(sessionStorage));
      } catch (e) {
        console.error("Could not stringify sessionStorage:", e);
        // Log keys individually if stringify fails
        Object.keys(sessionStorage).forEach(key => {
            console.log(`Session Storage Key: ${key} | Value: ${sessionStorage.getItem(key)}`); // Log value too
        });
      }
      // --- END DEBUG ---

      // Supabase SSR client typically stores the verifier in sessionStorage
      const codeVerifier = sessionStorage.getItem('supabase.auth.codeVerifier'); // Attempt with the default key

      if (!code) {
          // If there's no code and no error, something is wrong (e.g., user landed here directly)
          console.error('Callback page reached without authorization code or error.');
          setMessage('Invalid callback state. Missing authorization code.');
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=missing_code'), 3000);
          return;
      }

      if (!codeVerifier) {
          // This shouldn't happen if the auth flow started correctly with PKCE
          console.error('Callback page cannot find PKCE code verifier in sessionStorage.');
          setMessage('Invalid authentication state. Missing PKCE verifier.');
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=missing_code_verifier'), 3000);
          return;
      }

      // 3. Exchange the code using the Cloudflare Worker, now including the codeVerifier
      console.log("Found authorization code and PKCE verifier. Attempting exchange via worker...");
      setMessage('Exchanging authorization code...');
      setStatus('processing');

      let workerResponse: WorkerExchangeResponse;
      try {
          const response = await fetch(workerUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  action: 'exchangeCode',
                  code: code,
                  codeVerifier: codeVerifier, // Send the verifier to the worker
              }),
          });

          // Clean up the verifier from storage after sending it
          sessionStorage.removeItem('supabase.auth.codeVerifier');

          if (!response.ok) {
              // Try to parse error from worker response body
              let errorBody = { error: `Worker request failed with status ${response.status}`, message: '' };
              try {
                  errorBody = await response.json();
              } catch (e) { /* Ignore parsing error */ }
              console.error('Error response from worker:', response.status, errorBody);
              throw new Error(errorBody.message || errorBody.error || `Worker request failed: ${response.status}`);
          }

          workerResponse = await response.json();
          console.log("Received response from worker:", workerResponse);

      } catch (fetchError) {
          console.error('Error calling Cloudflare Worker:', fetchError);
          setMessage(`Failed to communicate with authentication service: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=worker_fetch_failed'), 3000);
          return;
      }

      // 4. Check for errors returned by the worker
      if (workerResponse.error || !workerResponse.session?.access_token || !workerResponse.session?.refresh_token) {
          console.error('Worker returned an error or incomplete session data:', workerResponse);
          setMessage(workerResponse.message || workerResponse.error || 'Failed to exchange code.');
          setStatus('error');
          const errorCode = workerResponse.error ? encodeURIComponent(workerResponse.error) : 'worker_exchange_failed';
          setTimeout(() => router.replace(`/auth-error?error=${errorCode}`), 3000);
          return;
      }

      // 5. Set the session client-side using tokens received from the worker
      console.log("Worker exchange successful. Setting session client-side...");
      const supabase = getSupabaseBrowserClient();
      const { error: sessionError } = await supabase.auth.setSession({
          access_token: workerResponse.session.access_token,
          refresh_token: workerResponse.session.refresh_token,
      });

      if (sessionError) {
          console.error('Error setting session using supabase.auth.setSession after worker exchange:', sessionError);
          setMessage(`Failed to establish local session after code exchange: ${sessionError.message}`);
          setStatus('error');
          setTimeout(() => router.replace('/auth-error?error=session_set_failed'), 3000);
          return;
      }

      // --- Session is now established client-side ---
      console.log('Supabase session established successfully via worker exchange.');
      setMessage('Session established. Checking game claim status...');
      // Status remains 'processing' while we check the claim

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
