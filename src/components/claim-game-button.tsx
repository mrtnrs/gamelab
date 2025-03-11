"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { startAuthWithGameContext } from "@/lib/auth-client"; // Import from our client-side utility

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
      } else if (errorMessage === "auth_failed") {
        displayMessage = "Authentication failed. Please try again.";
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
      
      // Use the client-side authentication utility
      await startAuthWithGameContext(gameId, gameSlug);
      
      // The Auth.js implementation will handle the redirect
    } catch (error) {
      console.error('Error starting authentication:', error);
      toast.error('Failed to start authentication. Please try again.');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
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