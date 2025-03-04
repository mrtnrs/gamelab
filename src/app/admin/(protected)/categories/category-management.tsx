"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiX } from 'react-icons/fi'
import { gameService, Category, CategoryFormData } from '@/services/game-service'
import { generateSlug } from '@/utils/slug'

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Partial<CategoryFormData>>({
    name: '',
    slug: '',
    image: '',
    description: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load categories from Supabase
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await gameService.getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) => {
    return category.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Handle category form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentCategory({
      ...currentCategory,
      [name]: value
    })

    // Auto-generate slug from name if editing the name field
    if (name === 'name') {
      setCurrentCategory(prev => ({
        ...prev,
        slug: generateSlug(value)
      }))
    }
  }

  // Start editing a category
  const handleEditCategory = (category: Category) => {
    setIsEditing(true)
    setIsCreating(false)
    setEditingId(category.id)
    setCurrentCategory({
      name: category.name,
      slug: category.slug,
      image: category.image,
      description: category.description || ''
    })
    setError(null)
    setSuccess(null)
  }

  // Start creating a new category
  const handleNewCategory = () => {
    setIsCreating(true)
    setIsEditing(false)
    setEditingId(null)
    setCurrentCategory({
      name: '',
      slug: '',
      image: 'https://via.placeholder.com/300x200',
      description: ''
    })
    setError(null)
    setSuccess(null)
  }

  // Cancel editing or creating
  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    setEditingId(null)
    setCurrentCategory({
      name: '',
      slug: '',
      image: '',
      description: ''
    })
    setError(null)
    setSuccess(null)
  }

  // Save category (create or update)
  const handleSaveCategory = async () => {
    // Validate form
    if (!currentCategory.name) {
      setError('Category name is required')
      return
    }

    if (!currentCategory.image) {
      setError('Category image URL is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (isCreating) {
        // Create new category
        const result = await gameService.createCategory(currentCategory as CategoryFormData)
        if (result.success) {
          setSuccess('Category created successfully')
          await fetchCategories()
          handleCancel()
        } else {
          setError(`Failed to create category: ${result.error?.message || 'Unknown error'}`)
        }
      } else if (isEditing && editingId) {
        // Update existing category
        const result = await gameService.updateCategory(editingId, currentCategory)
        if (result.success) {
          setSuccess('Category updated successfully')
          await fetchCategories()
          handleCancel()
        } else {
          setError(`Failed to update category: ${result.error?.message || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error saving category:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        setLoading(true)
        setError(null)
        
        const result = await gameService.deleteCategory(id)
        if (result.success) {
          setSuccess('Category deleted successfully')
          await fetchCategories()
        } else {
          setError(`Failed to delete category: ${result.error?.message || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Category Management</h1>
        {!isCreating && !isEditing && (
          <button
            onClick={handleNewCategory}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add New Category
          </button>
        )}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Category Form */}
      {(isCreating || isEditing) && (
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
          <h2 className="text-xl font-semibold mb-4">
            {isCreating ? 'Create New Category' : 'Edit Category'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  Category Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentCategory.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="slug">
                  Slug (auto-generated)
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentCategory.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated-from-name"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="image">
                  Image URL *
                </label>
                <input
                  id="image"
                  name="image"
                  type="text"
                  className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentCategory.image}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={currentCategory.description}
                  onChange={handleInputChange}
                />
              </div>
              
              {currentCategory.image && (
                <div className="mb-4">
                  <p className="block text-sm font-medium mb-1">Image Preview</p>
                  <div className="relative h-40 w-full rounded-md overflow-hidden">
                    <Image
                      src={currentCategory.image}
                      alt="Category preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-input bg-background rounded-md hover:bg-muted transition-colors"
            >
              <FiX className="mr-2 h-4 w-4 inline" />
              Cancel
            </button>
            <button
              onClick={handleSaveCategory}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <FiSave className="mr-2 h-4 w-4 inline" />
              {isCreating ? 'Create Category' : 'Update Category'}
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!isCreating && !isEditing && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Categories Table */}
      {!isCreating && !isEditing && (
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">Loading categories...</div>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <Image
                              src={category.image || '/placeholder-category.jpg'}
                              alt={category.name}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                          </div>
                          <div className="font-medium">{category.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="max-w-xs truncate">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No categories found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
