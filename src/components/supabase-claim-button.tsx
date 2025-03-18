"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { startAuthWithGameContext } from "@/lib/auth-client";

interface SupabaseClaimButtonProps {
  gameId: string;
  gameSlug: string;
  developerUrl: string;
  claimed?: boolean;
  onGameClaimed?: () => void;
}

export default function SupabaseClaimButton({
  gameId,
  gameSlug,
  developerUrl,
  claimed,
  onGameClaimed,
}: SupabaseClaimButtonProps) {
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
      } else if (errorMessage === "invalid_developer_url") {
        displayMessage = "Invalid developer URL. Please add a valid Twitter/X URL to your game.";
      } else if (errorMessage === "auth_failed") {
        displayMessage = "Authentication failed. Please try again.";
      } else if (errorMessage === "already_claimed") {
        displayMessage = "This game has already been claimed.";
      } else if (errorMessage === "claim_failed") {
        displayMessage = "Failed to update game status. Please try again.";
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
      
      // Use the client-side authentication utility with game context
      await startAuthWithGameContext(gameId, gameSlug);
      
      // The auth flow will handle the redirect, so we won't get here
    } catch (error) {
      console.error('Error starting authentication:', error);
      toast.error('Failed to start authentication. Please try again.');
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading || claimed}
        className={`flex items-center space-x-2 px-3 py-1 text-sm border border-border rounded-md transition-colors ${
          claimed 
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" 
            : isLoading 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:bg-accent"
        }`}
      >
        <span className="h-6 w-6 text-[black] dark:text-[white] flex items-center justify-center">
          𝕏
        </span>
        <span>
          {claimed ? "Developer Verified" : isLoading ? "Processing..." : "Claim Your Game"}
        </span>
      </button>

      {isOpen && !claimed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Claim Your Game</h3>
            <p className="mb-6">
              You are about to claim this game as its developer. You will be redirected to X (Twitter) to authenticate. Make sure the X account you use matches the developer URL for this game.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleStartAuth}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span className="h-4 w-4 flex items-center justify-center">𝕏</span>
                    <span>Authenticate with X</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
