import Header from '@/components/header';
import Footer from '@/components/footer';
import GameDetailClient from './game-detail-client';

// Define Props with params as a Promise
type Props = {
  params: Promise<{ slug: string }>;
};

// Async Server Component
export default async function GamePage({ params }: Props) {
  const { slug } = await params; // Await the Promise to get the slug

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <GameDetailClient slug={slug} /> {/* Pass the resolved slug */}
      </main>
      <Footer />
    </div>
  );
}