"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiUpload } from 'react-icons/fi';
import { gameService } from '@/services/game-service';
import { Game, GameFormData } from '@/types/game';

interface GameFormProps {
  gameId?: string;
  initialData?: Partial<Game>;
}

export default function GameForm({ gameId, initialData }: GameFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<GameFormData>>({
    title: '',
    description: '',
    image_url: '',
    category: '',
    url: '',
    featured: false,
    developer: '',
    tags: [],
    status: 'draft',
    ...initialData
  });

  const isEditing = !!gameId;

  useEffect(() => {
    if (isEditing && gameId && !initialData) {
      const fetchGame = async () => {
        setLoading(true);
        try {
          const game = await gameService.getGameById(gameId);
          if (game) {
            setFormData({
              title: game.title,
              description: game.description,
              image_url: game.image_url,
              category: game.category,
              url: game.url,
              featured: game.featured,
              developer: game.developer,
              tags: game.tags,
              status: game.status,
            });
            setImagePreview(game.image_url);
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
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, tags: tagsArray }));
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

      // Prepare final form data
      const finalFormData: GameFormData = {
        title: formData.title || '',
        description: formData.description || '',
        image_url: imageUrl || '',
        category: formData.category || '',
        url: formData.url || '',
        featured: !!formData.featured,
        developer: formData.developer || '',
        tags: formData.tags || [],
        status: formData.status as 'published' | 'draft' || 'draft',
      };

      let result;
      if (isEditing && gameId) {
        // Update existing game
        result = await gameService.updateGame(gameId, finalFormData);
      } else {
        // Create new game
        result = await gameService.createGame(finalFormData);
      }

      if (result.success) {
        router.push('/admin/games');
      } else {
        alert(`Failed to ${isEditing ? 'update' : 'create'} game: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} game:`, error);
      alert(`An error occurred while ${isEditing ? 'updating' : 'creating'} the game`);
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
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </div>
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
              value={formData.tags?.join(', ') || ''}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="action, multiplayer, fantasy"
            />
          </div>

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
              {isEditing ? 'Update Game' : 'Create Game'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
