import { Suspense } from 'react'
import { TournamentDetailView } from '@/components/tournament-detail-view'
import { AuthGuard } from '@/components/auth-guard'

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-[#080e1e] flex items-center justify-center text-slate-400">Loading Tournament...</div>}>
        <TournamentDetailView tournamentId={id} />
      </Suspense>
    </AuthGuard>
  )
}
