'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleAuthCallback } from '@/actions/supabase-auth-actions';

export default function SupabaseCallbackPage() {
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
          setTimeout(() => {
            router.replace(`/auth-error?error=${encodeURIComponent(error_description || error)}`);
          }, 2000);
          return;
        }
        
        // Get the code from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          setStatus('error');
          setErrorMessage('Missing authentication code');
          setTimeout(() => {
            router.replace('/auth-error?error=no_code');
          }, 2000);
          return;
        }
        
        setStatus('processing');
        
        // Process the callback
        const result = await handleAuthCallback(code);
        
        if (!result.success) {
          setStatus('error');
          setErrorMessage(result.error || 'Authentication failed');
          
          // If we have a redirect URL, go there
          if (result.redirect) {
            setTimeout(() => {
              router.replace(result.redirect);
            }, 1000);
          }
          return;
        }
        
        // Redirect to the specified URL
        if (result.redirect) {
          router.replace(result.redirect);
        } else {
          // Fallback to home page
          router.replace('/');
        }
      } catch (error) {
        console.error('Error processing callback:', error);
        setStatus('error');
        setErrorMessage('Unexpected error during authentication');
        setTimeout(() => {
          router.replace('/auth-error?error=unexpected_error');
        }, 2000);
      }
    };

    processCallback();
  }, [router, searchParams]);

  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Authentication in progress</h1>
      <div className="flex justify-center mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
      <p className="mb-2">
        {status === 'loading' && 'Please wait while we complete your authentication...'}
        {status === 'processing' && 'Verifying your game ownership...'}
        {status === 'error' && 'An error occurred during authentication.'}
      </p>
      {errorMessage && (
        <p className="text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
