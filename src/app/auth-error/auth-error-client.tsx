"use client"

import Link from 'next/link'

interface AuthErrorClientProps {
  error?: string
}

export default function AuthErrorClient({ error }: AuthErrorClientProps) {
  const errorCode = error || 'unknown_error'
  
  const errorMessages: Record<string, string> = {
    // Original error messages
    invalid_state: 'Authentication session expired or invalid. Please try again.',
    token_exchange_failed: 'Failed to complete authentication with X.com. Please try again.',
    user_info_failed: 'Could not retrieve your X.com profile information. Please try again.',
    
    // Auth.js specific error messages
    OAuthSignin: 'Error starting the Twitter sign in process. Please try again.',
    OAuthCallback: 'Error processing the Twitter authentication callback. Please try again.',
    OAuthCreateAccount: 'Error creating your account. Please try again.',
    OAuthAccountNotLinked: 'The Twitter account is not linked to an existing account. Please sign in with the provider you used during registration.',
    AccessDenied: 'You denied access to your Twitter account. Please try again and allow access.',
    Verification: 'The verification token has expired or has already been used. Please try again.',
    Configuration: 'There is a problem with the server configuration. Please contact support.',
    no_session: 'No authentication session was created. Please try again.',
    session_error: 'There was an error checking your authentication session. Please try again.',
    
    // Default error messages
    unexpected_error: 'An unexpected error occurred during authentication. Please try again.',
    unknown_error: 'An unknown error occurred during authentication. Please try again.'
  }
  
  const errorMessage = errorMessages[errorCode] || errorMessages.unknown_error
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-background border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
