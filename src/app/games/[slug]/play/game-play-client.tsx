"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import GamePlayer from '@/components/game-player'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'

export default function GamePlayClient({ slug }: { slug: string }) {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true)
      try {
        const gameData = await gameService.getGameBySlug(slug)
        
        if (gameData) {
          setGame(gameData)
          
          // Increment visit count
          try {
            await gameService.incrementVisitCount(gameData.id)
          } catch (error) {
            console.error('Error incrementing visit count:', error)
          }
        } else {
          // If game not found, show error and redirect
          toast.error('Game not found')
          router.push('/games')
        }
      } catch (error) {
        console.error('Error fetching game:', error)
        toast.error('Failed to load game data')
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      fetchGameData()
    }
  }, [slug, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading game...</div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div>Game not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href={`/games/${slug}`}
          className="flex items-center text-foreground hover:text-primary transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          <span>Back to game details</span>
        </Link>
        <h1 className="text-2xl font-bold">{game.title}</h1>
      </div>
      
      <GamePlayer gameUrl={game.url} title={game.title} />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">About this game</h2>
        <p className="text-muted-foreground">{game.description}</p>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
            <p>{game.developer}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
            <p>{game.category}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Released</h3>
            <p>{new Date(game.created_at).getFullYear()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {game.tags.map((tag) => (
                <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
