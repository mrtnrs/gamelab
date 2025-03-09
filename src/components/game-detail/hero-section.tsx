"use client";

import Image from 'next/image';
import Link from 'next/link';
import { FiPlay, FiExternalLink } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import VerifiedBadge from '@/components/verified-badge';
import ClaimGameButton from '@/components/claim-game-button';
import { Game } from '@/types/game';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

interface HeroSectionProps {
  game: Game;
  formattedGame: any;
  selectedImage: string;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (game: any) => void;
  handleGameClaimed: () => void;
}

export default function HeroSection({ 
  game, 
  formattedGame, 
  selectedImage, 
  isBookmarked, 
  toggleBookmark,
  handleGameClaimed
}: HeroSectionProps) {
  const [imageError, setImageError] = useState(false);
  
  // Format the date to show Month Year if available
  const formattedDate = (() => {
    if (!game.created_at) return formattedGame.year;
    
    try {
      const date = new Date(game.created_at);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (error) {
      return formattedGame.year;
    }
  })();

  return (
    <div className="relative w-full h-[70vh] min-h-[500px]">
      <div className="absolute inset-0">
        <Image src={selectedImage} alt={formattedGame.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/50 to-transparent dark:from-black/70 dark:via-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-transparent dark:from-black/70 dark:via-black/40" />
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-24">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{formattedGame.title}</h1>
            {formattedGame.claimed && <VerifiedBadge className="h-6 w-6" />}
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            {formattedGame.rating_average > 0 && (
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => {
                  const starValue = i + 1;
                  if (starValue <= formattedGame.rating_average) {
                    return <FaStar key={i} className="text-yellow-400 w-4 h-4" />;
                  } else if (starValue - 0.5 <= formattedGame.rating_average) {
                    return <FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />;
                  } else {
                    return <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />;
                  }
                })}
                <span className="text-sm text-white ml-1">{formattedGame.rating_average.toFixed(1)}</span>
              </div>
            )}
            {formattedDate && <span className="text-sm">{formattedDate}</span>}
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {game.tags && game.tags.slice(0, 4).map((tag: string, index: number) => (
                <span key={index} className="text-xs bg-black/30 dark:bg-white/20 text-foreground dark:text-white px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              href={`/games/${formattedGame.slug}/play`}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
            >
              <FiPlay className="h-5 w-5" />
              <span>Play Now</span>
            </Link>

            {formattedGame.url && (
              <button
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
                onClick={() => window.open(formattedGame.url, '_blank', 'noopener,noreferrer')}
              >
                <FiExternalLink className="h-5 w-5" />
                <span>Open Website</span>
                
              </button>
            )}

            <button
              onClick={() =>
                toggleBookmark({
                  id: formattedGame.id,
                  title: formattedGame.title,
                  slug: formattedGame.slug,
                  image: formattedGame.feature_image,
                  year: formattedGame.year,
                })
              }
              className="bg-black/30 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/30 text-foreground dark:text-white p-3 rounded-full backdrop-blur-sm transition-colors"
              aria-label={isBookmarked(formattedGame.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
            >
              {isBookmarked(formattedGame.id) ? (
                <BsBookmarkFill className="h-5 w-5 text-primary" />
              ) : (
                <BsBookmark className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-accent">
              {!imageError ? (
                <Image
                  src={formattedGame.creator.image}
                  alt={formattedGame.creator.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                  {formattedGame.creator.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created by</p>
              <div className="flex items-center space-x-2">
                <a
                  href={formattedGame.creator.social_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {formattedGame.creator.name}
                </a>
                <ClaimGameButton
                  gameId={formattedGame.id}
                  gameSlug={formattedGame.slug}
                  developerUrl={formattedGame.creator.social_link}
                  claimed={formattedGame.claimed || false}
                  onGameClaimed={handleGameClaimed}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
