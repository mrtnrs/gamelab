import Header from '@/components/header';
import Footer from '@/components/footer';
import EditGameClient from './edit-game-client';

// Define the props type for Next.js 15
// type Props = {
//   params: Promise<{ id: string }>; // Correct typing for dynamic routes
// };

// Required for Cloudflare Pages deployment
// export const runtime = 'edge';
export const runtime = 'edge';
// Async Server Component
// export default async function EditGamePage({ params }: Props) {
//   const { id } = await params; // Access id directly from params

export default async function EditGamePage() {
  // const { id } = await params; // Access id directly from params

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Game</h1>
            <p className="text-muted-foreground mt-2">Update game information</p>
          </div>
{/*           
          <EditGameClient id={id} /> Pass the resolved id */}
        </div>
      </main>
      <Footer />
    </div>
  );
}