"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaStar, FaRegStar } from "react-icons/fa";
import { rateGame } from "@/actions/game-actions";

interface GameRatingProps {
  gameId: string;
  initialRating?: number;
  averageRating?: number;
  ratingCount?: number;
  onRatingSubmitted?: (newRating: number) => void;
}

export default function GameRating({
  gameId,
  initialRating = 0,
  averageRating,
  ratingCount,
  onRatingSubmitted,
}: GameRatingProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check localStorage for existing rating on component mount
  useEffect(() => {
    const storedRating = localStorage.getItem(`game_rating_${gameId}`);
    if (storedRating) {
      setRating(parseInt(storedRating));
    } else if (initialRating > 0) {
      setRating(initialRating);
    }
  }, [gameId, initialRating]);

  // Debug log to see what's happening with the rating state
  useEffect(() => {
    console.log("Current rating state:", rating);
  }, [rating]);

  const handleRatingSubmit = async (selectedRating: number) => {
    if (isSubmitting) return;
    
    // Immediately update UI for better feedback
    setRating(selectedRating);
    setIsSubmitting(true);
    
    try {
      const result = await rateGame(gameId, selectedRating);
      
      if (result.error) {
        toast.error(result.error);
        // Revert to previous rating if there was an error
        const storedRating = localStorage.getItem(`game_rating_${gameId}`);
        if (storedRating) {
          setRating(parseInt(storedRating));
        }
      } else {
        // Save the rating to localStorage
        localStorage.setItem(`game_rating_${gameId}`, selectedRating.toString());
        toast.success(result.message || "Rating submitted successfully");
        
        if (onRatingSubmitted) {
          onRatingSubmitted(selectedRating);
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
      
      // Revert to previous rating if there was an error
      const storedRating = localStorage.getItem(`game_rating_${gameId}`);
      if (storedRating) {
        setRating(parseInt(storedRating));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isSubmitting}
            onClick={() => handleRatingSubmit(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="p-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hoveredRating !== null ? (
              star <= hoveredRating ? (
                <FaStar className="text-yellow-500" size={20} />
              ) : (
                <FaRegStar className="text-gray-500" size={20} />
              )
            ) : rating >= star ? (
              <FaStar className="text-yellow-500" size={20} />
            ) : (
              <FaRegStar className="text-gray-500" size={20} />
            )}
          </button>
        ))}
        
        {averageRating !== undefined && ratingCount !== undefined && (
          <span className="ml-3 text-sm text-muted-foreground">
            {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
          </span>
        )}
      </div>
      
      {isSubmitting && (
        <div className="text-sm text-muted-foreground">Submitting...</div>
      )}
    </div>
  );
}
