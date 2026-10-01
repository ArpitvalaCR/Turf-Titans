'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Trophy,
  Swords,
  Coins,
  Handshake,
  Users,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

interface StoryPart {
  id: number
  oldWayTag: string
  mainHeading: string
  italicSubheading: string
  description: string
  icon: string
  badgeColor: string
  glowColor: string
  accentGradient: string
  navLabel: string
}

const STORY_PARTS: StoryPart[] = [
  {
    id: 1,
    oldWayTag: 'OLD WAY',
    mainHeading: 'ZERO BARRIERS',
    italicSubheading: 'OPEN TO ALL STUDENTS',
    description:
      'No prior experience needed. Whether you are a seasoned athlete or stepping onto the field for the first time, Turf Titans welcomes every student with open arms.',
    icon: '🏆',
    badgeColor: 'border-[#74c004]/50 bg-[#74c004]/10 text-[#74c004]',
    glowColor: 'rgba(116, 192, 4, 0.22)',
    accentGradient: 'from-[#74c004] to-[#a3e635]',
    navLabel: 'Zero Barriers',
  },
  {
    id: 2,
    oldWayTag: 'OLD WAY',
    mainHeading: 'REAL COMPETITION',
    italicSubheading: 'PROFESSIONAL FORMAT',
    description:
      'Our tournaments follow professional formats — Swiss rounds for Chess, knockout brackets for Football, league stages for Cricket. Real competition, real glory.',
    icon: '🏏',
    badgeColor: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400',
    glowColor: 'rgba(56, 189, 248, 0.22)',
    accentGradient: 'from-cyan-400 to-blue-500',
    navLabel: 'Professional Format',
  },
  {
    id: 3,
    oldWayTag: 'OLD WAY',
    mainHeading: 'CASH PRIZES',
    italicSubheading: 'AMAZING PRIZE POOL',
    description:
      'Compete for real cash prizes across all sports. Champions take home trophies, medals, certificates, and a share of our seasonal prize pool.',
    icon: '💰',
    badgeColor: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
    glowColor: 'rgba(251, 191, 36, 0.22)',
    accentGradient: 'from-amber-400 to-yellow-500',
    navLabel: 'Cash Prizes',
  },
  {
    id: 4,
    oldWayTag: 'OLD WAY',
    mainHeading: 'COMMUNITY',
    italicSubheading: 'BUILT FOR CAMPUS LIFE',
    description:
      'More than just sports — Turf Titans is a community. Events, socials, and celebrations that bring the entire campus together around the love of competition.',
    icon: '🤝',
    badgeColor: 'border-pink-500/50 bg-pink-500/10 text-pink-400',
    glowColor: 'rgba(236, 72, 153, 0.22)',
    accentGradient: 'from-pink-500 to-rose-400',
    navLabel: 'Community',
  },
]

