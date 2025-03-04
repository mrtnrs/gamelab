import { supabase } from '@/utils/supabase';
import { Game, GameFormData } from '@/types/game';

// Comment type definition
export interface GameComment {
  id: string;
  game_id: string;
  comment_text: string;
  created_at: string;
  user_id?: string;
}

// Category type definition
export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  count?: number;
}

// Category form data type
export interface CategoryFormData {
  name: string;
  slug?: string;
  image: string;
  description?: string;
}

export const gameService = {
  async getGames(): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getGames:', error);
      return [];
    }
  },
  
  async getFeaturedGames(): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('featured', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching featured games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getFeaturedGames:', error);
      return [];
    }
  },
  
  async getGamesByCategory(categorySlug: string): Promise<Game[]> {
    try {
      // First get the category ID from the slug
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (categoryError || !categoryData) {
        console.error(`Error fetching category with slug ${categorySlug}:`, categoryError);
        return [];
      }
      
      // Then get games with that category ID
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching games by category ${categorySlug}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getGamesByCategory:', error);
      return [];
    }
  },
  
  async getGameById(id: string): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching game with id ${id}:`, error);
        return null;
      }
      
      // Increment visit count in the background
      this.incrementVisitCount(id).catch(err => {
        console.error('Error incrementing visit count:', err);
      });
      
      return data;
    } catch (error) {
      console.error('Error in getGameById:', error);
      return null;
    }
  },
  
  async getGameBySlug(slug: string): Promise<Game | null> {
    try {
      // Convert slug to title format by replacing hyphens with spaces and capitalizing words
      const title = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .ilike('title', title)
        .eq('status', 'published')
        .single();
      
      if (error) {
        console.error(`Error fetching game with slug ${slug}:`, error);
        return null;
      }
      
      // Increment visit count in the background
      if (data) {
        this.incrementVisitCount(data.id).catch(err => {
          console.error('Error incrementing visit count:', err);
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error in getGameBySlug:', error);
      return null;
    }
  },
  
  async incrementVisitCount(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_game_visit_count', { game_id: id });
      
      if (error) {
        console.error(`Error incrementing visit count for game ${id}:`, error);
      }
    } catch (error) {
      console.error('Error in incrementVisitCount:', error);
    }
  },
  
  async rateGame(id: string, rating: number): Promise<{ success: boolean; error?: any }> {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }
      
      // First, insert the rating into the game_ratings table
      const { error: ratingError } = await supabase
        .from('game_ratings')
        .insert([
          { 
            game_id: id,
            rating,
            // We don't have user_id or user_ip here, but in a real app you would include them
          }
        ]);
      
      if (ratingError) {
        // If there's a unique constraint violation, the user has already rated this game
        if (ratingError.code === '23505') { // PostgreSQL unique violation code
          return { success: false, error: 'You have already rated this game' };
        }
        console.error(`Error rating game ${id}:`, ratingError);
        return { success: false, error: ratingError };
      }
      
      // Then, update the game's rating stats
      const { error: updateError } = await supabase.rpc('update_game_rating_stats', { 
        game_id: id,
        new_rating: rating
      });
      
      if (updateError) {
        console.error(`Error updating rating stats for game ${id}:`, updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in rateGame:', error);
      return { success: false, error };
    }
  },
  
  async getTrendingGames(limit: number = 5): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .order('visit_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching trending games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTrendingGames:', error);
      return [];
    }
  },
  
  async getTopRatedGames(limit: number = 10): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .gt('rating_average', 0) // Only games with ratings > 0
        .gt('rating_count', 0)  // Only games with at least one rating
        .order('rating_average', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching top rated games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTopRatedGames:', error);
      return [];
    }
  },
  
  async getNewReleases(limit: number = 10): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false }) // Sort by created_at to get newest games
        .limit(limit);
      
      if (error) {
        console.error('Error fetching new releases:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getNewReleases:', error);
      return [];
    }
  },

  async getMobileGames(limit: number = 10): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .eq('is_mobile_compatible', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching mobile games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getMobileGames:', error);
      return [];
    }
  },
  
  async getMultiplayerGames(limit: number = 10): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .eq('is_multiplayer', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching multiplayer games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getMultiplayerGames:', error);
      return [];
    }
  },
  
  async getFilteredGames(options: { 
    categoryId?: string, 
    mobileOnly?: boolean, 
    multiplayerOnly?: boolean,
    limit?: number
  }): Promise<Game[]> {
    try {
      let query = supabase
        .from('games')
        .select('*')
        .eq('status', 'published');
      
      if (options.categoryId && options.categoryId !== 'all') {
        query = query.eq('category_id', options.categoryId);
      }
      
      if (options.mobileOnly) {
        query = query.eq('is_mobile_compatible', true);
      }
      
      if (options.multiplayerOnly) {
        query = query.eq('is_multiplayer', true);
      }
      
      query = query.order('created_at', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching filtered games:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getFilteredGames:', error);
      return [];
    }
  },
  
  async createGame(gameData: GameFormData): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert([
          { 
            ...gameData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        console.error('Error creating game:', error);
        return { success: false, error };
      }
      
      return { success: true, id: data?.[0]?.id };
    } catch (error) {
      console.error('Error in createGame:', error);
      return { success: false, error };
    }
  },
  
  async updateGame(id: string, gameData: Partial<GameFormData>): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          ...gameData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error(`Error updating game with id ${id}:`, error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in updateGame:', error);
      return { success: false, error };
    }
  },
  
  async deleteGame(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting game with id ${id}:`, error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteGame:', error);
      return { success: false, error };
    }
  },
  
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.rpc('get_categories_with_counts');
      
      if (error) {
        console.error('Error fetching categories with counts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  },
  
  async getAllCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching all categories:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return [];
    }
  },
  
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        console.error(`Error fetching category with slug ${slug}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCategoryBySlug:', error);
      return null;
    }
  },
  
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching category with id ${id}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      return null;
    }
  },
  
  async createCategory(categoryData: CategoryFormData): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
      // Generate slug from name if not provided
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name.toLowerCase().replace(/\s+/g, '-');
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: categoryData.name,
            slug: categoryData.slug,
            image: categoryData.image,
            description: categoryData.description || '',
          }
        ])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating category:', error);
        return { success: false, error };
      }
      
      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error in createCategory:', error);
      return { success: false, error };
    }
  },
  
  async updateCategory(id: string, categoryData: Partial<CategoryFormData>): Promise<{ success: boolean; error?: any }> {
    try {
      // Generate slug from name if name is provided but slug isn't
      if (categoryData.name && !categoryData.slug) {
        categoryData.slug = categoryData.name.toLowerCase().replace(/\s+/g, '-');
      }
      
      const { error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          slug: categoryData.slug,
          image: categoryData.image,
          description: categoryData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating category:', error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in updateCategory:', error);
      return { success: false, error };
    }
  },
  
  async deleteCategory(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      // First, check if there are games using this category
      const { data: games, error: checkError } = await supabase
        .from('games')
        .select('id')
        .eq('category_id', id);
      
      if (checkError) {
        console.error('Error checking games with category:', checkError);
        return { success: false, error: checkError };
      }
      
      // If there are games using this category, don't delete it
      if (games && games.length > 0) {
        return { 
          success: false, 
          error: { message: `Cannot delete category because it is used by ${games.length} games. Please reassign these games to another category first.` }
        };
      }
      
      // Delete the category if it's not being used
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting category:', error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      return { success: false, error };
    }
  },
  
  async uploadGameImage(file: File): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `game-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gameimages')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return { success: false, error: uploadError };
      }
      
      const { data } = supabase.storage
        .from('gameimages')
        .getPublicUrl(filePath);
      
      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error('Error in uploadGameImage:', error);
      return { success: false, error };
    }
  },

  async uploadGalleryImages(files: File[]): Promise<{ success: boolean; urls?: string[]; error?: any }> {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `game-images/gallery/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gameimages')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Error uploading gallery image:', uploadError);
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('gameimages')
          .getPublicUrl(filePath);
        
        return data.publicUrl;
      });
      
      const urls = await Promise.all(uploadPromises);
      return { success: true, urls };
    } catch (error) {
      console.error('Error in uploadGalleryImages:', error);
      return { success: false, error };
    }
  },
  
  async addComment(gameId: string, commentText: string): Promise<{ success: boolean; commentId?: string; error?: any }> {
    try {
      const { data, error } = await supabase.rpc('add_game_comment', {
        p_game_id: gameId,
        p_comment_text: commentText
      });
      
      if (error) {
        console.error(`Error adding comment to game ${gameId}:`, error);
        return { success: false, error: error.message };
      }
      
      if (!data.success) {
        return { success: false, error: data.error };
      }
      
      return { success: true, commentId: data.comment_id };
    } catch (error) {
      console.error('Error in addComment:', error);
      return { success: false, error };
    }
  },
  
  async getComments(gameId: string): Promise<GameComment[]> {
    try {
      const { data, error } = await supabase
        .from('game_comments')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching comments for game ${gameId}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  },
  
  async getSimilarGames(gameId: string, tags: string[], limit: number = 5): Promise<Game[]> {
    try {
      // First try to find games with matching tags
      if (tags && tags.length > 0) {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .neq('id', gameId) // Exclude current game
          .eq('status', 'published')
          .overlaps('tags', tags) // Find games with at least one matching tag
          .order('rating_average', { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error(`Error fetching similar games for game ${gameId}:`, error);
          return [];
        }
        
        if (data && data.length >= limit) {
          return data;
        }
        
        // If we didn't get enough games with matching tags, get some popular games to fill the list
        const remainingLimit = limit - (data?.length || 0);
        if (remainingLimit > 0) {
          const { data: popularGames, error: popularError } = await supabase
            .from('games')
            .select('*')
            .neq('id', gameId)
            .eq('status', 'published')
            .not('id', 'in', data?.map(g => g.id) || [])
            .order('visit_count', { ascending: false })
            .limit(remainingLimit);
          
          if (!popularError && popularGames) {
            return [...(data || []), ...popularGames];
          }
        }
        
        return data || [];
      }
      
      // If no tags, just get popular games
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .neq('id', gameId)
        .eq('status', 'published')
        .order('visit_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`Error fetching popular games for game ${gameId}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSimilarGames:', error);
      return [];
    }
  },
};
