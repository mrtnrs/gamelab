"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
// import { startXAuth } from "@/actions/auth-actions"; // Commented out as it's no longer used

// Helper function to generate a random string for state and codeVerifier
function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join("");
}

// Helper function to generate codeChallenge from codeVerifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64Digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface ClaimGameButtonProps {
  gameId: string;
  gameSlug: string;
  developerUrl: string;
  claimed?: boolean;
  onGameClaimed?: () => void;
}

export default function ClaimGameButton({
  gameId,
  gameSlug,
  developerUrl,
  claimed,
  onGameClaimed,
}: ClaimGameButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  // Check if developerUrl is an X.com URL
  const isXUrl =
    developerUrl &&
    (developerUrl.includes("twitter.com/") || developerUrl.includes("x.com/"));
  if (!isXUrl) return null;

  // Handle success/error feedback from URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "game-claimed") {
      if (onGameClaimed) onGameClaimed(); // Let onGameClaimed handle the toast
    } else if (error) {
      const errorMessage = decodeURIComponent(error);
      let displayMessage = "Failed to claim game. Please try again.";
      if (errorMessage === "handle-mismatch") {
        displayMessage = "Your X handle does not match the developer URL.";
      } else if (errorMessage === "already_claimed") {
        displayMessage = "This game has already been claimed.";
      }
      toast.error(displayMessage);
    }

    // Clean up URL params
    if (success || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams, onGameClaimed]);

  const handleStartAuth = async () => {
    try {
      setIsLoading(true);
      // // Call the server action to start X auth
      // await startXAuth(gameId, gameSlug);
      // // This won't be reached because startXAuth redirects

      // Generate OAuth2 parameters on the client side
      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Send the parameters to the edge API route
      const response = await fetch("/api/auth/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId,
          gameSlug,
          state,
          codeVerifier,
          codeChallenge,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start authentication");
      }

      const { authUrl } = await response.json();
      window.location.href = authUrl; // Redirect to the authorization URL
    } catch (error) {
      console.error("Error starting auth:", error);
      toast.error("Failed to start authentication. Please try again.");
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading} // Only disable when loading, not when claimed
        className={`flex items-center space-x-2 px-3 py-1 text-sm border border-border rounded-md transition-colors ${
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
        }`}
      >
        <span className="h-6 w-6 text-[black] dark:text-[white] flex items-center justify-center">
          𝕏
        </span>
        <span>
          {claimed ? "Developer Verified" : isLoading ? "Processing..." : "Claim Your Game"}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {claimed ? "Verify Ownership" : "Claim Your Game"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-muted-foreground mb-6">
              {claimed
                ? "Sign in with your X account to verify you’re the developer."
                : "Verify ownership by signing in with your X account. Your handle must match the developer URL."}
            </p>
            <button
              onClick={handleStartAuth}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#000000] text-white rounded-md hover:bg-[#333333] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg hidden font-bold">𝕏</span>
              <span>{isLoading ? "Processing..." : "Sign in with 𝕏"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { toast } from "react-hot-toast";
// import { useSearchParams } from "next/navigation";
// import { startXAuth } from "@/actions/auth-actions";

// interface ClaimGameButtonProps {
//   gameId: string;
//   gameSlug: string;
//   developerUrl: string;
//   claimed?: boolean;
//   onGameClaimed?: () => void;
// }

// export default function ClaimGameButton({
//   gameId,
//   gameSlug,
//   developerUrl,
//   claimed,
//   onGameClaimed,
// }: ClaimGameButtonProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const searchParams = useSearchParams();

//   // Check if developerUrl is an X.com URL
//   const isXUrl =
//     developerUrl &&
//     (developerUrl.includes("twitter.com/") || developerUrl.includes("x.com/"));
//   if (!isXUrl) return null;

//   // Handle success/error feedback from URL params
//   useEffect(() => {
//     const success = searchParams.get("success");
//     const error = searchParams.get("error");
  
//     if (success === "game-claimed") {
//       if (onGameClaimed) onGameClaimed(); // Let onGameClaimed handle the toast
//     } else if (error) {
//       const errorMessage = decodeURIComponent(error);
//       let displayMessage = "Failed to claim game. Please try again.";
//       if (errorMessage === "handle-mismatch") {
//         displayMessage = "Your X handle does not match the developer URL.";
//       } else if (errorMessage === "already_claimed") {
//         displayMessage = "This game has already been claimed.";
//       }
//       toast.error(displayMessage);
//     }
  
//     // Clean up URL params
//     if (success || error) {
//       const url = new URL(window.location.href);
//       url.searchParams.delete("success");
//       url.searchParams.delete("error");
//       window.history.replaceState({}, "", url);
//     }
//   }, [searchParams, onGameClaimed]);

//   const handleStartAuth = async () => {
//     try {
//       setIsLoading(true);
//       // Call the server action to start X auth
//       await startXAuth(gameId, gameSlug);
//       // This won't be reached because startXAuth redirects
//     } catch (error) {
//       console.error("Error starting auth:", error);
//       toast.error("Failed to start authentication. Please try again.");
//       setIsLoading(false);
//       setIsOpen(false);
//     }
//   };

//   return (
//     <>
//       <button
//         onClick={() => setIsOpen(true)}
//         disabled={isLoading} // Only disable when loading, not when claimed
//         className={`flex items-center space-x-2 px-3 py-1 text-sm border border-border rounded-md transition-colors ${
//           isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
//         }`}
//       >
//         <span className="h-6 w-6 text-[black] dark:text-[white] flex items-center justify-center">
//           𝕏
//         </span>
//         <span>{claimed ? "Developer Verified" : isLoading ? "Processing..." : "Claim Your Game"}</span>
//       </button>

//       {isOpen && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">{claimed ? "Verify Ownership" : "Claim Your Game"}</h2>
//               <button
//                 onClick={() => setIsOpen(false)}
//                 disabled={isLoading}
//                 className="text-muted-foreground hover:text-foreground text-2xl"
//               >
//                 ×
//               </button>
//             </div>
//             <p className="text-muted-foreground mb-6">
//               {claimed
//                 ? "Sign in with your X account to verify you’re the developer."
//                 : "Verify ownership by signing in with your X account. Your handle must match the developer URL."}
//             </p>
//             <button
//               onClick={handleStartAuth}
//               disabled={isLoading}
//               className="w-full px-4 py-2 bg-[#000000] text-white rounded-md hover:bg-[#333333] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <span className="text-lg hidden font-bold">𝕏</span>
//               <span>{isLoading ? "Processing..." : "Sign in with 𝕏"}</span>
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }