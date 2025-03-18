// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleAuthCallback } from '@/actions/supabase-auth-actions';
import { getSupabaseBrowserClient } from '@/utils/supabase-client';

// Define the expected response type
interface AuthCallbackResponse {
  success: boolean;
  redirect?: string;
  error?: string;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'processing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for errors first
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setErrorMessage(error_description || error);
          router.replace(`/auth-error?error=${encodeURIComponent(error_description || error)}`);
          return;
        }

        // Get the code from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          setStatus('error');
          setErrorMessage('No authentication code found');
          router.replace('/auth-error?error=no_code');
          return;
        }
        
        // Call the server action to handle the auth callback
        const result = await handleAuthCallback(code) as AuthCallbackResponse;
        
        if (result && typeof result === 'object') {
          if ('redirect' in result) {
            // Handle the redirect URL from the response
            router.replace(result.redirect as string);
            return;
          } else if ('error' in result) {
            setStatus('error');
            setErrorMessage(result.error as string);
            router.replace(`/auth-error?error=${encodeURIComponent(result.error as string)}`);
            return;
          }
        }
        
        // If we get here without a redirect, go to home
        router.replace('/');
      } catch (error) {
        console.error('Error processing callback:', error);
        setStatus('error');
        setErrorMessage('Unexpected error during authentication');
        router.replace('/auth-error?error=unexpected_error');
      }
    };

    // Execute immediately
    processCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' && 'Processing Authentication...'}
          {status === 'processing' && 'Verifying Game Ownership...'}
          {status === 'error' && 'Authentication Error'}
        </h1>
        
        {status === 'loading' && (
          <p className="text-muted-foreground">
            Please wait while we process your authentication...
          </p>
        )}
        
        {status === 'processing' && (
          <p className="text-muted-foreground">
            Verifying your game ownership and updating records...
          </p>
        )}
        
        {status === 'error' && (
          <div>
            <p className="text-destructive">
              {errorMessage || 'An error occurred during authentication.'}
            </p>
            <button 
              onClick={() => router.replace('/')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
