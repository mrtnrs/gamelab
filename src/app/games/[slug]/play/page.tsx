import Header from '@/components/header';
import Footer from '@/components/footer';
import GamePlayClient from './game-play-client';
import { supabase } from '@/utils/supabase';
import { Metadata, ResolvingMetadata } from 'next';
import { gameService } from '@/services/game-service';
import { generateSlug } from '@/utils/slug';

// Define props type consistently for both page and metadata
type Props = {
  params: Promise<{ slug: string }>;
};

// Static generation configuration
export const dynamicParams = false; // Only pre-render known slugs at build time

// Generate metadata for the game play page
export async function generateMetadata(
  { params }: Props, // Use the same Props type
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

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gamelab.fun'}/games/${slug}/play`;

  return {
    title: `Play ${game.title} | GameLab`,
    description: `Play ${game.title} online for free. ${game.description.substring(0, 120)}`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `Play ${game.title} | GameLab`,
      description: `Play ${game.title} online for free. ${game.description.substring(0, 120)}`,
      url: canonicalUrl,
      siteName: 'GameLab',
      images: [
        {
          url: game.image_url,
          width: 1200,
          height: 630,
          alt: `Play ${game.title}`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Play ${game.title} | GameLab`,
      description: `Play ${game.title} online for free. ${game.description.substring(0, 120)}`,
      images: [game.image_url],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Note: We're using dynamicParams = false for static generation
// We don't need edge runtime as we're pre-rendering all pages at build time

// Main page component
export default async function GamePlayPage({ params }: Props) {
  const { slug } = await params; // Await the Promise to get the slug

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <GamePlayClient slug={slug} />
      </main>
      <Footer />
    </div>
  );
}

// Reuse the same static paths as the game detail page
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

    // For each game, generate a slug from the title using our enhanced utility
    const paths = games.map((game) => {
      const slug = generateSlug(game.title);
      return { slug };
    });

    return paths;
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}