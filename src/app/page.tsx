import Header from '@/components/header';
import Footer from '@/components/footer';
import HeroBanner from '@/components/hero-banner';
import GameCarousel from '@/components/game-carousel';
import { gameService } from '@/services/game-service';
import { Game } from '@/types/game';

// Fallback data in case database is empty
const fallbackFeaturedGame = {
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
  return games.map(game => ({
    id: game.id,
    title: game.title,
    slug: game.title.toLowerCase().replace(/\s+/g, '-'),
    image: game.image_url,
    year: new Date(game.created_at).getFullYear().toString(),
    rating: 8.5 // Default rating since we don't have this in our schema
  }));
}

export default async function Home() {
  // Fetch games from Supabase
  const allGames = await gameService.getGames();
  const featuredGames = await gameService.getFeaturedGames();
  
  // Use the first featured game for the hero banner or fallback
  const featuredGame = featuredGames.length > 0 ? {
    title: featuredGames[0].title,
    description: featuredGames[0].description,
    slug: featuredGames[0].title.toLowerCase().replace(/\s+/g, '-'),
    image: featuredGames[0].image_url,
    year: new Date(featuredGames[0].created_at).getFullYear().toString(),
    rating: "9.5/10" // Default rating
  } : fallbackFeaturedGame;
  
  // Prepare game categories
  const actionGames = allGames.filter(game => game.category === 'Action');
  const adventureGames = allGames.filter(game => game.category === 'Adventure');
  const strategyGames = allGames.filter(game => game.category === 'Strategy');
  
  // Format games for carousel or use fallbacks if empty
  const trendingGames = allGames.length > 0 ? formatGamesForCarousel(allGames) : fallbackGames;
  const topRatedGames = featuredGames.length > 0 ? formatGamesForCarousel(featuredGames) : fallbackGames;
  const newGames = actionGames.length > 0 ? formatGamesForCarousel(actionGames) : fallbackGames;
  const bookmarkedGames = adventureGames.length > 0 ? formatGamesForCarousel(adventureGames) : fallbackGames;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16">
        <HeroBanner {...featuredGame} />
        
        <div className="container mx-auto px-4 py-8">
          <GameCarousel 
            title="Trending Games" 
            games={trendingGames} 
            viewAllLink="/games?category=trending"
          />
          
          <GameCarousel 
            title="Top Rated" 
            games={topRatedGames} 
            viewAllLink="/games?category=top-rated"
          />
          
          <GameCarousel 
            title="New Releases" 
            games={newGames} 
            viewAllLink="/games?category=new"
          />
          
          <GameCarousel 
            title="Bookmarked" 
            games={bookmarkedGames} 
            viewAllLink="/games?category=bookmarked"
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
