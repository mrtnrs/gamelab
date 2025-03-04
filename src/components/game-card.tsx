"use client"

import Image from 'next/image'
import Link from 'next/link'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { useBookmarks } from '@/contexts/bookmark-context'
import { generateSlug } from '@/utils/slug'

interface GameCardProps {
  id: string
  title: string
  slug: string
  image: string
  rating?: number
  year?: string
}

export default function GameCard({ id, title, slug, image, rating, year }: GameCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(id)
  
  // Normalize the slug using our utility function
  const safeSlug = slug || generateSlug(title || 'game')
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleBookmark({ id, title, slug: safeSlug, image, year, rating })
  }
  
  return (
    <div className="group relative rounded-md overflow-hidden transition-all duration-300">
      <div className="aspect-[2/3] relative overflow-hidden rounded-md">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
        />
        
        {year && (
          <span className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {year}
          </span>
        )}
        
        {rating && (
          <div className="absolute top-2 right-2 flex items-center space-x-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
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
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-between items-center mb-2">
          <Link 
            href={`/games/${safeSlug}`} 
            className="text-white font-semibold hover:text-primary hover:underline transition-colors"
          >
            {title}
          </Link>
          
          <button 
            onClick={handleBookmarkClick}
            className="bg-black/30 hover:bg-black/50 dark:bg-white/20 dark:hover:bg-white/30 rounded-full p-2 transition-colors backdrop-blur-sm"
            aria-label={bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            {bookmarked ? (
              <BsBookmarkFill className="h-4 w-4 text-primary" />
            ) : (
              <BsBookmark className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
