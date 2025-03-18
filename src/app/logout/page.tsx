'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Signing out...');

  useEffect(() => {
    async function handleLogout() {
      try {
        await signOut();
        setStatus('success');
        setMessage('You have been signed out successfully.');
        
        // Redirect to home page after a delay
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (error) {
        console.error('Error signing out:', error);
        setStatus('error');
        setMessage('There was an error signing you out.');
        
        // Redirect to home page after a delay even if there's an error
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    }
    
    handleLogout();
  }, [router]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold text-center mb-6">
          {status === 'loading' ? 'Signing Out' : 
           status === 'success' ? 'Sign Out Successful' : 
           'Sign Out Error'}
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
          {status === 'loading' ? 'Please wait...' : 
           'You will be redirected to the home page.'}
        </p>
      </div>
    </div>
  );
}
