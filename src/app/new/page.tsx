"use client"

import { useState, useEffect } from 'react'
import GameCard from '@/components/game-card'
import { FiTrendingUp, FiStar, FiCalendar } from 'react-icons/fi'
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
    trending: true,
    featured: true,
  },
  {
    id: '2',
    title: 'Neon Drift',
    slug: 'neon-drift',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=2070',
    category: 'racing',
    rating: 4.5,
    year: '2025',
    trending: true,
    featured: false,
  },
  {
    id: '3',
    title: 'Quantum Tactics',
    slug: 'quantum-tactics',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070',
    category: 'strategy',
    rating: 4.7,
    year: '2024',
    trending: true,
    featured: false,
  },
  {
    id: '4',
    title: 'Mystic Realms',
    slug: 'mystic-realms',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070',
    category: 'rpg',
    rating: 4.9,
    year: '2024',
    trending: false,
    featured: true,
  },
  {
    id: '5',
    title: 'Cyber Infiltrator',
    slug: 'cyber-infiltrator',
    image: 'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070',
    category: 'action',
    rating: 4.6,
    year: '2024',
    trending: true,
    featured: false,
  },
  {
    id: '6',
    title: 'Puzzle Dimensions',
    slug: 'puzzle-dimensions',
    image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=2070',
    category: 'puzzle',
    rating: 4.3,
    year: '2024',
    trending: false,
    featured: true,
  },
  {
    id: '7',
    title: 'Stellar Command',
    slug: 'stellar-command',
    image: 'https://images.unsplash.com/photo-1548484352-ea579e5233a8?q=80&w=2070',
    category: 'strategy',
    rating: 4.7,
    year: '2023',
    trending: false,
    featured: true,
  },
  {
    id: '8',
    title: 'Velocity Rush',
    slug: 'velocity-rush',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070',
    category: 'racing',
    rating: 4.4,
    year: '2023',
    trending: true,
    featured: false,
  },
];

export default function NewAndPopularPage() {
  const [activeTab, setActiveTab] = useState('trending')
  
  // Get games based on active tab
  const getFilteredGames = () => {
    switch (activeTab) {
      case 'trending':
        return MOCK_GAMES.filter(game => game.trending)
      case 'featured':
        return MOCK_GAMES.filter(game => game.featured)
      case 'new':
        return MOCK_GAMES.sort((a, b) => parseInt(b.year) - parseInt(a.year)).slice(0, 6)
      default:
        return []
    }
  }
  
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {getFilteredGames().map((game) => (
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
      
      {/* No Results */}
      {getFilteredGames().length === 0 && (
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
