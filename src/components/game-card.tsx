"use client"

import Image from 'next/image'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { FaMobileAlt, FaUsers } from 'react-icons/fa'
import { useBookmarks } from '@/contexts/bookmark-context'
import { generateSlug } from '@/utils/slug'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface GameCardProps {
  id: string
  title: string
  slug: string
  image: string
  rating?: number
  year?: string
  is_mobile_compatible?: boolean
  is_multiplayer?: boolean
}

export default function GameCard({ id, title, slug, image, rating, year, is_mobile_compatible, is_multiplayer }: GameCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const router = useRouter()
  const bookmarked = isBookmarked(id)
  const [isHovered, setIsHovered] = useState(false)
  
  // Normalize the slug using our utility function
  const safeSlug = slug || generateSlug(title || 'game')
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleBookmark({ id, title, slug: safeSlug, image, year, rating })
  }
  
  // Track mouse down position to detect drags
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 })
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY })
  }
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Calculate distance moved since mouse down
    const dx = Math.abs(e.clientX - mouseDownPos.x)
    const dy = Math.abs(e.clientY - mouseDownPos.y)
    
    // If mouse moved more than a small threshold, consider it a drag not a click
    const dragThreshold = 5
    if (dx <= dragThreshold && dy <= dragThreshold) {
      router.push(`/games/${safeSlug}`)
    }
  }
  
  // Only show rating if it's greater than 0
  const showRating = rating !== undefined && rating > 0;
  
  return (
    <div 
      onClick={handleCardClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-md overflow-hidden transition-all duration-300 block cursor-pointer"
    >
      <div className="aspect-[2/3] md:aspect-[2/3] relative overflow-hidden rounded-md">
        <div className="w-full h-[75%] md:h-full">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-all duration-500 ${isHovered ? 'scale-110 brightness-75' : ''}`}
            />
          </div>
        </div>
        
        {/* Bookmark button - moved to top left */}
        <button 
          onClick={handleBookmarkClick}
          className="absolute top-2 left-2 bg-black/30 hover:bg-black/50 dark:bg-white/20 dark:hover:bg-white/30 rounded-full p-2 transition-colors backdrop-blur-sm z-10"
          aria-label={bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        >
          {bookmarked ? (
            <BsBookmarkFill className="h-4 w-4 text-primary" />
          ) : (
            <BsBookmark className="h-4 w-4 text-white" />
          )}
        </button>
        
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          <div className="flex gap-1.5">
            {is_mobile_compatible && (
              <div className="bg-black/30 p-1.5 rounded-full backdrop-blur-sm">
                <FaMobileAlt className="text-white w-3 h-3" />
              </div>
            )}
            
            {is_multiplayer && (
              <div className="bg-black/30 p-1.5 rounded-full backdrop-blur-sm">
                <FaUsers className="text-white w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex flex-col mb-1">
          <h3 className="text-white font-semibold hover:text-primary transition-colors">
            {title}
          </h3>
          
          {showRating && (
            <div className="flex items-center space-x-0.5 mt-1 mb-1">
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1;
                if (starValue <= rating) {
                  return <FaStar key={i} className="text-yellow-400 w-3 h-3" />;
                } else if (starValue - 0.5 <= rating) {
                  return <FaStarHalfAlt key={i} className="text-yellow-400 w-3 h-3" />;
                } else {
                  return <FaRegStar key={i} className="text-yellow-400 w-3 h-3" />;
                }
              })}
              <span className="text-white hidden text-xs ml-1">{rating.toFixed(1)}</span>
            </div>
          )}
          
          <div className="text-white/70 text-xs">
            {year}
          </div>
        </div>
      </div>
    </div>
  )
}
