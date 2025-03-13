// src/app/games/[slug]/game-detail-client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  isGameDeveloper: initialIsGameDeveloper,
  userRating: initialUserRating,
  comments: initialComments,
}: GameDetailClientProps) {
  // console.log('🔄 GameDetailClient rendering', { slug, claimed: game.claimed, isGameDeveloper: initialIsGameDeveloper });
  
  // Add render counter to track component renders
  // const renderCount = useRef(0);
  // useEffect(() => {
  //   renderCount.current += 1;
  //   console.log(`🔢 Render count: ${renderCount.current}`);
  // });
  
  const [formattedGame, setFormattedGame] = useState<FormattedGame>(formatGameForDisplay(game));
  const [selectedImage, setSelectedImage] = useState<string>(formattedGame.feature_image);
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [loadingSimilarGames, setLoadingSimilarGames] = useState(false);
  const [hasFetchedSimilarGames, setHasFetchedSimilarGames] = useState(false);
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);
  // Keep track of URL parameters being processed to prevent duplicate processing
  const [processedUrlParams, setProcessedUrlParams] = useState<{[key: string]: boolean}>({});
  // Client-side game developer status determination
  const [isGameDeveloper, setIsGameDeveloper] = useState<boolean>(initialIsGameDeveloper);
  
  const canonicalUrl = `https://gamelab.vercel.app/games/${slug}`;
  const router = useRouter();
  
  // Track state changes
  // useEffect(() => {
  //   console.log('📊 State updated - formattedGame:', { 
  //     id: formattedGame.id, 
  //     claimed: formattedGame.claimed,
  //     hasFetchedSimilarGames,
  //     hasHandledSuccess,
  //     isGameDeveloper
  //   });
  // }, [formattedGame, hasFetchedSimilarGames, hasHandledSuccess, isGameDeveloper]);
  
  // Mobile tabs state
  const [activeTab, setActiveTab] = useState('overview');
  const [isDesktop, setIsDesktop] = useState(false);

  // Check for URL parameters on component mount - WITH FIX to prevent infinite loop
  useEffect(() => {
   // console.log('🔍 URL parameter check effect running');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
  //  console.log('📝 URL parameters:', { error, success, hasHandledSuccess, processedUrlParams });
    
    // If there's a success parameter indicating successful game claiming
    if (success === 'game-claimed') {
      // Always set isGameDeveloper to true if success=game-claimed is present
      // This ensures the user is recognized as the developer regardless of server-side state
    //  console.log('🔑 Setting isGameDeveloper to true based on success parameter');
      setIsGameDeveloper(true);
    }
    
    // Handle error parameter
    if (error && !processedUrlParams[`error-${error}`]) {
    //  console.log('❌ Handling error parameter:', error);
      
      // Mark this error as processed to prevent reprocessing
      setProcessedUrlParams(prev => ({...prev, [`error-${error}`]: true}));
      
      switch (error) {
        case 'auth_failed':
          toast.error('Authentication failed. Please try again.');
          break;
        case 'game_not_found':
          toast.error('Game not found.');
          break;
        case 'invalid_developer_url':
          toast.error('Invalid developer URL. Please add a valid Twitter/X URL to your game.');
          break;
        case 'not_your_game':
          toast.error('The X handle in your profile does not match the game\'s developer URL.');
          break;
        case 'update_failed':
          toast.error('Failed to claim the game. Please try again.');
          break;
        case 'already_claimed_by_another':
          toast.error('This game has already been claimed by another developer.');
          break;
        default:
          toast.error('An error occurred. Please try again.');
          break;
      }
      
      // Remove the error parameter from the URL
      urlParams.delete('error');
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Handle success parameter - only if we haven't processed it already and game is not claimed
    const successParam = success === 'game-claimed';
    const needToProcess = successParam && !processedUrlParams['success-game-claimed'] && !hasHandledSuccess;
    
    if (needToProcess) {
      // console.log('✅ Handling success parameter: game-claimed', { 
      //   alreadyProcessed: processedUrlParams['success-game-claimed'],
      //   hasHandledSuccess
      // });
      
      // Mark this success as processed to prevent reprocessing
      setProcessedUrlParams(prev => ({...prev, 'success-game-claimed': true}));
      
      // Only update claimed status if it's not already true
      if (!formattedGame.claimed) {
        handleGameClaimed();
      } else {
    //   console.log('✅ Game already claimed, skipping state update');
        // Still need to mark as handled to prevent infinite loop
        setHasHandledSuccess(true);
      }
      
      // Remove the success parameter from the URL
      urlParams.delete('success');
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [formattedGame.claimed, processedUrlParams]); // Remove hasHandledSuccess from dependencies 
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    if (success === 'game-claimed' && !processedUrlParams['success-game-claimed']) {
      setIsGameDeveloper(true);
      setProcessedUrlParams(prev => ({ ...prev, 'success-game-claimed': true }));
      urlParams.delete('success');
      window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`);
    }
  }, [processedUrlParams]);

  const handleGameClaimed = () => {
    // console.log('🎮 handleGameClaimed called');
    // console.log('🎮 Current claimed status:', formattedGame.claimed);
    
    // Only update if not already claimed to prevent unnecessary state updates
    if (!formattedGame.claimed) {
    //  console.log('🎮 Updating game claimed status to true');
      // Update the game state to reflect the claimed status
      setFormattedGame((prev) => ({ ...prev, claimed: true }));
      
      // Set the user as the game developer since they just claimed it
      setIsGameDeveloper(true);
      
      // Force a page refresh to reload server components with new authentication state
      window.location.href = window.location.pathname;
    } else {
     // console.log('🎮 Game already claimed, skipping state update');
      // Even if already claimed, ensure developer status is true since they just authenticated
      setIsGameDeveloper(true);
    }
    
    // Mark as handled to prevent re-processing
    setHasHandledSuccess(true);
   // console.log('✅ Set hasHandledSuccess to true');
    
    // Show success toast (we can still show this even if we didn't update state)
    toast.success('Game claimed successfully! You can now add changelogs.');
  };

  // Handle stored rating and initial setup - only runs once
  useEffect(() => {
    console.log('💾 Loading stored rating effect running');
    if (formattedGame.id) {
      const storedRating = localStorage.getItem(`game_rating_${formattedGame.id}`);
     // console.log('💾 Stored rating for game', formattedGame.id, ':', storedRating);
      if (storedRating) {
        setUserRating(parseInt(storedRating, 10));
        setIsRatingSubmitted(true);
      }
    }
  }, [formattedGame.id]); // Only depend on the ID, not the entire object

  // Fetch similar games separately, only once
  useEffect(() => {
    // console.log('🎲 Similar games effect running', { 
    //   gameId: formattedGame.id, 
    //   hasFetchedSimilarGames, 
    //   tagCount: formattedGame.tags?.length 
    // });
    
    if (formattedGame.id && !hasFetchedSimilarGames) {
     // console.log('🎲 Fetching similar games...');
      const fetchSimilarGames = async () => {
        setLoadingSimilarGames(true);
        try {
          const games = await gameService.getSimilarGames(formattedGame.id, formattedGame.tags || [], 5);
        //  console.log(`🎲 Fetched ${games.length} similar games`);
          setSimilarGames(games);
          setHasFetchedSimilarGames(true);
        //  console.log('🎲 Set hasFetchedSimilarGames to true');
        } catch (error) {
          console.error('Error fetching similar games:', error);
          setSimilarGames([]);
        } finally {
          setLoadingSimilarGames(false);
        }
      }
      fetchSimilarGames();
    } else {
      // console.log('🎲 Skipping similar games fetch', { 
      //   hasId: !!formattedGame.id, 
      //   alreadyFetched: hasFetchedSimilarGames 
      // });
    }
  }, [formattedGame.id, formattedGame.tags, hasFetchedSimilarGames]);

  // Check if desktop for responsive layout
  useEffect(() => {
   // console.log('📱 Responsive layout effect running');
    const checkIfDesktop = () => {
      const isDesktopNow = window.innerWidth >= 768;
   //   console.log('📱 Device is desktop:', isDesktopNow);
      setIsDesktop(isDesktopNow);
    };
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  const handleRateGame = async (rating: number) => {
    if (isRatingLoading) return;

   // console.log('⭐ Submitting rating:', rating);
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
        
      //  console.log('⭐ Updated rating stats:', { newAverage, newCount });
        return {
          ...prev,
          rating_average: newAverage,
          rating_count: newCount
        };
      });
      
      toast.success('Rating submitted!');
      
      // Refresh the page to get updated data
    //  console.log('⭐ Refreshing page for updated data');
      router.refresh();
    } catch (error) {
      console.error('Failed to rate game:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handleImageSelect = (image: string) => {
   // console.log('🖼️ Selected image:', image);
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