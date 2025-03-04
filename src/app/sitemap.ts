import { MetadataRoute } from 'next';
import { supabase } from '@/utils/supabase';
import { generateSlug } from '@/utils/slug';

const BASE_URL = 'https://gamelab.fun';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all published games
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, title, updated_at')
    .eq('status', 'published');

  if (gamesError) {
    console.error('Error fetching games for sitemap:', gamesError);
  }

  // Static routes
  const routes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ] as MetadataRoute.Sitemap;

  // Add game routes
  const gameRoutes = (games || []).map((game) => {
    const slug = generateSlug(game.title);
    return {
      url: `${BASE_URL}/games/${slug}`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  // Add game play routes
  const gamePlayRoutes = (games || []).map((game) => {
    const slug = generateSlug(game.title);
    return {
      url: `${BASE_URL}/games/${slug}/play`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    };
  });

  return [...routes, ...gameRoutes, ...gamePlayRoutes];
}
