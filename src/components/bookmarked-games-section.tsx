"use client"

import { useBookmarks } from '@/contexts/bookmark-context'
import GameCard from './game-card'
import { BsBookmarkFill } from 'react-icons/bs'

export default function BookmarkedGamesSection() {
  const { bookmarkedGames } = useBookmarks()
  
  return (
    <div className="relative py-8 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BsBookmarkFill className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold">Bookmarked</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {bookmarkedGames.length > 0 ? (
          bookmarkedGames.map(game => (
            <div key={game.id}>
              <GameCard 
                id={game.id}
                title={game.title}
                slug={game.slug}
                image={game.image || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070`}
                year={game.year || new Date().getFullYear().toString()}
                rating={game.rating}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full border border-border bg-card/50 dark:bg-card/20 p-8 rounded-lg text-center shadow-sm">
            <BsBookmarkFill className="h-8 w-8 mx-auto mb-3 text-primary/60" />
            <p className="text-lg font-medium text-foreground">Add games to your bookmarks!</p>
            <p className="mt-2 text-muted-foreground">Click the bookmark icon on any game to save it here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
