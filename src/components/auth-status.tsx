// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { signOut } from 'next-auth/react';
// import { startAuthWithGameContext } from '@/auth';

// interface AuthStatusProps {
//   gameId?: string;
//   gameSlug?: string;
//   isDeveloper?: boolean;
// }

// export default function AuthStatus({ gameId, gameSlug, isDeveloper }: AuthStatusProps) {
//   const router = useRouter();
//   const [isSigningOut, setIsSigningOut] = useState(false);

//   const handleSignIn = async () => {
//     if (gameId && gameSlug) {
//       try {
//         await startAuthWithGameContext(gameId, gameSlug);
//       } catch (error) {
//         console.error('Error starting authentication:', error);
//       }
//     } else {
//       // If no game context, redirect to the sign-in page
//       router.push('/api/auth/signin');
//     }
//   };

//   const handleSignOut = async () => {
//     try {
//       setIsSigningOut(true);
//       await signOut({ redirect: false });
//       // Refresh the page to update the UI
//       router.refresh();
//     } catch (error) {
//       console.error('Error signing out:', error);
//     } finally {
//       setIsSigningOut(false);
//     }
//   };

//   return (
//     <div className="flex items-center space-x-2">
//       {isDeveloper && (
//         <span className="text-sm text-green-600 dark:text-green-400 font-medium">
//           Developer
//         </span>
//       )}
      
//       <button
//         onClick={isDeveloper ? handleSignOut : handleSignIn}
//         className={`px-3 py-1 text-sm rounded-md transition-colors ${
//           isDeveloper
//             ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
//             : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
//         }`}
//         disabled={isSigningOut}
//       >
//         {isSigningOut ? 'Signing out...' : isDeveloper ? 'Sign out' : 'Sign in'}
//       </button>
//     </div>
//   );
// }
