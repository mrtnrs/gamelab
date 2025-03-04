"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { FiSearch } from 'react-icons/fi'
import { gameService } from '@/services/game-service'

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  count: number;
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await gameService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Game Categories</h1>
          
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse">Loading categories...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <Link 
                    key={category.id}
                    href={`/games?category=${category.slug}`}
                    className="group relative rounded-lg overflow-hidden"
                  >
                    <div className="aspect-video relative">
                      <Image
                        src={category.image || '/placeholder-category.jpg'}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <h2 className="text-white text-xl font-semibold mb-2">{category.name}</h2>
                        <p className="text-white/80 text-sm">{category.count} games</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No categories found matching your search.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
