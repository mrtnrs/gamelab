'use client';

import React, { useState } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { startAuthWithGameContext } from '@/lib/auth-client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleTwitterLogin() {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the client function that will handle the auth flow
      // No need to pass gameId and gameSlug for regular login
      await startAuthWithGameContext("", "");
      
      // The client function will handle the redirect, so we won't get here
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold text-center mb-6">Login to GameLab</h1>
        
        <p className="text-muted-foreground mb-8 text-center">
          Sign in with your social account to use GameLab features.
        </p>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-md p-3 mb-6 text-destructive">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleTwitterLogin}
            disabled={isLoading}
            className="flex items-center justify-center w-full bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <FaXTwitter className="h-5 w-5 mr-2" />
                Sign in with X (Twitter)
              </>
            )}
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
