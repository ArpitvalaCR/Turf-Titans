'use client'

import React from 'react'
import {
  Target,
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  Cpu,
  Trophy,
  Star,
  Flame,
  Award,
  Swords,
  Activity,
} from 'lucide-react'

export function AboutUsSection() {
  const marqueeItemsTop = [
    { text: 'TURF TITANS', icon: '🏆' },
    { text: 'COLLEGE ATHLETICS', icon: '⚡' },
    { text: 'MORE THAN A CLUB', icon: '🔥' },
    { text: 'INCLUSIVE SPORTS', icon: '🎯' },
    { text: 'FUTSAL & CRICKET', icon: '⚽' },
    { text: 'HIGH PERFORMANCE', icon: '🥇' },
    { text: 'CAMPUS SPIRIT', icon: '🤝' },
    { text: 'DIGITAL SCORING', icon: '📡' },
  ]

  const marqueeItemsBottom = [
    { text: 'COMMUNITY FIRST', icon: '🤝' },
    { text: 'FAIR PLAY & INTEGRITY', icon: '🛡️' },
    { text: 'PRIZE POOL', icon: '💰' },
    { text: 'PROFESSIONAL FORMATS', icon: '⚔️' },
    { text: '450+ ATHLETES', icon: '👥' },
    { text: 'CAMPUS CHAMPIONS', icon: '🏅' },
    { text: 'INNOVATION IN SPORTS', icon: '✨' },
    { text: 'SWISS ROUNDS & KNOCKOUTS', icon: '♟️' },
  ]

  return (
    <section
      id="about"
      className="relative w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#060b18] text-white overflow-hidden border-t border-b border-white/5"
    >
      {/* Dynamic CSS Keyframes for smooth continuous marquee streams */}
      <style jsx>{`
        @keyframes marqueeScrollLeft {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marqueeScrollRight {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee-left {
          display: flex;
          width: max-content;
          animation: marqueeScrollLeft 35s linear infinite;
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marqueeScrollRight 38s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-marquee-left {
            animation-duration: 25s;
          }
          .animate-marquee-right {
            animation-duration: 28s;
          }
        }
        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Ambient background glow accents */}
      <div className="absolute top-1/3 -left-32 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-[#74c004]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-[#38bdf8]/10 blur-[130px] pointer-events-none" />

      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-30 pointer-events-none" />

      {/* ========================================================================= */}
      {/* CONTINUOUS MOTION STREAM 1 (Left → Right) */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-full overflow-hidden py-2 mb-8 sm:mb-12 pointer-events-none opacity-40 select-none">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#060b18] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#060b18] to-transparent z-10" />
        <div className="animate-marquee-right">
          {[...marqueeItemsTop, ...marqueeItemsTop, ...marqueeItemsTop].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 text-[11px] sm:text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              <span className="text-sm">{item.icon}</span>
              <span>{item.text}</span>
              <span className="text-[#74c004]/60">•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* ========================================================================= */}
        {/* 1. HERO HEADER: ABOUT US • MORE THAN A CLUB + ATHLETIC VISUAL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            {/* Top Pill / Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-300 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#74c004] animate-pulse" />
              <span>ABOUT US</span>
            </div>

            {/* Massive Display Title */}
            <h2 className="font-display font-black italic uppercase text-4xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <span className="text-white block">MORE THAN</span>
              <span className="text-white/40 block">A CLUB</span>
            </h2>

            {/* Subtitle / Lead Paragraph */}
            <p className="text-slate-300 sm:text-slate-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal">
              TurfTitans is the heartbeat of college athletics — a community where passion meets competition, and every student finds their arena.
            </p>

            {/* Micro Highlights Pill Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0c1426]/80 px-3 py-1.5 text-xs font-bold text-slate-200">
                <Trophy className="h-3.5 w-3.5 text-[#74c004]" />
                Prize Pool
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0c1426]/80 px-3 py-1.5 text-xs font-bold text-slate-200">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                450+ Athletes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0c1426]/80 px-3 py-1.5 text-xs font-bold text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-pink-400" />
                Fair Play Certified
              </span>
            </div>
          </div>

          {/* Right Column: Prominent Athletic Photo Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="group relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#0c162b] to-[#070e1d] p-3 sm:p-4 shadow-2xl overflow-hidden">
              {/* Image Frame */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#050914]">
                <img
                  src="/images/hero-turf.png"
                  alt="Turf Titans Athletes in Action"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-transparent to-transparent opacity-80" />

                {/* Floating Top Badge */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#060b18]/80 border border-white/20 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase text-[#74c004] backdrop-blur-md">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  <span>EST. 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MISSION & VISION ROW (2 COMPACT FEATURE CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* OUR MISSION CARD */}
          <div className="group relative rounded-3xl border border-white/10 bg-[#0c1426]/70 backdrop-blur-md p-6 sm:p-8 shadow-xl transition-all duration-300 hover:border-[#74c004]/50 hover:shadow-[0_0_30px_rgba(116,192,4,0.15)] flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#74c004]/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity" />

            <div className="relative z-10 space-y-4 sm:space-y-5">
              {/* Integrated SVG Visual */}
              <div className="w-12 h-12 rounded-2xl border border-white/15 bg-[#121d33] flex items-center justify-center text-[#74c004] shadow-inner group-hover:scale-110 group-hover:border-[#74c004]/50 transition-all duration-300">
                <Target className="w-6 h-6 stroke-[2]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black italic uppercase text-2xl sm:text-3xl text-white tracking-tight group-hover:text-[#74c004] transition-colors">
                  OUR MISSION
                </h3>
                <p className="text-slate-300 sm:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
                  To create an inclusive, high-performance sports culture on campus where every student — regardless of skill level — can compete, grow, and experience the thrill of athletic achievement.
                </p>
              </div>
            </div>
          </div>

          {/* OUR VISION CARD */}
          <div className="group relative rounded-3xl border border-white/10 bg-[#0c1426]/70 backdrop-blur-md p-6 sm:p-8 shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity" />

            <div className="relative z-10 space-y-4 sm:space-y-5">
              {/* Integrated SVG Visual */}
              <div className="w-12 h-12 rounded-2xl border border-white/15 bg-[#121d33] flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 group-hover:border-cyan-400/50 transition-all duration-300">
                <Star className="w-6 h-6 stroke-[2]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black italic uppercase text-2xl sm:text-3xl text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                  OUR VISION
                </h3>
                <p className="text-slate-300 sm:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
                  To be recognized as the most innovative and vibrant college sports organization in the country, setting the gold standard for student athletic programs nationwide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTINUOUS MOTION STREAM 2 (Right → Left) */}
        {/* ========================================================================= */}
        <div className="relative w-full max-w-full overflow-hidden py-2 pointer-events-none opacity-40 select-none">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#060b18] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#060b18] to-transparent z-10" />
          <div className="animate-marquee-left">
            {[...marqueeItemsBottom, ...marqueeItemsBottom, ...marqueeItemsBottom].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 text-[11px] sm:text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                <span className="text-sm">{item.icon}</span>
                <span>{item.text}</span>
                <span className="text-cyan-400/60">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. OUR VALUES (4 SLEEK COMPACT CARDS) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#74c004]">
                <Flame className="h-3.5 w-3.5" />
                <span>CORE PILLARS</span>
              </div>
              <h3 className="font-display font-black italic uppercase text-2xl sm:text-4xl text-white tracking-tight">
                OUR <span className="text-[#74c004]">VALUES</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* VALUE 1: EXCELLENCE */}
            <div className="group rounded-2xl border border-white/10 bg-[#0c1426]/60 backdrop-blur-md p-5 sm:p-6 space-y-3 hover:border-[#74c004]/50 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div className="w-10 h-10 rounded-xl border border-white/15 bg-[#14223b] flex items-center justify-center text-[#74c004] group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black italic uppercase text-base sm:text-lg text-white tracking-wide group-hover:text-[#74c004] transition-colors">
                  EXCELLENCE
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  We push every athlete to their peak performance through rigorous training and competition.
                </p>
              </div>
            </div>

            {/* VALUE 2: COMMUNITY */}
            <div className="group rounded-2xl border border-white/10 bg-[#0c1426]/60 backdrop-blur-md p-5 sm:p-6 space-y-3 hover:border-pink-500/50 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div className="w-10 h-10 rounded-xl border border-white/15 bg-[#14223b] flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black italic uppercase text-base sm:text-lg text-white tracking-wide group-hover:text-pink-400 transition-colors">
                  COMMUNITY
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Building bonds that last beyond the playing field, creating lifelong friendships.
                </p>
              </div>
            </div>

            {/* VALUE 3: INTEGRITY */}
            <div className="group rounded-2xl border border-white/10 bg-[#0c1426]/60 backdrop-blur-md p-5 sm:p-6 space-y-3 hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div className="w-10 h-10 rounded-xl border border-white/15 bg-[#14223b] flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black italic uppercase text-base sm:text-lg text-white tracking-wide group-hover:text-amber-300 transition-colors">
                  INTEGRITY
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Fair play and respect in every competition, upholding the spirit of sportsmanship.
                </p>
              </div>
            </div>

            {/* VALUE 4: INNOVATION */}
            <div className="group rounded-2xl border border-white/10 bg-[#0c1426]/60 backdrop-blur-md p-5 sm:p-6 space-y-3 hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-300 shadow-md">
              <div className="w-10 h-10 rounded-xl border border-white/15 bg-[#14223b] flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black italic uppercase text-base sm:text-lg text-white tracking-wide group-hover:text-cyan-400 transition-colors">
                  INNOVATION
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Reimagining college sports for the digital era with modern formats and experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
