'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { processCallback } from '@/actions/auth-actions';
import { useRouter } from 'next/navigation';

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get code and state from URL search params
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        console.log('Client-side callback parameters:', { code, state });
        setDebugInfo({ code: code ? `${code.substring(0, 10)}...` : 'Missing', state: state ? `${state.substring(0, 10)}...` : 'Missing' });

        if (!code || !state) {
          setError('Missing authentication parameters. Please try again.');
          setLoading(false);
          return;
        }

        // Process the callback using the server action
        const result = await processCallback(code, state);

        if (result.error) {
          // Handle different error types with more specific messages
          let errorMessage = result.error;
          
          if (result.error === 'missing_cookies') {
            errorMessage = 'Authentication session expired. Please try again.';
          } else if (result.error === 'invalid_state') {
            errorMessage = 'Invalid authentication state. Please try again.';
          } else if (result.error === 'token_exchange_failed') {
            errorMessage = 'Failed to exchange token with X.com. Please try again.';
          } else if (result.error === 'user_info_failed') {
            errorMessage = 'Failed to retrieve user information from X.com. Please try again.';
          } else if (result.error === 'not_your_game') {
            errorMessage = 'You are not authorized to claim this game.';
          }
          
          setError(errorMessage);
          setLoading(false);
        } else if (result.redirect) {
          // Redirect to the specified URL
          router.push(result.redirect);
        } else {
          // Fallback to home page if no redirect is specified
          router.push('/');
        }
      } catch (err) {
        console.error('Error in client callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setDebugInfo({
          ...debugInfo,
          error: err instanceof Error ? err.message : String(err)
        });
        setLoading(false);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h1 className="text-xl font-semibold">Processing Authentication...</h1>
          <p className="text-muted-foreground mt-2">Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-left mb-4 max-w-lg mx-auto">
          <h2 className="font-semibold mb-2">Debug Information:</h2>
          {Object.entries(debugInfo).map(([key, value]) => (
            <p key={key} className="text-sm">
              <span className="font-medium">{key}:</span> {value}
            </p>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <a
            href="/"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
          >
            Return to Home
          </a>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-accent"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // This should not be visible as we should either be loading or have an error or have redirected
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p className="mb-4">You will be redirected shortly.</p>
    </div>
  );
}
