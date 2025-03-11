import { supabase } from '@/utils/supabase'
import { generateSlug, getSlugVariations, slugsMatch } from '@/utils/slug';
import { Game, GameFormData } from '@/types/game';
import { generateUUID } from '@/utils/crypto-utils';

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

// Changelog type definition
export interface Changelog {
  id: string;
  title: string;
  version: string;
  date: string;
  content: string;
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
      // First get the category from the slug
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('slug', categorySlug)
        .single();
      
      if (categoryError || !categoryData) {
        console.error(`Error fetching category with slug ${categorySlug}:`, categoryError);
        return [];
      }
      
      // Get all published games
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching games for category ${categorySlug}:`, error);
        return [];
      }
      
      // Filter games by category name (case-insensitive)
      const categoryName = categoryData.name.toLowerCase();
    //  console.log(`Filtering games by category name (case-insensitive): ${categoryName}`);
      
      const filteredGames = data.filter(game => {
        // Handle both direct category_id match and case-insensitive category name match
        const matchesById = game.category_id === categoryData.id;
        const matchesByName = game.category && game.category.toLowerCase() === categoryName;
        
        return matchesById || matchesByName;
      });
      
    //  console.log(`Found ${filteredGames.length} games in category ${categoryData.name}`);
      return filteredGames || [];
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
      if (!slug) {
        console.error('Empty slug provided to getGameBySlug');
        return null;
      }

    //  console.log(`[getGameBySlug] Looking for game with slug: ${slug}`);
      
      // Get all published games
      const { data: allGames, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'published');
      
      if (error) {
        console.error('Error fetching games:', error);
        return null;
      }

      if (!allGames || allGames.length === 0) {
        console.log('No published games found');
        return null;
      }

    //  console.log(`[getGameBySlug] Found ${allGames.length} published games`);
      
      // First pass: Try to find an exact match by title-generated slug
      const generatedSlug = generateSlug(slug);
      console.log(`[getGameBySlug] Generated slug: ${generatedSlug}`);
      
      // Multi-pass matching
      let matchedGame: Game | null = null;
      
      // Pass 1: Try exact title match (case insensitive)
      matchedGame = allGames.find(game => {
        const gameSlug = generateSlug(game.title);
        const exactMatch = gameSlug.toLowerCase() === generatedSlug.toLowerCase();
        if (exactMatch) console.log(`[getGameBySlug] Found exact match: ${game.title}`);
        return exactMatch;
      }) || null;
      
      // Pass 2: Try slug matching with our utility
      if (!matchedGame) {
        matchedGame = allGames.find(game => {
          const gameSlug = generateSlug(game.title);
          const match = slugsMatch(gameSlug, slug);
          if (match) console.log(`[getGameBySlug] Found match using slugsMatch: ${game.title}`);
          return match;
        }) || null;
      }
      
      // Pass 3: Try partial title match
      if (!matchedGame) {
        matchedGame = allGames.find(game => {
          const gameTitle = game.title.toLowerCase();
          const searchSlug = slug.toLowerCase().replace(/-/g, ' ');
          const partialMatch = gameTitle.includes(searchSlug) || searchSlug.includes(gameTitle);
          if (partialMatch) console.log(`[getGameBySlug] Found partial match: ${game.title}`);
          return partialMatch;
        }) || null;
      }
      
      // Pass 4: Try matching first word
      if (!matchedGame) {
        const firstWord = slug.split('-')[0];
        if (firstWord && firstWord.length > 2) {
          matchedGame = allGames.find(game => {
            const gameFirstWord = game.title.split(' ')[0].toLowerCase();
            const match = gameFirstWord === firstWord.toLowerCase();
            if (match) console.log(`[getGameBySlug] Found first word match: ${game.title}`);
            return match;
          }) || null;
        }
      }
      
      if (matchedGame) {
       // console.log(`[getGameBySlug] Successfully found game: ${matchedGame.title}`);
        
        // Get the most up-to-date game data directly from the database
        const { data: freshGameData, error: freshError } = await supabase
          .from('games')
          .select('*')
          .eq('id', matchedGame.id)
          .single();
        
        if (freshError) {
          console.error('[getGameBySlug] Error fetching fresh game data:', freshError);
          // Continue with the matched game data if we can't get fresh data
        } else if (freshGameData) {
          console.log('[getGameBySlug] Retrieved fresh game data:', {
            id: freshGameData.id,
            title: freshGameData.title,
            claimed: freshGameData.claimed,
            developer_url: freshGameData.developer_url
          });
          matchedGame = freshGameData;
        }
        
        // Increment visit count in the background
        if (matchedGame) {
          this.incrementVisitCount(matchedGame.id).catch(err => {
            console.error('Error incrementing visit count:', err);
          });
        }
        
        return matchedGame;
      } else {
        console.log(`[getGameBySlug] No game found for slug: ${slug}`);
        return null;
      }
    } catch (error) {
      console.error('Error in getGameBySlug:', error);
      return null;
    }
  },
  
  async getGameSlugById(id: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('title')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching game title:', error);
        return null;
      }
      
      if (!data || !data.title) {
        return null;
      }
      
      // Generate the slug from the title
      return generateSlug(data.title);
    } catch (error) {
      console.error('Error in getGameSlugById:', error);
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
      // Base query to get all published games
      let query = supabase
        .from('games')
        .select('*')
        .eq('status', 'published');
      
      // Apply mobile and multiplayer filters directly in the query
      if (options.mobileOnly) {
        query = query.eq('is_mobile_compatible', true);
      }
      
      if (options.multiplayerOnly) {
        query = query.eq('is_multiplayer', true);
      }
      
      // Apply sorting
      query = query.order('created_at', { ascending: false });
      
      // Apply limit if specified
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching filtered games:', error);
        return [];
      }
      
      // If no category filter or 'all' category, return all games
      if (!options.categoryId || options.categoryId === 'all') {
        return data || [];
      }
      
      // For category filtering, we need to handle it post-query for case insensitivity
      // First get the category name
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', options.categoryId)
        .single();
      
      if (categoryError || !categoryData) {
        console.error(`Error fetching category with id ${options.categoryId}:`, categoryError);
        return [];
      }
      
      // Filter games by category (case-insensitive)
      const categoryName = categoryData.name.toLowerCase();
      console.log(`Filtering games by category (case-insensitive): ${categoryName}`);
      
      const filteredGames = data.filter(game => {
        // Handle both direct category_id match and case-insensitive category name match
        const matchesById = game.category_id === categoryData.id;
        const matchesByName = game.category && game.category.toLowerCase() === categoryName;
        
        return matchesById || matchesByName;
      });
      
      console.log(`Found ${filteredGames.length} games in category ${categoryData.name}`);
      return filteredGames || [];
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
      // First get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return [];
      }
      
      // Get all published games to count them for each category
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, category, category_id')
        .eq('status', 'published');
      
      if (gamesError) {
        console.error('Error fetching games for category counts:', gamesError);
        return categories || [];
      }
      
      // Count games for each category (case-insensitive)
      const categoriesWithCount = categories.map(category => {
        const categoryName = category.name.toLowerCase();
        
        const count = games.filter(game => {
          const matchesById = game.category_id === category.id;
          const matchesByName = game.category && game.category.toLowerCase() === categoryName;
          
          return matchesById || matchesByName;
        }).length;
        
        return {
          ...category,
          count
        };
      });
      
      return categoriesWithCount || [];
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return [];
    }
  },
  
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      console.log(`Looking for category with slug: ${slug}`);
      
      // First try exact match
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (data) {
        console.log(`Found category by exact slug match: ${data.name}`);
        return data;
      }
      
      if (error) {
        console.error(`Error fetching category with slug ${slug}:`, error);
        return null;
      }
      
      // If no exact match, get all categories and do case-insensitive comparison
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (allCategoriesError) {
        console.error('Error fetching all categories:', allCategoriesError);
        return null;
      }
      
      // Try case-insensitive match
      const normalizedSlug = slug.toLowerCase();
      const matchedCategory = allCategories.find(category => 
        category.slug.toLowerCase() === normalizedSlug ||
        generateSlug(category.name).toLowerCase() === normalizedSlug
      );
      
      if (matchedCategory) {
        console.log(`Found category by case-insensitive match: ${matchedCategory.name}`);
        return matchedCategory;
      }
      
      console.log(`No category found for slug: ${slug}`);
      return null;
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
        categoryData.slug = generateSlug(categoryData.name);
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
        categoryData.slug = generateSlug(categoryData.name);
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
      //console.log('getSimilarGames called with gameId:', gameId, 'tags:', tags, 'limit:', limit);
      let result: Game[] = [];
      
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
        } else if (data) {
         // console.log('Found games with matching tags:', data.length);
          result = data;
        }
      }
      
      // If we don't have enough games with matching tags, get some popular games to fill the list
      if (result.length < limit) {
       // console.log('Not enough games with matching tags, fetching popular games');
        const remainingLimit = limit - result.length;
        const { data: popularGames, error: popularError } = await supabase
          .from('games')
          .select('*')
          .neq('id', gameId)
          .eq('status', 'published')
          .not('id', 'in', result.map(g => g.id))
          .order('visit_count', { ascending: false })
          .limit(remainingLimit);
        
        if (!popularError && popularGames) {
         // console.log('Found popular games:', popularGames.length);
          result = [...result, ...popularGames];
        } else if (popularError) {
          console.error('Error fetching popular games:', popularError);
        }
      }
      
      // If we still don't have enough games, get random games to reach the minimum limit
      if (result.length < limit) {
       // console.log('Still not enough games, fetching random games by created_at');
        const remainingLimit = limit - result.length;
        const { data: randomGames, error: randomError } = await supabase
          .from('games')
          .select('*')
          .neq('id', gameId)
          .eq('status', 'published')
          .not('id', 'in', result.map(g => g.id))
          .order('created_at', { ascending: false }) // Different ordering to get different games
          .limit(remainingLimit);
        
        if (!randomError && randomGames) {
        //  console.log('Found random games by created_at:', randomGames.length);
          result = [...result, ...randomGames];
        } else if (randomError) {
          console.error('Error fetching random games by created_at:', randomError);
        }
      }
      
      // If we STILL don't have enough games, try one more approach with a different ordering
      if (result.length < limit) {
       // console.log('STILL not enough games, fetching any games');
        const remainingLimit = limit - result.length;
        const { data: moreRandomGames, error: moreRandomError } = await supabase
          .from('games')
          .select('*')
          .neq('id', gameId)
          .eq('status', 'published')
          .not('id', 'in', result.map(g => g.id))
          .limit(remainingLimit);
        
        if (!moreRandomError && moreRandomGames) {
          console.log('Found more random games:', moreRandomGames.length);
          result = [...result, ...moreRandomGames];
        } else if (moreRandomError) {
          console.error('Error fetching more random games:', moreRandomError);
        }
      }
      
      // As a last resort, if we still don't have enough games, just get ANY games
      if (result.length < limit) {
        console.log('FINAL ATTEMPT: Getting any games');
        const remainingLimit = limit - result.length;
        const { data: anyGames, error: anyError } = await supabase
          .from('games')
          .select('*')
          .limit(remainingLimit);
        
        if (!anyError && anyGames) {
          console.log('Found any games:', anyGames.length);
          // Filter out the current game and any duplicates
          const filteredGames = anyGames.filter(g => 
            g.id !== gameId && !result.some(existing => existing.id === g.id)
          );
          result = [...result, ...filteredGames];
        } else if (anyError) {
          console.error('Error fetching any games:', anyError);
        }
      }
      
      console.log('Final result length:', result.length);
      return result;
    } catch (error) {
      console.error('Error in getSimilarGames:', error);
      return [];
    }
  },
  
  /**
   * Claims a game for a developer based on X.com handle
   * @param gameId The ID of the game to claim
   * @param xHandle The X.com handle of the developer (without @)
   * @returns Success status and error if any
   */
  async claimGame(gameId: string, xHandle: string): Promise<{ success: boolean; error?: any }> {
    try {
      // First, get the game to check the developer_url
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('developer_url, claimed')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error('Error fetching game for claiming:', gameError);
        return { success: false, error: 'Game not found' };
      }
      
      // Check if the game is already claimed
      if (game.claimed) {
        return { success: false, error: 'This game has already been claimed' };
      }
      
      // Check if the developer_url contains the X handle
      if (!game.developer_url || !game.developer_url.includes('x.com/')) {
        return { 
          success: false, 
          error: 'This game does not have a valid X.com developer URL' 
        };
      }
      
      // Extract the handle from the developer_url
      const urlParts = game.developer_url.split('/');
      const developerHandle = urlParts[urlParts.length - 1];
      
      // Compare the handles (case insensitive)
      if (developerHandle.toLowerCase() !== xHandle.toLowerCase()) {
        return { 
          success: false, 
          error: 'Your X.com handle does not match the developer URL for this game' 
        };
      }
      
      // Update the game to mark it as claimed
      const { error: updateError } = await supabase
        .from('games')
        .update({ claimed: true })
        .eq('id', gameId);
      
      if (updateError) {
        console.error('Error claiming game:', updateError);
        return { success: false, error: 'Failed to claim game' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in claimGame:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
  
  /**
   * Adds a new changelog to a game
   * @param gameId The ID of the game
   * @param changelog The changelog to add
   * @returns Success status and error if any
   */
  async addChangelog(
    gameId: string, 
    changelog: Omit<Changelog, 'id'>
  ): Promise<{ success: boolean; changelogId?: string; error?: any }> {
    try {
      // First, get the current changelogs array
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('changelogs, claimed')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error('Error fetching game for changelog:', gameError);
        return { success: false, error: 'Game not found' };
      }
      
      // Check if the game is claimed
      if (!game.claimed) {
        return { 
          success: false, 
          error: 'You must claim this game before adding changelogs' 
        };
      }
      
      // Generate a unique ID for the changelog
      const changelogId = generateUUID();
      
      // Create the new changelog object
      const newChangelog: Changelog = {
        id: changelogId,
        ...changelog
      };
      
      // Get existing changelogs or initialize empty array
      const existingChangelogs: Changelog[] = game.changelogs || [];
      
      // Add the new changelog to the array
      const updatedChangelogs = [...existingChangelogs, newChangelog];
      
      // Update the game with the new changelogs array
      const { error: updateError } = await supabase
        .from('games')
        .update({ changelogs: updatedChangelogs })
        .eq('id', gameId);
      
      if (updateError) {
        console.error('Error adding changelog:', updateError);
        return { success: false, error: 'Failed to add changelog' };
      }
      
      return { success: true, changelogId };
    } catch (error) {
      console.error('Error in addChangelog:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
  
  /**
   * Updates an existing changelog
   * @param gameId The ID of the game
   * @param changelogId The ID of the changelog to update
   * @param changelog The updated changelog data
   * @returns Success status and error if any
   */
  async updateChangelog(
    gameId: string,
    changelogId: string,
    changelog: Partial<Omit<Changelog, 'id'>>
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // First, get the game and its changelogs
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('changelogs, claimed')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error('Error fetching game for changelog update:', gameError);
        return { success: false, error: 'Game not found' };
      }
      
      // Check if the game is claimed
      if (!game.claimed) {
        return { 
          success: false, 
          error: 'You must claim this game before updating changelogs' 
        };
      }
      
      // Get existing changelogs or initialize empty array
      const existingChangelogs: Changelog[] = game.changelogs || [];
      
      // Find the index of the changelog to update
      const changelogIndex = existingChangelogs.findIndex(cl => cl.id === changelogId);
      
      // If changelog not found, return error
      if (changelogIndex === -1) {
        return { success: false, error: 'Changelog not found' };
      }
      
      // Update the changelog
      const updatedChangelogs = [...existingChangelogs];
      updatedChangelogs[changelogIndex] = {
        id: changelogId,
        title: changelog.title || 'Untitled Update',
        version: changelog.version || '0.0.0',
        date: changelog.date || new Date().toISOString(),
        content: changelog.content || 'No details provided'
      };
      
      // Update the game with the modified changelogs array
      const { error: updateError } = await supabase
        .from('games')
        .update({ changelogs: updatedChangelogs })
        .eq('id', gameId);
      
      if (updateError) {
        console.error('Error updating changelog:', updateError);
        return { success: false, error: 'Failed to update changelog' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in updateChangelog:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
  
  /**
   * Deletes a changelog
   * @param gameId The ID of the game
   * @param changelogId The ID of the changelog to delete
   * @returns Success status and error if any
   */
  async deleteChangelog(
    gameId: string,
    changelogId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // First, get the game and its changelogs
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('changelogs, claimed')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error('Error fetching game for changelog deletion:', gameError);
        return { success: false, error: 'Game not found' };
      }
      
      // Check if the game is claimed
      if (!game.claimed) {
        return { 
          success: false, 
          error: 'You must claim this game before deleting changelogs' 
        };
      }
      
      // Get existing changelogs or initialize empty array
      const existingChangelogs: Changelog[] = game.changelogs || [];
      
      // Filter out the changelog to delete
      const updatedChangelogs = existingChangelogs.filter(cl => cl.id !== changelogId);
      
      // If the arrays have the same length, the changelog wasn't found
      if (updatedChangelogs.length === existingChangelogs.length) {
        return { success: false, error: 'Changelog not found' };
      }
      
      // Update the game with the filtered changelogs array
      const { error: updateError } = await supabase
        .from('games')
        .update({ changelogs: updatedChangelogs })
        .eq('id', gameId);
      
      if (updateError) {
        console.error('Error deleting changelog:', updateError);
        return { success: false, error: 'Failed to delete changelog' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteChangelog:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },
  
  /**
   * Gets all changelogs for a game
   * @param gameId The ID of the game
   * @returns Array of changelogs
   */
  async getChangelogs(gameId: string): Promise<Changelog[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('changelogs')
        .eq('id', gameId)
        .single();
      
      if (error) {
        console.error('Error fetching changelogs:', error);
        return [];
      }
      
      return data.changelogs || [];
    } catch (error) {
      console.error('Error in getChangelogs:', error);
      return [];
    }
  },
};
