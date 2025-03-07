import Header from '@/components/header';
import Footer from '@/components/footer';
import GameDetailClient from './game-detail-client';
import { supabase } from '@/utils/supabase';
import { Metadata, ResolvingMetadata } from 'next';
import { gameService } from '@/services/game-service';
import { generateSlug } from '@/utils/slug';

// Define props type matching the working version
type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for the game page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params; // Await the Promise to get the slug

  // Fetch the game data
  const game = await gameService.getGameBySlug(slug);

  if (!game) {
    return {
      title: 'Game Not Found | GameLab',
      description: 'The requested game could not be found on GameLab.',
    };
  }

  const keywords = game.tags?.join(', ') || '';
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gamelab.example.com'}/games/${slug}`;

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

// Static generation configuration
export const dynamicParams = false; // Only pre-render known slugs at build time
// Note: We're using dynamicParams = false for static generation
// We don't need edge runtime as we're pre-rendering all pages at build time

// Main page component
export default async function GamePage({ params }: Props) {
  const { slug } = await params; // Await the Promise to get the slug

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <GameDetailClient slug={slug} />
      </main>
      <Footer />
    </div>
  );
}

// Generate static paths at build time
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

    // For each game, generate a slug from the title using our enhanced utility
    const paths = games.map((game) => {
      const slug = generateSlug(game.title);
      console.log(`Generated slug for "${game.title}": ${slug}`);
      return { slug };
    });

    return paths;
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}