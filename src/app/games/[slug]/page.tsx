import Header from '@/components/header'
import Footer from '@/components/footer'
import GameDetailClient from './game-detail-client'

// This data would typically come from a server-side data fetch
// For example: export async function generateStaticParams() {...}

type Props = {
  params: { slug: string }
}

export default async function GamePage({ params }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        <GameDetailClient slug={params.slug} />
      </main>
      <Footer />
    </div>
  )
}
