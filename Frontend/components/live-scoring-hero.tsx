'use client'

import Link from 'next/link'
import { ArrowRight, Calculator, PlayCircle, HelpCircle, Trophy } from 'lucide-react'

export function LiveScoringHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#eef6e8] via-[#e7f2de] to-[#f4f7f2] text-slate-900 border-b border-emerald-950/10">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-lime-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Subtitle Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 backdrop-blur-sm border border-emerald-900/10">
              <span className="h-2 w-2 rounded-full bg-[#74c004] animate-pulse" />
              <span>Track Games, Run Matches, And Share Scores Instantly</span>
            </div>

            {/* Giant Title */}
            <div className="font-display uppercase tracking-tight leading-[0.95]">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)] [text-shadow:_0_2px_4px_rgb(0_0_0_/_10%)]">
                SCORE EVERY
              </h1>
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#68ad03] drop-shadow-sm">
                MATCH. LIVE
              </h2>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-700 max-w-xl font-medium leading-relaxed">
              Real-time ball-by-ball box cricket tracking, dynamic strike calculations,
              auto Net Run Rate (NRR) updates, and instant tournament fixture calculators
              designed for turf venues.
            </p>

            {/* Start Scoring CTA */}
            <div className="pt-2">
              <Link
                href="/scoring"
                className="inline-flex items-center gap-3 rounded-full bg-[#74c004] hover:bg-[#82d804] px-8 py-4 text-base font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_10px_25px_-5px_rgba(116,192,4,0.5)] transition-all hover:scale-105 active:scale-95"
              >
                <span>Start Scoring</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[#74c004]">
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </span>
              </Link>
            </div>

            {/* Secondary Utility Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-semibold text-slate-800">
              <Link
                href="/fixtures"
                className="flex items-center gap-2 rounded-full bg-slate-600/25 hover:bg-slate-600/35 px-4 py-2 backdrop-blur-md border border-slate-700/15 transition-all text-slate-900"
              >
                <Calculator className="h-4 w-4 text-slate-800" />
                <span>Fixture Calculator</span>
              </Link>

              <Link
                href="/fixtures#how-fixtures-work"
                className="flex items-center gap-2 rounded-full bg-slate-600/25 hover:bg-slate-600/35 px-4 py-2 backdrop-blur-md border border-slate-700/15 transition-all text-slate-900"
              >
                <PlayCircle className="h-4 w-4 text-slate-800" />
                <span>How Fixtures Work</span>
              </Link>

              <Link
                href="/scoring#how-scoring-works"
                className="flex items-center gap-2 rounded-full bg-slate-600/25 hover:bg-slate-600/35 px-4 py-2 backdrop-blur-md border border-slate-700/15 transition-all text-slate-900"
              >
                <HelpCircle className="h-4 w-4 text-slate-800" />
                <span>How Live Scoring Works</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Graphic - 3D Trophy Showcase */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-72 sm:w-88 md:w-96 aspect-square flex items-center justify-center">
              {/* Radial Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/20 to-orange-500/20 blur-2xl transform scale-110" />
              
              {/* Illustrated 3D Trophy */}
              <div className="relative z-10 w-full h-full flex items-center justify-center filter drop-shadow-[0_20px_35px_rgba(245,158,11,0.35)] animate-float">
                <svg
                  viewBox="0 0 300 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[340px]"
                >
                  <defs>
                    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FDE047" />
                      <stop offset="40%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="cup-inner" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#B45309" />
                      <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                    <linearGradient id="ribbon-red" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#991B1B" />
                    </linearGradient>
                    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="10" stdDeviation="8" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* Trophy Base */}
                  <path d="M90 235 H210 V250 C210 255 205 260 200 260 H100 C95 260 90 255 90 250 Z" fill="#D97706" />
                  <path d="M105 215 H195 V235 H105 Z" fill="#F59E0B" />
                  
                  {/* Stem */}
                  <path d="M135 170 H165 V215 H135 Z" fill="#D97706" />
                  <path d="M125 205 C125 195 175 195 175 205 H125 Z" fill="#FDE047" />

                  {/* Cup Handles */}
                  <path
                    d="M75 80 C40 80 40 150 90 155 L95 140 C60 135 60 95 85 95 Z"
                    fill="url(#gold-grad)"
                    filter="url(#shadow)"
                  />
                  <path
                    d="M225 80 C260 80 260 150 210 155 L205 140 C240 135 240 95 215 95 Z"
                    fill="url(#gold-grad)"
                    filter="url(#shadow)"
                  />

                  {/* Cup Main Body */}
                  <ellipse cx="150" cy="75" rx="65" ry="18" fill="url(#cup-inner)" />
                  <path
                    d="M85 75 C85 140 120 175 150 175 C180 175 215 140 215 75 Z"
                    fill="url(#gold-grad)"
                  />

                  {/* Red Winner Ribbons */}
                  <path d="M130 75 L120 140 L135 135 L142 140 L140 75 Z" fill="url(#ribbon-red)" />
                  <path d="M170 75 L180 140 L165 135 L158 140 L160 75 Z" fill="url(#ribbon-red)" />

                  {/* Golden Star Medal in Center */}
                  <circle cx="150" cy="115" r="28" fill="#F59E0B" stroke="#FEF08A" strokeWidth="4" />
                  <polygon
                    points="150,97 156,110 170,111 159,120 163,133 150,125 137,133 141,120 130,111 144,110"
                    fill="#FEF08A"
                  />
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
