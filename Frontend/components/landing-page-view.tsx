'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  Radio,
  CheckSquare,
  MessageCircle,
  Trophy,
  Users,
  ShieldCheck,
  Calendar,
  Activity
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { div } from 'three/tsl'

export function LandingNavbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  return (
    <header className="w-full bg-[#060b18]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6 lg:px-8 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl flex items-center justify-between">

        {/* Left Links */}
        <nav className="flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link
            href="/"
            className="text-white font-bold relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#74c004]"
          >
            Home
          </Link>
          <Link href="/tournaments" className="hover:text-[#74c004] transition-colors">
            Tournament
          </Link>
          <a href="#helpline" className="hover:text-[#74c004] transition-colors">
            Contact
          </a>
        </nav>

        {/* Center Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Turf Titans"
            className="h-9 w-9 rounded-lg object-contain shadow-[0_0_15px_rgba(116,192,4,0.3)]"
          />
          <div className="flex flex-col">
            <span className="font-display text-base font-black tracking-wider uppercase text-white leading-none">
              TURF <span className="text-[#74c004]">TITANS</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              SPORTS TOURNAMENT PLATFORM
            </span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/tournaments/turf-titans-2025?tab=scoring"
            className="hidden sm:flex items-center gap-2 rounded-full bg-[#162035] hover:bg-[#1f2d4a] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white border border-red-500/30 shadow-sm transition-all"
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>LIVE MATCH</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 bg-[#0d162a] border border-white/10 rounded-full px-3 py-1 text-xs">
                <span className="text-white font-bold truncate max-w-[120px]">
                  {user?.name || user?.email}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${isAdmin
                    ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300'
                    : 'bg-[#74c004]/20 border border-[#74c004]/40 text-[#74c004]'
                    }`}
                >
                  {isAdmin ? 'ADMIN' : 'USER'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full bg-[#74c004] hover:bg-[#86dc05] px-5 py-1.5 text-xs font-black uppercase tracking-wider text-[#060b18] transition-all hover:scale-105 shadow-[0_0_15px_rgba(116,192,4,0.3)]"
              >
                Login
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.2 0-.44.08-.67.33-.23.26-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.18 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.49-.3-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.59.13-.17.26-.68.85-.83 1.03-.15.17-.3.2-.56.07-.26-.13-1.1-.41-2.1-1.3-.77-.69-1.3-1.54-1.45-1.8-.15-.26-.02-.4.11-.53.12-.11.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.07-.13-.59-1.42-.81-1.95-.21-.51-.43-.44-.59-.45-.15-.01-.33-.01-.5-.01" />
    </svg>
  )
}

export function LandingFooter() {
  return (
    <footer id="helpline" className="w-full bg-[#050814] text-slate-400 border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Turf Titans"
                className="h-8 w-8 rounded-md object-contain"
              />
              <span className="font-display text-lg font-black tracking-wider uppercase text-white">
                TURF <span className="text-[#74c004]">TITANS</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The premier platform for organizing, managing, and tracking grassroots and pro sports tournaments under illuminated turf arenas.
            </p>
            <div className="pt-2 text-xs font-semibold text-slate-300">
              <span className="text-slate-500 font-normal">Co-Founders & Heads:</span> Turf Titans
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              QUICK NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/tournaments" className="hover:text-[#74c004] transition-colors">
                  All Tournaments
                </Link>
              </li>
              <li>
                <Link href="/tournaments/turf-titans-2025?tab=fixtures" className="hover:text-[#74c004] transition-colors">
                  Tournament Fixtures
                </Link>
              </li>
              <li>
                <Link href="/tournaments/turf-titans-2025?tab=points-table" className="hover:text-[#74c004] transition-colors">
                  Points Table & Standings
                </Link>
              </li>
              <li>
                <Link href="/tournaments/turf-titans-2025?tab=registration" className="hover:text-[#74c004] transition-colors">
                  Team Registration
                </Link>
              </li>
              <li>
                <Link href="/tournaments/turf-titans-2025?tab=scoring" className="hover:text-[#74c004] transition-colors">
                  Live Match Center
                </Link>
              </li>
            </ul>
          </div>




          {/* Col 4: Organizers Helpline & Community */}
          <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Left Part: Organizers Helpline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                ORGANIZERS HELPLINE
              </h4>
              <p className="text-xs text-slate-400">
                Have questions regarding tournament slots or venue rules?
              </p>
              <p className="text-xs font-bold text-slate-200">
                Available: 9:00 AM - 11:00 PM IST
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="rounded-lg bg-[#141f36] border border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-300 flex flex-col">
                  <span className="text-[#74c004]">Verified Turf</span>
                  <span>Tournaments</span>
                </div>
                <div className="rounded-lg bg-[#141f36] border border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-300 flex flex-col">
                  <span className="text-[#74c004]">100% Fair</span>
                  <span>Play Guarantee</span>
                </div>
              </div>
            </div>

            {/* Right Part: Social & Community Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                CONNECT & COMMUNITY
              </h4>
              <div className="flex flex-col gap-2.5">
                {/* 1. INSTAGRAM LINK */}
                <a
                  href="https://www.instagram.com/turf_titans_go/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex items-center justify-between gap-2.5 rounded-2xl border border-white/15 bg-[#060b18]/85 backdrop-blur-md p-2 sm:p-2.5 shadow-xl transition-all duration-300 hover:border-pink-500/50 hover:bg-[#0c162b]/95 hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] hover:scale-[1.01] active:scale-[0.98]"
                  aria-label="Instagram - See the highlights of our tournaments"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover/link:scale-105 transition-transform duration-300">
                      <InstagramIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide block truncate">
                        Instagram
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                        See the highlights of our tournaments
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 group-hover/link:text-pink-400 group-hover/link:border-pink-500/30 group-hover/link:bg-pink-500/10 transition-all duration-300 shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300" />
                  </div>
                </a>

                {/* 2. WHATSAPP COMMUNITY LINK */}
                <a
                  href="https://chat.whatsapp.com/I2e2xHXfgKOEcEhZKGDREO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex items-center justify-between gap-2.5 rounded-2xl border border-white/15 bg-[#060b18]/85 backdrop-blur-md p-2 sm:p-2.5 shadow-xl transition-all duration-300 hover:border-[#25D366]/50 hover:bg-[#0c162b]/95 hover:shadow-[0_0_25px_rgba(37,211,102,0.25)] hover:scale-[1.01] active:scale-[0.98]"
                  aria-label="WhatsApp Community - Join our community"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-md group-hover/link:scale-105 transition-transform duration-300">
                      <WhatsAppIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide block truncate">
                        WhatsApp Community
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                        Join our community
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 group-hover/link:text-[#25D366] group-hover/link:border-[#25D366]/30 group-hover/link:bg-[#25D366]/10 transition-all duration-300 shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2025 Turf Titans Sports Championship Platform. All Rights Reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/fixtures#tapeball-rules" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/fixtures#tapeball-rules" className="hover:text-slate-300 transition-colors">
              Terms of Play
            </Link>
            <Link href="/fixtures#tapeball-rules" className="hover:text-slate-300 transition-colors">
              Code of Conduct
            </Link>
          </div>
        </div>

      </div>

    </footer>
  )
}

