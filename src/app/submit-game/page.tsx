"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiSave, FiUpload } from 'react-icons/fi'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function SubmitGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    developer: '',
    email: '',
    gameUrl: '',
    thumbnailUrl: '',
    bannerUrl: '',
    screenshots: ['', '', ''],
    features: [''],
  })
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  // Handle array input change
  const handleArrayChange = (index, field, value) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({
      ...formData,
      [field]: newArray
    })
  }
  
  // Add new field to array
  const addArrayField = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    })
  }
  
  // Remove field from array
  const removeArrayField = (field, index) => {
    const newArray = [...formData[field]]
    newArray.splice(index, 1)
    setFormData({
      ...formData,
      [field]: newArray
    })
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Here we would typically send the data to a backend API
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      alert('Your game has been submitted successfully! Our team will review it shortly.')
      router.push('/')
    } catch (error) {
      console.error('Error submitting game:', error)
      alert('There was an error submitting your game. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Submit Your Game</h1>
            <p className="text-foreground/70">
              Share your AI-generated game with the GameLab community. Our team will review your submission and publish it if it meets our quality standards.
            </p>
          </div>
      
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Game Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">Select Category</option>
                <option value="action">Action</option>
                <option value="adventure">Adventure</option>
                <option value="puzzle">Puzzle</option>
                <option value="rpg">RPG</option>
                <option value="simulation">Simulation</option>
                <option value="strategy">Strategy</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
          </div>
        </div>
        
        {/* Developer Information */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4">Developer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Developer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="developer"
                value={formData.developer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Game URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="gameUrl"
                value={formData.gameUrl}
                onChange={handleChange}
                required
                placeholder="https://"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
              <p className="text-xs text-foreground/70 mt-1">
                Link to where your game can be played (e.g., itch.io, GitHub Pages, etc.)
              </p>
            </div>
          </div>
        </div>
        
        {/* Media */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4">Media</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Thumbnail URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                required
                placeholder="https://"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
              <p className="text-xs text-foreground/70 mt-1">
                A 16:9 image that will be used as the game's thumbnail (recommended size: 640x360)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Banner URL
              </label>
              <input
                type="url"
                name="bannerUrl"
                value={formData.bannerUrl}
                onChange={handleChange}
                placeholder="https://"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
              <p className="text-xs text-foreground/70 mt-1">
                A wide banner image that will be displayed at the top of your game's page (recommended size: 1920x1080)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Screenshots <span className="text-red-500">*</span>
              </label>
              
              {formData.screenshots.map((screenshot, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="url"
                    value={screenshot}
                    onChange={(e) => handleArrayChange(index, 'screenshots', e.target.value)}
                    placeholder="https://"
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
                    required={index === 0}
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeArrayField('screenshots', index)}
                    disabled={formData.screenshots.length <= 1}
                    className="ml-2 p-2 text-foreground/70 hover:text-foreground disabled:opacity-50"
                  >
                    <FiUpload className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayField('screenshots')}
                className="mt-2 text-sm text-primary hover:text-primary/90 flex items-center"
              >
                <FiUpload className="mr-1 h-4 w-4" /> Add Screenshot
              </button>
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          
          {formData.features.map((feature, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleArrayChange(index, 'features', e.target.value)}
                placeholder="Enter a game feature"
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
                required={index === 0}
              />
              
              <button
                type="button"
                onClick={() => removeArrayField('features', index)}
                disabled={formData.features.length <= 1}
                className="ml-2 p-2 text-foreground/70 hover:text-foreground disabled:opacity-50"
              >
                <FiUpload className="h-5 w-5" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayField('features')}
            className="mt-2 text-sm text-primary hover:text-primary/90 flex items-center"
          >
            <FiUpload className="mr-1 h-4 w-4" /> Add Feature
          </button>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md flex items-center disabled:opacity-70"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <FiSave className="mr-2 h-5 w-5" />
                Submit Game
              </>
            )}
          </button>
        </div>
      </form>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
