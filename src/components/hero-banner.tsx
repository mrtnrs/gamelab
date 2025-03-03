"use client"

import Image from 'next/image'
import Link from 'next/link'
import { FiPlay, FiInfo, FiPlus } from 'react-icons/fi'

interface HeroBannerProps {
  title: string
  description: string
  slug: string
  image: string
  year?: string
  rating?: string
}

export default function HeroBanner({ 
  title, 
  description, 
  slug, 
  image, 
  year, 
  rating 
}: HeroBannerProps) {
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
              href={`/games/${slug}/play`}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
            >
              <FiPlay className="h-5 w-5" />
              <span>Play Now</span>
            </Link>
            
            <Link 
              href={`/games/${slug}`}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-md flex items-center space-x-2 backdrop-blur-sm transition-colors"
            >
              <FiInfo className="h-5 w-5" />
              <span>More Info</span>
            </Link>
            
            <button className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
              <FiPlus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
