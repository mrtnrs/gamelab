import Header from '@/components/header'
import Footer from '@/components/footer'
import NewGameClient from './new-game-client'

// Server Component
export default async function NewGamePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Add New Game</h1>
            <p className="text-muted-foreground mt-2">Create a new game to showcase on the platform</p>
          </div>
          
          <NewGameClient />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
