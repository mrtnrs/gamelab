"use client"

import Image from 'next/image'
import Link from 'next/link'
import { FiPlay } from 'react-icons/fi'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { useBookmarks } from '@/contexts/bookmark-context'

interface HeroBannerProps {
  title: string
  description: string
  slug: string
  image: string
  id: string
  year?: string
  rating?: string
}

export default function HeroBanner({ 
  title, 
  description, 
  slug, 
  image, 
  id,
  year, 
  rating 
}: HeroBannerProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(id)
  
  const handleBookmarkClick = () => {
    toggleBookmark({ id, title, slug, image, year })
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-24">
        <div className="max-w-2xl">
          <div className="flex items-center mb-2">
            <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold tracking-wider">
              FEATURED
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
          
          <div className="flex items-center space-x-4 mb-4">
            {rating && (
              <span className="text-sm bg-primary text-white px-2 py-1 rounded">
                {rating}
              </span>
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
              href={`/games/${slug}`}
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
