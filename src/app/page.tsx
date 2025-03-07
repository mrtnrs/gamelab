import Header from '@/components/header';
import Footer from '@/components/footer';
import HeroBanner from '@/components/hero-banner';
import HeroBannerSlider from '@/components/hero-banner-slider';
import GameCarousel from '@/components/game-carousel';
import { gameService } from '@/services/game-service';
import { Game } from '@/types/game';
import BookmarkedGamesSection from '@/components/bookmarked-games-section';
import { generateSlug } from '@/utils/slug';

// Fallback data in case database is empty
const fallbackFeaturedGame = {
  id: "1",
  title: "Army of the Dead",
  description: "A group of mercenaries takes the ultimate gamble by venturing into a quarantine zone following a zombie outbreak in Las Vegas in hopes of pulling off an impossible heist.",
  slug: "army-of-the-dead",
  image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070",
  year: "2023",
  rating: "9.5/10"
};

const fallbackGames = [
  {
    id: "1",
    title: "Army of the Dead",
    slug: "army-of-the-dead",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070",
    year: "2023",
    rating: 9.5
  },
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
];

// Helper function to convert Game to carousel format
function formatGamesForCarousel(games: Game[]) {
  return games.map(game => {
    // Use the slug from the game object if available, otherwise generate it
    const slug = game.slug || generateSlug(game.title);
    // Use a placeholder image if image_url is missing
    const defaultImage = '/placeholder-game.jpg';
    const imageUrl = game.image_url || defaultImage;
    
    return {
      id: game.id,
      title: game.title,
      slug: slug,
      image: imageUrl,
      year: new Date(game.created_at).toLocaleString('default', { month: 'short' }) + ' ' + new Date(game.created_at).getFullYear(),
      rating: game.rating_average ? Math.round(game.rating_average * 10) / 10 : undefined,
      is_mobile_compatible: game.is_mobile_compatible,
      is_multiplayer: game.is_multiplayer
    };
  });
}

export default async function Home() {
  // Fetch games from Supabase
  const topRatedGames = await gameService.getTopRatedGames(10);
  const newReleases = await gameService.getNewReleases(10);
  const mobileGames = await gameService.getMobileGames(10);
  const trendingGames = await gameService.getTrendingGames(10);
  const multiplayerGames = await gameService.getMultiplayerGames(10);
  
  // Get featured game for the hero banner
  const featuredGames = await gameService.getFeaturedGames();
  
  // Use the featured game for the hero banner or fallback
  const featuredGame = featuredGames.length > 0 ? {
    id: featuredGames[0].id,
    title: featuredGames[0].title,
    description: featuredGames[0].description,
    slug: featuredGames[0].slug || generateSlug(featuredGames[0].title),
    image: featuredGames[0].image_url || '/placeholder-game.jpg',
    year: new Date(featuredGames[0].created_at).toLocaleString('default', { month: 'short' }) + ' ' + new Date(featuredGames[0].created_at).getFullYear(),
    rating: featuredGames[0].rating_average ? 
      `${Math.round(featuredGames[0].rating_average * 10) / 10}/5` : 
      "Not rated",
    rating_average: featuredGames[0].rating_average ? 
      Math.round(featuredGames[0].rating_average * 10) / 10 : 
      undefined
  } : fallbackFeaturedGame;
  
  // Format featured games for the slider
  const formattedFeaturedGames = featuredGames.length > 0 ? 
    featuredGames.map(game => ({
      id: game.id,
      title: game.title,
      description: game.description,
      slug: game.slug || generateSlug(game.title),
      image: game.image_url || '/placeholder-game.jpg',
      year: new Date(game.created_at).getFullYear().toString(),
      rating: game.rating_average ? 
        `${Math.round(game.rating_average * 10) / 10}/5` : 
        "Not rated",
      rating_average: game.rating_average ? 
        Math.round(game.rating_average * 10) / 10 : 
        undefined
    })) : 
    [fallbackFeaturedGame];
  
  // Format games for carousel or use fallbacks if empty
  const formattedTopRatedGames = topRatedGames.length > 0 ? 
    formatGamesForCarousel(topRatedGames) : 
    fallbackGames;
    
  const formattedNewReleases = newReleases.length > 0 ? 
    formatGamesForCarousel(newReleases) : 
    fallbackGames;
    
  const formattedMobileGames = mobileGames.length > 0 ?
    formatGamesForCarousel(mobileGames) :
    fallbackGames;
    
  const formattedTrendingGames = trendingGames.length > 0 ?
    formatGamesForCarousel(trendingGames) :
    fallbackGames;
    
  const formattedMultiplayerGames = multiplayerGames.length > 0 ?
    formatGamesForCarousel(multiplayerGames) :
    fallbackGames;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16">
        {featuredGames.length > 1 ? (
          <HeroBannerSlider featuredGames={formattedFeaturedGames} />
        ) : (
          <HeroBanner {...featuredGame} />
        )}
        
        <div className="container mx-auto px-4 py-8">
          <GameCarousel 
            title="🔥 Trending" 
            games={formattedTrendingGames} 
            viewAllLink="/games?category=trending"
          />
          
          <GameCarousel 
            title="💯 Top Rated" 
            games={formattedTopRatedGames} 
            viewAllLink="/games?category=top-rated"
          />
          
          <GameCarousel 
            title="🎁 New Releases" 
            games={formattedNewReleases} 
            viewAllLink="/games?category=new"
          />
          
          <GameCarousel 
            title="📱 Mobile Games" 
            games={formattedMobileGames} 
            viewAllLink="/games?category=mobile"
          />
          
          <GameCarousel 
            title="👥 Multiplayer Games" 
            games={formattedMultiplayerGames} 
            viewAllLink="/games?category=multiplayer"
          />
          
          <BookmarkedGamesSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
