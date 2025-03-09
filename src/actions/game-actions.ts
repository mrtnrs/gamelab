'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

// Create a Supabase client with the service role key (server-side only)
const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Track a visit to a game
 */
export async function trackGameVisit(gameId: string) {
  try {
    if (!gameId) {
      return { error: 'Game ID is required' };
    }

    const supabase = createServerSupabaseClient();
    
    // Call the SQL function to increment visit count
    const { error } = await supabase.rpc('increment_game_visit_count', {
      game_id: gameId
    });

    if (error) {
      console.error('Error tracking visit:', error);
      return { error: 'Failed to track visit' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking game visit:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Rate a game
 */
export async function rateGame(gameId: string, rating: number) {
  try {
    if (!gameId || !rating) {
      return { error: 'Game ID and rating are required' };
    }

    // Validate rating value
    const ratingValue = Number(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return { error: 'Rating must be a number between 1 and 5' };
    }

    const supabase = createServerSupabaseClient();
    
    // Get the user's IP address for duplicate prevention
    const headersList = await headers();
    const userIp = 
      headersList.get('x-forwarded-for') || 
      headersList.get('x-real-ip') || 
      'unknown';

    // First, check if this IP has already rated this game
    const { data: existingRating, error: checkError } = await supabase
      .from('game_ratings')
      .select('id, rating')
      .eq('game_id', gameId)
      .eq('user_ip', userIp)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing rating:', checkError);
      return { error: 'Failed to check existing rating' };
    }

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('game_ratings')
        .update({ rating: ratingValue })
        .eq('id', existingRating.id);

      if (updateError) {
        console.error('Error updating rating:', updateError);
        return { error: 'Failed to update rating' };
      }

      // Manually recalculate the game rating
      const { data: ratings, error: fetchError } = await supabase
        .from('game_ratings')
        .select('rating')
        .eq('game_id', gameId);
      
      if (fetchError) {
        console.error('Error fetching ratings:', fetchError);
        return { error: 'Failed to recalculate rating' };
      }
      
      // Calculate new rating stats
      const ratingCount = ratings.length;
      const ratingTotal = ratings.reduce((sum, item) => sum + item.rating, 0);
      const ratingAverage = ratingTotal / ratingCount;
      
      // Update the game with new rating stats
      const { error: updateGameError } = await supabase
        .from('games')
        .update({
          rating_count: ratingCount,
          rating_total: ratingTotal,
          rating_average: ratingAverage
        })
        .eq('id', gameId);
      
      if (updateGameError) {
        console.error('Error updating game rating stats:', updateGameError);
        return { error: 'Failed to update game rating stats' };
      }

      return { success: true, message: 'Rating updated' };
    } else {
      // Insert new rating
      const { error: insertError } = await supabase
        .from('game_ratings')
        .insert({
          game_id: gameId,
          rating: ratingValue,
          user_ip: userIp
        });

      if (insertError) {
        console.error('Error inserting rating:', insertError);
        return { error: 'Failed to save rating' };
      }

      // Call the SQL function to update game rating stats
      const { error: updateError } = await supabase.rpc('update_game_rating_stats', {
        game_id: gameId,
        new_rating: ratingValue
      });

      if (updateError) {
        console.error('Error updating rating stats:', updateError);
        return { error: 'Failed to update rating stats' };
      }

      return { success: true, message: 'Rating saved' };
    }
  } catch (error) {
    console.error('Error rating game:', error);
    return { error: 'An unexpected error occurred' };
  }
}
