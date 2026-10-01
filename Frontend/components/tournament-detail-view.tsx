'use client'

import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  ArrowRight,
  Shield,
  CheckCircle2,
  FileText,
  Activity,
  Award,
  ChevronRight,
  Sparkles,
  Info,
  Upload,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
  AlertCircle,
  X,
  FileCheck2,
  UserCheck
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { FixturesView } from '@/components/fixtures-view'
import { PointsTableView } from '@/components/points-table-view'
import { LeaderboardView } from '@/components/leaderboard-view'
import { RegistrationForm } from '@/components/registration-form'
import { AdminRegistrationsView } from '@/components/admin-registrations-view'
import { LiveScoringCenter } from '@/components/live-scoring-center'
import { EditTournamentModal } from '@/components/edit-tournament-modal'
import { getTournamentById, TournamentItem } from '@/lib/tournaments-data'
import {
  getEvent,
  Event as BackendEvent,
  formatEventDates,
  formatSport,
  uploadEventRulebook,
  deleteEventRulebook
} from '@/lib/services'
import { useAuth } from '@/lib/auth-context'
import { Edit3 } from 'lucide-react'

type TabType = 'fixtures' | 'points-table' | 'leaderboard' | 'registration' | 'scoring' | 'rules'

export function TournamentDetailView({ tournamentId }: { tournamentId: string }) {
  const searchParams = useSearchParams()
  const { isAdmin } = useAuth()

  const tabParam = searchParams.get('tab') as TabType
  const matchIdParam = searchParams.get('matchId') || undefined
  const initialTab = (tabParam && ['fixtures', 'points-table', 'leaderboard', 'registration', 'scoring', 'rules'].includes(tabParam)) ? tabParam : 'fixtures'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const staticTournament: TournamentItem = getTournamentById(tournamentId)
  const [dbTournament, setDbTournament] = useState<BackendEvent | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)

  // Rulebook PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState('')
  const [pdfErrorMsg, setPdfErrorMsg] = useState('')
  const [viewPdfModal, setViewPdfModal] = useState(false)

  const loadTournamentData = useCallback(async () => {
    try {
      const data = await getEvent(tournamentId)
      if (data) {
        setDbTournament(data)
      }
    } catch {
      // Fallback to static data
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    if (tabParam && ['fixtures', 'points-table', 'leaderboard', 'registration', 'scoring', 'rules'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    loadTournamentData()
  }, [loadTournamentData])

  const title = dbTournament?.title || staticTournament.title
  const sportKey = dbTournament?.sport || staticTournament.sport || 'cricket'
  const sportLabel = dbTournament ? formatSport(dbTournament.sport) : staticTournament.sportLabel
  const dateDisplay = dbTournament
    ? formatEventDates(dbTournament.startDate, dbTournament.endDate)
    : staticTournament.date
  const venue = dbTournament?.venue || staticTournament.venue
  const location = dbTournament?.location || staticTournament.location
  const description = dbTournament?.description || staticTournament.description
  const prizePool = dbTournament?.prizes || staticTournament.prizePool
  const totalTeams = dbTournament?.maxTeams || staticTournament.maxTeams
  const feeDisplay = dbTournament ? `₹${dbTournament.registrationFee.toLocaleString()}` : staticTournament.fee
  const statusLabel = dbTournament?.status === 'registration_open' ? 'Registration Open' : staticTournament.statusLabel

  // Rulebook Upload Handler (Admin only)
  const handlePdfFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfErrorMsg('Please select a valid PDF document (.pdf).')
      setPdfFile(null)
      return
    }

    setPdfErrorMsg('')
    setPdfFile(file)
  }

  const handleUploadRulebook = async () => {
    if (!pdfFile) {
      setPdfErrorMsg('Please select a PDF file first.')
      return
    }
    const targetEventId = dbTournament?._id || tournamentId
    setPdfUploading(true)
    setPdfSuccessMsg('')
    setPdfErrorMsg('')

    try {
      const res = await uploadEventRulebook(targetEventId, pdfFile)
      setPdfSuccessMsg('Official rulebook PDF uploaded successfully!')
      setPdfFile(null)
      await loadTournamentData()
      setTimeout(() => setPdfSuccessMsg(''), 4000)
    } catch (err: any) {
      setPdfErrorMsg(err?.message || 'Failed to upload rulebook PDF.')
    } finally {
      setPdfUploading(false)
    }
  }

  const handleDeleteRulebook = async () => {
    if (!confirm('Are you sure you want to delete the official rulebook PDF for this tournament?')) return
    const targetEventId = dbTournament?._id || tournamentId
    setPdfUploading(true)
    setPdfSuccessMsg('')
    setPdfErrorMsg('')

    try {
      await deleteEventRulebook(targetEventId)
      setPdfSuccessMsg('Official rulebook removed.')
      await loadTournamentData()
      setTimeout(() => setPdfSuccessMsg(''), 3000)
    } catch (err: any) {
      setPdfErrorMsg(err?.message || 'Failed to delete rulebook.')
    } finally {
      setPdfUploading(false)
    }
  }

  const rulebookUrl = dbTournament?.rulebookPdf || null

  return (
    <div className="min-h-screen bg-[#080e1e] text-slate-100 flex flex-col justify-between selection:bg-[#74c004] selection:text-[#080e1e]">
      {/* Global Minimal Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full pb-20">

        {/* 1. TOURNAMENT HERO HEADER BANNER */}
        <section className="w-full bg-[#070c1a] border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* Top Bar: Back to Sport / All Tournaments */}
            {/* Top Bar: Back to Sport / All Tournaments & Admin Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/tournaments?sport=${sportKey}`}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 text-[#74c004] group-hover:-translate-x-1 transition-transform" />
                <span>Back to {sportLabel} Tournaments</span>
              </Link>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#74c004]/15 hover:bg-[#74c004]/25 border border-[#74c004]/40 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#74c004] shadow-md transition-all cursor-pointer hover:scale-105"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Tournament</span>
                  </button>
                )}
                <span className="rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#74c004]">
                  {sportLabel}
                </span>
                <span className="rounded-full bg-white/10 border border-white/10 px-3 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Tournament Title & Meta Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

              <div className="lg:col-span-8 space-y-3">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white leading-tight">
                  {title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Calendar className="h-4 w-4 text-[#74c004]" />
                    <span>{dateDisplay}</span>
                  </div>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, ${location}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-300 hover:text-[#74c004] transition-colors cursor-pointer group"
                    title="Click to open venue in Google Maps"
                  >
                    <MapPin className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="group-hover:underline underline-offset-2">{venue}, {location}</span>
                  </a>
                </div>

                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Quick Info Badges */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Prize Pool</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white font-display">
                    {prizePool}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#74c004] text-xs font-bold uppercase">
                    <Users className="h-3.5 w-3.5" />
                    <span>Slots</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white font-display">
                    {totalTeams} Max
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 2. TAB NAVIGATION BAR */}
        <section className="sticky top-16 z-30 w-full bg-[#080e1e]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-2.5">

              <div className="flex items-center gap-1 sm:gap-2">
                {[
                  { id: 'fixtures', label: 'Fixtures & Schedule', icon: Calendar },
                  { id: 'points-table', label: 'Points Table', icon: Activity },
                  { id: 'leaderboard', label: 'Leaderboard & MVP', icon: Award },
                  { id: 'scoring', label: 'Live Scoring Center', icon: Activity },
                  {
                    id: 'registration',
                    label: isAdmin ? 'Review Registrations' : 'Squad Registration',
                    icon: isAdmin ? UserCheck : Users
                  },
                  { id: 'rules', label: 'Official Rules', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#74c004] text-[#080e1e] shadow-lg shadow-[#74c004]/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#080e1e]' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Quick Action Button in Tab Bar for Users */}
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('registration')}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors shrink-0 cursor-pointer"
                >
                  <span>Register Squad</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#74c004]" />
                </button>
              )}

            </div>
          </div>
        </section>

        {/* 3. TAB CONTENT */}
        <div className="w-full">

          {/* TAB 1: FIXTURES */}
          {activeTab === 'fixtures' && (
            <div>
              <FixturesView tournamentId={tournamentId || 'turf-titans-2025'} />
            </div>
          )}

          {/* TAB 2: POINTS TABLE */}
          {activeTab === 'points-table' && (
            <div>
              <PointsTableView tournamentId={tournamentId || 'turf-titans-2025'} />
            </div>
          )}

          {/* TAB 3: LEADERBOARD & MVP */}
          {activeTab === 'leaderboard' && (
            <div>
              <LeaderboardView tournamentId={tournamentId || 'turf-titans-2025'} />
            </div>
          )}

          {/* TAB 4: REGISTRATION (USER) OR REVIEW REGISTRATIONS (ADMIN) */}
          {activeTab === 'registration' && (
            <div>
              {isAdmin ? (
                <AdminRegistrationsView tournamentId={dbTournament?._id || staticTournament.id || tournamentId || 'turf-titans-2025'} />
              ) : (
                <RegistrationForm defaultEventId={dbTournament?._id || staticTournament.id || tournamentId} />
              )}
            </div>
          )}

          {/* TAB 5: SCORING */}
          {activeTab === 'scoring' && (
            <div>
              <LiveScoringCenter
                key={matchIdParam}
                initialMatchId={matchIdParam || 'match-1'}
                tournamentId={tournamentId || 'turf-titans-2025'}
              />
            </div>
          )}

          {/* TAB 6: OFFICIAL RULES (PDF RULEBOOK SYSTEM) */}
          {activeTab === 'rules' && (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
              
              {/* ADMIN CONTROL: UPLOAD / REPLACE RULEBOOK PDF */}
              {isAdmin && (
                <div className="rounded-3xl border border-[#74c004]/30 bg-[#0a1329] p-6 sm:p-8 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#74c004]/20 text-[#74c004]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-black uppercase text-white tracking-wide">
                          Upload Official Rulebook PDF
                        </h3>
                        <span className="text-[10px] text-slate-400">
                          Admin Management • PDF File is the single source of truth for tournament rules.
                        </span>
                      </div>
                    </div>
                    <span className="rounded bg-[#74c004]/20 border border-[#74c004]/30 px-2.5 py-0.5 text-[9px] font-black uppercase text-[#74c004]">
                      ADMIN ONLY
                    </span>
                  </div>

                  {/* Messages */}
                  {pdfSuccessMsg && (
                    <div className="p-3 rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 text-xs text-[#74c004] font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{pdfSuccessMsg}</span>
                    </div>
                  )}
                  {pdfErrorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{pdfErrorMsg}</span>
                    </div>
                  )}

                  {/* Current Rulebook Status & Actions */}
                  {rulebookUrl ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#060b18] border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">
                            {dbTournament?.rulebookFileName || 'Official Rulebook PDF'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {dbTournament?.rulebookUpdatedAt ? `Updated: ${new Date(dbTournament.rulebookUpdatedAt).toLocaleDateString()}` : 'Active Rulebook'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setViewPdfModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Rulebook</span>
                        </button>
                        <button
                          type="button"
                          disabled={pdfUploading}
                          onClick={handleDeleteRulebook}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No official rulebook PDF has been uploaded for this tournament yet.
                    </p>
                  )}

                  {/* Upload input form */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <label className="flex-1 flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-dashed border-white/15 bg-[#060b18] hover:border-[#74c004]/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5 truncate">
                        <Upload className="h-4 w-4 text-[#74c004] shrink-0" />
                        <span className="text-xs text-slate-300 truncate font-semibold">
                          {pdfFile ? pdfFile.name : 'Select Official Rulebook PDF (*.pdf)'}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-bold uppercase text-slate-300 shrink-0">
                        Browse
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handlePdfFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={pdfUploading || !pdfFile}
                      onClick={handleUploadRulebook}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {pdfUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>{rulebookUrl ? 'Replace Rulebook' : 'Upload Rulebook'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* USER & PUBLIC VIEW: OFFICIAL RULEBOOK */}
              <div className="rounded-3xl border border-white/10 bg-[#0f182e] p-6 sm:p-10 space-y-6 shadow-xl text-center">
                <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-white/10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#74c004]/10 border border-[#74c004]/30 text-[#74c004]">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
                      Official Rulebook
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Official rules, conduct codes, and match playing conditions for {title}.
                    </p>
                  </div>
                </div>

                {rulebookUrl ? (
                  <div className="space-y-6 max-w-lg mx-auto">
                    <div className="p-6 rounded-2xl bg-[#060b18] border border-white/10 space-y-4">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
                        <CheckCircle2 className="h-5 w-5 text-[#74c004]" />
                        <span>Official Certified Tournament Rulebook Available</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The tournament committee has released the complete official PDF rulebook. Click below to review match protocols, player eligibility, and field guidelines.
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setViewPdfModal(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-lg shadow-[#74c004]/20 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2.5} />
                          <span>View Rulebook</span>
                        </button>
                        <a
                          href={rulebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={dbTournament?.rulebookFileName || 'Turf-Titans-Official-Rulebook.pdf'}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open in New Tab</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state message when no PDF uploaded */
                  <div className="py-12 space-y-3 max-w-md mx-auto">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400">
                      <Clock className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase text-slate-200">
                      Official rulebook will be available soon.
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The organizing committee is finalizing the tournament regulations and will publish the PDF rulebook shortly.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* View PDF Modal */}
        {viewPdfModal && rulebookUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6">
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#0b1329] rounded-2xl border border-white/15 flex flex-col overflow-hidden shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#070c1a]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#74c004]" />
                  <span className="text-xs font-black uppercase text-white">
                    {dbTournament?.rulebookFileName || 'Official Rulebook PDF'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={rulebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setViewPdfModal(false)}
                    className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full bg-black">
                <iframe
                  src={rulebookUrl}
                  title="Official Rulebook PDF"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Tournament Modal (Admin) */}
        {showEditModal && dbTournament && (
          <EditTournamentModal
            tournament={dbTournament}
            onClose={() => setShowEditModal(false)}
            onSuccess={(updated) => {
              setDbTournament(updated)
              loadTournamentData()
            }}
          />
        )}

      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  )
}
