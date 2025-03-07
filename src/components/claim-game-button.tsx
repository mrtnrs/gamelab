"use client"

import { useState, useEffect } from 'react'
import { xAuth } from '@/utils/x-auth'
import { toast } from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

interface ClaimGameButtonProps {
  gameId: string
  gameSlug: string
  developerUrl: string
  claimed?: boolean
  onGameClaimed?: () => void
}

export default function ClaimGameButton({ gameId, gameSlug, developerUrl, claimed, onGameClaimed }: ClaimGameButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()
  
  // Check if the developer URL is an X.com URL
  const isXUrl = developerUrl && (
    developerUrl.includes('twitter.com/') || 
    developerUrl.includes('x.com/')
  )
  
  // If it's not an X.com URL, don't render the button
  if (!isXUrl) {
    return null
  }
  
  // Check for success/error messages in URL
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    // Only process if we have success or error params
    if (success || error) {
      if (success === 'game-claimed') {
        toast.success('Game claimed successfully!')
        
        // Call the onGameClaimed callback if provided
        if (onGameClaimed) {
          onGameClaimed()
        }
      } else if (error) {
        let errorMessage = 'Failed to claim game'
        const decodedError = decodeURIComponent(error)
        
        // Map error codes to user-friendly messages
        switch (decodedError) {
          case 'authentication-failed':
            errorMessage = 'Authentication failed. Please try again.'
            break
          case 'This game has already been claimed':
            errorMessage = 'This game has already been claimed.'
            break
          case 'Your X.com handle does not match the developer URL for this game':
            errorMessage = 'This is not your game. Make one yourself!'
            break
          default:
            errorMessage = decodedError.replace(/-/g, ' ')
        }
        
        toast.error(errorMessage)
      }
      
      // Clear the URL parameters to prevent multiple toasts
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, onGameClaimed])
  
  const handleStartAuth = async () => {
    // Store the game ID and slug in cookies for the API route
    document.cookie = `game_to_claim=${gameId}; path=/; max-age=1800;` // 30 minutes
    document.cookie = `game_to_claim_slug=${gameSlug}; path=/; max-age=1800;` // 30 minutes
    
    // Start the X.com authentication flow
    await xAuth.startAuth()
    
    // Close the modal
    setIsOpen(false)
  }
  
  const handleCloseModal = () => {
    setIsOpen(false)
  }
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors"
      >
        <span className="h-6 w-6 text-[black] dark:text-[white] flex items-center justify-center">𝕏</span>
        <span>Claim Your Game</span>
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Claim Your Game</h2>
              <button 
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Verify your ownership by authenticating with your X account. Your X handle must match the developer URL for this game.
            </p>
            
            <div className="mb-6">
              <p className="mb-4 text-sm">
                Click the button below to authenticate with X and verify your identity.
              </p>
              <button
                onClick={handleStartAuth}
                className="w-full px-4 py-2 bg-[#000000] text-white rounded-md hover:bg-[#333333] transition-colors flex items-center justify-center space-x-2"
              >
                <span className="text-lg font-bold">𝕏</span>
                <span>Sign in with X</span>
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
