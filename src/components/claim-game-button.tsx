"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

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
      toast.success("Game claimed successfully!");
      if (onGameClaimed) onGameClaimed();
    } else if (error) {
      const errorMessage = decodeURIComponent(error);
      toast.error(
        errorMessage === "handle-mismatch"
          ? "Your X handle does not match the developer URL."
          : "Failed to claim game. Please try again."
      );
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
    // Redirect to API route to initiate auth
    const redirectUrl = `/api/auth/x?gameId=${encodeURIComponent(
      gameId
    )}&gameSlug=${encodeURIComponent(gameSlug)}`;
    window.location.href = redirectUrl;
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={claimed}
        className={`flex items-center space-x-2 px-3 py-1 text-sm border border-border rounded-md transition-colors ${
          claimed ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
        }`}
      >
        <span className="h-6 w-6 text-[black] dark:text-[white] flex items-center justify-center">
          𝕏
        </span>
        <span>{claimed ? "Game Claimed" : "Claim Your Game"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Claim Your Game</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-muted-foreground mb-6">
              Verify ownership by signing in with your X account. Your handle
              must match the developer URL.
            </p>
            <button
              onClick={handleStartAuth}
              className="w-full px-4 py-2 bg-[#000000] text-white rounded-md hover:bg-[#333333] transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-lg font-bold">𝕏</span>
              <span>Sign in with X</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}