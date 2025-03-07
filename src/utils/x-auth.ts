"use client"

import { supabase } from './supabase'

// This is a placeholder for X.com OAuth integration
// In a real implementation, you would need to:
// 1. Register your app with X.com/Twitter Developer Platform
// 2. Get API keys and configure OAuth
// 3. Implement the full OAuth flow

// For now, we'll simulate the authentication flow
// In production, replace this with actual X.com OAuth implementation

interface XAuthResponse {
  success: boolean
  handle?: string
  error?: string
}

export const xAuth = {
  /**
   * Start the X.com authentication flow
   * Redirects to X.com OAuth
   */
  async startAuth(redirectUrl?: string): Promise<void> {
    // Build the auth URL with the current page as the redirect URL
    const authUrl = new URL(`${window.location.origin}/api/auth/x`)
    
    // Add the redirect URL if provided
    if (redirectUrl) {
      authUrl.searchParams.append('redirect', redirectUrl)
    } else {
      // Default to current page
      authUrl.searchParams.append('redirect', window.location.pathname)
    }
    
    // Redirect to the auth endpoint
    window.location.href = authUrl.toString()
  },
  
  /**
   * Check if the user is authenticated with X.com
   * @returns The X.com handle if authenticated, null otherwise
   */
  getXHandle(): string | null {
    // Check for the x_handle cookie
    const cookies = document.cookie.split(';')
    const xHandleCookie = cookies.find(cookie => cookie.trim().startsWith('x_handle='))
    
    if (xHandleCookie) {
      // Extract and decode the handle
      const handle = xHandleCookie.split('=')[1].trim()
      return decodeURIComponent(handle)
    }
    
    return null
  },
  
  /**
   * Clear the X.com authentication
   */
  clearAuth(): void {
    // Delete the x_handle cookie
    document.cookie = 'x_handle=; max-age=0; path=/;'
  },
  
  /**
   * Get the X.com handle from a URL
   * @param url The X.com profile URL
   */
  extractHandleFromUrl(url: string): string | null {
    if (!url) return null
    
    try {
      // Create a URL object to parse the URL
      const urlObj = new URL(url)
      
      // Check if the URL is from X.com or Twitter
      if (urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com') {
        // Get the path segments
        const pathSegments = urlObj.pathname.split('/').filter(Boolean)
        
        // The first segment should be the handle
        if (pathSegments.length > 0) {
          return pathSegments[0]
        }
      }
      
      return null
    } catch (error) {
      console.error('Error parsing URL:', error)
      return null
    }
  },
  
  /**
   * Compare a user's X.com handle with a developer URL
   * @param xHandle The X.com handle to compare
   * @param developerUrl The developer URL from the game
   */
  compareHandleWithUrl(xHandle: string, developerUrl: string): boolean {
    if (!xHandle || !developerUrl) return false
    
    const urlHandle = this.extractHandleFromUrl(developerUrl)
    
    if (!urlHandle) return false
    
    // Compare handles (case insensitive)
    return urlHandle.toLowerCase() === xHandle.toLowerCase()
  }
}

// For development/demo purposes, we'll create a mock API route handler
// In a real implementation, this would be a Next.js API route
if (typeof window !== 'undefined') {
  // Mock the X.com OAuth callback
  const handleMockCallback = () => {
    const url = window.location.href
    
    if (url.includes('/api/mock-x-auth-callback')) {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      
      if (code && state) {
        // In a real implementation, exchange the code for tokens
        // For now, we'll simulate a successful authentication
        
        // In production, this would come from the X.com API
        const handle = 'simulated_user'
        
        // Store the handle in localStorage for the claim process
        localStorage.setItem('x_handle', handle)
        
        // Redirect back to the game page
        const redirectUrl = localStorage.getItem('x_auth_redirect') || '/'
        window.location.href = redirectUrl
      }
    }
  }
  
  // Check if we're on the callback page
  if (typeof window !== 'undefined') {
    handleMockCallback()
  }
}
