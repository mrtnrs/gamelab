"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import GameCard from '@/components/game-card'
import { FiFilter, FiChevronDown, FiGrid, FiList } from 'react-icons/fi'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'
import { generateSlug } from '@/utils/slug'

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'rating', name: 'Highest Rated' },
  { id: 'title', name: 'Alphabetical' },
];

export default function GamesPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  
  const [games, setGames] = useState<Game[]>([])
  const [visibleGames, setVisibleGames] = useState<Game[]>([])
  const [categories, setCategories] = useState<{id: string, name: string, slug: string}[]>([])
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || 'all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [mobileOnly, setMobileOnly] = useState(false)
  const [multiplayerOnly, setMultiplayerOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const gamesPerPage = 8
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await gameService.getCategories();
        
        // Format categories for the dropdown
        const formattedCategories = [
          { id: 'all', name: 'All Categories', slug: 'all' },
          ...categoriesData.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug
          }))
        ];
        
        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch games based on category and filters
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        let gamesData;
        let categoryId;
        
        // Get category ID if a specific category is selected
        if (selectedCategory !== 'all') {
          const category = await gameService.getCategoryBySlug(selectedCategory);
          categoryId = category?.id;
        }
        
        // Use the optimized filtered query
        gamesData = await gameService.getFilteredGames({
          categoryId: categoryId,
          mobileOnly: mobileOnly,
          multiplayerOnly: multiplayerOnly
        });
        
        setGames(gamesData);
        
        // Apply sorting
        const sortedGames = [...gamesData].sort((a, b) => {
          switch (sortBy) {
            case 'newest':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'oldest':
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'rating':
              return (b.rating_average || 0) - (a.rating_average || 0);
            case 'title':
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });
        
        setGames(sortedGames);
        setPage(1);
        setVisibleGames(sortedGames.slice(0, gamesPerPage));
        setHasMore(sortedGames.length > gamesPerPage);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };
    
    fetchGames();
  }, [selectedCategory, sortBy, mobileOnly, multiplayerOnly])
  
  // Load more games when scrolling
  const loadMoreGames = () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      const nextPage = page + 1
      const startIndex = (nextPage - 1) * gamesPerPage
      const endIndex = startIndex + gamesPerPage
      
      const newVisibleGames = [...visibleGames, ...games.slice(startIndex, endIndex)]
      
      setVisibleGames(newVisibleGames)
      setPage(nextPage)
      setHasMore(endIndex < games.length)
      setLoading(false)
    }, 800)
  }
  
  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 500 &&
        !loading &&
        hasMore
      ) {
        loadMoreGames()
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore, games, visibleGames, page])
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Games</h1>
        <p className="text-foreground/70">
          Discover AI-generated games across various genres and styles
        </p>
      </div>
      
      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-card border border-border rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70" />
          </div>
          
          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-card border border-border rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70" />
          </div>
          
          {/* Mobile Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mobileOnly"
              checked={mobileOnly}
              onChange={(e) => setMobileOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="mobileOnly" className="text-sm">
              Mobile Games Only
            </label>
          </div>
          
          {/* Multiplayer Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="multiplayerOnly"
              checked={multiplayerOnly}
              onChange={(e) => setMultiplayerOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="multiplayerOnly" className="text-sm">
              Multiplayer Only
            </label>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-card text-foreground'}`}
          >
            <FiGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-card text-foreground'}`}
          >
            <FiList className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Games Grid */}
      {initialLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading games...</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleGames.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              title={game.title}
              slug={generateSlug(game.title)}
              image={game.image_url || '/placeholder-game.jpg'}
              rating={game.rating_average}
              year={new Date(game.created_at).toLocaleString('default', { month: 'short' }) + ' ' + new Date(game.created_at).getFullYear()}
              is_mobile_compatible={game.is_mobile_compatible}
              is_multiplayer={game.is_multiplayer}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGames.map((game) => (
            <div key={game.id} className="flex bg-card border border-border rounded-md overflow-hidden">
              <div className="w-1/4 aspect-video relative">
                <img
                  src={game.image_url || '/placeholder-game.jpg'}
                  alt={game.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4 flex-1">
                <h3 className="text-lg font-semibold mb-2">{game.title}</h3>
                <div className="flex items-center text-sm text-foreground/70 mb-2">
                  <span className="capitalize">{game.developer}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(game.created_at).toLocaleString('default', { month: 'short' })} {new Date(game.created_at).getFullYear()}</span>
                </div>
                {game.rating_average !== undefined && game.rating_average > 0 && (
                  <div className="flex items-center">
                    <div className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {game.rating_average.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* No Results */}
      {visibleGames.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No games found</h3>
          <p className="text-foreground/70">Try adjusting your filters or check back later for new games</p>
        </div>
      )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
