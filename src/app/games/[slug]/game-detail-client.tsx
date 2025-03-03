"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import GameCarousel from '@/components/game-carousel'
import { FiPlay, FiPlus, FiThumbsUp, FiShare2, FiDownload, FiStar } from 'react-icons/fi'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'
import { toast } from 'react-hot-toast'

// Mock data for similar games - to be replaced with real data later
const similarGames = [
  {
    id: "2",
    title: "Gunpowder Milkshake",
    slug: "gunpowder-milkshake",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070",
    year: "2023",
    rating: 8.7
  },
  {
    id: "3",
    title: "Red Notice",
    slug: "red-notice",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071",
    year: "2022",
    rating: 7.9
  },
  {
    id: "5",
    title: "Bloodshot",
    slug: "bloodshot",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059",
    year: "2021",
    rating: 7.5
  },
  {
    id: "7",
    title: "Extraction",
    slug: "extraction",
    image: "https://images.unsplash.com/photo-1559163499-413811fb2344?q=80&w=2070",
    year: "2021",
    rating: 9.1
  },
];

// Define a type for the formatted game object
type FormattedGame = {
  id: string;
  title: string;
  slug: string;
  description: string;
  feature_image: string;
  year: string;
  rating_average: number;
  rating_count: number;
  creator: {
    name: string;
    image: string;
    social_link: string;
  };
  features: string[];
  gallery: string[];
  is_multiplayer?: boolean;
  is_mobile_compatible?: boolean;
  visit_count: number;
};

// Function to convert a game object to a display-friendly format
const formatGameForDisplay = (game: Game): FormattedGame => {
  return {
    id: game.id,
    title: game.title,
    slug: game.title.toLowerCase().replace(/\s+/g, '-'),
    description: game.description,
    feature_image: game.image_url,
    year: new Date(game.created_at).getFullYear().toString(),
    rating_average: game.rating_average || 0,
    rating_count: game.rating_count || 0,
    creator: {
      name: game.developer,
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2074", // Default image
      social_link: game.developer_url || "#"
    },
    features: game.tags || [],
    gallery: game.gallery_images || [game.image_url],
    is_multiplayer: game.is_multiplayer,
    is_mobile_compatible: game.is_mobile_compatible,
    visit_count: game.visit_count || 0
  };
};

