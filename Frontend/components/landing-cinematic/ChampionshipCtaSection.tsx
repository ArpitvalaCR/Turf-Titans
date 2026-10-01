'use client'

import Link from 'next/link'
import { ArrowRight, Trophy, Sparkles, ShieldCheck, Flame, Star } from 'lucide-react'
import { ChampionshipTrophy3D } from './ChampionshipTrophy3D'

export function ChampionshipCtaSection() {
  return (
    <section className="relative w-full py-28 px-4 sm:px-6 lg:px-8 bg-[#03060f] text-white overflow-hidden border-t border-white/10">

      {/* Golden Championship Glow Radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#ffd700]/10 via-[#74c004]/10 to-transparent blur-[160px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: 3D Championship Trophy Stage */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <div className="relative w-full aspect-square max-w-[440px] rounded-3xl border border-yellow-500/20 bg-[#070e1c]/80 backdrop-blur-xl p-6 shadow-[0_0_80px_rgba(255,215,0,0.15)] flex flex-col items-center justify-between">

              {/* Top Trophy Header */}
              <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-yellow-400 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>CHAMPIONSHIP CUP</span>
                </div>
                <span className="text-[10px] text-slate-400"> PRIZE POOL</span>
              </div>

              {/* Real 3D Golden Trophy WebGL Canvas */}
              <div className="w-full h-72 sm:h-80 flex items-center justify-center">
                <ChampionshipTrophy3D className="w-full h-full" enableMouseInteraction={true} />
              </div>

              {/* Bottom Label */}
              <div className="w-full text-center pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Interactive 3D Championship Trophy • Rotate with cursor
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Final Call to Action Narrative */}
          <div className="lg:col-span-6 space-y-8 text-left order-1 lg:order-2">

            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-yellow-400">
              <Trophy className="h-4 w-4" />
              <span>THE ULTIMATE PRIZE AWAITS</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                READY FOR THE <br />
                <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-[#74c004] bg-clip-text text-transparent">
                  NEXT MATCH?
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                Step into the floodlit turf arena. Register your franchise, prove your squad under pressure, and carve your name onto the official Turf Titans trophy.
              </p>
            </div>

            <div className="space-y-3">

              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-200">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74c004] text-slate-950">
                  ✓
                </div>
                <span>Certified turf umpires & official digital live scoring</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-200">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74c004] text-slate-950">
                  ✓
                </div>
                <span>Live video broadcasts, MVP awards & trophy podium</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/tournaments/turf-titans-2025?tab=registration"
                className="inline-flex items-center gap-3 rounded-full bg-[#74c004] hover:bg-[#86dc05] px-8 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_35px_rgba(116,192,4,0.4)] transition-all hover:scale-105"
              >
                <span>Book Your Slot </span>
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </Link>

              <Link
                href="/tournaments"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all hover:border-yellow-400/50"
              >
                Browse Tournaments
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
