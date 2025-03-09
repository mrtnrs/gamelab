'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processCallback } from '@/actions/auth-actions';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract query parameters from the URL
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // Handle error from the authentication provider
    if (errorParam) {
      setError(
        errorParam === 'access_denied'
          ? 'You denied access to your X account.'
          : `Authentication error: ${errorParam}`
      );
      return;
    }

    // Validate presence of code and state
    if (!code || !state) {
      setError('Missing code or state parameters.');
      return;
    }

    // Process the authentication callback
    processCallback(code, state)
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else if (result.redirect) {
          router.push(result.redirect);
        } else {
          // Fallback redirect to home if no redirect is specified
          router.push('/');
        }
      })
      .catch((err) => {
        console.error('Error handling authentication callback:', err);
        setError('An unexpected error occurred during authentication.');
      });
  }, [searchParams, router]);

  // Render error state if present
  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
        >
          Return to Home
        </a>
      </div>
    );
  }

  // Default loading state while processing
  return <div>Processing authentication...</div>;
}

// import { processCallback } from "@/actions/auth-actions";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";

// // Define the correct types for Next.js 15
// type Props = {
//   params: Promise<{}>;
//   searchParams: Promise<{
//     code?: string | string[];
//     state?: string | string[];
//     error?: string | string[];
//   }>;
// };

// export default async function XAuthCallbackPage({ params }: Props) {
//   // Await the params (though unused here)
//   await params;

//   // Read headers set by middleware
//   const headersList = await headers();
//   const code = headersList.get("x-oauth-code") || "";
//   const state = headersList.get("x-oauth-state") || "";
//   const error = headersList.get("x-oauth-error") || "";

//   console.log("Headers from middleware:", { code, state, error });

//   // Handle errors from X.com
//   if (error) {
//     return (
//       <div className="container mx-auto p-8 text-center">
//         <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
//         <p className="text-red-500 mb-4">
//           {error === "access_denied"
//             ? "You denied access to your X account."
//             : `An error occurred during authentication: ${error}`}
//         </p>
//         <a
//           href="/"
//           className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
//         >
//           Return to Home
//         </a>
//       </div>
//     );
//   }

//   // Validate required parameters
//   if (!code || !state) {
//     return (
//       <div className="container mx-auto p-8 text-center">
//         <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
//         <p className="text-red-500 mb-4">Missing code or state parameters.</p>
//         <pre className="text-left bg-gray-100 p-2 rounded">
//           {JSON.stringify({ code, state }, null, 2)}
//         </pre>
//         <a
//           href="/"
//           className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
//         >
//           Return to Home
//         </a>
//       </div>
//     );
//   }

//   try {
//     // Process the callback using the server action
//     const result = await processCallback(code, state);

//     if (result.error) {
//       return (
//         <div className="container mx-auto p-8 text-center">
//           <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
//           <p className="text-red-500 mb-4">{result.error}</p>
//           <div className="bg-gray-100 p-4 rounded-md text-left mb-4 max-w-lg mx-auto">
//             <h2 className="font-semibold mb-2">Debug Information:</h2>
//             <p>Code: {code ? code.substring(0, 10) + "..." : "Missing"}</p>
//             <p>State: {state ? state.substring(0, 10) + "..." : "Missing"}</p>
//           </div>
//           <a
//             href="/"
//             className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
//           >
//             Return to Home
//           </a>
//         </div>
//       );
//     }

//     if (result.redirect) {
//       redirect(result.redirect);
//     }

//     // Fallback if no redirect is provided (should not happen)
//     return (
//       <div className="container mx-auto p-8 text-center">
//         <h1 className="text-2xl font-bold mb-4">Authentication Successful</h1>
//         <p className="mb-4">You have been authenticated successfully.</p>
//         <a
//           href="/"
//           className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
//         >
//           Return to Home
//         </a>
//       </div>
//     );
//   } catch (error) {
//     console.error("Error handling X callback:", error);
//     return (
//       <div className="container mx-auto p-8 text-center">
//         <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
//         <p className="text-red-500 mb-4">
//           An unexpected error occurred during authentication.
//         </p>
//         <div className="bg-gray-100 p-4 rounded-md text-left mb-4 max-w-lg mx-auto">
//           <h2 className="font-semibold mb-2">Debug Information:</h2>
//           <p>Error: {error instanceof Error ? error.message : String(error)}</p>
//         </div>
//         <a
//           href="/"
//           className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
//         >
//           Return to Home
//         </a>
//       </div>
//     );
//   }
// }