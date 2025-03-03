"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { FiSearch } from 'react-icons/fi'

// Mock categories data
const categories = [
  {
    id: "1",
    name: "Action",
    slug: "action",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070",
    count: 42
  },
  {
    id: "2",
    name: "Adventure",
    slug: "adventure",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070",
    count: 38
  },
  {
    id: "3",
    name: "RPG",
    slug: "rpg",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071",
    count: 27
  },
  {
    id: "4",
    name: "Strategy",
    slug: "strategy",
    image: "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?q=80&w=2080",
    count: 19
  },
  {
    id: "5",
    name: "Simulation",
    slug: "simulation",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059",
    count: 24
  },
  {
    id: "6",
    name: "Sports",
    slug: "sports",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070",
    count: 16
  },
  {
    id: "7",
    name: "Racing",
    slug: "racing",
    image: "https://images.unsplash.com/photo-1559163499-413811fb2344?q=80&w=2070",
    count: 12
  },
  {
    id: "8",
    name: "Puzzle",
    slug: "puzzle",
    image: "https://images.unsplash.com/photo-1547638375-ebf04735d792?q=80&w=2013",
    count: 31
  },
  {
    id: "9",
    name: "Horror",
    slug: "horror",
    image: "https://images.unsplash.com/photo-1608889175638-9322300c46e8?q=80&w=2080",
    count: 18
  },
  {
    id: "10",
    name: "Platformer",
    slug: "platformer",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025",
    count: 22
  },
  {
    id: "11",
    name: "Shooter",
    slug: "shooter",
    image: "https://images.unsplash.com/photo-1543536448-d209d2d13a1c?q=80&w=2070",
    count: 29
  },
  {
    id: "12",
    name: "Fighting",
    slug: "fighting",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070",
    count: 14
  },
];

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <Link 
                key={category.id}
                href={`/games?category=${category.slug}`}
                className="group relative rounded-lg overflow-hidden"
              >
                <div className="aspect-video relative">
                  <Image
                    src={category.image}
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
