'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Menu, X, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getLiveEventStatus } from '@/lib/services'

export function Navbar({ variant = 'championship' }: { variant?: 'championship' | 'scoring' }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [liveEventSlug, setLiveEventSlug] = useState<string | null>(null)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  useEffect(() => {
    let isMounted = true

    const checkLiveStatus = async () => {
      try {
        const status = await getLiveEventStatus()
        if (isMounted) {
          setIsLive(Boolean(status.isLive))
          if (status.liveEvents && status.liveEvents.length > 0) {
            setLiveEventSlug(status.liveEvents[0].slug || status.liveEvents[0]._id)
          } else {
            setLiveEventSlug(null)
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsLive(false)
          setLiveEventSlug(null)
        }
      }
    }

    checkLiveStatus()
    // Poll every 30 seconds to stay updated
    const interval = setInterval(checkLiveStatus, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [pathname])

  const isHomeActive = pathname === '/'
  const isTournamentsActive = pathname.startsWith('/tournaments') && !pathname.includes('tab=scoring')
  const isLiveActive = pathname.includes('tab=scoring')

  const liveTargetUrl = liveEventSlug
    ? `/tournaments/${liveEventSlug}?tab=scoring`
    : '/tournaments?filter=live'

  return (
    <header className="w-full bg-[#0b1329] border-b border-white/10 px-4 py-3 sm:px-6 lg:px-8 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        
        {/* Left Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Turf Titans"
            className="h-8 w-8 rounded-md object-contain"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm sm:text-base font-black tracking-wider uppercase text-white leading-none">
                TURF TITANS
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#74c004]" />
            </div>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              SPORTS TOURNAMENT PLATFORM
            </span>
          </div>
        </Link>

        {/* Center Global Navigation */}
        <nav className="hidden sm:flex items-center gap-1.5 bg-[#060c1c]/60 p-1 rounded-lg border border-white/5">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors ${
              isHomeActive
                ? 'bg-white/10 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            HOME
          </Link>
          <Link
            href="/tournaments"
            className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors ${
              isTournamentsActive
                ? 'bg-[#74c004] text-[#0b1329] shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            TOURNAMENTS
          </Link>
          {isLive && (
            <Link
              href={liveTargetUrl}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors ${
                isLiveActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE</span>
            </Link>
          )}
        </nav>

        {/* Right Actions: Live Arena Tag (when live) & User Login/Logout */}
        <div className="flex items-center gap-3">
          {isLive && (
            <Link
              href={liveTargetUrl}
              className="hidden xs:flex items-center gap-2 rounded-full bg-red-600/20 hover:bg-red-600/30 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-red-300 border border-red-500/30 shadow-sm transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE ARENA</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* User / Admin Tag */}
              <div className="hidden md:flex items-center gap-2 bg-[#060c1c]/80 border border-white/10 rounded-full px-3 py-1 text-xs">
                <span className="text-white font-bold truncate max-w-[120px]">
                  {user?.name || user?.username || user?.email}
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

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:text-red-200 transition-colors cursor-pointer"
                title="Log Out of Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full bg-[#74c004] hover:bg-[#86dc05] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#060b18] transition-all hover:scale-105"
              >
                <User className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden text-white p-1 ml-1"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="sm:hidden pt-3 pb-2 border-t border-white/10 mt-3 space-y-2 text-xs font-bold uppercase">
          <Link href="/" onClick={() => setMobileOpen(false)} className="block py-1 text-slate-300">HOME</Link>
          <Link href="/tournaments" onClick={() => setMobileOpen(false)} className="block py-1 text-[#74c004]">TOURNAMENTS</Link>
          {isLive && (
            <Link href={liveTargetUrl} onClick={() => setMobileOpen(false)} className="block py-1 text-red-400 font-black">
              ● LIVE SCORING
            </Link>
          )}
          {isAuthenticated ? (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-300 text-xs">
                {user?.name || user?.username || user?.email} ({isAdmin ? 'ADMIN' : 'USER'})
              </span>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  logout()
                }}
                className="text-red-400 font-bold"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-1 text-slate-300">LOGIN</Link>
          )}
        </div>
      )}
    </header>
  )
}
