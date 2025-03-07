"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiPlay, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { useBookmarks } from '@/contexts/bookmark-context'
import { generateSlug } from '@/utils/slug'
import { motion, AnimatePresence } from 'framer-motion'

interface FeaturedGame {
  id: string
  title: string
  description: string
  slug: string
  image: string
  year?: string
  rating?: string
  rating_average?: number
}

interface HeroBannerSliderProps {
  featuredGames: FeaturedGame[]
}

export default function HeroBannerSlider({ featuredGames }: HeroBannerSliderProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  
  const currentGame = featuredGames[currentIndex]
  const bookmarked = isBookmarked(currentGame.id)
  
  // Auto-advance the slider every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext()
    }, 8000)
    
    return () => clearInterval(interval)
  }, [currentIndex, featuredGames.length])
  
  const handleBookmarkClick = () => {
    const game = featuredGames[currentIndex]
    const safeSlug = game.slug || generateSlug(game.title)
    toggleBookmark({ 
      id: game.id, 
      title: game.title, 
      slug: safeSlug, 
      image: game.image, 
      year: game.year 
    })
  }
  
  const handlePrev = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredGames.length - 1 : prevIndex - 1
    )
  }
  
  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredGames.length - 1 ? 0 : prevIndex + 1
    )
  }
  
  // Touch handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }
  
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    
    // If the swipe is significant enough (more than 50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left, go to next
        handleNext()
      } else {
        // Swiped right, go to previous
        handlePrev()
      }
    }
  }
  
  // Mouse handlers for desktop swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX
    
    // Add event listeners for mouse move and up
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grabbing'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    touchEndX.current = e.clientX
  }
  
  const handleMouseUp = () => {
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab'
    }
    
    const diff = touchStartX.current - touchEndX.current
    
    // If the swipe is significant enough (more than 50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left, go to next
        handleNext()
      } else {
        // Swiped right, go to previous
        handlePrev()
      }
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  // Normalize the slug
  const safeSlug = currentGame.slug || generateSlug(currentGame.title)
  
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  }
  
  return (
    <div 
      ref={sliderRef}
      className="relative w-full h-[70vh] min-h-[500px] overflow-hidden cursor-grab"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0">
            <Image
              src={currentGame.image}
              alt={currentGame.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent dark:from-black/70 dark:via-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent dark:from-black/70 dark:via-black/20" />
          </div>
          
          <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{currentGame.title}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                {currentGame.rating_average && currentGame.rating_average > 0 && (
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => {
                      const starValue = i + 1;
                      if (starValue <= currentGame.rating_average!) {
                        return <FaStar key={i} className="text-yellow-400 w-4 h-4" />;
                      } else if (starValue - 0.5 <= currentGame.rating_average!) {
                        return <FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />;
                      } else {
                        return <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />;
                      }
                    })}
                    <span className="text-sm text-white ml-1">{currentGame.rating_average.toFixed(1)}</span>
                  </div>
                )}
                {currentGame.year && (
                  <span className="text-sm">{currentGame.year}</span>
                )}
              </div>
              
              <p className="text-lg text-foreground/90 mb-6 line-clamp-3">
                {currentGame.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={`/games/${safeSlug}`}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <FiPlay className="h-5 w-5" />
                  <span>Discover</span>
                </Link>
                
                <button 
                  onClick={handleBookmarkClick}
                  className="bg-black/30 hover:bg-black/50 dark:bg-white/20 dark:hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-colors shadow-md"
                  aria-label={bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                >
                  {bookmarked ? (
                    <BsBookmarkFill className="h-5 w-5 text-primary" />
                  ) : (
                    <BsBookmark className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-3 shadow-md opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Previous slide"
      >
        <FiChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full p-3 shadow-md opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Next slide"
      >
        <FiChevronRight className="h-6 w-6" />
      </button>
      
      {/* Pagination dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
        {featuredGames.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-primary' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
