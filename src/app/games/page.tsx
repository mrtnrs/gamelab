"use client"

import { useState, useEffect } from 'react'
import GameCard from '@/components/game-card'
import { FiFilter, FiChevronDown, FiGrid, FiList } from 'react-icons/fi'
import Header from '@/components/header'
import Footer from '@/components/footer'

// Mock data for games
const MOCK_GAMES = [
  {
    id: '1',
    title: 'Cosmic Odyssey',
    slug: 'cosmic-odyssey',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070',
    category: 'adventure',
    rating: 4.8,
    year: '2025',
  },
  {
    id: '2',
    title: 'Neon Drift',
    slug: 'neon-drift',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=2070',
    category: 'racing',
    rating: 4.5,
    year: '2025',
  },
  {
    id: '3',
    title: 'Quantum Tactics',
    slug: 'quantum-tactics',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070',
    category: 'strategy',
    rating: 4.7,
    year: '2024',
  },
  {
    id: '4',
    title: 'Mystic Realms',
    slug: 'mystic-realms',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070',
    category: 'rpg',
    rating: 4.9,
    year: '2024',
  },
  {
    id: '5',
    title: 'Cyber Infiltrator',
    slug: 'cyber-infiltrator',
    image: 'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070',
    category: 'action',
    rating: 4.6,
    year: '2024',
  },
  {
    id: '6',
    title: 'Puzzle Dimensions',
    slug: 'puzzle-dimensions',
    image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=2070',
    category: 'puzzle',
    rating: 4.3,
    year: '2024',
  },
  {
    id: '7',
    title: 'Stellar Command',
    slug: 'stellar-command',
    image: 'https://images.unsplash.com/photo-1548484352-ea579e5233a8?q=80&w=2070',
    category: 'strategy',
    rating: 4.7,
    year: '2023',
  },
  {
    id: '8',
    title: 'Velocity Rush',
    slug: 'velocity-rush',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070',
    category: 'racing',
    rating: 4.4,
    year: '2023',
  },
  {
    id: '9',
    title: 'Arcane Legacy',
    slug: 'arcane-legacy',
    image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=2070',
    category: 'rpg',
    rating: 4.8,
    year: '2023',
  },
  {
    id: '10',
    title: 'Shadow Protocol',
    slug: 'shadow-protocol',
    image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=2070',
    category: 'action',
    rating: 4.5,
    year: '2023',
  },
  {
    id: '11',
    title: 'Logic Labyrinth',
    slug: 'logic-labyrinth',
    image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=2070',
    category: 'puzzle',
    rating: 4.2,
    year: '2023',
  },
  {
    id: '12',
    title: 'Galactic Pioneers',
    slug: 'galactic-pioneers',
    image: 'https://images.unsplash.com/photo-1536152470836-b943b246224c?q=80&w=2070',
    category: 'adventure',
    rating: 4.6,
    year: '2022',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'action', name: 'Action' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'puzzle', name: 'Puzzle' },
  { id: 'racing', name: 'Racing' },
  { id: 'rpg', name: 'RPG' },
  { id: 'strategy', name: 'Strategy' },
];

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'rating', name: 'Highest Rated' },
  { id: 'title', name: 'Alphabetical' },
];

export default function GamesPage() {
  const [games, setGames] = useState(MOCK_GAMES)
  const [visibleGames, setVisibleGames] = useState([])
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const gamesPerPage = 6
  
  // Filter and sort games
  useEffect(() => {
    let filteredGames = [...MOCK_GAMES]
    
    // Apply category filter
    if (category !== 'all') {
      filteredGames = filteredGames.filter(game => game.category === category)
    }
    
    // Apply sorting
    filteredGames.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return parseInt(b.year) - parseInt(a.year)
        case 'oldest':
          return parseInt(a.year) - parseInt(b.year)
        case 'rating':
          return b.rating - a.rating
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    
    setGames(filteredGames)
    setPage(1)
    setVisibleGames(filteredGames.slice(0, gamesPerPage))
    setHasMore(filteredGames.length > gamesPerPage)
  }, [category, sortBy])
  
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-card border border-border rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
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
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleGames.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              title={game.title}
              slug={game.slug}
              image={game.image}
              rating={game.rating}
              year={game.year}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGames.map((game) => (
            <div key={game.id} className="flex bg-card border border-border rounded-md overflow-hidden">
              <div className="w-1/4 aspect-video relative">
                <img
                  src={game.image}
                  alt={game.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4 flex-1">
                <h3 className="text-lg font-semibold mb-2">{game.title}</h3>
                <div className="flex items-center text-sm text-foreground/70 mb-2">
                  <span className="capitalize">{game.category}</span>
                  <span className="mx-2">•</span>
                  <span>{game.year}</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                    {game.rating}
                  </div>
                </div>
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
