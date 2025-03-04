"use client"

import GameForm from '@/components/game-form'
import AdminRouteGuard from '@/components/admin-route-guard'

export default function NewGameClient() {
  return (
    <AdminRouteGuard>
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        {/* <GameForm /> */}
      </div>
    </AdminRouteGuard>
  )
}
