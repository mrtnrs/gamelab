import Header from '@/components/header';
import Footer from '@/components/footer';
import HeroBanner from '@/components/hero-banner';
import GameCarousel from '@/components/game-carousel';
import { gameService } from '@/services/game-service';
import { Game } from '@/types/game';
import BookmarkedGamesSection from '@/components/bookmarked-games-section';

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
  return games.map(game => ({
    id: game.id,
    title: game.title,
    slug: game.title.toLowerCase().replace(/\s+/g, '-'),
    image: game.image_url,
    year: new Date(game.created_at).getFullYear().toString(),
    rating: game.rating_average ? Math.round(game.rating_average * 10) / 10 : undefined
  }));
}

export default async function Home() {
  // Fetch games from Supabase
  const topRatedGames = await gameService.getTopRatedGames(10);
  const newReleases = await gameService.getNewReleases(10);
  
  // Get the most visited game for the hero banner
  const mostVisitedGames = await gameService.getTopRatedGames(1);
  
  // Use the most visited game for the hero banner or fallback
  const featuredGame = mostVisitedGames.length > 0 ? {
    id: mostVisitedGames[0].id,
    title: mostVisitedGames[0].title,
    description: mostVisitedGames[0].description,
    slug: mostVisitedGames[0].title.toLowerCase().replace(/\s+/g, '-'),
    image: mostVisitedGames[0].image_url,
    year: new Date(mostVisitedGames[0].created_at).getFullYear().toString(),
    rating: mostVisitedGames[0].rating_average ? 
      `${Math.round(mostVisitedGames[0].rating_average * 10) / 10}/5` : 
      "Not rated"
  } : fallbackFeaturedGame;
  
  // Format games for carousel or use fallbacks if empty
  const formattedTopRatedGames = topRatedGames.length > 0 ? 
    formatGamesForCarousel(topRatedGames) : 
    fallbackGames;
    
  const formattedNewReleases = newReleases.length > 0 ? 
    formatGamesForCarousel(newReleases) : 
    fallbackGames;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16">
        <HeroBanner {...featuredGame} />
        
        <div className="container mx-auto px-4 py-8">
          <GameCarousel 
            title="Top Rated" 
            games={formattedTopRatedGames} 
            viewAllLink="/games?category=top-rated"
          />
          
          <GameCarousel 
            title="New Releases" 
            games={formattedNewReleases} 
            viewAllLink="/games?category=new"
          />
          
          <BookmarkedGamesSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
