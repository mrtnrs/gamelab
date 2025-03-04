"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BookmarkedGame {
  id: string;
  slug: string;
  title: string;
  image?: string;
  year?: string;
  rating?: number;
}

interface BookmarkContextType {
  bookmarkedGames: BookmarkedGame[];
  isBookmarked: (gameId: string) => boolean;
  toggleBookmark: (game: BookmarkedGame) => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarkedGames, setBookmarkedGames] = useState<BookmarkedGame[]>([]);
  
  // Load bookmarked games from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBookmarks = localStorage.getItem('bookmarkedGames');
      if (storedBookmarks) {
        try {
          setBookmarkedGames(JSON.parse(storedBookmarks));
        } catch (error) {
          console.error('Error parsing bookmarked games:', error);
          localStorage.removeItem('bookmarkedGames');
        }
      }
    }
  }, []);
  
  // Save bookmarked games to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && bookmarkedGames.length > 0) {
      localStorage.setItem('bookmarkedGames', JSON.stringify(bookmarkedGames));
    }
  }, [bookmarkedGames]);
  
  // Check if a game is bookmarked
  const isBookmarked = (gameId: string): boolean => {
    return bookmarkedGames.some(game => game.id === gameId);
  };
  
  // Toggle bookmark status
  const toggleBookmark = (game: BookmarkedGame) => {
    setBookmarkedGames(prev => {
      const isAlreadyBookmarked = prev.some(g => g.id === game.id);
      
      if (isAlreadyBookmarked) {
        // Remove from bookmarks
        const updatedBookmarks = prev.filter(g => g.id !== game.id);
        if (updatedBookmarks.length === 0) {
          // If no bookmarks left, remove from localStorage
          localStorage.removeItem('bookmarkedGames');
        }
        return updatedBookmarks;
      } else {
        // Add to bookmarks
        return [...prev, game];
      }
    });
  };
  
  return (
    <BookmarkContext.Provider value={{ bookmarkedGames, isBookmarked, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
