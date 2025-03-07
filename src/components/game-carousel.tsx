"use client"

import { useState, useRef, useEffect } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import GameCard from './game-card'
import Link from 'next/link'

// Global state to track dragging across all carousels
export const carouselState = {
  draggedRecently: false,
  setDraggedRecently: (value: boolean) => {
    carouselState.draggedRecently = value;
    if (value) {
      // Reset the flag after a short delay
      setTimeout(() => {
        carouselState.draggedRecently = false;
      }, 300); // 300ms delay before allowing navigation again
    }
  }
};

interface Game {
  id: string
  title: string
  slug: string
  image: string
  rating?: number
  year?: string
  is_mobile_compatible?: boolean
  is_multiplayer?: boolean
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
  const touchStartX = useRef(0)
  const isDragging = useRef(false)
  const dragDistance = useRef(0)
  
  // Debug log for games array
  console.log(`GameCarousel '${title}' received ${games.length} games:`, games)
  
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
  
  // Mouse handlers for desktop swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return
    
    // Only handle primary mouse button (left click)
    if (e.button !== 0) return
    
    isDragging.current = true
    touchStartX.current = e.clientX
    dragDistance.current = 0
    carouselRef.current.style.cursor = 'grabbing'
    carouselRef.current.style.scrollBehavior = 'auto'
    
    // Prevent default behavior to avoid text selection during drag
    e.preventDefault()
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return
    
    const dx = touchStartX.current - e.clientX
    dragDistance.current += Math.abs(dx)
    carouselRef.current.scrollLeft += dx
    touchStartX.current = e.clientX
    
    // If user has dragged more than a threshold, mark as dragged
    if (dragDistance.current > 5) {
      carouselState.setDraggedRecently(true)
    }
  }
  
  const handleMouseUp = () => {
    if (!carouselRef.current) return
    
    isDragging.current = false
    carouselRef.current.style.cursor = 'grab'
    carouselRef.current.style.scrollBehavior = 'smooth'
  }
  
  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp()
    }
  }
  
  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    dragDistance.current = 0
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!carouselRef.current) return
    
    const touchDelta = touchStartX.current - e.touches[0].clientX
    dragDistance.current += Math.abs(touchDelta)
    carouselRef.current.scrollLeft += touchDelta
    touchStartX.current = e.touches[0].clientX
    
    // If user has dragged more than a threshold, mark as dragged
    if (dragDistance.current > 5) {
      carouselState.setDraggedRecently(true)
    }
  }
  
  // Add and remove event listeners
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    
    // Add event listeners for mouse events
    carousel.addEventListener('mousemove', handleMouseMove)
    carousel.addEventListener('mouseup', handleMouseUp)
    carousel.addEventListener('mouseleave', handleMouseLeave)
    
    // Clean up event listeners
    return () => {
      carousel.removeEventListener('mousemove', handleMouseMove)
      carousel.removeEventListener('mouseup', handleMouseUp)
      carousel.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])
  
  return (
    <div className="relative py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        {viewAllLink && (
          <Link 
            href={viewAllLink}
            className={`text-sm text-muted-foreground hover:text-primary transition-colors ${carouselState.draggedRecently ? 'pointer-events-none' : ''}`}
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
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 cursor-grab"
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
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
          ) : games && games.length > 0 ? (
            games.map((game) => {
              if (!game) {
                console.error('Null or undefined game in carousel');
                return null;
              }
              return (
                <div key={game.id} className="flex-shrink-0 w-[250px]">
                  <GameCard {...game} />
                </div>
              );
            })
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
