import Header from '@/components/header';
import Footer from '@/components/footer';
import EditGameClient from './edit-game-client';
import { Metadata } from 'next';

// Define the props type with params as a Promise
type Props = {
  params: Promise<{ id: string }>; // Updated for Next.js 15
};

 export const runtime = 'edge'; // Commented out to fix build error

// Async Server Component
export default async function EditGamePage({ params }: Props) {
  const { id } = await params; // Await the Promise to get the id

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Game</h1>
            <p className="text-muted-foreground mt-2">Update game information</p>
          </div>
          
          <EditGameClient id={id} /> {/* Pass the resolved id */}
        </div>
      </main>
      <Footer />
    </div>
  );
}