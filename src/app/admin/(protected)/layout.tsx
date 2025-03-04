"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiHome, FiGrid, FiUsers, FiSettings, FiLogOut, FiMenu, FiX, FiTag } from 'react-icons/fi'
import { ThemeToggle } from '@/components/theme-toggle'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'

export const runtime = 'edge';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Check if current path is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  
  // Get auth context
  const { signOut } = useAuth()
  
  // Handle logout
  const handleLogout = () => {
    signOut()
  }
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])
  
  // Close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden bg-card border-b border-border flex items-center justify-between p-4">
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mr-4"
          >
            {isMobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
          <Link href="/admin" className="text-xl font-bold">
            GameLab Admin
          </Link>
        </div>
        <ThemeToggle />
      </header>
      
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-4">
            <div className="flex items-center justify-between mb-6">
              <Link href="/admin" className="text-xl font-bold">
                GameLab Admin
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="space-y-1">
              <Link
                href="/admin"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin') && !isActive('/admin/games') && !isActive('/admin/users')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <FiHome className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/admin/games"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/games')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <FiGrid className="mr-3 h-5 w-5" />
                Games
              </Link>
              <Link
                href="/admin/categories"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/categories')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <FiTag className="mr-3 h-5 w-5" />
                Categories
              </Link>
              <Link
                href="/admin/settings"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/settings')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <FiSettings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </nav>
            
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-md hover:bg-accent"
              >
                <FiLogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Layout */}
      <div className="flex h-screen lg:overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
          } hidden lg:block`}
        >
          <div className="h-full flex flex-col">
            <div className={`p-4 ${!isSidebarOpen && 'justify-center'} flex items-center`}>
              {isSidebarOpen ? (
                <Link href="/admin" className="text-xl font-bold">
                  GameLab Admin
                </Link>
              ) : (
                <Link href="/admin" className="text-xl font-bold">
                  GL
                </Link>
              )}
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              <Link
                href="/admin"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin') && !isActive('/admin/games') && !isActive('/admin/users')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                } ${!isSidebarOpen && 'justify-center'}`}
                title="Dashboard"
              >
                <FiHome className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
                {isSidebarOpen && <span>Dashboard</span>}
              </Link>
              <Link
                href="/admin/games"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/games')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                } ${!isSidebarOpen && 'justify-center'}`}
                title="Games"
              >
                <FiGrid className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
                {isSidebarOpen && <span>Games</span>}
              </Link>
              <Link
                href="/admin/categories"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/categories')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                } ${!isSidebarOpen && 'justify-center'}`}
                title="Categories"
              >
                <FiTag className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
                {isSidebarOpen && <span>Categories</span>}
              </Link>
              <Link
                href="/admin/users"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/users')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                } ${!isSidebarOpen && 'justify-center'}`}
                title="Users"
              >
                <FiUsers className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
                {isSidebarOpen && <span>Users</span>}
              </Link>
              <Link
                href="/admin/settings"
                className={`flex items-center px-3 py-2 rounded-md ${
                  isActive('/admin/settings')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                } ${!isSidebarOpen && 'justify-center'}`}
                title="Settings"
              >
                <FiSettings className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
                {isSidebarOpen && <span>Settings</span>}
              </Link>
            </nav>
            
            <div className="p-4 border-t border-border flex items-center justify-between">
              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 rounded-md hover:bg-accent ${
                  !isSidebarOpen && 'justify-center w-full'
                }`}
                title="Logout"
              >
                <FiLogOut className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
                {isSidebarOpen && <span>Logout</span>}
              </button>
              
              {isSidebarOpen && <ThemeToggle />}
            </div>
          </div>
        </aside>
        
        {/* Toggle Sidebar Button (Desktop) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex fixed bottom-4 left-4 z-50 items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md"
        >
          {isSidebarOpen ? (
            <FiX className="h-5 w-5" />
          ) : (
            <FiMenu className="h-5 w-5" />
          )}
        </button>
        
        {/* Main Content */}
        <main className={`flex-1 overflow-auto p-4 lg:p-8 ${isSidebarOpen ? 'lg:ml-[0]' : 'lg:ml-20'}`}>
          {children}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  )
}
