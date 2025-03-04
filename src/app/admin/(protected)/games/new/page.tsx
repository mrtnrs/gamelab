"use client"

import Header from '@/components/header'
import Footer from '@/components/footer'
import GameForm from '@/components/game-form'
import AdminRouteGuard from '@/components/admin-route-guard'

function NewGameContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Add New Game</h1>
            <p className="text-muted-foreground mt-2">Create a new game to showcase on the platform</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <GameForm />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function NewGamePage() {
  return (
    <AdminRouteGuard>
      <NewGameContent />
    </AdminRouteGuard>
  )
}
