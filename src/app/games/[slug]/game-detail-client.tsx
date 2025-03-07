"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import GameCarousel from '@/components/game-carousel'
import { GameStructuredData } from '@/components/structured-data'
import { FiPlay, FiExternalLink, FiStar, FiSend } from 'react-icons/fi'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { gameService, GameComment } from '@/services/game-service'
import { Game } from '@/types/game'
import { toast } from 'react-hot-toast'
import { useBookmarks } from '@/contexts/bookmark-context'
import { formatDistanceToNow } from 'date-fns'
import { generateSlug } from '@/utils/slug'
import ClaimGameButton from '@/components/claim-game-button'
import ChangelogManager from '@/components/changelog-manager'
import VerifiedBadge from '@/components/verified-badge'

// Game carousel item type
type GameCarouselItem = {
  id: string;
  title: string;
  slug: string;
  image: string;
  year: string;
  rating: number;
};

// Define a type for the formatted game object
type FormattedGame = {
  id: string;
  title: string;
  slug: string;
  description: string;
  feature_image: string;
  year: string;
  url: string;
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
  claimed?: boolean;
};

// Function to convert a game object to a display-friendly format
const formatGameForDisplay = (game: Game): FormattedGame => {
  // Use a placeholder image if image_url is missing
  const defaultImage = '/placeholder-game.jpg';
  const imageUrl = game.image_url || defaultImage;
  
  return {
    id: game.id,
    title: game.title,
    url: game.url,
    slug: game.slug || generateSlug(game.title),
    description: game.description,
    feature_image: imageUrl,
    year: new Date(game.created_at).getFullYear().toString(),
    rating_average: game.rating_average || 0,
    rating_count: game.rating_count || 0,
    creator: {
      name: game.developer,
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2074", // Default image
      social_link: game.developer_url || "#"
    },
    features: game.tags || [],
    gallery: game.gallery_images || [imageUrl],
    is_multiplayer: game.is_multiplayer,
    is_mobile_compatible: game.is_mobile_compatible,
    visit_count: game.visit_count || 0,
    claimed: game.claimed || false
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
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState('');
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [comments, setComments] = useState<GameComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [loadingSimilarGames, setLoadingSimilarGames] = useState(false);
  const commentTextRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  
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
    if (!game?.id) return;
    
    setIsRatingLoading(true);
    
    try {
      const result = await gameService.rateGame(game.id, rating);
      
      if (result.success) {
        // Save to localStorage to track user's rating
        localStorage.setItem(`game_rating_${game.id}`, rating.toString());
        setUserRating(rating);
        setIsRatingSubmitted(true);
        toast.success('Rating submitted successfully!');
        
        // Update the game object with new rating
        setGame((prev: FormattedGame | null) => {
          if (!prev) return null;
          
          // If user already rated, update the average without incrementing count
          if (isRatingSubmitted && userRating) {
            const totalRating = (prev.rating_average * prev.rating_count) - userRating + rating;
            return {
              ...prev,
              rating_average: totalRating / prev.rating_count
            };
          } else {
            // First time rating
            return {
              ...prev,
              rating_count: (prev.rating_count || 0) + 1,
              rating_average: ((prev.rating_average || 0) * (prev.rating_count || 0) + rating) / ((prev.rating_count || 0) + 1)
            };
          }
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
  
  // Function to fetch comments for a game
  const fetchComments = async (gameId: string) => {
    setLoadingComments(true);
    try {
      const commentsData = await gameService.getComments(gameId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };
  
  // Function to fetch similar games
  const fetchSimilarGames = async (gameId: string, tags: string[]) => {
    setLoadingSimilarGames(true);
    try {
      console.log('Fetching similar games for:', gameId, 'with tags:', tags);
      const similarGamesData = await gameService.getSimilarGames(gameId, tags);
      console.log('Similar games returned:', similarGamesData.length, similarGamesData);
      setSimilarGames(similarGamesData);
    } catch (error) {
      console.error('Error fetching similar games:', error);
    } finally {
      setLoadingSimilarGames(false);
    }
  };

  // Effect to fetch game data when slug changes
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      try {
        const gameData = await gameService.getGameBySlug(slug);
        
        if (gameData) {
          const formattedGame = formatGameForDisplay(gameData);
          setGame(formattedGame);
          setSelectedImage(formattedGame.feature_image);
          
          // Fetch comments for this game
          fetchComments(gameData.id);
          
          // Fetch similar games
          fetchSimilarGames(gameData.id, gameData.tags || []);
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
  }, [slug]);
  
  // Effect to check for URL parameters
  useEffect(() => {
    // Check for error or success messages in URL
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      toast.error(decodeURIComponent(error));
    }
    
    if (success) {
      toast.success(decodeURIComponent(success));
    }
  }, [searchParams]);
  
  // Effect to handle responsive design
  useEffect(() => {
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
  }, []);
  
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
  
  // Construct the canonical URL for structured data
  const canonicalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/games/${slug}` 
    : `https://gamelab.example.com/games/${slug}`;

  // Get the raw game data for structured data
  const rawGame = game as unknown as Game;

  return (
    <>
      {/* Add structured data for SEO */}
      <GameStructuredData game={rawGame} url={canonicalUrl} />
      
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
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/50 to-transparent dark:from-black/70 dark:via-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-transparent dark:from-black/70 dark:via-black/40" />
        </div>
        
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-24">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{game.title}</h1>
              {game.claimed && <VerifiedBadge className="h-6 w-6" />}
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              {game.rating_average !== undefined && game.rating_average > 0 && (
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => {
                    const starValue = i + 1;
                    if (starValue <= game.rating_average) {
                      return <FaStar key={i} className="text-yellow-400 w-4 h-4" />;
                    } else if (starValue - 0.5 <= game.rating_average) {
                      return <FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />;
                    } else {
                      return <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />;
                    }
                  })}
                  <span className="text-sm text-white ml-1">{game.rating_average.toFixed(1)}</span>
                </div>
              )}
              {game.year && (
                <span className="text-sm">{game.year}</span>
              )}
              <div className="flex space-x-2">
                {game.features.slice(0, 3).map((feature: string) => (
                  <span key={feature} className="text-xs bg-black/30 dark:bg-white/20 text-foreground dark:text-white px-2 py-1 rounded">
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
              
              <button 
                onClick={() => game && toggleBookmark({ id: game.id, title: game.title, slug: game.slug, image: game.feature_image, year: game.year })}
                className="bg-black/30 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/30 text-foreground dark:text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                aria-label={isBookmarked(game.id) ? "Remove from bookmarks" : "Add to bookmarks"}
              >
                {isBookmarked(game.id) ? (
                  <BsBookmarkFill className="h-5 w-5 text-primary" />
                ) : (
                  <BsBookmark className="h-5 w-5" />
                )}
              </button>
              
              <button 
                className="bg-black/30 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/30 text-foreground dark:text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                aria-label="Open game in new tab"
                onClick={() => {
                  // If game has an external URL, open it in a new tab
                  if (game.url) {
                    window.open(game.url, '_blank', 'noopener,noreferrer');
                  } else {
                    // Fallback to our play page if no external URL exists
                    window.open(`/games/${game.slug}/play`, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <FiExternalLink className="h-5 w-5" />
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
                <div className="flex items-center space-x-2">
                  <a 
                    href={game.creator.social_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {game.creator.name}
                  </a>
                  <ClaimGameButton 
                    gameId={game.id} 
                    gameSlug={game.slug}
                    developerUrl={game.creator.social_link}
                    claimed={game.claimed || false}
                    onGameClaimed={() => {
                      // Update local state to reflect the game is now claimed
                      setGame(prev => prev ? {...prev, claimed: true} : null)
                      
                      // Show success message
                      toast.success('Game claimed successfully! You can now add changelogs.')
                    }}
                  />
                </div>
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
                
                {/* Changelog Manager */}
                <ChangelogManager 
                  gameId={game.id}
                  claimed={game.claimed || false}
                />
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
                  <div className="hidden">
                    <h3 className="text-sm font-medium text-muted-foreground">Visits</h3>
                    <p>{game.visit_count?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
                    <div className="flex items-center space-x-2">
                      <p>{game.rating_average ? `${game.rating_average.toFixed(1)}/5` : 'N/A'}</p>
                      <span className="text-xs text-muted-foreground">({game.rating_count || 0} ratings)</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Features</h3>
                    <p>{game.features.join(', ')}</p>
                  </div>
                  
                  {/* Rating Component */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Rate this game</h3>
                    <div className="flex items-center space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRateGame(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          disabled={isRatingLoading}
                          className={`text-xl transition-colors ${isRatingLoading ? 'opacity-50' : ''}`}
                          aria-label={`Rate ${star} stars`}
                        >
                          {hoverRating !== null ? (
                            star <= hoverRating ? (
                              <FaStar className="text-yellow-500" />
                            ) : (
                              <FaRegStar className="text-gray-500" />
                            )
                          ) : userRating && userRating >= star ? (
                            <FaStar className="text-yellow-500" />
                          ) : (
                            <FaRegStar className="text-gray-500" />
                          )}
                        </button>
                      ))}
                    </div>
                    {isRatingSubmitted ? (
                      <p className="text-xs text-green-500">Thanks for your rating! You can change it anytime.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Click to rate</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Gallery - Always visible on desktop, conditionally on mobile */}
          {(activeTab === 'gallery' || isDesktop) && game.gallery && game.gallery.length > 0 && (
            <div className="mb-12 md:border-t md:border-border md:pt-12">
              <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {game.gallery.map((image: string, index: number) => (
                  <div 
                    key={index}
                    className={`relative aspect-video rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                      selectedImage === image ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedImage(image);
                      setFullScreenImage(image);
                      setShowFullImage(true);
                    }}
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
              
              {/* Comments List */}
              <div className="space-y-6 mb-6">
                {loadingComments ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse">Loading comments...</div>
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">
                              {comment.user_id ? comment.user_id.substring(0, 2).toUpperCase() : 'A'}
                            </span>
                          </div>
                          <span className="font-medium">
                            {comment.user_id ? `User ${comment.user_id.substring(0, 6)}` : 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-line">{comment.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
                )}
              </div>
              
              {/* Comment Form */}
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Add a comment</h3>
                <textarea 
                  ref={commentTextRef}
                  className="w-full bg-background border border-input rounded-md p-3 mb-4"
                  rows={4}
                  placeholder="Share your thoughts about this game..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmittingComment}
                ></textarea>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
                  <button 
                    className={`flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors mb-2 sm:mb-0 ${isSubmittingComment ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={async () => {
                      if (!game || !commentText.trim() || isSubmittingComment) return;
                      
                      setIsSubmittingComment(true);
                      try {
                        const result = await gameService.addComment(game.id, commentText.trim());
                        
                        if (result.success) {
                          toast.success('Comment posted successfully!');
                          setCommentText('');
                          // Refresh comments
                          if (game) fetchComments(game.id);
                        } else {
                          toast.error(result.error || 'Failed to post comment');
                        }
                      } catch (error) {
                        console.error('Error posting comment:', error);
                        toast.error('An error occurred while posting your comment');
                      } finally {
                        setIsSubmittingComment(false);
                      }
                    }}
                    disabled={isSubmittingComment || !commentText.trim()}
                  >
                    <FiSend className="h-4 w-4" />
                    <span>Post Comment</span>
                  </button>
                  <p className="text-xs hidden text-muted-foreground">Comments are limited to one per user per day to prevent spam</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Similar Games */}
        <GameCarousel 
          title="Similar Games" 
          games={similarGames.map(g => {
            // Use the normalized slug utility function
            const slug = g.slug || generateSlug(g.title);
            // Use a placeholder image if image_url is missing
            const defaultImage = '/placeholder-game.jpg';
            const imageUrl = g.image_url || defaultImage;
            
            console.log('Processing similar game:', g.title, 'with slug:', slug);
            return {
              id: g.id,
              title: g.title,
              slug: slug,
              image: imageUrl,
              year: new Date(g.created_at).toLocaleString('default', { month: 'short' }) + ' ' + new Date(g.created_at).getFullYear(),
              rating: g.rating_average || 0,
              is_mobile_compatible: g.is_mobile_compatible,
              is_multiplayer: g.is_multiplayer
            };
          })}
          viewAllLink="/games"
          loading={loadingSimilarGames}
        />
        
        {/* Full screen image viewer */}
        {showFullImage && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
            <div className="relative w-full max-w-5xl max-h-[90vh] aspect-video">
              <Image 
                src={fullScreenImage} 
                alt="Full screen image"
                fill
                className="object-contain"
              />
            </div>
            <button 
              className="absolute top-4 right-4 text-white text-xl"
              onClick={() => setShowFullImage(false)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}
