// src/lib/auth-helpers.ts
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the service role key (server-side only)
const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
    throw new Error('Supabase URL or service key is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

// Extract handle from X.com or Twitter URL
function extractHandleFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    let urlObj: URL = url.startsWith('http://') || url.startsWith('https://') ? new URL(url) : new URL(`https://${url}`);
    const path = urlObj.pathname.replace(/^\//, '');
    return path.split('/')[0] || null;
  } catch (error) {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    return match ? match[1] : null;
  }
}

/**
 * Check if the current authenticated user is authorized to edit a game
 * @param gameSlug The slug of the game to check
 * @returns An object with authorization status and game data if available
 */
export async function isAuthorizedToEditGame(gameSlug: string) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session?.user?.xHandle) {
      return { 
        authorized: false, 
        reason: 'not_authenticated',
        game: null
      };
    }

    // Get the game from the database
    const supabase = createServerSupabaseClient();
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', gameSlug)
      .single();

    if (error || !game) {
      console.error('Error fetching game:', error);
      return { 
        authorized: false, 
        reason: 'game_not_found',
        game: null
      };
    }

    // Check if the game is claimed
    if (!game.claimed) {
      return { 
        authorized: false, 
        reason: 'game_not_claimed',
        game
      };
    }

    // Extract the handle from the developer_url and compare with the authenticated user
    const expectedHandle = extractHandleFromUrl(game.developer_url);
    if (!expectedHandle || expectedHandle.toLowerCase() !== session.user.xHandle.toLowerCase()) {
      return { 
        authorized: false, 
        reason: 'not_developer',
        game
      };
    }

    // User is authorized to edit the game
    return { 
      authorized: true,
      reason: null,
      game
    };
  } catch (error) {
    console.error('Error checking authorization:', error);
    return { 
      authorized: false, 
      reason: 'error',
      game: null
    };
  }
}

/**
 * Check if the current authenticated user is the developer of a game
 * @param gameId The ID of the game to check
 * @returns A boolean indicating if the user is the developer
 */
export async function isDeveloperOfGame(gameId: string): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.xHandle) {
      return false;
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('games')
      .select('developer_url, claimed')
      .eq('id', gameId)
      .single();

    if (error || !data || !data.claimed) {
      console.error('Error checking if user is developer:', error);
      return false;
    }
    
    // Extract the handle from the developer_url and compare with the authenticated user
    const expectedHandle = extractHandleFromUrl(data.developer_url);
    return !!expectedHandle && expectedHandle.toLowerCase() === session.user.xHandle.toLowerCase();
  } catch (error) {
    console.error('Error checking if user is developer:', error);
    return false;
  }
}
