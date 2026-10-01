import { Play, Sparkles } from 'lucide-react'
import { getHighlights } from '@/lib/services'

export async function Highlights() {
  let highlights: Array<{
    _id: string
    title: string
    description?: string
    mediaType?: 'image' | 'video'
    mediaUrl: string
  }> = []

  try {
    const data = await getHighlights()
    if (data && data.length > 0) {
      highlights = data
    }
  } catch {
    highlights = []
  }

  return (
    <section id="highlights" className="w-full bg-[#050814] py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-1 text-xs font-bold text-[#74c004] uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MATCH TELEMETRY & REELS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white">
              Tournament <span className="text-[#74c004]">Highlights</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-400 font-medium">
            Relive the buzzer beaters, hat-tricks, and championship moments captured under our stadium floodlights.
          </p>
        </div>

        {highlights.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-12 text-center">
            <p className="text-slate-400 font-medium text-sm">
              No tournament highlights or match reels uploaded yet. Highlights will appear here after tournament matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((item) => (
              <div
                key={item._id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f182e] shadow-lg transition-all hover:border-[#74c004]/50"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.mediaUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080e1e] via-transparent to-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#74c004] text-[#080e1e] shadow-lg shadow-[#74c004]/40 transition-transform group-hover:scale-110">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white group-hover:text-[#74c004] transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
