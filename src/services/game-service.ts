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
      
      return data;
    } catch (error) {
      console.error('Error in getGameById:', error);
      return null;
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
        .from('game-assets')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return { success: false, error: uploadError };
      }
      
      const { data } = supabase.storage
        .from('game-assets')
        .getPublicUrl(filePath);
      
      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error('Error in uploadGameImage:', error);
      return { success: false, error };
    }
  }
};
