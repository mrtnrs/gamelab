// src/app/games/[slug]/game-detail-client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Game } from "@/types/game";
import { Changelog } from "@/services/game-service";
import { rateGame } from "@/actions/game-actions";
import HeroSection from "@/components/game-detail/hero-section";
import GameOverview from "@/components/game-detail/game-overview";
import GameGallery from "@/components/game-detail/game-gallery";
import GameComments from "@/components/game-detail/game-comments";
import GameCarousel from '@/components/game-carousel';
import { gameService, GameComment } from '@/services/game-service';
import { generateSlug } from '@/utils/slug';
import GameVisitTracker from '@/components/game-visit-tracker';
import { useBookmarks } from '@/contexts/bookmark-context';

// Define types (unchanged types omitted for brevity)
type FormattedGame = {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  feature_image: string;
  cover_image: string;
  gallery: string[];
  tags: string[];
  created_at: string;
  rating_average: number;
  rating_count: number;
  visit_count: number;
  claimed: boolean;
  creator: {
    name: string;
    social_link: string;
  };
};

const formatGameForDisplay = (game: Game): FormattedGame => {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug || generateSlug(game.title),
    description: game.description || '',
    url: game.url || '',
    feature_image: game.image_url || '/placeholder.png',
    cover_image: game.image_url || '/placeholder.png',
    gallery: game.gallery_images || [],
    tags: game.tags || [],
    created_at: game.created_at,
    rating_average: game.rating_average || 0,
    rating_count: game.rating_count || 0,
    visit_count: game.visit_count || 0,
    claimed: game.claimed || false,
    creator: {
      name: game.developer || 'Unknown',
      social_link: game.developer_url || '#',
    },
  };
};

interface GameDetailClientProps {
  game: Game;
  slug: string;
  initialChangelogs: Changelog[];
  isGameDeveloper: boolean;
  userRating: number | null;
  comments: GameComment[];
}

export default function GameDetailClient({
  game,
  slug,
  initialChangelogs,
  isGameDeveloper,
  userRating: initialUserRating,
  comments: initialComments,
}: GameDetailClientProps) {
  const [formattedGame, setFormattedGame] = useState<FormattedGame>(formatGameForDisplay(game));
  const [selectedImage, setSelectedImage] = useState<string>(formattedGame.feature_image);
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [loadingSimilarGames, setLoadingSimilarGames] = useState(false);
  const canonicalUrl = `https://gamelab.vercel.app/games/${slug}`;
  const router = useRouter();
  
  // Mobile tabs state
  const [activeTab, setActiveTab] = useState('overview');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (formattedGame.id) {
      const storedRating = localStorage.getItem(`game_rating_${formattedGame.id}`);
      if (storedRating) {
        setUserRating(parseInt(storedRating, 10));
        setIsRatingSubmitted(true);
      }
    }

    // Fetch similar games
    const fetchSimilarGames = async () => {
      setLoadingSimilarGames(true);
      try {
        const games = await gameService.getSimilarGames(formattedGame.id, formattedGame.tags || [], 5);
        setSimilarGames(games);
      } catch (error) {
        console.error('Error fetching similar games:', error);
        setSimilarGames([]);
      } finally {
        setLoadingSimilarGames(false);
      }
    }
    fetchSimilarGames();
  }, [formattedGame]);

  // Check if desktop for responsive layout
  useEffect(() => {
    const checkIfDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  const handleGameClaimed = () => {
    setFormattedGame((prev) => (prev ? { ...prev, claimed: true } : prev));
    toast.success('Game claimed successfully! You can now add changelogs.');
  };

  const handleRateGame = async (rating: number) => {
    if (isRatingLoading) return;

    setIsRatingLoading(true);
    try {
      await rateGame(formattedGame.id, rating);
      
      // Update local state
      setUserRating(rating);
      setIsRatingSubmitted(true);
      localStorage.setItem(`game_rating_${formattedGame.id}`, rating.toString());
      
      // Update the game's rating in the UI
      setFormattedGame(prev => {
        const newCount = prev.rating_count + (userRating ? 0 : 1);
        const newAverage = userRating 
          ? (prev.rating_average * prev.rating_count - userRating + rating) / prev.rating_count
          : (prev.rating_average * prev.rating_count + rating) / newCount;
        
        return {
          ...prev,
          rating_average: newAverage,
          rating_count: newCount
        };
      });
      
      toast.success('Rating submitted!');
      
      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to rate game:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handleImageSelect = (image: string) => {
    setSelectedImage(image);
  };

  return (
    <>
      <GameVisitTracker gameId={formattedGame.id} />
      <HeroSection 
        formattedGame={formattedGame} 
        selectedImage={selectedImage}
        isBookmarked={isBookmarked}
        game={game} 
        toggleBookmark={toggleBookmark}
        handleGameClaimed={handleGameClaimed}
      />

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Tabs */}
        <div className="md:hidden border-b border-border mb-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-4 px-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'gallery' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-4 px-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Comments
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="md:hidden">
          {activeTab === 'overview' && (
            <GameOverview
              formattedGame={formattedGame}
              game={game}
              initialChangelogs={initialChangelogs}
              isGameDeveloper={isGameDeveloper}
              userRating={userRating}
              handleRateGame={handleRateGame}
            />
          )}
          
          {activeTab === 'gallery' && (
            <GameGallery 
              gallery={formattedGame.gallery} 
              title={formattedGame.title}
              onImageSelect={handleImageSelect}
            />
          )}
          
          {activeTab === 'comments' && (
            <GameComments 
              gameId={formattedGame.id}
              initialComments={initialComments}
            />
          )}
        </div>

        {/* Desktop Content */}
        <div className="hidden md:block">
          <GameOverview
            formattedGame={formattedGame}
            game={game}
            initialChangelogs={initialChangelogs}
            isGameDeveloper={isGameDeveloper}
            userRating={userRating}
            handleRateGame={handleRateGame}
          />
          
          {formattedGame.gallery && formattedGame.gallery.length > 0 && (
            <GameGallery 
              gallery={formattedGame.gallery} 
              title={formattedGame.title}
              onImageSelect={handleImageSelect}
            />
          )}
          
          <GameComments 
            gameId={formattedGame.id}
            initialComments={initialComments}
          />
        </div>

        {/* Similar Games */}
        {similarGames.length > 0 && (
          <GameCarousel
            title="Similar Games"
            games={similarGames.map((game) => ({
              id: game.id,
              title: game.title,
              slug: game.slug || '',
              image: game.image_url || '/placeholder.png',
              year: game.created_at ? new Date(game.created_at).getFullYear().toString() : 'Unknown',
              rating: game.rating_average || 0,
              is_mobile_compatible: game.is_mobile_compatible,
              is_multiplayer: game.is_multiplayer
            }))}
            viewAllLink="/games"
            loading={loadingSimilarGames}
          />
        )}
      </div>
    </>
  );
}