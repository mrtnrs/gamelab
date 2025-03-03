"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AdminRouteGuard from '@/components/admin-route-guard'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'

// Fallback game data in case database is empty
const fallbackGames: Game[] = [
  {
    id: '1',
    title: 'Space Explorer',
    category: 'Adventure',
    status: 'published',
    created_at: '2023-05-15T00:00:00.000Z',
    image_url: 'https://via.placeholder.com/150',
    description: 'Explore the vastness of space in this adventure game.',
    url: '#',
    updated_at: '2023-05-15T00:00:00.000Z',
    featured: true,
    developer: 'Space Games Inc.',
    tags: ['space', 'adventure'],
  },
  {
    id: '2',
    title: 'Zombie Survival',
    category: 'Action',
    status: 'published',
    created_at: '2023-05-10T00:00:00.000Z',
    image_url: 'https://via.placeholder.com/150',
    description: 'Survive in a world overrun by zombies.',
    url: '#',
    updated_at: '2023-05-10T00:00:00.000Z',
    featured: false,
    developer: 'Survival Studios',
    tags: ['zombies', 'survival', 'action'],
  },
  {
    id: '3',
    title: 'Fantasy Quest',
    category: 'RPG',
    status: 'draft',
    created_at: '2023-05-05T00:00:00.000Z',
    image_url: 'https://via.placeholder.com/150',
    description: 'Embark on an epic fantasy quest.',
    url: '#',
    updated_at: '2023-05-05T00:00:00.000Z',
    featured: false,
    developer: 'Fantasy Games',
    tags: ['fantasy', 'rpg'],
  }
]

function AdminGamesContent() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 5
  
  // Load games from Supabase
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await gameService.getGames();
        setGames(data.length > 0 ? data : fallbackGames);
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames(fallbackGames);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, [])
  
  // Filter games based on search query and filters
  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || game.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesCategory = categoryFilter === 'all' || game.category.toLowerCase() === categoryFilter.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesCategory
  })
  
  // Pagination
  const indexOfLastGame = currentPage * gamesPerPage
  const indexOfFirstGame = indexOfLastGame - gamesPerPage
  const currentGames = filteredGames.slice(indexOfFirstGame, indexOfLastGame)
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage)
  
  // Handle game deletion
  const handleDeleteGame = async (id: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      setLoading(true);
      try {
        const result = await gameService.deleteGame(id);
        if (result.success) {
          setGames(games.filter((game) => game.id !== id));
        } else {
          alert('Failed to delete game: ' + result.error?.message);
        }
      } catch (error) {
        console.error('Error deleting game:', error);
        alert('An error occurred while deleting the game');
      } finally {
        setLoading(false);
      }
    }
  }
  
  // Get unique categories for filter
  const categories = ['all', ...new Set(games.map((game) => game.category.toLowerCase()))]
  
  return (
    <div>
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Games Management</h1>
          <Link
            href="/admin/games/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add New Game
          </Link>
        </div>
        
        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search games..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-muted-foreground" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-muted-foreground" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Games Table */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Game</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      Loading games...
                    </td>
                  </tr>
                ) : currentGames.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      No games found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  currentGames.map((game) => (
                    <tr key={game.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3 relative overflow-hidden rounded">
                            <Image
                              src={game.image_url || 'https://via.placeholder.com/150'}
                              alt={game.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{game.title}</div>
                            <div className="text-sm text-muted-foreground">ID: {game.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {game.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          game.status === 'published' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                        }`}>
                          {game.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(game.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/games/edit/${game.id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && filteredGames.length > 0 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstGame + 1} to {Math.min(indexOfLastGame, filteredGames.length)} of {filteredGames.length} games
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default function AdminGamesPage() {
  return (
    <AdminRouteGuard>
      <AdminGamesContent />
    </AdminRouteGuard>
  )
}
