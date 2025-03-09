"use client";

import { useEffect, useState } from "react";
import { trackGameVisit } from "@/actions/game-actions";

interface GameVisitTrackerProps {
  gameId: string;
}

export default function GameVisitTracker({ gameId }: GameVisitTrackerProps) {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    // Only track the visit once per session
    const hasTrackedVisit = sessionStorage.getItem(`tracked_visit_${gameId}`);
    
    if (!hasTrackedVisit && !tracked) {
      const trackVisit = async () => {
        try {
          await trackGameVisit(gameId);
          sessionStorage.setItem(`tracked_visit_${gameId}`, "true");
          setTracked(true);
        } catch (error) {
          console.error("Error tracking game visit:", error);
          // Silent failure - don't bother the user with tracking errors
        }
      };
      
      // Delay tracking slightly to prioritize page load
      const timeoutId = setTimeout(trackVisit, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [gameId, tracked]);

  // This is a utility component that doesn't render anything
  return null;
}
