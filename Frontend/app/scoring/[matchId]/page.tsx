import { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { LiveScoringCenter } from '@/components/live-scoring-center'
import { Footer } from '@/components/footer'

export default async function MatchScoringPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params

  return (
    <div className="min-h-screen bg-[#080e1e] text-slate-100 flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading Match Center...</div>}>
          <LiveScoringCenter initialMatchId={matchId} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