export function LandingPageView() {
  return (
    <div className="min-h-screen bg-[#f8faf6] text-slate-900 flex flex-col justify-between selection:bg-[#74c004] selection:text-slate-950">
      {/* Exact Landing Page Top Navigation */}
      <LandingNavbar />

      {/* Hero Section with Light Soft Green Theme (matching Scoring Page color family) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eef6e8] via-[#e7f2de] to-[#f4f7f2] pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-950/10">
        {/* Soft Ambient Blurs */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-lime-300/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-emerald-300/25 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Heading, Subtext, Buttons, Stat Boxes */}
            <div className="lg:col-span-7 space-y-7">

              {/* Green Sub-heading Pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/5 px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 backdrop-blur-sm border border-emerald-900/10">
                <span className="h-2 w-2 rounded-full bg-[#74c004] animate-pulse" />
                <span className="uppercase tracking-wider">
                  ELITE GRASSROOTS SPORTS TOURNAMENTS & CHAMPIONSHIPS
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-slate-900">
                THE FUTURE OF <br />
                <span className="text-[#68ad03]">SPORTS TOURNAMENT</span> <br />
                PLATFORM
              </h1>

              {/* Subtext */}
              <p className="text-slate-700 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
                Discover, Compete & Track Live Matches — The centralized platform for modern sports tournaments, leagues, and championship events under floodlit turf arenas.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                {/* <Link
                  href="/tournaments/turf-titans-2025?tab=registration"
                  className="inline-flex items-center gap-3 rounded-full bg-[#74c004] hover:bg-[#82d804] pl-6 pr-2.5 py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_10px_25px_-5px_rgba(116,192,4,0.4)] transition-all hover:scale-105"
                >
                  <span>Register Team (₹3,000)</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[#74c004]">
                    <ArrowRight className="h-4 w-4" strokeWidth={3} />
                  </div>
                </Link> */}

                <Link
                  href="/tournaments"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-900/15 bg-white/90 hover:bg-white px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 shadow-xs transition-colors"
                >
                  Explore Tournaments
                </Link>

                <Link
                  href="/tournaments/turf-titans-2025?tab=fixtures"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-900/15 bg-white/90 hover:bg-white px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 shadow-xs transition-colors"
                >
                  View Fixtures
                </Link>
              </div>

              {/* 4 Stat Boxes in a row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl">

                {/* Stat 1 */}
                <div className="rounded-2xl border border-emerald-900/10 bg-white/80 backdrop-blur-sm p-4 text-center shadow-xs">
                  <div className="font-display text-2xl sm:text-3xl font-black text-slate-900">
                    20
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    TEAMS (4 GROUPS)
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="rounded-2xl border border-emerald-900/10 bg-white/80 backdrop-blur-sm p-4 text-center shadow-xs">
                  <div className="font-display text-2xl sm:text-3xl font-black text-slate-900">
                    200+
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    ATHLETES & SQUADS
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="rounded-2xl border border-emerald-900/10 bg-white/80 backdrop-blur-sm p-4 text-center shadow-xs">
                  <div className="font-display text-2xl sm:text-3xl font-black text-[#68ad03]">
                    5 OVERS
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    HIGH-TEMPO FORMAT
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="rounded-2xl border border-emerald-900/10 bg-white/80 backdrop-blur-sm p-4 text-center shadow-xs">
                  <div className="font-display text-2xl sm:text-3xl font-black text-[#68ad03]">
                    ₹35K+
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    PRIZE POOL
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Clean & Minimal Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md rounded-3xl border border-emerald-900/15 bg-white/95 backdrop-blur-sm p-6 shadow-xl overflow-hidden group">

                {/* Mockup Header - Clean & Minimal without tours */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-4 border-b border-emerald-900/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#74c004]" />
                    <span className="text-slate-900 font-bold">Turf Titans Series</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[#5ea303] text-[11px] uppercase tracking-wider">
                    <Activity className="h-3.5 w-3.5" />
                    <span>LIVE ARENA SYNC</span>
                  </div>
                </div>

                {/* Mockup Body Content */}
                <div className="pt-4 space-y-4">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Modern Sports Tournament Infrastructure
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase text-slate-900 leading-tight">
                    Professional Sports <br />
                    <span className="text-[#68ad03]">Championships</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Discover, organize, compete & track live scores in real time.
                  </p>

                  {/* Highlighting Card */}
                  <div className="rounded-2xl border border-emerald-900/10 bg-[#eef6e8]/80 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase">
                        REGISTRATIONS OPEN
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                        Official Tournament Draw • Lush Arena
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#74c004] px-3.5 py-1.5 text-right text-slate-950 shadow-xs">
                      <div className="text-xs font-black">
                        ₹3,000
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-wider">
                        Slot Pass
                      </div>
                    </div>
                  </div>

                  {/* Mockup Bottom Navigation */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    <div className="py-2 rounded-xl bg-slate-100/80 border border-slate-200/60">PLAYERS</div>
                    <div className="py-2 rounded-xl bg-slate-100/80 border border-slate-200/60">TEAMS</div>
                    <div className="py-2 rounded-xl bg-slate-100/80 border border-slate-200/60">FIXTURES</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* The Turf Titans Way Section (Clean Light Minimal Section) */}
      <section className="w-full bg-white text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center space-y-10">

          {/* Section Heading */}
          <div className="flex items-center justify-center gap-2">
            <CheckSquare className="h-6 w-6 text-[#5ea303]" />
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
              The Turf Titans Way
            </h2>
          </div>

          {/* 2 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">

            {/* Card 1: Centralized Registrations */}
            <div className="rounded-2xl bg-[#f4f8ef] border border-emerald-900/10 p-6 sm:p-8 flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#74c004] text-slate-950 shadow-sm">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold text-slate-900 uppercase">
                  Centralized Registrations
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Team rosters, player verification & tournament entry slots managed in one frictionless portal.
                </p>
              </div>
            </div>

            {/* Card 2: Real-Time Live Scoring */}
            <div className="rounded-2xl bg-[#f4f8ef] border border-emerald-900/10 p-6 sm:p-8 flex items-start gap-4 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#74c004] text-slate-950 shadow-sm">
                <Radio className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold text-slate-900 uppercase">
                  Real-Time Live Match Scoring
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Instant live scorecards, match telemetry, dynamic leaderboard calculations, and spectator tracking.
                </p>
              </div>
            </div>

          </div>

          {/* Center Indicator */}
          <div className="flex justify-center pt-2">
            <div className="h-9 w-14 rounded-full bg-[#162720] flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-[#74c004]" />
            </div>
          </div>

        </div>
      </section>

      {/* Exact Landing Page 4-Column Footer */}
      <LandingFooter />
    </div>
  )
}
