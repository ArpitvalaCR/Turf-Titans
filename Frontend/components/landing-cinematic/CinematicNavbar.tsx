'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Radio, Shield, LogOut, Menu, X, Trophy, Calendar, Phone, Home, Info } from 'lucide-react'

export function CinematicNavbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      setIsScrolled(currentScrollY > 20)

      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 80 && !mobileMenuOpen) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, mobileMenuOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${
        isScrolled || mobileMenuOpen
          ? 'bg-[#060b18]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Desktop Left Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
            <Link
              href="/"
              className="text-white hover:text-[#74c004] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#74c004]"
            >
              Home
            </Link>
            <a href="#about" className="hover:text-[#74c004] transition-colors">
              About
            </a>
            <Link href="/tournaments" className="hover:text-[#74c004] transition-colors">
              Tournaments
            </Link>
            <Link href="/tournaments/turf-titans-2025?tab=fixtures" className="hover:text-[#74c004] transition-colors">
              Fixtures
            </Link>
            <a href="#helpline" className="hover:text-[#74c004] transition-colors">
              Contact
            </a>
          </nav>

          {/* Brand Logo (Centered on Desktop, Left on Mobile) */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Turf Titans"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-contain shadow-[0_0_20px_rgba(116,192,4,0.4)] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-display text-sm sm:text-base font-black tracking-wider uppercase text-white leading-none">
                TURF <span className="text-[#74c004]">TITANS</span>
              </span>
              <span className="text-[7px] sm:text-[8px] font-extrabold tracking-widest text-slate-400 uppercase mt-0.5">
                SPORTS CHAMPIONSHIP
              </span>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/tournaments/turf-titans-2025?tab=scoring"
              className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#162035] hover:bg-[#1f2d4a] px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white border border-red-500/40 shadow-sm transition-all hover:scale-105"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="hidden xs:inline">LIVE MATCH</span>
              <span className="xs:hidden">LIVE</span>
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 bg-[#0d162a] border border-white/10 rounded-full px-3 py-1 text-xs">
                  <span className="text-white font-bold truncate max-w-[120px]">
                    {user?.name || user?.email}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      isAdmin
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
                  title="Logout"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <LogOut className="h-3.5 w-3.5 sm:hidden" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-full bg-[#74c004] hover:bg-[#86dc05] px-4 sm:px-5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:scale-105 shadow-[0_0_20px_rgba(116,192,4,0.4)]"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-3 border-t border-white/10 mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
            <nav className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-[#74c004] transition-colors"
              >
                <Home className="h-4 w-4 text-[#74c004]" />
                <span>Home</span>
              </Link>

              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-[#74c004] transition-colors"
              >
                <Info className="h-4 w-4 text-cyan-400" />
                <span>About Us</span>
              </a>

              <Link
                href="/tournaments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-[#74c004] transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Tournaments</span>
              </Link>

              <Link
                href="/tournaments/turf-titans-2025?tab=fixtures"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-[#74c004] transition-colors"
              >
                <Calendar className="h-4 w-4 text-purple-400" />
                <span>Fixtures</span>
              </Link>

              <Link
                href="/tournaments/turf-titans-2025?tab=scoring"
                onClick={() => setMobileMenuOpen(false)}
                className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="h-4 w-4 text-red-400 animate-pulse" />
                  <span>Live Arena Scoring</span>
                </div>
                <span className="text-[10px] font-black uppercase text-red-400">WATCH / SCORE</span>
              </Link>
            </nav>

            {/* Mobile Auth Row */}
            <div className="pt-2 border-t border-white/10">
              {isAuthenticated ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d162a] border border-white/10">
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-white truncate">
                      {user?.name || user?.email}
                    </span>
                    <span className="text-[9px] font-bold text-[#74c004] uppercase">
                      {isAdmin ? '👑 ADMIN ACCESS' : 'PLAYER ACCOUNT'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      logout()
                    }}
                    className="rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1.5 text-xs font-bold uppercase transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center p-3 rounded-xl bg-[#74c004] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-[#74c004]/20"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
