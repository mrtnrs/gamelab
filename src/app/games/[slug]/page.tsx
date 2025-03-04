import Header from '@/components/header';
import Footer from '@/components/footer';
import GameDetailClient from './game-detail-client';
import { supabase } from '@/utils/supabase';

type Props = {
  params: Promise<{ slug: string }>;
};

// export const runtime = 'edge';
export const dynamicParams = false; // Only pre-rendered slugs

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

// This function generates all the static paths at build time
export async function generateStaticParams() {
  try {
    // Fetch all published games from Supabase
    const { data: games, error } = await supabase
      .from('games')
      .select('title')
      .eq('status', 'published');
    
    if (error) {
      console.error('Error fetching games for static paths:', error);
      return [];
    }
    
    // Convert titles to slugs and return the params objects
    return games.map(game => ({
      slug: game.title.toLowerCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}