export function SportsJourneyStory() {
  const [activePart, setActivePart] = useState<number>(0)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const touchStartXRef = useRef<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  // Auto-progress slideshow every 6 seconds when not hovered
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      setActivePart((prev) => (prev + 1) % STORY_PARTS.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isHovered])

  const handleSelectPart = (index: number) => {
    setActivePart(index)
  }

  // Swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe left -> Next
        setActivePart((prev) => (prev + 1) % STORY_PARTS.length)
      } else {
        // Swipe right -> Prev
        setActivePart((prev) => (prev - 1 + STORY_PARTS.length) % STORY_PARTS.length)
      }
    }
    touchStartXRef.current = null
  }

  const current = STORY_PARTS[activePart]

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#050914] text-white overflow-hidden border-t border-b border-white/5"
    >
      {/* Background Ambient Radial Glow */}
      <div
        className="absolute w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] rounded-full blur-[120px] sm:blur-[140px] pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, ${current.glowColor} 0%, rgba(5,9,20,0) 70%)`,
          top: '50%',
          right: '5%',
          transform: 'translate(0, -50%)',
        }}
      />

      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />

      {/* Main Content Stage */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Mobile Top Step Navigation Bar (Touch Optimized) */}
        <div className="flex lg:hidden items-center justify-between gap-1.5 pb-6 mb-6 border-b border-white/10 overflow-x-auto no-scrollbar">
          {STORY_PARTS.map((part, idx) => {
            const isActive = activePart === idx
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => handleSelectPart(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive
                    ? 'bg-[#74c004] text-[#050914] shadow-md shadow-[#74c004]/20'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                  }`}
              >
                <span>{part.icon}</span>
                <span className="truncate max-w-[100px]">{part.navLabel}</span>
              </button>
            )
          })}
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: ACTIVE STORY SLIDE */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 pr-0 lg:pr-4">
              {/* Top Badges Row */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-300 shadow-sm backdrop-blur-sm">
                  <span>{current.oldWayTag}</span>
                </div>

                <div
                  className={`inline-flex items-center rounded-full border px-3.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md ${current.badgeColor}`}
                >
                  <span>{current.mainHeading}</span>
                </div>
              </div>

              {/* Giant Italic Subheading */}
              <h2 className="font-display font-black italic uppercase text-3xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.95] tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                {current.italicSubheading}
              </h2>

              {/* Description Paragraph */}
              <p className="text-slate-300 sm:text-slate-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal">
                {current.description}
              </p>

              {/* Mobile Swipe Indicators & Arrow Controls */}
              <div className="flex lg:hidden items-center justify-between pt-4">
                <div className="flex items-center gap-1.5">
                  {STORY_PARTS.map((part, idx) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => handleSelectPart(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${activePart === idx ? 'w-8 bg-[#74c004]' : 'w-2 bg-white/20 hover:bg-white/40'
                        }`}
                      aria-label={`Go to ${part.mainHeading}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPart((activePart - 1 + STORY_PARTS.length) % STORY_PARTS.length)}
                    className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Previous story part"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPart((activePart + 1) % STORY_PARTS.length)}
                    className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Next story part"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: 3D ILLUSTRATION & DESKTOP VERTICAL NAVIGATION PILLS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end gap-6 sm:gap-8 relative">
            {/* 3D Visual Centerpiece */}
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-88 lg:h-88 flex items-center justify-center">
              {STORY_PARTS.map((part, idx) => {
                const isActive = activePart === idx

                return (
                  <div
                    key={`visual-${part.id}`}
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${isActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
                      }`}
                  >
                    {/* Part 1 Visual: Zero Barriers */}
                    {idx === 0 && (
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-[#74c004]/20 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 rounded-full bg-gradient-to-b from-[#14280f] to-[#0a1407] border-2 border-[#74c004]/40 shadow-[0_0_80px_rgba(116,192,4,0.35)] animate-float">
                          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#74c004] to-[#a3e635] flex items-center justify-center text-slate-950 shadow-inner">
                            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 stroke-[2.2] text-slate-950 drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Part 2 Visual: Real Competition */}
                    {idx === 1 && (
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 rounded-full bg-gradient-to-b from-[#0c2338] to-[#06121c] border-2 border-cyan-400/40 shadow-[0_0_80px_rgba(56,189,248,0.35)] animate-float">
                          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 shadow-inner">
                            <Swords className="w-16 h-16 sm:w-20 sm:h-20 stroke-[2.2] text-slate-950 drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Part 3 Visual: Cash Prizes */}
                    {idx === 2 && (
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 rounded-full bg-gradient-to-b from-[#2d2208] to-[#140f04] border-2 border-amber-400/40 shadow-[0_0_80px_rgba(251,191,36,0.35)] animate-float">
                          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-inner">
                            <Coins className="w-16 h-16 sm:w-20 sm:h-20 stroke-[2.2] text-slate-950 drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Part 4 Visual: Community */}
                    {idx === 3 && (
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 rounded-full bg-gradient-to-b from-[#2b0e1d] to-[#15060e] border-2 border-pink-500/40 shadow-[0_0_80px_rgba(236,72,153,0.35)] animate-float">
                          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#fcd34d] via-[#f59e0b] to-[#f43f5e] flex items-center justify-center text-slate-950 shadow-inner">
                            <Handshake className="w-16 h-16 sm:w-20 sm:h-20 stroke-[2.2] text-slate-950 drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Vertical Right Navigation Bar (Desktop Only) */}
            <div className="hidden lg:flex flex-col items-center gap-3 bg-[#0d162a]/90 p-2.5 rounded-full border border-white/10 backdrop-blur-md shadow-2xl shrink-0">
              {STORY_PARTS.map((part, idx) => {
                const isActive = activePart === idx
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => handleSelectPart(idx)}
                    title={`${part.mainHeading} — ${part.italicSubheading}`}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 cursor-pointer text-lg ${isActive
                        ? 'bg-[#74c004] text-[#050914] shadow-[0_0_20px_rgba(116,192,4,0.6)] scale-110'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <span>{part.icon}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
