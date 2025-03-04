"use client"

import Image from 'next/image'
import Link from 'next/link'
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs'
import { useBookmarks } from '@/contexts/bookmark-context'

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
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleBookmark({ id, title, slug, image, year, rating })
  }
  
  return (
    <div className="group relative rounded-md overflow-hidden transition-all duration-300">
      <div className="aspect-video relative overflow-hidden rounded-md">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
        />
        
        {year && (
          <span className="absolute bottom-2 left-2 bg-background/80 text-xs px-2 py-1 rounded">
            {year}
          </span>
        )}
        
        {rating && (
          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
            {rating}
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-between items-center mb-2">
          <Link 
            href={`/games/${slug}`} 
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
