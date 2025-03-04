import Header from '@/components/header'
import Footer from '@/components/footer'
import GamesClient from './games-client'

// Required for Cloudflare Pages deployment
// export const runtime = 'edge';

// Server Component
export default async function GamesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <GamesClient />
      </main>
      <Footer />
    </div>
  );
}