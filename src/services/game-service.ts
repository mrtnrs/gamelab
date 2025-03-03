import { supabase } from '@/utils/supabase';
import { Game, GameFormData } from '@/types/game';

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
  
  async getGamesByCategory(category: string): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching games by category ${category}:`, error);
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
  
  async getTopRatedGames(limit: number = 5): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .gt('rating_count', 0) // Only include games with at least one rating
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
  
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('category')
        .eq('status', 'published');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      
      // Extract unique categories
      const categories = [...new Set(data?.map(game => game.category))];
      return categories.filter(Boolean) as string[];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
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
  }
};
