"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLock, FiMail } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '@/contexts/auth-context'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, isAdmin, isLoading, signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  
  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      router.push('/admin/games')
    } else if (user && !isAdmin) {
      setError('Only authorized administrators can access this area.')
    }
  }, [user, isAdmin, router])
  
  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
      setLoginLoading(false)
    }
  }
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24 flex items-center justify-center">
        <div className="container max-w-md mx-auto px-4 py-8">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Access</h1>
              <p className="text-muted-foreground">Sign in with Google to access the admin area</p>
              <p className="text-xs text-muted-foreground mt-2">Only authorized administrators can access this area</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-3 mb-6">
                {error}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-100 py-2 px-4 rounded-md border border-gray-300 transition-colors"
                disabled={loginLoading}
              >
                <FcGoogle className="h-5 w-5" />
                {loginLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Admin access only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
