// src/app/games/[slug]/page.tsx
import GameDetailClient from './game-detail-client';
import { gameService } from '@/services/game-service';
import { Metadata, ResolvingMetadata } from 'next';
import { generateSlug } from '@/utils/slug';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';

// Helper function to extract handle from URL
function extractHandleFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    let urlObj: URL;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlObj = new URL(`https://${url}`);
    } else {
      urlObj = new URL(url);
    }
    const path = urlObj.pathname.replace(/^\//, '');
    return path.split('/')[0] || null;
  } catch (error) {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    return match ? match[1] : null;
  }
}

// Define the correct types for Next.js 15
type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata (unchanged)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const game = await gameService.getGameBySlug(slug);

  if (!game) {
    return {
      title: 'Game Not Found | GameLab',
      description: 'The requested game could not be found on GameLab.',
    };
  }

  const keywords = game.tags?.join(', ') || '';
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gamelab.fun'}/games/${slug}`;

  return {
    title: `${game.title} | Play on GameLab`,
    description: game.description.substring(0, 160),
    keywords: `${keywords}, online game, browser game, ai game, multiplayer game`,
    openGraph: {
      title: `${game.title} | Play on GameLab`,
      description: game.description.substring(0, 160),
      url: canonicalUrl,
      siteName: 'GameLab',
      images: [
        {
          url: game.image_url || '/placeholder-game.jpg',
          width: 1200,
          height: 630,
          alt: game.title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.title} | Play on GameLab`,
      description: game.description.substring(0, 160),
      images: [game.image_url || '/placeholder-game.jpg'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Static generation configuration (unchanged)
export const dynamicParams = false;

export default async function GamePage({ params }: Props) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Fetch the game data server-side
  const game = await gameService.getGameBySlug(slug);

  if (!game) {
    return <div>Game not found</div>;
  }

  // Fetch changelogs
  const changelogs = await gameService.getChangelogs(game.id);

  // Check if user is the developer
  let isGameDeveloper = false;
  if (game.claimed) {
    const cookieStore = await cookies();
    const xHandle = cookieStore.get('x_handle')?.value;
    if (xHandle) {
      const gameDeveloperHandle = game.developer_url ? extractHandleFromUrl(game.developer_url) : '';
      if (gameDeveloperHandle && gameDeveloperHandle.toLowerCase() === xHandle.toLowerCase()) {
        isGameDeveloper = true;
      }
    }
  }

  return (
    <GameDetailClient
      game={game}
      slug={slug}
      initialChangelogs={changelogs}
      isGameDeveloper={isGameDeveloper}
      userRating={null}
      comments={[]}
    />
  );
}

// Generate static paths (unchanged)
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('title')
      .eq('status', 'published');

    if (error) {
      console.error('Error fetching games for static paths:', error);
      return [];
    }

    if (!games || games.length === 0) {
      console.log('No published games found for static paths');
      return [];
    }

    console.log(`Generating static paths for ${games.length} games`);

    return games.map((game) => ({
      slug: generateSlug(game.title),
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}