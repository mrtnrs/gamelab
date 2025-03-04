"use client"

import { useState, useEffect } from 'react'
import GameCard from '@/components/game-card'
import { FiTrendingUp, FiStar, FiCalendar } from 'react-icons/fi'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'
import { generateSlug } from '@/utils/slug'

export default function NewAndPopularPage() {
  const [activeTab, setActiveTab] = useState('trending')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch games based on active tab
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      try {
        let data: Game[] = []
        
        switch (activeTab) {
          case 'trending':
            data = await gameService.getTrendingGames(10)
            break
          case 'featured':
            data = await gameService.getFeaturedGames()
            break
          case 'new':
            data = await gameService.getNewReleases(10)
            break
          default:
            data = []
        }
        
        setGames(data)
      } catch (error) {
        console.error(`Error fetching ${activeTab} games:`, error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGames()
  }, [activeTab])
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New & Popular</h1>
        <p className="text-foreground/70">
          Discover trending, featured, and newly released AI-generated games
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex items-center px-4 py-3 font-medium ${
            activeTab === 'trending'
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <FiTrendingUp className="mr-2 h-5 w-5" />
          Trending Now
        </button>
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center px-4 py-3 font-medium ${
            activeTab === 'featured'
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <FiStar className="mr-2 h-5 w-5" />
          Featured
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex items-center px-4 py-3 font-medium ${
            activeTab === 'new'
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <FiCalendar className="mr-2 h-5 w-5" />
          New Releases
        </button>
      </div>
      
      {/* Games Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading games...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              title={game.title}
              slug={generateSlug(game.title)}
              image={game.image_url}
              rating={game.rating_average}
              year={new Date(game.created_at).getFullYear().toString()}
            />
          ))}
        </div>
      )}
      
      {/* No Results */}
      {!loading && games.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No games found</h3>
          <p className="text-foreground/70">Check back later for new games</p>
        </div>
      )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
