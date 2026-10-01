'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio, ArrowRight, Shield, Zap, Sparkles, Activity, Award } from 'lucide-react'

const SCORE_TICKS = [
  {
    over: '4.1',
    battingScore: '42/3',
    target: '48 Needed off 11 Balls',
    runsThisOver: ['4'],
    striker: 'Rahul V. (24* off 11b)',
    bowler: 'Sameer K. (1/18, 1.1 ov)',
    currentDelivery: '4 RUNS (PULLED OVER MIDWICKET)',
  },
  {
    over: '4.2',
    battingScore: '43/3',
    target: '47 Needed off 10 Balls',
    runsThisOver: ['4', '1'],
    striker: 'Arman S. (6* off 3b)',
    bowler: 'Sameer K. (1/19, 1.2 ov)',
    currentDelivery: '1 RUN (QUICK SINGLE TO COVER)',
  },
  {
    over: '4.3',
    battingScore: '43/4',
    target: '47 Needed off 9 Balls',
    runsThisOver: ['4', '1', 'W'],
    striker: 'Kunal P. (0* off 0b)',
    bowler: 'Sameer K. (2/19, 1.3 ov)',
    currentDelivery: 'WICKET! BOWLED THROUGH THE GATE',
  },
  {
    over: '4.4',
    battingScore: '45/4',
    target: '45 Needed off 8 Balls',
    runsThisOver: ['4', '1', 'W', '2'],
    striker: 'Kunal P. (2* off 1b)',
    bowler: 'Sameer K. (2/21, 1.4 ov)',
    currentDelivery: '2 RUNS (DRIVEN PAST LONG ON)',
  },
  {
    over: '4.5',
    battingScore: '45/4',
    target: '45 Needed off 7 Balls',
    runsThisOver: ['4', '1', 'W', '2', '0'],
    striker: 'Kunal P. (2* off 2b)',
    bowler: 'Sameer K. (2/21, 1.5 ov)',
    currentDelivery: 'DOT BALL (BEATEN OUTSIDE OFF)',
  },
  {
    over: '5.0',
    battingScore: '51/4',
    target: '39 Needed off 6 Balls',
    runsThisOver: ['4', '1', 'W', '2', '0', '6'],
    striker: 'Rahul V. (30* off 12b)',
    bowler: 'Sameer K. (2/27, 2.0 ov)',
    currentDelivery: 'MAXIMUM! 6 RUNS OVER LONG OFF!',
  },
]

export function LiveScoreShowcase() {
  const [tickIndex, setTickIndex] = useState(0)
  const currentTick = SCORE_TICKS[tickIndex]

  useEffect(() => {
    const timer = setInterval(() => {
      setTickIndex((prev) => (prev + 1) % SCORE_TICKS.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#070d1a] border-y border-white/10 overflow-hidden">
      {/* Dynamic Stadium Floodlight Beams */}
      <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-[#74c004]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#162035] border border-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#74c004]">
            <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            <span>REAL-TIME ARENA TELEMETRY</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            LIVE BALL-BY-BALL <br />
            <span className="text-[#74c004]">SCORING ENGINE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Every delivery, boundary, extra, and wicket synced seamlessly between the umpire on the turf and spectators worldwide.
          </p>
        </div>

        {/* Realistic Turf Titans Live Scoreboard Arena Mockup */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/15 bg-[#0a1224]/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] space-y-6">

          {/* Top Live Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE MATCH CENTER</span>
              </span>
              <span className="text-xs font-bold text-slate-400">
                Turf Titans Championship • Group B • Match #08
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#74c004]">
              <Activity className="h-4 w-4 animate-spin text-[#74c004]" />
              <span>TURF ARENA </span>
            </div>
          </div>

          {/* Main Teams Score Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

            {/* Batting Team (Chasing) */}
            <div className="rounded-2xl bg-[#0e1930] border border-[#74c004]/30 p-5 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-[#74c004]/10 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#74c004] text-slate-950 font-black text-xs">
                    TT
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                      TITANS CRICKET CLUB
                    </h3>
                    <span className="text-[10px] font-bold text-[#74c004] uppercase tracking-wider">
                      ★ 2ND INNINGS (CHASING)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl sm:text-4xl font-black text-[#74c004] transition-all duration-300">
                    {currentTick.battingScore}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    OVER {currentTick.over} / 5.0
                  </div>
                </div>
              </div>

              {/* Striker Stats */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#74c004]" />
                  {currentTick.striker}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  RR: 10.2 • REQ: 11.5
                </span>
              </div>
            </div>

            {/* Bowling Team (1st Innings Score) */}
            <div className="rounded-2xl bg-[#090f1d] border border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2b4c] text-white font-black text-xs">
                    RS
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                      ROYAL STRIKERS
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      1ST INNINGS COMPLETED
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl sm:text-3xl font-black text-slate-300">
                    89/4
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    5.0 OVERS
                  </div>
                </div>
              </div>

              {/* Bowler Stats */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-amber-400" />
                  {currentTick.bowler}
                </span>
                <span className="text-[11px] font-semibold text-amber-400">
                  {currentTick.target}
                </span>
              </div>
            </div>

          </div>

          {/* Current Over Deliveries Feed */}
          <div className="rounded-2xl bg-[#060b18] border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">Current Over Deliveries:</span>
              <span className="text-[#74c004] font-black">{currentTick.currentDelivery}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {currentTick.runsThisOver.map((ball, idx) => {
                const isWicket = ball === 'W'
                const isSix = ball === '6'
                const isFour = ball === '4'
                return (
                  <div
                    key={idx}
                    className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl font-display font-black text-sm transition-all duration-300 transform scale-100 ${isWicket
                        ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : isSix
                          ? 'bg-[#74c004] text-slate-950 shadow-[0_0_15px_rgba(116,192,4,0.6)] animate-bounce'
                          : isFour
                            ? 'bg-[#82d804] text-slate-950 shadow-[0_0_10px_rgba(130,216,4,0.4)]'
                            : 'bg-[#152238] text-slate-200 border border-white/10'
                      }`}
                  >
                    {ball}
                  </div>
                )
              })}
              {/* Upcoming delivery placeholder slots */}
              {Array.from({ length: 6 - currentTick.runsThisOver.length }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl font-bold text-xs border border-white/5 bg-white/5 text-slate-600"
                >
                  •
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Award className="h-4 w-4 text-[#74c004]" />
              <span>Full scorecard, overs history & leaderboards available in live match view.</span>
            </div>

            <Link
              href="/tournaments/turf-titans-2025?tab=scoring"
              className="inline-flex items-center gap-2 rounded-full bg-[#74c004] hover:bg-[#86dc05] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:scale-105 shadow-[0_0_20px_rgba(116,192,4,0.3)]"
            >
              <span>Explore Live Tournament Scoring</span>
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
