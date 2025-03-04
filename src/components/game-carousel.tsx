"use client"

import { useState, useRef } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import GameCard from './game-card'
import Link from 'next/link'

interface Game {
  id: string
  title: string
  slug: string
  image: string
  rating?: number
  year?: string
}

interface GameCarouselProps {
  title: string
  games: Game[]
  viewAllLink?: string
  loading?: boolean
}

export default function GameCarousel({ title, games, viewAllLink, loading = false }: GameCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  
  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    
    const { scrollLeft, clientWidth } = carouselRef.current
    const scrollTo = direction === 'left' 
      ? scrollLeft - clientWidth * 0.75
      : scrollLeft + clientWidth * 0.75
    
    carouselRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    })
  }
  
  const handleScroll = () => {
    if (!carouselRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setShowLeftButton(scrollLeft > 0)
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10)
  }
  
  return (
    <div className="relative py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        {viewAllLink && (
          <Link 
            href={viewAllLink}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View all
          </Link>
        )}
      </div>
      
      <div className="relative group">
        {showLeftButton && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>
        )}
        
        <div 
          ref={carouselRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          onScroll={handleScroll}
        >
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-[250px]">
                <div className="rounded-lg overflow-hidden shadow-md bg-card">
                  <div className="aspect-[2/3] bg-muted animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : games.length > 0 ? (
            games.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-[250px]">
                <GameCard {...game} />
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground w-full">
              No games found
            </div>
          )}
        </div>
        
        {showRightButton && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <FiChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  )
}
