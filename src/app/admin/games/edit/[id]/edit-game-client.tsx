"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameForm from '@/components/game-form'
import AdminRouteGuard from '@/components/admin-route-guard'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'

function EditGameContent({ id }: { id: string | string[] }) {
  // Ensure we have a single string ID
  const gameId = Array.isArray(id) ? id[0] : id;
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadGame() {
      try {
        if (gameId) {
          const gameData = await gameService.getGameById(gameId)
          if (gameData) {
            setGame(gameData)
          } else {
            setError('Game not found')
          }
        }
      } catch (err) {
        console.error('Error loading game:', err)
        setError('Failed to load game data')
      } finally {
        setLoading(false)
      }
    }
    
    loadGame()
  }, [gameId])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game data...</p>
        </div>
      </div>
    )
  }
  
  if (error || !game) {
    return (
      <div className="bg-destructive/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
        <p>{error || 'Game not found'}</p>
        <button 
          onClick={() => router.push('/admin/games')}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Games
        </button>
      </div>
    )
  }
  
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <p className="text-muted-foreground mb-6">Update information for {game.title}</p>
      <GameForm initialData={game} isEditing={true} />
    </div>
  )
}

export default function EditGameClient({ id }: { id: string | string[] }) {
  return (
    <AdminRouteGuard>
      <EditGameContent id={id} />
    </AdminRouteGuard>
  )
}
