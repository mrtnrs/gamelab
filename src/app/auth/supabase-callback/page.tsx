'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/utils/supabase-client';
import { verifyAndClaimGame } from '@/actions/game-auth-actions';

// Import the response type for proper typing
type GameAuthResponse = {
  success: boolean;
  error?: string;
  redirect?: string;
};

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
        
        // Get the game context parameters
        const gameId = searchParams.get('gameId');
        const gameSlug = searchParams.get('gameSlug');
        
        // Create a Supabase client
        const supabase = await getSupabaseBrowserClient();
        
        try {
          // This will automatically handle the hash fragment if present
          const { error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            setStatus('error');
            setErrorMessage('Authentication session error');
            
            setTimeout(() => {
              router.replace('/auth-error?error=session_error');
            }, 2000);
            return;
          }
          
          // Now we have a valid session, we can proceed with game claiming if needed
          if (gameId && gameSlug) {
            setStatus('processing');
            
            // Use the server action to verify and claim the game
            const result = await verifyAndClaimGame(gameId, gameSlug);
            
            if (!result.success) {
              setStatus('error');
              setErrorMessage(result.error || 'Game claiming failed');
              
              // Handle the redirect URL if present
              const redirectUrl = result.redirect 
                ? result.redirect 
                : `/games/${gameSlug}?error=${encodeURIComponent(result.error || 'unknown_error')}`;
                
              setTimeout(() => {
                router.replace(redirectUrl);
              }, 1000);
              return;
            }
            
            // Success - redirect to the game page
            const successUrl = result.redirect 
              ? result.redirect 
              : `/games/${gameSlug}?success=game-claimed`;
              
            router.replace(successUrl);
            return;
          }
          
          // No game context, just go to home
          router.replace('/');
        } catch (authError) {
          console.error('Error processing auth callback:', authError);
          setStatus('error');
          setErrorMessage('Authentication session error');
          
          setTimeout(() => {
            router.replace('/auth-error?error=session_error');
          }, 2000);
        }
      } catch (error) {
        console.error('Unhandled error in auth callback:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
        
        setTimeout(() => {
          router.replace('/auth-error?error=unexpected');
        }, 2000);
      }
    };
    
    processCallback();
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold text-center mb-6">
          {status === 'loading' ? 'Finalizing Authentication' : 
           status === 'processing' ? 'Processing Your Request' : 
           'Authentication Error'}
        </h1>
        
        <div className="flex justify-center mb-6">
          {status === 'loading' || status === 'processing' ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <p className="text-center mb-6">
          {status === 'loading' ? 'Please wait while we complete your authentication...' :
           status === 'processing' ? 'Processing your game claim...' :
           errorMessage || 'An error occurred during authentication'}
        </p>
      </div>
    </div>
  );
}
