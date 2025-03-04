import Header from '@/components/header';
import Footer from '@/components/footer';
import GamePlayClient from './game-play-client';

// Define Props with params as a Promise
type Props = {
  params: Promise<{ slug: string }>;
};

// export const dynamicParams = false;
export const runtime = 'edge';

// Async Server Component
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
