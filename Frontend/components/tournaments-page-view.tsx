'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Trophy,
  Calendar,
  MapPin,
  Users,
  Shield,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  Zap,
  Building2,
  Flame,
  Swords
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import {
  getEvents,
  createAdminEvent,
  deleteAdminEvent,
  Event as BackendEvent,
  formatEventDates,
  formatStatus
} from '@/lib/services'

export interface SportArena {
  id: string
  name: string
  tagline: string
  icon: string
  badgeText: string
  accentColor: string
  bgGlow: string
  borderColor: string
  description: string
  equipmentVisual: string
  quickRules: string
}

export const SPORT_ARENAS: SportArena[] = [
  {
    id: 'cricket',
    name: 'Cricket',
    tagline: 'Team Sport',
    icon: '🏏',
    badgeText: 'Cage & Turf Matches',
    accentColor: '#74c004',
    bgGlow: 'from-[#74c004]/15 via-[#0b1b08]/30 to-transparent',
    borderColor: 'hover:border-[#74c004]/60',
    description: 'Bat, bowl, and field your way to glory in inter-college cricket tournaments with competing teams  ',
    equipmentVisual: '🏏 🔴',
    quickRules: 'Bat, bowl, and field your way to glory in inter-college cricket tournaments with competing teams.',
  },
  {
    id: 'football',
    name: 'Football',
    tagline: 'Team Sport ',
    icon: '⚽',
    badgeText: 'FIFA-Grade Synthetic Turf',
    accentColor: '#38bdf8',
    bgGlow: 'from-[#38bdf8]/15 via-[#081b2a]/30 to-transparent',
    borderColor: 'hover:border-[#38bdf8]/60',
    description: 'Dribble through defenders and score in the most exciting campus football league of the season.',
    equipmentVisual: '⚽ 🥅',
    quickRules: '5v5 & 7v7 Formats • Rebound Cage • Rolling Substitutions',
  },
  {
    id: 'badminton',
    name: 'Badminton',
    tagline: 'Individual Sport',
    icon: '🏸',
    badgeText: 'BWF-Grade Synthetic Courts',
    accentColor: '#f59e0b',
    bgGlow: 'from-[#f59e0b]/15 via-[#231706]/30 to-transparent',
    borderColor: 'hover:border-[#f59e0b]/60',
    description: 'Lightning-fast singles and doubles knockout clashes with feather shuttlecocks and digital point tracking.',
    equipmentVisual: '🏸 🪶',
    quickRules: 'Singles & Doubles • 21-Point Rallies • Feather Shuttle',
  },
  {
    id: 'pickleball',
    name: 'Pickleball',
    tagline: 'High-Velocity Paddle Arena',
    icon: '🏓',
    badgeText: 'Dual-Court Showdowns',
    accentColor: '#ec4899',
    bgGlow: 'from-[#ec4899]/15 via-[#230816]/30 to-transparent',
    borderColor: 'hover:border-[#ec4899]/60',
    description: 'Dynamic non-volley zone tactical battles, carbon composite paddles, and fast-paced doubles brackets.',
    equipmentVisual: '🏓 🟡',
    quickRules: '11-Point Games • Non-Volley Kitchen Zone • Carbon Paddles',
  },
  {
    id: 'snooker',
    name: 'Snooker',
    tagline: 'Precision Cue Masters Series',
    icon: '🎱',
    badgeText: 'Full-Size Heated Slates',
    accentColor: '#a855f7',
    bgGlow: 'from-[#a855f7]/15 via-[#180826]/30 to-transparent',
    borderColor: 'hover:border-[#a855f7]/60',
    description: 'Frame-by-frame break-building tournaments on 12-foot tournament tables with professional referees.',
    equipmentVisual: '🎱 🪄',
    quickRules: 'Standard 15 Reds • Break Tracking • Best of 5 Frames',
  },
  {
    id: 'chess',
    name: 'Chess',
    tagline: 'Grandmaster Rapid & Blitz Clashes',
    icon: '♟️',
    badgeText: 'FIDE-Timed Swiss System',
    accentColor: '#10b981',
    bgGlow: 'from-[#10b981]/15 via-[#062016]/30 to-transparent',
    borderColor: 'hover:border-[#10b981]/60',
    description: 'Mind games on physical wooden boards with digital Fischer clocks, rated Swiss-system rounds and live streaming.',
    equipmentVisual: '♟️ ⏱️',
    quickRules: '10m + 5s Rapid & 3m+2s Blitz • FIDE Swiss System',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    tagline: '3v3 Half-Court & 5v5 Full-Court',
    icon: '🏀',
    badgeText: 'Sprung Hardwood & Turf',
    accentColor: '#f97316',
    bgGlow: 'from-[#f97316]/15 via-[#261208]/30 to-transparent',
    borderColor: 'hover:border-[#f97316]/60',
    description: 'Fast-paced streetball tournaments with shot clocks, MVP ladders, and 3-point contest side events.',
    equipmentVisual: '🏀 🗑️',
    quickRules: '3v3 Half-Court & 5v5 • 12-Second Shot Clocks',
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    tagline: 'Spike & Block Turf Series',
    icon: '🏐',
    badgeText: 'Sand & Turf Courts',
    accentColor: '#06b6d4',
    bgGlow: 'from-[#06b6d4]/15 via-[#082026]/30 to-transparent',
    borderColor: 'hover:border-[#06b6d4]/60',
    description: 'Spike showdowns on cushioned turf courts with 6-player squads, rotation tracking, and power jump stats.',
    equipmentVisual: '🏐 🕸️',
    quickRules: '6v6 Squads • 25-Point Sets • Rotation Tracking',
  },
]

