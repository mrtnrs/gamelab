// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyAndClaimGame } from '@/actions/auth-actions';

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
        if (error) {
          setStatus('error');
          setErrorMessage(error);
          router.replace(`/auth-error?error=${encodeURIComponent(error)}`);
          return;
        }

        const gameId = searchParams.get('gameId');
        const gameSlug = searchParams.get('gameSlug');
        const callbackUrl = searchParams.get('callbackUrl') || '/';

        if (gameId && gameSlug) {
          setStatus('processing');
          const result = await verifyAndClaimGame(gameId, gameSlug);
          
          if (result.redirect) {
            router.replace(result.redirect);
            return;
          }
        }

        // If no game context or after successful processing, go to callback URL
        router.replace(callbackUrl);
      } catch (error) {
        console.error('Error processing callback:', error);
        setStatus('error');
        setErrorMessage('Unexpected error during authentication');
        router.replace('/auth-error?error=unexpected_error');
      }
    };

    // Execute immediately instead of using timeout
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

// // src/app/auth/callback/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { verifyAndClaimGame } from '@/actions/auth-actions';

// export default function AuthCallbackPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [status, setStatus] = useState<'loading' | 'processing' | 'error'>('loading');
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);

//   useEffect(() => {
//     const processCallback = async () => {
//       try {
//         // Check for errors first
//         const error = searchParams.get('error');
        
//         if (error) {
//           setStatus('error');
//           setErrorMessage(error);
//           router.push(`/auth-error?error=${encodeURIComponent(error)}`);
//           return;
//         }

//         // Get the game context from URL parameters
//         const gameId = searchParams.get('gameId');
//         const gameSlug = searchParams.get('gameSlug');
        
//         // If we have game context, verify and claim the game
//         if (gameId && gameSlug) {
//           setStatus('processing');
          
//           try {
//             // Call the server action to verify and claim the game
//             await verifyAndClaimGame(gameId, gameSlug);
            
//             // If we get here, the game was claimed successfully
//             // The server action should have redirected us, but we'll add a fallback
//             router.push(`/games/${gameSlug}?success=game-claimed`);
//           } catch (error) {
//            // console.log('Caught error from verifyAndClaimGame:', error);
            
//             // Let the redirect happen naturally
//             // The Next.js router will handle the NEXT_REDIRECT error
//             // We don't need to do anything here
//           }
//         } else {
//           // No game context, just redirect to the callback URL or home
//           const callbackUrl = searchParams.get('callbackUrl') || '/';
//           router.push(callbackUrl);
//         }
//       } catch (error) {
//         console.error('Error processing callback:', error);
//         setStatus('error');
//         setErrorMessage('Unexpected error during authentication');
//         router.push('/auth-error?error=unexpected_error');
//       }
//     };

//     // Process the callback after a short delay to ensure Auth.js has completed its work
//     const timer = setTimeout(() => {
//       processCallback();
//     }, 1000);
    
//     return () => clearTimeout(timer);
//   }, [router, searchParams]);

//   return (
//     <div className="container mx-auto p-8 text-center">
//       <h1 className="text-2xl font-bold mb-4">Authentication in progress</h1>
//       <div className="flex justify-center mb-4">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
//       </div>
//       <p className="mb-2">
//         {status === 'loading' && 'Please wait while we complete your authentication...'}
//         {status === 'processing' && 'Verifying your game ownership...'}
//         {status === 'error' && 'An error occurred during authentication.'}
//       </p>
//       {errorMessage && (
//         <p className="text-red-500">{errorMessage}</p>
//       )}
//     </div>
//   );
// }
