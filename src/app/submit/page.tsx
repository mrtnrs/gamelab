"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { gameService } from '@/services/game-service'
import { GameFormData } from '@/types/game'
import { FiSave, FiUpload } from 'react-icons/fi'
import { supabase } from '@/utils/supabase'

export default function SubmitGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    url: '',
    link_to_socials: '',
    email: '',
    tags: [],
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    setFormData((prev) => ({ ...prev, tags: tagsArray }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Submit to game_submissions table
      const { data, error } = await supabase
        .from('game_submissions')
        .insert([
          {
            name: formData.name,
            link_to_socials: formData.link_to_socials,
            email: formData.email || null
          }
        ])

      if (!error) {
        setSuccess(true)
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          url: '',
          link_to_socials: '',
          email: '',
          tags: [],
        })
      } else {
        alert(`Failed to submit game: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting game:', error)
      alert('An error occurred while submitting the game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Submit Your Game</h1>
            <p className="text-muted-foreground mt-2">Share your game with the GameLab community</p>
          </div>
          
          {success ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-2">Game Submitted Successfully!</h2>
              <p className="mb-4">Successfully submitted your game. We'll add it to the site asap if it meets requirements.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSuccess(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Submit Another Game
                </button>
                <button 
                  onClick={() => router.push('/')}
                  className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Game Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Game title"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Game description"
                      />
                    </div>

                    <div>
                      <label htmlFor="url" className="block text-sm font-medium mb-1">
                        Game URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="url"
                        name="url"
                        type="url"
                        required
                        value={formData.url || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/game"
                      />
                    </div>

                    <div>
                      <label htmlFor="link_to_socials" className="block text-sm font-medium mb-1">
                        Link to Socials <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="link_to_socials"
                        name="link_to_socials"
                        type="url"
                        required
                        value={formData.link_to_socials || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://x.com/yourusername"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email (optional)
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Game Image upload field removed */}

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a category</option>
                        <option value="Action">Action</option>
                        <option value="Adventure">Adventure</option>
                        <option value="RPG">RPG</option>
                        <option value="Strategy">Strategy</option>
                        <option value="Simulation">Simulation</option>
                        <option value="Sports">Sports</option>
                        <option value="Racing">Racing</option>
                        <option value="Puzzle">Puzzle</option>
                        <option value="Shooter">Shooter</option>
                        <option value="Platformer">Platformer</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium mb-1">
                        Tags (comma separated)
                      </label>
                      <input
                        id="tags"
                        name="tags"
                        type="text"
                        value={formData.tags?.join(', ') || ''}
                        onChange={handleTagsChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. multiplayer, fantasy, puzzle"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <FiSave className="mr-2 h-4 w-4" />
                    {loading ? 'Submitting...' : 'Submit Game'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
