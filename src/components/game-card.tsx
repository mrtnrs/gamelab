"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FiPlay, FiInfo, FiPlus, FiThumbsUp } from 'react-icons/fi'

interface GameCardProps {
  id: string
  title: string
  slug: string
  image: string
  rating?: number
  year?: string
}

export default function GameCard({ id, title, slug, image, rating, year }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="group relative rounded-md overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/games/${slug}`}>
        <div className="aspect-video relative overflow-hidden rounded-md">
          <Image
            src={image}
            alt={title}
            fill
            className={`object-cover transition-all duration-500 ${
              isHovered ? 'scale-110 brightness-75' : 'scale-100'
            }`}
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
      </Link>
      
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-white font-semibold mb-2">{title}</h3>
          
          <div className="flex space-x-2">
            <button className="bg-white text-black hover:bg-white/90 rounded-full p-2 transition-colors">
              <FiPlay className="h-4 w-4" />
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
              <FiPlus className="h-4 w-4 text-white" />
            </button>
            <button className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
              <FiThumbsUp className="h-4 w-4 text-white" />
            </button>
            <Link 
              href={`/games/${slug}`}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 ml-auto transition-colors"
            >
              <FiInfo className="h-4 w-4 text-white" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
