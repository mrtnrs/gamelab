"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import GameForm from '@/components/game-form'
import AdminRouteGuard from '@/components/admin-route-guard'
import { getGameById } from '@/services/game-service'
import { Game } from '@/types/game'

function EditGameContent() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadGame() {
      try {
        if (params.id) {
          const gameData = await getGameById(params.id as string)
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
  }, [params.id])
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-16 pb-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading game data...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  if (error || !game) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-16 pb-20">
          <div className="container mx-auto px-4 py-8">
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
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Game</h1>
            <p className="text-muted-foreground mt-2">Update information for {game.title}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <GameForm initialData={game} isEditing={true} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function EditGamePage() {
  return (
    <AdminRouteGuard>
      <EditGameContent />
    </AdminRouteGuard>
  )
}
