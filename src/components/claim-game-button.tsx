"use client"

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import CryptoJS from 'crypto-js';

interface ClaimGameButtonProps {
  gameId: string
  gameSlug: string
  developerUrl: string
  claimed?: boolean
  onGameClaimed?: () => void
}

// Utility functions for PKCE (Proof Key for Code Exchange)
const generateRandomString = (length: number) => {
  const randomBytes = CryptoJS.lib.WordArray.random(length);
  const randomString = randomBytes.toString(CryptoJS.enc.Base64)
    .replace(/[^A-Za-z0-9]/g, '') // Remove special characters
    .slice(0, length); // Trim to desired length
  return randomString;
};

const generateCodeChallenge = async (codeVerifier: string) => {
  const hash = CryptoJS.SHA256(codeVerifier);
  const base64 = hash.toString(CryptoJS.enc.Base64);
  return base64
    .replace(/\+/g, '-') // URL-safe Base64
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

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

  const handleStartAuth = useCallback(async () => {
    // Store the game ID and slug in cookies for the API route
    document.cookie = `game_to_claim=${gameId}; path=/; max-age=1800;` // 30 minutes
    document.cookie = `game_to_claim_slug=${gameSlug}; path=/; max-age=1800;` // 30 minutes

    // Generate state and code_verifier for security
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code_verifier securely for later use in token exchange
    localStorage.setItem('code_verifier', codeVerifier);

    // Build X.com authorization URL
    const authUrl = new URL('https://x.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_X_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/x/callback`);
    authUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Redirect user to X.com for authentication
    window.location.href = authUrl.toString();

    // Close the modal
    setIsOpen(false)
  }, [gameId, gameSlug])

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
                ×
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