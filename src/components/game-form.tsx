"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiUpload } from 'react-icons/fi';
import { gameService } from '@/services/game-service';
import { Game, GameFormData } from '@/types/game';

interface GameFormProps {
  gameId?: string;
  initialData?: Partial<Game>;
  isEditing?: boolean;
}

export default function GameForm({ gameId, initialData, isEditing }: GameFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<GameFormData>>({
    title: '',
    description: '',
    image_url: '',
    gallery_images: [],
    category: '',
    url: '',
    featured: false,
    developer: '',
    developer_url: '',
    tags: [],
    status: 'draft',
    is_mobile_compatible: false,
    is_multiplayer: false,
    ...initialData
  });

  const isEditingMode = isEditing !== undefined ? isEditing : !!gameId;

  useEffect(() => {
    if (isEditingMode && gameId && !initialData) {
      const fetchGame = async () => {
        setLoading(true);
        try {
          const game = await gameService.getGameById(gameId);
          if (game) {
            setFormData({
              title: game.title,
              description: game.description,
              image_url: game.image_url,
              gallery_images: game.gallery_images || [],
              category: game.category,
              url: game.url,
              featured: game.featured,
              developer: game.developer,
              developer_url: game.developer_url || '',
              tags: game.tags,
              status: game.status,
              is_mobile_compatible: game.is_mobile_compatible || false,
              is_multiplayer: game.is_multiplayer || false,
            });
            setImagePreview(game.image_url);
            setGalleryPreviews(game.gallery_images || []);
          }
        } catch (error) {
          console.error('Error fetching game:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchGame();
    }
  }, [gameId, initialData, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the raw input value, don't split it yet
    const tagsString = e.target.value;
    
    // Store the raw string in a temporary state
    setFormData((prev) => ({
      ...prev,
      // Only split into array when submitting the form
      _tagsInput: tagsString,
      // Keep the tags array for compatibility
      tags: prev.tags
    }));
  };
  
  // Process tags before submission
  const processTagsBeforeSubmit = () => {
    const tagsString = formData._tagsInput || formData.tags?.join(', ') || '';
    // Split by commas or spaces, but treat multiple spaces as one delimiter
    return tagsString
      .split(/[,\s]+/) // Split by commas or one or more spaces
      .map(tag => tag.trim())
      .filter(Boolean); // Remove empty strings
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      // Combine with existing files, limit to 5 total
      const combinedFiles = [...galleryFiles, ...files].slice(0, 5);
      setGalleryFiles(combinedFiles);
      
      // Create previews for new files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prevPreviews => {
            // Combine with existing previews, limit to 5 total
            const newPreviews = [...prevPreviews, reader.result as string].slice(0, 5);
            return newPreviews;
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryPreview = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image if a new one is selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadResult = await gameService.uploadGameImage(imageFile);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Upload gallery images if new ones are selected
      let galleryUrls = formData.gallery_images || [];
      if (galleryFiles.length > 0) {
        const uploadResult = await gameService.uploadGalleryImages(galleryFiles);
        if (uploadResult.success && uploadResult.urls) {
          // If we're editing and have existing gallery images, combine them
          if (isEditingMode && formData.gallery_images && formData.gallery_images.length > 0) {
            // Only keep gallery images that weren't removed in the UI
            const existingImages = formData.gallery_images.filter(url => galleryPreviews.includes(url));
            galleryUrls = [...existingImages, ...uploadResult.urls];
          } else {
            galleryUrls = uploadResult.urls;
          }
        } else {
          throw new Error('Failed to upload gallery images');
        }
      } else if (galleryPreviews.length > 0 && formData.gallery_images) {
        // If no new files but previews changed (some were removed), update gallery_images
        galleryUrls = formData.gallery_images.filter(url => galleryPreviews.includes(url));
      }

      // Process tags before submission
      const processedTags = processTagsBeforeSubmit();
      
      // Prepare final form data
      const finalFormData: GameFormData = {
        title: formData.title || '',
        description: formData.description || '',
        image_url: imageUrl || '',
        gallery_images: galleryUrls,
        category: formData.category || '',
        url: formData.url || '',
        featured: !!formData.featured,
        developer: formData.developer || '',
        developer_url: formData.developer_url || '',
        tags: processedTags,
        status: formData.status as 'published' | 'draft' || 'draft',
        is_mobile_compatible: !!formData.is_mobile_compatible,
        is_multiplayer: !!formData.is_multiplayer,
      };

      let result;
      if (isEditingMode && gameId) {
        // Update existing game
        result = await gameService.updateGame(gameId, finalFormData);
      } else {
        // Create new game
        result = await gameService.createGame(finalFormData);
      }

      if (result.success) {
        router.push('/admin/games');
      } else {
        alert(`Failed to ${isEditingMode ? 'update' : 'create'} game: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${isEditingMode ? 'updating' : 'creating'} game:`, error);
      alert(`An error occurred while ${isEditingMode ? 'updating' : 'creating'} the game`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
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

          <div>
            <label htmlFor="developer_url" className="block text-sm font-medium mb-1">
              Developer Website/Social URL
            </label>
            <input
              id="developer_url"
              name="developer_url"
              type="url"
              value={formData.developer_url || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://twitter.com/developer"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-1">
              Featured Game Image
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
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="gallery-images" className="block text-sm font-medium mb-1">
              Gallery Images (up to 5)
            </label>
            <div className="mt-1">
              <div className="w-full">
                <label
                  htmlFor="gallery-upload"
                  className="flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed border-input rounded-md cursor-pointer hover:border-primary"
                >
                  <div className="space-y-1 text-center">
                    <FiUpload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="flex text-sm">
                      <span className="relative rounded-md font-medium text-primary hover:text-primary/90">
                        Upload gallery images
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Select multiple images</p>
                  </div>
                </label>
                <input
                  id="gallery-upload"
                  name="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className="sr-only"
                />
              </div>

              {/* Gallery previews */}
              {galleryPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Gallery ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryPreview(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              <option value="Puzzle">Puzzle</option>
              <option value="Simulation">Simulation</option>
              <option value="Sports">Sports</option>
              <option value="Racing">Racing</option>
              <option value="Other">Other</option>
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
              value={formData._tagsInput !== undefined ? formData._tagsInput : formData.tags?.join(', ') || ''}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="action, multiplayer, fantasy"
            />
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  checked={!!formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm">
                  Featured Game
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="is_mobile_compatible"
                  name="is_mobile_compatible"
                  type="checkbox"
                  checked={!!formData.is_mobile_compatible}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="is_mobile_compatible" className="ml-2 block text-sm">
                  Mobile Compatible
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="is_multiplayer"
                  name="is_multiplayer"
                  type="checkbox"
                  checked={!!formData.is_multiplayer}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="is_multiplayer" className="ml-2 block text-sm">
                  Multiplayer Support
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'draft'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => router.push('/admin/games')}
          className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
        >
          <FiX className="inline-block mr-2 h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span>Processing...</span>
          ) : (
            <>
              <FiSave className="inline-block mr-2 h-4 w-4" />
              {isEditingMode ? 'Update Game' : 'Create Game'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
