"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/header'
import Footer from '@/components/footer'
import GameCard from '@/components/game-card'
import { gameService } from '@/services/game-service'
import { Game } from '@/types/game'

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCategoryAndGames = async () => {
      try {
        setLoading(true);
        
        // Fetch category details
        const categoryData = await gameService.getCategoryBySlug(slug);
        setCategory(categoryData);
        
        // Fetch games in this category
        if (categoryData) {
          const gamesData = await gameService.getGamesByCategory(slug);
          setGames(gamesData);
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchCategoryAndGames();
    }
  }, [slug]);
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-24">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center py-12">
              <div className="animate-pulse">Loading category...</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!category) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-24">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
              <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-8">
          {/* Category Hero Section */}
          <div className="relative w-full h-64 rounded-xl overflow-hidden mb-8">
            <Image
              src={category.image || '/placeholder-category.jpg'}
              alt={category.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-white/80 max-w-2xl">{category.description}</p>
              )}
            </div>
          </div>
          
          {/* Games Grid */}
          <h2 className="text-2xl font-bold mb-6">Games in {category.name}</h2>
          
          {games.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  slug={game.title.toLowerCase().replace(/\s+/g, '-')}
                  image={game.image_url}
                  rating={game.rating_average}
                  year={new Date(game.created_at).getFullYear().toString()}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No games found in this category.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
