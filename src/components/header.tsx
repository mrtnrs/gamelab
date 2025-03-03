"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './theme-toggle'
import { FiSearch, FiMenu, FiX, FiUser, FiShield, FiLogOut, FiUpload } from 'react-icons/fi'
import { useAuth } from '@/contexts/auth-context'
import AdminLogoutButton from './admin-logout-button'

export default function Header() {
  const { isAdmin } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${
      isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-gradient-to-b from-background/80 to-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="mr-4 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
          
          <Link href="/" className="flex items-center">
            <span className="text-primary font-bold text-2xl">🎮 GameLab</span>
          </Link>
          
          <nav className="hidden md:flex ml-10 space-x-8">
            <Link href="/games" className="text-foreground/90 hover:text-primary transition-colors">
              Games
            </Link>
            <Link href="/categories" className="text-foreground/90 hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/new" className="text-foreground/90 hover:text-primary transition-colors">
              New & Popular
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/search" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
            <FiSearch className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          
          <Link 
            href="/submit" 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
          >
            <FiUpload className="h-4 w-4" />
            <span className="hidden md:inline">Submit Game</span>
          </Link>
          
          {isAdmin && (
            <div className="hidden md:block">
              <AdminLogoutButton />
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <nav className="flex flex-col py-4">
            <Link href="/games" className="px-4 py-2 hover:bg-accent transition-colors">
              Games
            </Link>
            <Link href="/categories" className="px-4 py-2 hover:bg-accent transition-colors">
              Categories
            </Link>
            <Link href="/new" className="px-4 py-2 hover:bg-accent transition-colors">
              New & Popular
            </Link>
            
            <Link href="/submit" className="px-4 py-2 hover:bg-accent transition-colors">
              Submit Game
            </Link>
            
            {isAdmin && (
              <div className="px-4 py-2 hover:bg-accent transition-colors">
                <AdminLogoutButton />
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
