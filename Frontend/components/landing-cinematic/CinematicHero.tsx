'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Trophy, Radio, Shield, Activity, Flame } from 'lucide-react'
import { InteractiveSportsObject3D } from './InteractiveSportsObject3D'

export function CinematicHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#060b18] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">

      {/* Stadium Floodlight Visual Beams & Glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#74c004]/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#1e40af]/20 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-[#74c004]/10 blur-[120px] pointer-events-none" />

      {/* Subtle Stadium Turf Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="mx-auto max-w-7xl w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Cinematic Typography & Action Buttons */}
          <div className="lg:col-span-7 space-y-8 text-left">

            {/* Live Status Radar Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-[#0d162a]/90 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-300 border border-white/10 backdrop-blur-md shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74c004] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#74c004]" />
              </span>
              <span className="text-[#74c004]">TURF TITANS PRO CHAMPIONSHIP</span>
              <span className="text-slate-500">•</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.92] text-white">
                WHERE SPORTS <br />
                <span className="bg-gradient-to-r from-[#74c004] via-[#86dc05] to-[#a3e635] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(116,192,4,0.3)]">
                  MEETS COMPETITION.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-medium pt-2">
                Everything your tournament needs.
                Register teams, generate fixtures, and manage live ball-by-ball scoring — all in one place.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/tournaments/turf-titans-2025?tab=registration"
                className="group inline-flex items-center gap-3 rounded-full bg-[#74c004] hover:bg-[#86dc05] pl-6 pr-2.5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_30px_rgba(116,192,4,0.4)] transition-all hover:scale-105"
              >
                <span>Explore tournaments</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[#74c004] group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </div>
              </Link>

              <Link
                href="/tournaments/turf-titans-2025?tab=scoring"
                className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-4 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-red-300 backdrop-blur-md transition-all"
              >
                <Radio className="h-4 w-4 text-red-400 animate-pulse" />
                <span>Live Arena</span>
              </Link>
            </div>

            {/* Feature Highlights Row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#74c004]" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  100% Fair Play
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#74c004]" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Live match Sync
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#74c004]" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Cash Prize Pool
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Interactive Sports Equipment Canvas Container */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">

            {/* 3D Stage Glow Base */}
            <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#74c004]/20 via-[#b8141f]/20 to-transparent blur-3xl pointer-events-none" />

            <div className="relative w-full aspect-square max-w-[420px] rounded-3xl border border-white/10 bg-[#0a1224]/60 backdrop-blur-xl p-4 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
              <InteractiveSportsObject3D className="w-full h-full" enableMouseInteraction={true} />
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
