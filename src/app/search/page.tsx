"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { FiSearch } from 'react-icons/fi'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'
import { generateSlug } from '@/utils/slug'
import { FiSmartphone, FiUsers } from 'react-icons/fi'

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [mobileOnly, setMobileOnly] = useState<boolean>(false);
  const [multiplayerOnly, setMultiplayerOnly] = useState<boolean>(false);
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Fetch games and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gamesData, categoriesData] = await Promise.all([
          gameService.getGames(),
          gameService.getAllCategories()
        ]);
        setGames(gamesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter and sort games based on user selections
  const filteredGames = games
    .filter(game => {
      // Text search filter
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.some(cat => game.category?.toLowerCase() === cat.toLowerCase());
      
      // Rating filter
      const matchesRating = (game.rating_average || 0) >= minRating;
      
      // Mobile compatibility filter
      const matchesMobile = !mobileOnly || game.is_mobile_compatible;
      
      // Multiplayer filter
      const matchesMultiplayer = !multiplayerOnly || game.is_multiplayer;
      
      return matchesSearch && matchesCategory && matchesRating && matchesMobile && matchesMultiplayer;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating_average || 0) - (a.rating_average || 0);
      } else if (sortBy === 'newest') {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      } else if (sortBy === 'popular') {
        return (b.visit_count || 0) - (a.visit_count || 0);
      }
      // Default: relevance (based on title match)
      return a.title.toLowerCase().indexOf(searchQuery.toLowerCase()) - 
             b.title.toLowerCase().indexOf(searchQuery.toLowerCase());
    });
  
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Search Games</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Filters</h2>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Categories</h3>
                  <div className="space-y-2">
                    {loading ? (
                      <p className="text-sm text-muted-foreground">Loading categories...</p>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-input mr-2"
                            checked={selectedCategories.includes(category.name)}
                            onChange={() => toggleCategory(category.name)}
                          />
                          <span>{category.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories found</p>
                    )}
                  </div>
                </div>
                
                {/* Mobile & Multiplayer Filters */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Game Type</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-input mr-2"
                        checked={mobileOnly}
                        onChange={() => setMobileOnly(!mobileOnly)}
                      />
                      <FiSmartphone className="mr-1" />
                      <span>Mobile Compatible</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-input mr-2"
                        checked={multiplayerOnly}
                        onChange={() => setMultiplayerOnly(!multiplayerOnly)}
                      />
                      <FiUsers className="mr-1" />
                      <span>Multiplayer</span>
                    </label>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Minimum Rating</h3>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span>{minRating}</span>
                    <span>10</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-background border border-input rounded-md p-2"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating (High to Low)</option>
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Search Results */}
            <div className="lg:col-span-3">
              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Search games..."
                  className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <p className="text-muted-foreground">
                  {filteredGames.length} {filteredGames.length === 1 ? 'result' : 'results'} found
                </p>
              </div>
              
              {loading ? (
                <div className="text-center py-12 bg-card rounded-lg">
                  <p className="text-muted-foreground">Loading games...</p>
                </div>
              ) : filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map((game) => (
                    <Link 
                      key={game.id}
                      href={`/games/${generateSlug(game.title)}`}
                      className="group bg-card rounded-lg overflow-hidden transition-transform hover:-translate-y-1"
                    >
                      <div className="aspect-video relative">
                        <Image
                          src={game.image_url || '/placeholder-game.jpg'}
                          alt={game.title}
                          fill
                          className="object-cover"
                        />
                        {game.rating_average > 0 && (
                          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                            {game.rating_average.toFixed(1)}
                          </div>
                        )}
                        {/* Game type indicators */}
                        <div className="absolute bottom-2 left-2 flex space-x-1">
                          {game.is_mobile_compatible && (
                            <div className="bg-black/70 text-white text-xs p-1 rounded-full">
                              <FiSmartphone size={14} />
                            </div>
                          )}
                          {game.is_multiplayer && (
                            <div className="bg-black/70 text-white text-xs p-1 rounded-full">
                              <FiUsers size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{game.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(game.created_at || '').getFullYear()}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {game.category && (
                            <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                              {game.category}
                            </span>
                          )}
                          {game.tags && game.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-lg">
                  <p className="text-muted-foreground mb-2">No games found matching your search criteria.</p>
                  <p className="text-sm">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
