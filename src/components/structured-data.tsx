'use client'

import { Game } from '@/types/game'
import Script from 'next/script'

interface GameStructuredDataProps {
  game: Game
  url: string
}

export function GameStructuredData({ game, url }: GameStructuredDataProps) {
  // Format the structured data according to schema.org
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description,
    image: game.image_url,
    url: url,
    author: {
      '@type': 'Organization',
      name: game.developer || 'GameLab',
      url: game.developer_url || 'https://gamelab.example.com',
    },
    genre: game.category,
    keywords: game.tags?.join(', ') || '',
    datePublished: game.created_at,
    aggregateRating: game.rating_count && game.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: game.rating_average || 0,
      ratingCount: game.rating_count || 0,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    gamePlatform: [
      'Web Browser',
      ...(game.is_mobile_compatible ? ['Mobile'] : []),
    ],
    numberOfPlayers: game.is_multiplayer ? 'MultiPlayer' : 'SinglePlayer',
  }

  return (
    <Script id={`structured-data-${game.id}`} type="application/ld+json">
      {JSON.stringify(structuredData)}
    </Script>
  )
}
