// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyAndClaimGame } from '@/actions/game-auth-actions';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Completing authentication...');

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for error in the URL (if coming back from auth provider with an error)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Auth error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          
          // Redirect to home page after a delay
          setTimeout(() => {
            router.push(`/?error=${encodeURIComponent(error)}`);
          }, 2000);
          
          return;
        }
        
        // Get game context from URL parameters
        const gameId = searchParams.get('gameId');
        const gameSlug = searchParams.get('gameSlug');
        
        // If there's no game context, we're just doing a regular login
        if (!gameId || !gameSlug) {
          setStatus('success');
          setMessage('Authentication successful!');
          
          // Redirect to home page after a delay
          setTimeout(() => {
            router.push('/');
          }, 1000);
          
          return;
        }
        
        // If we have game context, try to claim the game
        const claimResult = await verifyAndClaimGame(gameId, gameSlug);
        
        if (claimResult.success) {
          setStatus('success');
          setMessage('Game claimed successfully!');
        } else {
          setStatus('error');
          setMessage('Failed to claim game: ' + (claimResult.error || 'Unknown error'));
        }
        
        // Redirect to the appropriate page
        if (claimResult.redirect) {
          setTimeout(() => {
            router.push(claimResult.redirect || '/');
          }, 1000);
        } else {
          setTimeout(() => {
            router.push(`/games/${gameSlug}`);
          }, 1000);
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        
        // Redirect to home page after a delay
        setTimeout(() => {
          router.push('/?error=unexpected');
        }, 2000);
      }
    }
    
    handleCallback();
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold text-center mb-6">
          {status === 'loading' ? 'Finalizing Authentication' : 
           status === 'success' ? 'Authentication Successful' : 
           'Authentication Error'}
        </h1>
        
        <div className="flex justify-center mb-6">
          {status === 'loading' ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          ) : status === 'success' ? (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <p className="text-center text-lg mb-4">{message}</p>
        
        <p className="text-center text-muted-foreground">
          {status === 'loading' ? 'Please wait while we complete the process...' : 
           status === 'success' ? 'You will be redirected shortly.' : 
           'You will be redirected to the home page.'}
        </p>
      </div>
    </div>
  );
}
