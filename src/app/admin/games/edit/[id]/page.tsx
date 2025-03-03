import Header from '@/components/header'
import Footer from '@/components/footer'
import EditGameClient from './edit-game-client'

export default function EditGamePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Game</h1>
            <p className="text-muted-foreground mt-2">Update game information</p>
          </div>
          
          <EditGameClient id={params.id} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
