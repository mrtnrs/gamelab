"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { FiSearch } from 'react-icons/fi'

// Mock games data
const allGames = [
  {
    id: "1",
    title: "Army of the Dead",
    slug: "army-of-the-dead",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070",
    year: "2023",
    rating: 9.5,
    categories: ["Action", "Horror", "Shooter"]
  },
  {
    id: "2",
    title: "Gunpowder Milkshake",
    slug: "gunpowder-milkshake",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070",
    year: "2023",
    rating: 8.7,
    categories: ["Action", "Adventure"]
  },
  {
    id: "3",
    title: "Red Notice",
    slug: "red-notice",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071",
    year: "2022",
    rating: 7.9,
    categories: ["Adventure", "Comedy"]
  },
  {
    id: "4",
    title: "365 Red Notice",
    slug: "365-red-notice",
    image: "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?q=80&w=2080",
    year: "2022",
    rating: 8.2,
    categories: ["Strategy", "Puzzle"]
  },
  {
    id: "5",
    title: "Bloodshot",
    slug: "bloodshot",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059",
    year: "2021",
    rating: 7.5,
    categories: ["Action", "Sci-Fi"]
  },
  {
    id: "6",
    title: "Lost Bullet",
    slug: "lost-bullet",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070",
    year: "2020",
    rating: 8.0,
    categories: ["Action", "Racing"]
  },
  {
    id: "7",
    title: "Extraction",
    slug: "extraction",
    image: "https://images.unsplash.com/photo-1559163499-413811fb2344?q=80&w=2070",
    year: "2021",
    rating: 9.1,
    categories: ["Action", "Thriller"]
  },
  {
    id: "8",
    title: "Mosul",
    slug: "mosul",
    image: "https://images.unsplash.com/photo-1547638375-ebf04735d792?q=80&w=2013",
    year: "2019",
    rating: 8.3,
    categories: ["War", "Action"]
  },
  {
    id: "9",
    title: "Spider-man: Far From Home",
    slug: "spider-man-far-from-home",
    image: "https://images.unsplash.com/photo-1608889175638-9322300c46e8?q=80&w=2080",
    year: "2022",
    rating: 9.4,
    categories: ["Action", "Adventure", "Superhero"]
  },
  {
    id: "10",
    title: "Bright",
    slug: "bright",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025",
    year: "2017",
    rating: 7.8,
    categories: ["Fantasy", "Action"]
  },
];

// Get all unique categories
const allCategories = Array.from(
  new Set(allGames.flatMap(game => game.categories))
).sort();

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  
  const filteredGames = allGames
    .filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategories.length === 0 || 
        selectedCategories.some(cat => game.categories.includes(cat))) &&
      game.rating >= minRating
    )
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else if (sortBy === 'newest') {
        return parseInt(b.year) - parseInt(a.year);
      } else if (sortBy === 'oldest') {
        return parseInt(a.year) - parseInt(b.year);
      }
      // Default: relevance (based on title match)
      return a.title.toLowerCase().indexOf(searchQuery.toLowerCase()) - 
             b.title.toLowerCase().indexOf(searchQuery.toLowerCase());
    });
  
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Search Games</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Filters</h2>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Categories</h3>
                  <div className="space-y-2">
                    {allCategories.map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-input mr-2"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Minimum Rating</h3>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span>{minRating}</span>
                    <span>10</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-background border border-input rounded-md p-2"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating (High to Low)</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Search Results */}
            <div className="lg:col-span-3">
              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Search games..."
                  className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <p className="text-muted-foreground">
                  {filteredGames.length} {filteredGames.length === 1 ? 'result' : 'results'} found
                </p>
              </div>
              
              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map((game) => (
                    <Link 
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="group bg-card rounded-lg overflow-hidden transition-transform hover:-translate-y-1"
                    >
                      <div className="aspect-video relative">
                        <Image
                          src={game.image}
                          alt={game.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          {game.rating}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{game.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{game.year}</p>
                        <div className="flex flex-wrap gap-1">
                          {game.categories.slice(0, 3).map((category) => (
                            <span key={category} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-lg">
                  <p className="text-muted-foreground mb-2">No games found matching your search criteria.</p>
                  <p className="text-sm">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
