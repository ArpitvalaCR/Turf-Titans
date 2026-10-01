import { Navbar } from '@/components/navbar'
import { LiveScoringCards } from '@/components/live-scoring-cards'

export function ScoringFooter() {
  return (
    <footer className="w-full bg-[#070c1a] border-t border-white/10 px-4 py-5 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-bold uppercase tracking-wider text-white">
          <img
            src="/logo.png"
            alt="Turf Titans"
            className="h-6 w-6 rounded-md object-contain"
          />
          <span>TURF TITANS</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-normal normal-case">Box Cricket Championship Engine</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>© {new Date().getFullYear()} Turf Titans. All rights reserved. Real-time scoring system powered for turf arenas.</span>
          <span className="h-2 w-2 rounded-full bg-[#74c004]" />
        </div>
      </div>
    </footer>
  )
}

export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-[#080e1e] text-white flex flex-col justify-between">
      {/* Navbar with exact scoring layout */}
      <Navbar variant="scoring" />
      <main className="flex-1">
        {/* Dedicated Live Scoring Hub */}
        <LiveScoringCards />
      </main>
      {/* Scoring footer */}
      <ScoringFooter />
    </div>
  )
}
