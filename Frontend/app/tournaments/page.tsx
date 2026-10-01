'use client'

import { TournamentsPageView } from '@/components/tournaments-page-view'
import { AuthGuard } from '@/components/auth-guard'

export default function TournamentsPage() {
  return (
    <AuthGuard>
      <TournamentsPageView />
    </AuthGuard>
  )
}