export function TournamentsPageView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAdmin } = useAuth()

  // Selected sport query handling
  const sportParam = searchParams.get('sport')?.toLowerCase() || null
  const selectedSport = SPORT_ARENAS.find((s) => s.id === sportParam) || null

  // Tournaments state for selected sport
  const [tournaments, setTournaments] = useState<BackendEvent[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Admin Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Delete Modal States
  const [tournamentToDelete, setTournamentToDelete] = useState<BackendEvent | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form Data for Create Tournament
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newVenue, setNewVenue] = useState('Lush Turf Arena Complex')
  const [newLocation, setNewLocation] = useState('Mira Road East, Mumbai')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newRegStartDate, setNewRegStartDate] = useState('')
  const [newRegEndDate, setNewRegEndDate] = useState('')
  const [newFee, setNewFee] = useState('3000')
  const [newMaxTeams, setNewMaxTeams] = useState('16')
  const [newPrizes, setNewPrizes] = useState('₹35,000 + Champions Trophy')
  const [newRules, setNewRules] = useState('')

  // Show temporary toast
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Fetch tournaments for selected sport from backend
  const fetchSportTournaments = useCallback(async (sportId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEvents({ sport: sportId })
      setTournaments(data || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load tournaments for this sport.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSport) {
      fetchSportTournaments(selectedSport.id)
    } else {
      setTournaments([])
    }
  }, [selectedSport, fetchSportTournaments])

  // Handle Sport Click -> update URL query
  const handleSelectSport = (sportId: string) => {
    router.push(`/tournaments?sport=${sportId}`)
  }

  // Handle Back to Choose Arena
  const handleBackToArenas = () => {
    router.push('/tournaments')
  }

  // Handle Create Tournament Submit
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSport) return
    if (!newTitle.trim()) {
      setCreateError('Tournament title is required.')
      return
    }
    if (!newStartDate || !newEndDate || !newRegStartDate || !newRegEndDate) {
      setCreateError('All tournament and registration dates are required.')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const payload = {
        title: newTitle.trim(),
        sport: selectedSport.id,
        description: newDescription.trim() || `Official ${selectedSport.name} championship hosted by Turf Titans.`,
        venue: newVenue.trim(),
        location: newLocation.trim(),
        startDate: new Date(newStartDate).toISOString(),
        endDate: new Date(newEndDate).toISOString(),
        registrationStartDate: new Date(newRegStartDate).toISOString(),
        registrationEndDate: new Date(newRegEndDate).toISOString(),
        registrationFee: Number(newFee) || 0,
        maxTeams: Number(newMaxTeams) || 16,
        prizes: newPrizes.trim() || '₹35,000 + Golden Trophy',
        rules: newRules.trim() || selectedSport.quickRules,
        status: 'registration_open',
      }

      await createAdminEvent(payload)
      showToast('success', `New ${selectedSport.name} tournament created successfully!`)
      setIsCreateModalOpen(false)

      // Reset form
      setNewTitle('')
      setNewDescription('')
      setNewRules('')

      // Reload list
      await fetchSportTournaments(selectedSport.id)
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create tournament. Please check fields.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle Delete Tournament Confirm
  const handleDeleteTournament = async () => {
    if (!tournamentToDelete || !selectedSport) return

    setIsDeleting(true)
    try {
      await deleteAdminEvent(tournamentToDelete._id)
      showToast('success', `Tournament "${tournamentToDelete.title}" was deleted permanently.`)
      setTournamentToDelete(null)
      await fetchSportTournaments(selectedSport.id)
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete tournament.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060b18] text-white flex flex-col justify-between selection:bg-[#74c004] selection:text-[#060b18]">
      {/* Global Minimal Navbar */}
      <Navbar />

      {/* Floating Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-300 ${toastMessage.type === 'success'
            ? 'bg-[#0f2415] border-[#74c004]/40 text-[#74c004]'
            : 'bg-[#290d14] border-red-500/40 text-red-400'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* VIEW 1: CHOOSE YOUR ARENA (Sport Selection) */}
        {/* ========================================================================= */}
        {!selectedSport && (
          <div className="space-y-12">
            {/* Header / Hero Banner */}
            <section className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b1426] via-[#0e1b33] to-[#0a1324] p-8 sm:p-12 shadow-2xl overflow-hidden text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#74c004]/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-4 py-1 text-xs font-black uppercase tracking-widest text-[#74c004]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>OFFICIAL TOURNAMENT ARENAS</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                  Choose Your <span className="text-[#74c004]">Arena</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Select your sport to access dedicated championship brackets, live ball-by-ball scorecards, squad registrations, and official rules.
                </p>
              </div>
            </section>

            {/* Sports Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                    Select a Sport
                  </h2>
                  <p className="text-xs text-slate-400">
                    Each arena features dedicated tournaments, standings, and isolated rosters.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {SPORT_ARENAS.map((sport) => (
                  <div
                    key={sport.id}
                    onClick={() => handleSelectSport(sport.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectSport(sport.id)
                    }}
                    className={`group relative rounded-3xl border border-white/10 bg-[#0c1426] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(116,192,4,0.15)] cursor-pointer flex flex-col justify-between overflow-hidden ${sport.borderColor}`}
                  >
                    {/* Top Ambient Glow */}
                    <div
                      className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${sport.bgGlow} blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60`}
                    />

                    <div className="relative z-10 space-y-4">
                      {/* Sport Icon & Equipment Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-4xl select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                          {sport.icon}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                          {sport.equipmentVisual}
                        </span>
                      </div>

                      {/* Sport Title (Strictly Sport Name only) */}
                      <div>
                        <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white group-hover:text-[#74c004] transition-colors">
                          {sport.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                          {sport.tagline}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed font-normal">
                        {sport.description}
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="relative z-10 pt-5 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#74c004] group-hover:translate-x-1 transition-transform">
                      <span>View Tournaments</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom Highlights Feature Row */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c1426] p-6 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16233d] text-[#74c004]">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="font-display text-base font-bold uppercase text-white">
                  Isolated Brackets & Standings
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every tournament operates with its own isolated registrations, points table, fixtures, and scorecards.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1426] p-6 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16233d] text-[#74c004]">
                  <Building2 className="h-5 w-5" />
                </div>
                <h4 className="font-display text-base font-bold uppercase text-white">
                  FIFA & BWF Grade Arenas
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Curated partner turfs and sports courts across Mumbai with high-power floodlights and player lounges.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c1426] p-6 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16233d] text-[#74c004]">
                  <Trophy className="h-5 w-5" />
                </div>
                <h4 className="font-display text-base font-bold uppercase text-white">
                  Cash Prizes & Champions Cups
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verified cash prizes, MVP trophies, and official Turf Titans leaderboard ranking for all sports.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SPORT-SCOPED TOURNAMENTS LIST */}
        {/* ========================================================================= */}
        {selectedSport && (
          <div className="space-y-8">
            {/* Top Navigation & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <button
                type="button"
                onClick={handleBackToArenas}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors group cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-[#74c004] group-hover:-translate-x-1 transition-transform" />
                <span>← Choose Your Arena</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedSport.icon}</span>
                  <span className="font-display text-xl font-black uppercase tracking-tight text-white">
                    {selectedSport.name}
                  </span>
                </div>

                {/* ADMIN ONLY: Create New Tournament Button */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreateError(null)
                      setIsCreateModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-[0_0_15px_rgba(116,192,4,0.3)] transition-all cursor-pointer hover:scale-105"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    <span>+ Create New Tournament</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sport Header Card */}
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-[#0c1426] via-[#101b33] to-[#0c1426] p-6 sm:p-8 shadow-xl overflow-hidden">
              <div
                className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${selectedSport.bgGlow} blur-3xl pointer-events-none opacity-50`}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-300">
                    <span>{selectedSport.badgeText}</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black font-display uppercase tracking-tight text-white">
                    {selectedSport.name} Tournaments
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                    {selectedSport.description}
                  </p>
                </div>

                <div className="shrink-0 p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[140px]">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    ACTIVE TOURNAMENTS
                  </span>
                  <span className="font-display text-3xl font-black text-[#74c004] mt-0.5 block">
                    {tournaments.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 text-[#74c004] animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Fetching {selectedSport.name} Tournaments from Database...
                </p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
                <p className="text-sm font-bold text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchSportTournaments(selectedSport.id)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-white/20 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State: COMING SOON */}
            {!loading && !error && tournaments.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-[#0c1426]/70 p-12 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#16233d] mx-auto text-4xl shadow-inner">
                  {selectedSport.icon}
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                    <span>COMING SOON</span>
                  </div>
                  <h3 className="text-2xl font-black font-display uppercase tracking-tight text-white">
                    No tournament is currently available for this sport.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    We are finalizing dates and fixtures for upcoming {selectedSport.name} championships. Check back soon or contact tournament organizers.
                  </p>
                </div>

                {/* ADMIN ONLY: Option to create the first tournament */}
                {isAdmin && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateError(null)
                        setIsCreateModalOpen(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-lg transition-all cursor-pointer hover:scale-105"
                    >
                      <Plus className="h-4 w-4" strokeWidth={3} />
                      <span>+ Create First {selectedSport.name} Tournament</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tournaments Grid (Real Backend Data) */}
            {!loading && !error && tournaments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {tournaments.map((tournament) => {
                  const tournamentId = tournament._id
                  const isRegistrationOpen = tournament.status === 'registration_open'

                  return (
                    <div
                      key={tournamentId}
                      className="rounded-3xl border border-white/10 bg-[#0c1426] hover:border-[#74c004]/50 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(116,192,4,0.15)] flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Top Badge & Icon */}
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-[#74c004]/15 border border-[#74c004]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#74c004]">
                            {selectedSport.name}
                          </span>

                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                            {formatStatus(tournament.status, 0, tournament.maxTeams, tournament.startDate, tournament.endDate)}
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white leading-snug">
                            {tournament.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">
                            {tournament.description}
                          </p>
                        </div>

                        {/* Dates and Location */}
                        <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#74c004] shrink-0" />
                            <span>{formatEventDates(tournament.startDate, tournament.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.venue ? `${tournament.venue}, ${tournament.location}` : tournament.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 text-slate-300 hover:text-[#74c004] transition-colors truncate group/venue"
                              title="Click to open venue in Google Maps"
                            >
                              <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0 group-hover/venue:scale-110 transition-transform" />
                              <span className="truncate group-hover/venue:underline">{tournament.venue || tournament.location}</span>
                            </a>
                          </div>
                        </div>

                        {/* Tournament Metrics */}
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Prize Pool:</span>
                            <span className="font-bold text-[#74c004]">{tournament.prizes}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Capacity:</span>
                            <span className="font-bold text-white">{tournament.maxTeams} Teams Max</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Entry Fee:</span>
                            <span className="font-bold text-white">₹{tournament.registrationFee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: User [View] | Admin [View] [Delete] */}
                      <div className="pt-5 border-t border-white/10 mt-5 flex items-center gap-2">
                        <Link
                          href={`/tournaments/${tournamentId}`}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md transition-all hover:scale-[1.02]"
                        >
                          <span>View Tournament</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>

                        {/* ADMIN ONLY: Delete Tournament Button */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setTournamentToDelete(tournament)}
                            title="Delete Tournament (Admin)"
                            className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADMIN CREATE TOURNAMENT MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && selectedSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0c1426] p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedSport.icon}</span>
                <div>
                  <h3 className="font-display text-xl font-black uppercase tracking-tight text-white">
                    Create New {selectedSport.name} Tournament
                  </h3>
                  <p className="text-xs text-slate-400">
                    This tournament will be scoped specifically under <span className="text-[#74c004] font-bold">{selectedSport.name}</span>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error in modal */}
            {createError && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs font-bold text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Tournament Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. Turf Titans ${selectedSport.name} Championship 2026`}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Description / Subtitle
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief highlights, format, division details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Venue */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Venue <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Location / City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Tournament Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Tournament End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Reg Start Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Registration Opens <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRegStartDate}
                    onChange={(e) => setNewRegStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Reg End Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Registration Closes <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRegEndDate}
                    onChange={(e) => setNewRegEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Entry Fee */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Registration Fee (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Max Teams */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Max Teams Capacity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMaxTeams}
                    onChange={(e) => setNewMaxTeams(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Prizes */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Prize Pool & Awards <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹40,000 + Golden Cup + MVP Medals"
                    value={newPrizes}
                    onChange={(e) => setNewPrizes(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none"
                  />
                </div>

                {/* Rules */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-300">
                    Official Rules (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Key match regulations, innings format, tie-break rules..."
                    value={newRules}
                    onChange={(e) => setNewRules(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#070d1a] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#74c004] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[3]" />}
                  <span>{isCreating ? 'Creating Tournament...' : 'Save & Publish Tournament'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADMIN DELETE TOURNAMENT CONFIRMATION */}
      {/* ========================================================================= */}
      {tournamentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-red-500/30 bg-[#0e1628] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                Delete Tournament?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-white">"{tournamentToDelete.title}"</span>?
              </p>
              <p className="text-[11px] text-red-400 font-semibold leading-relaxed">
                This will safely remove all registrations, fixtures, groups, and match data associated with this tournament from the database. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setTournamentToDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-white/15 py-2.5 text-xs font-bold uppercase text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTournament}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  )
}
