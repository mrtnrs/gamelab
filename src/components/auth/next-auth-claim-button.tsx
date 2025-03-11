// 'use client';

// import { useState } from 'react';
// import { signIn } from 'next-auth/react';
// import { Button } from '@/components/ui/button';
// import { setGameClaimCookies } from '@/actions/auth-actions';
// import { useRouter } from 'next/navigation';

// interface NextAuthClaimButtonProps {
//   gameId: string;
//   gameSlug: string;
//   developerUrl?: string;
//   className?: string;
// }

// export default function NextAuthClaimButton({
//   gameId,
//   gameSlug,
//   developerUrl,
//   className,
// }: NextAuthClaimButtonProps) {
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();

//   const handleClaimGame = async () => {
//     try {
//       setIsLoading(true);
      
//       // First, set the cookies for the game claim
//       await setGameClaimCookies(gameId, gameSlug);
      
//       // Then redirect to Twitter auth
//       await signIn('twitter', { 
//         callbackUrl: `/games/${gameSlug}`,
//         redirect: true
//       });
//     } catch (error) {
//       console.error('Error starting claim process:', error);
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Button
//       onClick={handleClaimGame}
//       disabled={isLoading}
//       className={className}
//     >
//       {isLoading ? 'Authenticating...' : 'Claim Game'}
//     </Button>
//   );
// }
