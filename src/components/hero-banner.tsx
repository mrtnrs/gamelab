"use client"

import Image from 'next/image'
import Link from 'next/link'
import { FiPlay } from 'react-icons/fi'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { useBookmarks } from '@/contexts/bookmark-context'
import { generateSlug } from '@/utils/slug'

interface HeroBannerProps {
  title: string
  description: string
  slug: string
  image: string
  id: string
  year?: string
  rating?: string
  rating_average?: number
}

export default function HeroBanner({ 
  title, 
  description, 
  slug, 
  image, 
  id,
  year, 
  rating,
  rating_average
}: HeroBannerProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(id)
  
  // Normalize the slug
  const safeSlug = slug || generateSlug(title)
  
  const handleBookmarkClick = () => {
    toggleBookmark({ id, title, slug: safeSlug, image, year })
  }
  
  return (
    <div className="relative w-full h-[70vh] min-h-[500px]">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/50 to-transparent dark:from-black/70 dark:via-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-transparent dark:from-black/70 dark:via-black/40" />
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-24">
        <div className="max-w-2xl">
          {/* Featured tag removed */}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
          
          <div className="flex items-center space-x-4 mb-4">
            {rating_average && rating_average > 0 && (
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => {
                  const starValue = i + 1;
                  if (starValue <= rating_average) {
                    return <FaStar key={i} className="text-yellow-400 w-4 h-4" />;
                  } else if (starValue - 0.5 <= rating_average) {
                    return <FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />;
                  } else {
                    return <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />;
                  }
                })}
                <span className="text-sm text-white ml-1">{rating_average.toFixed(1)}</span>
              </div>
            )}
            {year && (
              <span className="text-sm">{year}</span>
            )}
          </div>
          
          <p className="text-lg text-foreground/90 mb-6 line-clamp-3">
            {description}
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
    </div>
  )
}
