"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { gameService } from '@/services/game-service'
import { GameFormData } from '@/types/game'
import { FiSave, FiUpload } from 'react-icons/fi'

export default function SubmitGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<GameFormData>>({
    title: '',
    description: '',
    image_url: '',
    category: '',
    url: '',
    featured: false,
    developer: '',
    tags: [],
    status: 'draft', // Submissions start as drafts
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
      // Upload image if selected
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadResult = await gameService.uploadGameImage(imageFile)
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url
        } else {
          throw new Error('Failed to upload image')
        }
      }

      // Prepare final form data
      const finalFormData: GameFormData = {
        title: formData.title || '',
        description: formData.description || '',
        image_url: imageUrl || '',
        category: formData.category || '',
        url: formData.url || '',
        featured: false, // User submissions are not featured by default
        developer: formData.developer || '',
        tags: formData.tags || [],
        status: 'draft', // All submissions start as drafts
      }

      // Submit to Supabase
      const result = await gameService.createGame(finalFormData)

      if (result.success) {
        setSuccess(true)
        // Reset form
        setFormData({
          title: '',
          description: '',
          image_url: '',
          category: '',
          url: '',
          featured: false,
          developer: '',
          tags: [],
          status: 'draft',
        })
        setImageFile(null)
        setImagePreview(null)
      } else {
        alert(`Failed to submit game: ${result.error?.message || 'Unknown error'}`)
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
              <p className="mb-4">Thank you for submitting your game. Our team will review it and publish it soon.</p>
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
                      <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Game Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        value={formData.title || ''}
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
                      <label htmlFor="developer" className="block text-sm font-medium mb-1">
                        Developer
                      </label>
                      <input
                        id="developer"
                        name="developer"
                        type="text"
                        value={formData.developer || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Developer name"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="image" className="block text-sm font-medium mb-1">
                        Game Image
                      </label>
                      <div className="mt-1 flex items-center">
                        <div className="w-full">
                          <label
                            htmlFor="image-upload"
                            className="flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed border-input rounded-md cursor-pointer hover:border-primary"
                          >
                            <div className="space-y-1 text-center">
                              {imagePreview ? (
                                <div className="relative h-40 w-full mb-4">
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-full mx-auto object-contain"
                                  />
                                </div>
                              ) : (
                                <FiUpload className="mx-auto h-12 w-12 text-muted-foreground" />
                              )}
                              <div className="flex text-sm">
                                <span className="relative rounded-md font-medium text-primary hover:text-primary/90">
                                  Upload a file
                                </span>
                                <p className="pl-1 text-muted-foreground">or drag and drop</p>
                              </div>
                              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                            </div>
                          </label>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label htmlFor="image_url" className="block text-sm font-medium mb-1">
                          Or enter image URL
                        </label>
                        <input
                          id="image_url"
                          name="image_url"
                          type="url"
                          value={formData.image_url || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>

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
