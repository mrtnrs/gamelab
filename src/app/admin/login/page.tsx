"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiLock } from 'react-icons/fi'
import { useAuth } from '@/contexts/auth-context'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function AdminLoginPage() {
  const router = useRouter()
  const { adminLogin, isAdmin } = useAuth()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Redirect if already logged in as admin
  if (isAdmin) {
    router.push('/admin/games')
    return null
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { success, error } = await adminLogin(password)
      
      if (!success) {
        throw new Error(error || 'Invalid admin password')
      }
      
      router.push('/admin/games')
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24 flex items-center justify-center">
        <div className="container max-w-md mx-auto px-4 py-8">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Access</h1>
              <p className="text-muted-foreground">Enter admin password to continue</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-3 mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4 mb-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-md transition-colors"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Access Admin Area'}
              </button>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