export default function GameDetailClient({ slug }: { slug: string }) {
  const [game, setGame] = useState<FormattedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  
  // Check if user has already rated this game from localStorage
  useEffect(() => {
    if (game?.id) {
      const storedRating = localStorage.getItem(`game_rating_${game.id}`);
      if (storedRating) {
        setUserRating(parseInt(storedRating));
        setIsRatingSubmitted(true);
      }
    }
  }, [game?.id]);
  
  // Function to handle rating submission
  const handleRateGame = async (rating: number) => {
    if (!game?.id || isRatingSubmitted) return;
    
    setIsRatingLoading(true);
    
    try {
      const result = await gameService.rateGame(game.id, rating);
      
      if (result.success) {
        // Save to localStorage to prevent multiple ratings
        localStorage.setItem(`game_rating_${game.id}`, rating.toString());
        setUserRating(rating);
        setIsRatingSubmitted(true);
        toast.success('Rating submitted successfully!');
        
        // Update the game object with new rating
        setGame((prev: FormattedGame | null) => {
          if (!prev) return null;
          return ({
          ...prev,
          rating_count: (prev.rating_count || 0) + 1,
          rating_average: ((prev.rating_average || 0) * (prev.rating_count || 0) + rating) / ((prev.rating_count || 0) + 1)
        });
        });
      } else {
        toast.error(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error rating game:', error);
      toast.error('An error occurred while submitting your rating');
    } finally {
      setIsRatingLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      try {
        const gameData = await gameService.getGameBySlug(slug);
        
        if (gameData) {
          const formattedGame = formatGameForDisplay(gameData);
          setGame(formattedGame);
          setSelectedImage(formattedGame.feature_image);
        } else {
          // If game not found, show error
          toast.error('Game not found');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        toast.error('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchGameData();
    }
    
    // Check if we're on desktop
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Initial check
    checkIfDesktop();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfDesktop);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, [slug]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Game not found</div>
      </div>
    );
  }
  
  return (
    <>
      {/* Hero Section */}
      <div className="relative w-full h-[70vh] min-h-[500px]">
        <div className="absolute inset-0">
          <Image
            src={selectedImage}
            alt={game.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{game.title}</h1>
            
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm bg-primary text-white px-2 py-1 rounded">
                {game.rating_average ? game.rating_average.toFixed(1) : 'N/A'}/5
              </span>
              {game.year && (
                <span className="text-sm">{game.year}</span>
              )}
              <div className="flex space-x-2">
                {game.features.slice(0, 3).map((feature: string) => (
                  <span key={feature} className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <Link 
                href={`/games/${game.slug}/play`}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
              >
                <FiPlay className="h-5 w-5" />
                <span>Play Now</span>
              </Link>
              
              <button className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
                <FiPlus className="h-5 w-5" />
              </button>
              
              <button className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
                <FiThumbsUp className="h-5 w-5" />
              </button>
              
              <button className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
                <FiShare2 className="h-5 w-5" />
              </button>
              
              <button className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
                <FiDownload className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={game.creator.image}
                  alt={game.creator.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <a 
                  href={game.creator.social_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {game.creator.name}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Tabs - Only visible on mobile */}
        <div className="md:hidden border-b border-border mb-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'gallery' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'comments' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Comments
            </button>
          </div>
        </div>
        
        {/* Content - Mobile: Tab-based, Desktop: All visible */}
        <div className="mb-12">
          {/* Overview - Always visible on desktop, conditionally on mobile */}
          {(activeTab === 'overview' || isDesktop) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <h2 className="text-2xl font-semibold mb-4 col-span-full">About this game</h2>
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-6">{game.description}</p>
                
                <h3 className="text-xl font-semibold mb-3">Features</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {game.features.map((feature: string) => (
                    <span key={feature} className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4">Game Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Release Date</h3>
                    <p>{game.year}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
                    <p>{game.creator.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Visits</h3>
                    <p>{game.visit_count?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
                    <div className="flex items-center space-x-2">
                      <p>{game.rating_average ? game.rating_average.toFixed(1) : 'N/A'}/5</p>
                      <span className="text-xs text-muted-foreground">({game.rating_count || 0} ratings)</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Features</h3>
                    <p>{game.features.join(', ')}</p>
                  </div>
                  
                  {/* Rating Component */}
                  <div className="mt-6 p-4 bg-accent rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Rate this game</h3>
                    <div className="flex items-center space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => !isRatingSubmitted && handleRateGame(star)}
                          disabled={isRatingSubmitted || isRatingLoading}
                          className={`text-xl transition-colors ${isRatingLoading ? 'opacity-50' : ''} ${userRating && userRating >= star ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-400'}`}
                          aria-label={`Rate ${star} stars`}
                        >
                          <FiStar className={userRating && userRating >= star ? 'fill-current' : ''} />
                        </button>
                      ))}
                    </div>
                    {isRatingSubmitted ? (
                      <p className="text-xs text-green-500">Thanks for your rating!</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Click to rate</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Gallery - Always visible on desktop, conditionally on mobile */}
          {(activeTab === 'gallery' || isDesktop) && (
            <div className="mb-12 md:border-t md:border-border md:pt-12">
              <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {game.gallery.map((image: string, index: number) => (
                  <div 
                    key={index}
                    className={`relative aspect-video rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                      selectedImage === image ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={image}
                      alt={`${game.title} screenshot ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Comments - Always visible on desktop, conditionally on mobile */}
          {(activeTab === 'comments' || isDesktop) && (
            <div className="md:border-t md:border-border md:pt-12">
              <h2 className="text-2xl font-semibold mb-4">Comments</h2>
              <div className="bg-card rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Add a comment</h3>
                <textarea 
                  className="w-full bg-background border border-input rounded-md p-3 mb-4"
                  rows={4}
                  placeholder="Share your thoughts about this game..."
                ></textarea>
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors">
                  Post Comment
                </button>
              </div>
              
              <div className="space-y-6">
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Similar Games */}
        <GameCarousel 
          title="Similar Games" 
          games={similarGames} 
          viewAllLink="/games"
        />
      </div>
    </>
  );
}
