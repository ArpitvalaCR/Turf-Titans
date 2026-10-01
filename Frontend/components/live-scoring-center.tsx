'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Radio,
  RotateCcw,
  Volume2,
  Share2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Flame,
  Award,
  ChevronRight,
  Shield,
  ShieldAlert,
  Clock,
  Lock,
  Save,
  Loader2,
  Play,
  RefreshCw,
  Eye,
  Flag,
  UserCheck,
  Zap,
  AlertTriangle,
  Undo2
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  getMatchSession,
  acquireMatchLock,
  sendMatchHeartbeat,
  releaseMatchLock,
  recordMatchDelivery,
  undoMatchDelivery,
  swapMatchStrike,
  changeMatchBowler,
  substituteMatchPlayer,
  startSecondInnings,
  endMatchSession,
  resetMatchStart,
  MatchSessionData
} from '@/lib/match-service'
import { MatchSetupModal } from './match-scoring/match-setup-modal'
import { WicketModal } from './match-scoring/wicket-modal'
import { BowlerSelectModal } from './match-scoring/bowler-select-modal'
import { PlayerReplaceModal } from './match-scoring/player-replace-modal'
import { InningsSummaryModal } from './match-scoring/innings-summary-modal'
import { FullScorecardTable } from './match-scoring/full-scorecard-table'
import { EndMatchModal } from './match-scoring/end-match-modal'

export function LiveScoringCenter({
  initialMatchId = 'match-1',
  tournamentId = 'turf-titans-2025',
}: {
  initialMatchId?: string
  tournamentId?: string
}) {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [matchId, setMatchId] = useState(initialMatchId)

  // Match session state
  const [session, setSession] = useState<MatchSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'scoring' | 'scorecard'>('scoring')

  // Local Session Lock ID
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`tt_scoring_session_${initialMatchId}`)
      if (stored) return stored
      const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      sessionStorage.setItem(`tt_scoring_session_${initialMatchId}`, newId)
      return newId
    }
    return `sess_${Date.now()}`
  })

  // Modals state
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showWicketModal, setShowWicketModal] = useState(false)
  const [showBowlerModal, setShowBowlerModal] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [showInningsBreakModal, setShowInningsBreakModal] = useState(false)
  const [showEndMatchModal, setShowEndMatchModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)

  // Extras state popup
  const [extraType, setExtraType] = useState<'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE'>('NONE')
  const [additionalRuns, setAdditionalRuns] = useState<number>(0)
  const [showExtrasPanel, setShowExtrasPanel] = useState(false)

  // Async Action state
  const [actionLoading, setActionLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Polling interval & Heartbeat ref
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync initialMatchId when prop changes
  useEffect(() => {
    if (initialMatchId && initialMatchId !== matchId) {
      setMatchId(initialMatchId)
    }
  }, [initialMatchId, matchId])

  // Load Session Data
  const fetchSession = useCallback(async (quiet = false) => {
    if (!matchId) return
    if (!quiet) setLoading(true)
    setErrorMsg('')
    try {
      const data = await getMatchSession(matchId, sessionId)
      setSession(data)

      // If match is in innings break, prompt for 2nd innings
      if (data?.status === 'INNINGS_BREAK' && data.currentInnings === 1) {
        setShowInningsBreakModal(true)
      } else {
        setShowInningsBreakModal(false)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load match session')
      setSession(null)
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [matchId, sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const isMatchConfigured = Boolean(
    session?.isConfigured ||
    session?.status === 'LIVE' ||
    session?.status === 'INNINGS_BREAK' ||
    session?.status === 'COMPLETED' ||
    session?.status === 'STOPPED' ||
    (session?.innings && session.innings.length > 0 && session.innings[0]?.battingScorecard && session.innings[0].battingScorecard.length > 0)
  )

  // Polling for live updates (every 3 seconds for visitors / view-only, every 8 seconds for active scorer)
  useEffect(() => {
    const isLockedByMe = session?.lock?.sessionId === sessionId && session?.lock?.isLocked
    const intervalMs = isLockedByMe ? 10000 : 3000

    pollTimerRef.current = setInterval(() => {
      fetchSession(true)
    }, intervalMs)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [fetchSession, session?.lock?.isLocked, session?.lock?.sessionId, sessionId])

  // Heartbeat for keeping lock active (every 10s if held by this client)
  useEffect(() => {
    const isLockedByMe = session?.lock?.sessionId === sessionId && session?.lock?.isLocked

    if (isLockedByMe && matchId) {
      heartbeatTimerRef.current = setInterval(async () => {
        try {
          await sendMatchHeartbeat(matchId, sessionId)
        } catch {
          // Lock may have expired
        }
      }, 10000)
    }

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current)
    }
  }, [session?.lock?.isLocked, session?.lock?.sessionId, matchId, sessionId])

  // Handlers
  // Acquire Lock
  const handleAcquireLock = async (steal = false) => {
    if (!isAdmin) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      await acquireMatchLock(matchId, sessionId, steal)
      setStatusMsg('Scoring lock acquired successfully!')
      setTimeout(() => setStatusMsg(''), 3000)
      await fetchSession(true)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to acquire scoring lock')
    } finally {
      setActionLoading(false)
    }
  }

  // Release Lock
  const handleReleaseLock = async () => {
    if (!isAdmin) return
    setActionLoading(true)
    try {
      await releaseMatchLock(matchId, sessionId)
      setStatusMsg('Lock released. Match is now in view-only mode.')
      setTimeout(() => setStatusMsg(''), 3000)
      await fetchSession(true)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to release lock')
    } finally {
      setActionLoading(false)
    }
  }

  // Record Delivery (Runs or Extras)
  const handleRecordBall = async (runs: number, extra = 'NONE', addRuns = 0) => {
    if (!isAdmin) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const updated = await recordMatchDelivery(
        matchId,
        {
          runsOffBat: extra === 'NONE' || extra === 'NO_BALL' ? runs : 0,
          extraType: extra as any,
          additionalRanRuns: addRuns,
          isWicket: false,
        },
        sessionId
      )
      setSession(updated)
      setShowExtrasPanel(false)
      setExtraType('NONE')
      setAdditionalRuns(0)

      // Only prompt bowler modal when an over has genuinely completed
      const currentInningsEvents = updated.innings?.[updated.currentInnings - 1]?.events || []
      const lastEvent: any = currentInningsEvents[currentInningsEvents.length - 1]
      if (lastEvent?.stateSnapshot?.didOverEnd && updated.status === 'LIVE') {
        setShowBowlerModal(true)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error recording delivery')
    } finally {
      setActionLoading(false)
    }
  }

  // Record Wicket
  const handleConfirmWicket = async (dismissalPayload: any) => {
    if (!isAdmin) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const updated = await recordMatchDelivery(
        matchId,
        {
          runsOffBat: 0,
          extraType: 'NONE',
          isWicket: true,
          dismissal: dismissalPayload,
        },
        sessionId
      )
      setSession(updated)
      setShowWicketModal(false)

      const currentInningsEvents = updated.innings?.[updated.currentInnings - 1]?.events || []
      const lastEvent: any = currentInningsEvents[currentInningsEvents.length - 1]
      if (lastEvent?.stateSnapshot?.didOverEnd && updated.status === 'LIVE') {
        setShowBowlerModal(true)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error recording wicket')
    } finally {
      setActionLoading(false)
    }
  }

  // End / Complete Match (Admin Action)
  const handleEndMatch = () => {
    if (!isAdmin) return
    setShowEndMatchModal(true)
  }

  const handleConfirmEndMatch = async (payload: {
    action: 'COMPLETED' | 'STOPPED'
    stoppedReason?: string
    stoppedDetails?: string
  }) => {
    if (!isAdmin) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const updated = await endMatchSession(matchId, payload, sessionId)
      setSession(updated)
      setShowEndMatchModal(false)
      setStatusMsg(
        payload.action === 'STOPPED'
          ? `Match recorded as stopped (${payload.stoppedReason}). Redirecting...`
          : 'Match completed and finalized successfully! Redirecting...'
      )
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}?tab=fixtures`)
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to finalize match')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Undo Delivery
  const handleUndo = async () => {
    if (!isAdmin) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      const updated = await undoMatchDelivery(matchId, sessionId)
      setSession(updated)
      setStatusMsg('Previous delivery reversed')
      setTimeout(() => setStatusMsg(''), 2000)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Cannot undo delivery')
    } finally {
      setActionLoading(false)
    }
  }

  // Swap Strike
  const handleSwapStrike = async () => {
    if (!isAdmin) return
    setActionLoading(true)
    try {
      await swapMatchStrike(matchId, sessionId)
      await fetchSession(true)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change strike')
    } finally {
      setActionLoading(false)
    }
  }

  // Change Bowler
  const handleSelectBowler = async (newBowler: string) => {
    if (!isAdmin) return
    setActionLoading(true)
    try {
      const updated = await changeMatchBowler(matchId, newBowler, sessionId)
      setSession(updated)
      setShowBowlerModal(false)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change bowler')
    } finally {
      setActionLoading(false)
    }
  }

  // Substitute Player
  const handleConfirmSubstitute = async (payload: any) => {
    if (!isAdmin) return
    setActionLoading(true)
    try {
      const updated = await substituteMatchPlayer(matchId, payload, sessionId)
      setSession(updated)
      setShowReplaceModal(false)
      setStatusMsg(`Substituted: ${payload.playerOut} → ${payload.playerIn}`)
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to substitute player')
    } finally {
      setActionLoading(false)
    }
  }

  // Start 2nd Innings
  const handleStartSecondInnings = async (payload: any) => {
    if (!isAdmin) return
    setActionLoading(true)
    try {
      const updated = await startSecondInnings(matchId, payload, sessionId)
      setSession(updated)
      setShowInningsBreakModal(false)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start second innings')
    } finally {
      setActionLoading(false)
    }
  }

  // Reset Match Start (0 balls only)
  const handleResetStart = async () => {
    if (!isAdmin) return
    setActionLoading(true)
    setErrorMsg('')
    try {
      await resetMatchStart(matchId)
      setShowResetConfirmModal(false)
      setStatusMsg('Match reset to UPCOMING. Redirecting to fixtures...')
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}?tab=fixtures`)
      }, 800)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset match start')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#74c004] mx-auto" />
        <p className="text-slate-400 text-sm">Loading Match Center...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <div className="rounded-3xl border border-white/10 bg-[#0f182e] p-10 space-y-4 shadow-xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#74c004]/10 border border-[#74c004]/30 text-[#74c004]">
            <Radio className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black uppercase text-white">
              No Active Match Selected
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {errorMsg || 'Select an upcoming or live match from the Fixtures & Schedule tab to begin or view live scoring.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/scoring"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase text-xs px-5 py-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Live Matches List</span>
            </Link>
            <Link
              href={`/tournaments/${tournamentId}?tab=fixtures`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-6 py-3 transition-colors shadow-lg cursor-pointer"
            >
              <span>View Fixtures & Schedule</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // IF MATCH IS NOT YET CONFIGURED / SETUP
  if (!isMatchConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
        <div className="rounded-2xl bg-[#0b1329] border border-white/10 p-8 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#74c004]/10 border border-[#74c004]/30 text-[#74c004]">
            <Trophy className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#74c004]">
              {session?.groupName || 'Group Stage'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-white">
              {session?.team1} <span className="text-[#74c004]">vs</span> {session?.team2}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This fixture is scheduled and upcoming. Match configuration and toss have not yet been recorded.
            </p>
          </div>

          {isAdmin ? (
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-8 py-3.5 shadow-lg shadow-[#74c004]/20 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>START MATCH & SETUP TOSS</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 pt-2">
              Waiting for match administrators to initialize squads and toss.
            </div>
          )}
        </div>

        {showSetupModal && (
          <MatchSetupModal
            matchId={matchId}
            team1={session?.team1 || 'Team 1'}
            team2={session?.team2 || 'Team 2'}
            team1AvailablePlayers={session?.team1AvailablePlayers || []}
            team2AvailablePlayers={session?.team2AvailablePlayers || []}
            onClose={() => setShowSetupModal(false)}
            onSuccess={(newSession, newSessionId) => {
              setSession(newSession)
              if (newSessionId) {
                setSessionId(newSessionId)
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(`tt_scoring_session_${matchId}`, newSessionId)
                }
              }
              setShowSetupModal(false)
            }}
          />
        )}
      </div>
    )
  }

  // ACTIVE LIVE SESSION METRICS
  const live = session.liveState
  const currentInningsData = session.innings[session.currentInnings - 1]
  const currentStrikerCard = currentInningsData?.battingScorecard?.find(
    (b) => b.playerName.toLowerCase() === live.striker.toLowerCase()
  )
  const currentNonStrikerCard = currentInningsData?.battingScorecard?.find(
    (b) => b.playerName.toLowerCase() === live.nonStriker.toLowerCase()
  )
  const currentBowlerCard = currentInningsData?.bowlingScorecard?.find(
    (b) => b.playerName.toLowerCase() === live.currentBowler.toLowerCase()
  )

  const isCompleted = session.status === 'COMPLETED'
  const isStopped = session.status === 'STOPPED'
  const isLockedByOther = session.isLockedByOther
  const isLockHeldByMe = session.isLockHeldByMe

  const totalOvers = session.config.totalOvers || 5
  const totalBallsQuota = totalOvers * 6
  const ballsRemaining = Math.max(0, totalBallsQuota - live.legalBalls)
  const runsNeeded = session.target && session.target > 0 ? Math.max(0, session.target - live.runs) : 0
  const crr = live.legalBalls > 0 ? ((live.runs / live.legalBalls) * 6).toFixed(2) : '0.00'
  const rrr =
    session.currentInnings === 2 && session.target && ballsRemaining > 0
      ? ((runsNeeded / ballsRemaining) * 6).toFixed(2)
      : '0.00'

  const activeBattingSquad =
    live.battingTeam.toLowerCase() === session.team1Squad.teamName.toLowerCase()
      ? session.team1Squad.playing
      : session.team2Squad.playing
  const activeBowlingSquad =
    live.bowlingTeam.toLowerCase() === session.team1Squad.teamName.toLowerCase()
      ? session.team1Squad.playing
      : session.team2Squad.playing

  const dismissedBatsmen =
    currentInningsData?.battingScorecard?.filter((b) => b.isOut).map((b) => b.playerName) || []

  // Total deliveries recorded in the entire match session across all innings
  const totalDeliveriesCount = (session.innings || []).reduce(
    (acc, inn) => acc + (inn.events?.length || 0),
    0
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* 1. MATCH HEADER & LIVE BANNER */}
      <div className="rounded-2xl bg-[#0b1329] border border-white/10 p-5 sm:p-6 space-y-5 shadow-xl">
        {/* Top bar: Tournament, Group, Lock status & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Clear Exit / Back Button */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => router.push(`/tournaments/${tournamentId}?tab=fixtures`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Exit scoring and return to fixture management"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Exit Scoring</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/scoring')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Return to Live Matches list"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Live Matches</span>
              </button>
            )}

            <span className="rounded-md bg-[#74c004]/10 border border-[#74c004]/30 px-2 py-0.5 text-[10px] font-black uppercase text-[#74c004]">
              {session.groupName}
            </span>
            <span className="text-slate-400 font-semibold">• Match {session.matchId}</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 font-bold hidden sm:inline">
              {session.config.totalOvers} Overs Turf Match
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-1 text-[11px] font-black uppercase text-sky-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Match Completed
              </span>
            ) : isStopped ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-[11px] font-black uppercase text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                Match Stopped
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-[11px] font-black uppercase text-red-400 animate-pulse">
                <Radio className="h-3.5 w-3.5" />
                LIVE (Inn {session.currentInnings})
              </span>
            )}

            {/* Lock Badge */}
            {isAdmin && !isCompleted && !isStopped && (
              <>
                {isLockHeldByMe ? (
                  <button
                    type="button"
                    onClick={handleReleaseLock}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    title="Click to release scoring lock"
                  >
                    <UserCheck className="h-3 w-3" />
                    <span>Scoring: You</span>
                  </button>
                ) : isLockedByOther ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">
                      <Lock className="h-3 w-3" />
                      <span>Locked by {session.lockedByAdminName || 'Admin'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAcquireLock(true)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Steal Lock
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAcquireLock(false)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#74c004]/20 border border-[#74c004]/40 px-2.5 py-1 text-[10px] font-bold uppercase text-[#74c004] hover:bg-[#74c004]/30 transition-colors cursor-pointer"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Take Scoring Control</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Big Live Score Numbers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {live.battingTeam} Batting
              </span>
              <span className="text-xs text-slate-500">vs {live.bowlingTeam}</span>
            </div>

            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-white">
                {live.runs} <span className="text-2xl sm:text-4xl text-slate-400">/ {live.wickets}</span>
              </h1>
              <span className="text-lg sm:text-2xl font-bold text-slate-300">
                ({live.oversDisplay} / {totalOvers} ov)
              </span>
            </div>

            {/* Target & Equation */}
            {session.currentInnings === 2 && session.target ? (
              <div className="text-xs sm:text-sm font-bold text-[#74c004] flex flex-wrap items-center gap-2">
                <span>
                  Target: {session.target} runs • Need {runsNeeded} runs in {ballsRemaining} balls
                </span>
                <span className="text-slate-400 font-normal">
                  (CRR: {crr} • RRR: {rrr})
                </span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-400">
                CRR: <strong className="text-white">{crr}</strong> • Max Overs:{' '}
                <strong className="text-white">{totalOvers}.0</strong>
              </div>
            )}
          </div>

          {/* Recent Deliveries Telemetry Chips */}
          <div className="lg:col-span-5 space-y-2 lg:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Recent Balls (Current Innings)
            </span>
            <div className="flex flex-wrap items-center lg:justify-end gap-1.5">
              {live.recentBalls && live.recentBalls.length > 0 ? (
                [...live.recentBalls.slice(0, 8)].reverse().map((chip, idx) => {
                  const isWkt = chip.includes('W')
                  const isFour = chip === '4'
                  const isSix = chip === '6'
                  const isExtra = chip.includes('Wd') || chip.includes('Nb') || chip.includes('B') || chip.includes('Lb')

                  return (
                    <span
                      key={idx}
                      className={`flex h-8 min-w-8 px-2 items-center justify-center rounded-lg text-xs font-black uppercase transition-transform ${
                        isWkt
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                          : isSix
                          ? 'bg-[#74c004] text-[#080e1e] shadow-md shadow-[#74c004]/30 scale-105'
                          : isFour
                          ? 'bg-amber-400 text-[#080e1e]'
                          : isExtra
                          ? 'bg-purple-500/30 border border-purple-500/50 text-purple-200'
                          : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      {chip}
                    </span>
                  )
                })
              ) : (
                <span className="text-xs text-slate-500 italic">No balls bowled yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Current Batters & Bowler Quick Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
          {/* Striker */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase text-[#74c004] block">
                Striker 🏏
              </span>
              <span className="font-bold text-white text-sm truncate">{live.striker}</span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-white">
                {currentStrikerCard?.runs || 0}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({currentStrikerCard?.ballsFaced || 0}b • {currentStrikerCard?.fours || 0}x4,{' '}
                {currentStrikerCard?.sixes || 0}x6)
              </span>
            </div>
          </div>

          {/* Non-Striker */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Non-Striker
              </span>
              <span className="font-bold text-white text-sm truncate">{live.nonStriker}</span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-white">
                {currentNonStrikerCard?.runs || 0}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({currentNonStrikerCard?.ballsFaced || 0}b • {currentNonStrikerCard?.fours || 0}x4,{' '}
                {currentNonStrikerCard?.sixes || 0}x6)
              </span>
            </div>
          </div>

          {/* Bowler */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase text-red-400 block">
                Bowler ⚡
              </span>
              <span className="font-bold text-white text-sm truncate">{live.currentBowler}</span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-[#74c004]">
                {currentBowlerCard?.wickets || 0} / {currentBowlerCard?.runsConceded || 0}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({currentBowlerCard?.oversBowled || '0.0'} ov • {currentBowlerCard?.dotBalls || 0} dots)
              </span>
            </div>
          </div>
        </div>

        {/* Match Result Banner if Completed */}
        {isCompleted && session.result && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-emerald-400">
              <Trophy className="h-4 w-4" />
              <span>Match Result</span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-black text-white">
              {session.result.isTie
                ? 'Match Tied!'
                : `${session.result.winnerTeam} ${session.result.margin}`}
            </h3>
          </div>
        )}

        {/* Match Stopped Banner */}
        {isStopped && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-red-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Match Stopped</span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-black text-white">
              {session.stoppedReason || 'Match Stopped'}{session.stoppedDetails ? ` — ${session.stoppedDetails}` : ''}
            </h3>
            <p className="text-xs text-slate-400">
              This match was halted before completion. All recorded deliveries and player stats are preserved.
            </p>
          </div>
        )}
      </div>

      {/* 2. TAB SWITCHER (Scoring Controls vs Full Scorecard) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'scoring'
                ? 'bg-[#74c004] text-[#080e1e] shadow-md shadow-[#74c004]/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Live Scoring Controls
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'scorecard'
                ? 'bg-[#74c004] text-[#080e1e] shadow-md shadow-[#74c004]/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Full Scorecard
          </button>
        </div>

        {/* Status / Error Toast */}
        <div className="text-xs">
          {statusMsg && <span className="text-[#74c004] font-semibold">{statusMsg}</span>}
          {errorMsg && <span className="text-red-400 font-semibold">{errorMsg}</span>}
        </div>
      </div>

      {/* 3. SCORING KEYPAD & ACTIONS (IF SCORING TAB) */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          {/* Status Banners */}
          {isCompleted ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-[#74c004] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">This match has ended.</h4>
                  <p className="text-slate-400">
                    {session.result?.winnerTeam
                      ? `${session.result.winnerTeam} ${session.result.margin}`
                      : 'Final scores are saved. View detailed stats in the Full Scorecard tab.'}
                  </p>
                </div>
              </div>
              <div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/tournaments/${tournamentId}?tab=fixtures`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Return to Fixtures</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/scoring')}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Live Matches</span>
                  </button>
                )}
              </div>
            </div>
          ) : isStopped ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-red-200">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-red-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">MATCH STOPPED</h4>
                  <p className="text-red-300 font-medium mt-0.5">
                    Reason: {session.stoppedReason || 'Match Halted'}
                    {session.stoppedDetails ? ` — ${session.stoppedDetails}` : ''}
                  </p>
                </div>
              </div>
              <div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/tournaments/${tournamentId}?tab=fixtures`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Return to Fixtures</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/scoring')}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Live Matches</span>
                  </button>
                )}
              </div>
            </div>
          ) : !isAdmin ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#74c004]" />
                <span>You are in live spectator mode. Real-time scores update automatically.</span>
              </div>
            </div>
          ) : isLockedByOther ? (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <span>
                  Match is currently active and locked by {session.lockedByAdminName || 'another administrator'}.
                </span>
              </div>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAcquireLock(true)}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 text-[#080e1e] px-4 py-2 font-bold uppercase text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Take Scoring Control
              </button>
            </div>
          ) : null}

          {/* ADMIN ACTIVE SCORING PAD */}
          {isAdmin && !isCompleted && !isStopped && (
            <div className="space-y-6">
              {/* PRIMARY RUNS BUTTONS (0 - 7) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Runs (Off Bat)
                  </span>
                  <span className="text-[10px] text-slate-500">Click to record runs on current ball</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRecordBall(num, 'NONE', 0)}
                      className={`h-16 rounded-2xl font-display font-black text-xl flex flex-col items-center justify-center border transition-all cursor-pointer disabled:opacity-50 ${
                        num === 4
                          ? 'bg-amber-400/20 hover:bg-amber-400/30 border-amber-400 text-amber-300 shadow-md shadow-amber-400/10'
                          : num === 6
                          ? 'bg-[#74c004]/20 hover:bg-[#74c004]/30 border-[#74c004] text-[#74c004] shadow-md shadow-[#74c004]/10'
                          : num === 0
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                          : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                      }`}
                    >
                      <span>{num === 0 ? '• 0' : num}</span>
                      <span className="text-[9px] font-bold tracking-tight opacity-75">
                        {num === 0 ? 'DOT' : num === 4 ? 'FOUR' : num === 6 ? 'SIX' : 'RUN'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECONDARY ROW: EXTRAS & WICKETS */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                {/* WICKET BUTTON */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowWicketModal(true)}
                  className="col-span-2 sm:col-span-2 h-14 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-display font-black uppercase text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-red-500/10"
                >
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  <span>OUT / WICKET</span>
                </button>

                {/* WIDE */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setExtraType('WIDE')
                    setAdditionalRuns(0)
                    setShowExtrasPanel(true)
                  }}
                  className="h-14 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold uppercase text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  Wide (Wd)
                </button>

                {/* NO BALL */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setExtraType('NO_BALL')
                    setAdditionalRuns(0)
                    setShowExtrasPanel(true)
                  }}
                  className="h-14 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold uppercase text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  No Ball (Nb)
                </button>

                {/* BYE */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setExtraType('BYE')
                    setAdditionalRuns(1)
                    setShowExtrasPanel(true)
                  }}
                  className="h-14 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-slate-300 font-bold uppercase text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  Bye (B)
                </button>

                {/* LEG BYE */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setExtraType('LEG_BYE')
                    setAdditionalRuns(1)
                    setShowExtrasPanel(true)
                  }}
                  className="h-14 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-slate-300 font-bold uppercase text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  Leg Bye (Lb)
                </button>
              </div>

              {/* EXTRAS RUNS SUB-PANEL (If Wide/Nb/Bye/Leg Bye clicked) */}
              {showExtrasPanel && (
                <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300 uppercase">
                      Configure Extra Delivery: <strong className="text-white font-black">{extraType === 'NO_BALL' ? 'NO BALL (NB)' : extraType}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowExtrasPanel(false)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 block">
                      {extraType === 'NO_BALL'
                        ? 'Runs scored off bat on this No-Ball (Penalty +1 is automatically added to innings total):'
                        : extraType === 'WIDE'
                        ? 'Additional ran runs on Wide (Penalty +1 is automatically added):'
                        : 'Runs taken on Bye / Leg Bye:'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setAdditionalRuns(r)}
                          className={`h-10 min-w-14 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                            additionalRuns === r
                              ? 'bg-[#74c004] text-[#080e1e] border-[#74c004] font-black shadow-md shadow-[#74c004]/20'
                              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {extraType === 'NO_BALL' ? `NB + ${r} (${r + 1} runs)` : `+${r}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowExtrasPanel(false)}
                      className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRecordBall(additionalRuns, extraType, additionalRuns)}
                      className="rounded-xl bg-[#74c004] hover:bg-[#63a503] px-6 py-2 text-xs font-black uppercase text-[#080e1e] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {extraType === 'NO_BALL'
                        ? `Confirm No Ball (+${additionalRuns} bat = ${additionalRuns + 1} total)`
                        : `Confirm ${extraType} (+${additionalRuns})`}
                    </button>
                  </div>
                </div>
              )}

              {/* CONTROL UTILITIES: UNDO / RESET START, CHANGE STRIKE, CHANGE BOWLER, SUBSTITUTE, END MATCH */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {/* ZERO DELIVERIES: UNDO / RESET START */}
                {totalDeliveriesCount === 0 ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowResetConfirmModal(true)}
                    className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Undo Match Start: Fixture will revert to UPCOMING (0 balls bowled)"
                  >
                    <Undo2 className="h-4 w-4" />
                    <span>Reset Start (0b)</span>
                  </button>
                ) : (
                  /* >= 1 DELIVERIES: NORMAL UNDO LAST BALL ONLY */
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleUndo}
                    className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Revert the last recorded delivery event"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>UNDO Ball</span>
                  </button>
                )}

                {/* SWAP STRIKE */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSwapStrike}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4 text-[#74c004]" />
                  <span>Swap Strike</span>
                </button>

                {/* CHANGE BOWLER */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowBowlerModal(true)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Shield className="h-4 w-4 text-red-400" />
                  <span>Change Bowler</span>
                </button>

                {/* REPLACE PLAYER / SUBSTITUTE */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowReplaceModal(true)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>Substitute</span>
                </button>

                {/* END MATCH */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleEndMatch}
                  className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Complete or Stop Match"
                >
                  <Flag className="h-4 w-4 text-red-400" />
                  <span>End Match</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. FULL SCORECARD (IF SCORECARD TAB) */}
      {activeTab === 'scorecard' && <FullScorecardTable session={session} />}

      {/* MODALS */}
      {showEndMatchModal && (
        <EndMatchModal
          loading={actionLoading}
          onClose={() => setShowEndMatchModal(false)}
          onConfirm={handleConfirmEndMatch}
        />
      )}

      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0b1329] border border-red-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase">Undo Match Start</h3>
                <span className="text-xs text-red-300/80">0 deliveries recorded</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to reset this match? Because no balls have been bowled yet, the active match session will be removed and the fixture will revert to <strong>UPCOMING</strong> so it can be re-configured and started when ready.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleResetStart}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm & Reset Fixture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showWicketModal && (
        <WicketModal
          striker={live.striker}
          nonStriker={live.nonStriker}
          bowler={live.currentBowler}
          battingSquad={activeBattingSquad}
          bowlingSquad={activeBowlingSquad}
          dismissedBatsmen={dismissedBatsmen}
          onClose={() => setShowWicketModal(false)}
          onConfirmWicket={handleConfirmWicket}
        />
      )}

      {showBowlerModal && (
        <BowlerSelectModal
          currentBowler={live.currentBowler}
          bowlingSquad={activeBowlingSquad}
          bowlingScorecard={currentInningsData?.bowlingScorecard || []}
          maxOversPerBowler={session.config.maxOversPerBowler}
          isBowlingLimitStrict={session.config.isBowlingLimitStrict}
          onClose={() => setShowBowlerModal(false)}
          onSelectBowler={handleSelectBowler}
        />
      )}

      {showReplaceModal && (
        <PlayerReplaceModal
          team1Squad={session.team1Squad}
          team2Squad={session.team2Squad}
          onClose={() => setShowReplaceModal(false)}
          onConfirmReplace={handleConfirmSubstitute}
        />
      )}

      {showInningsBreakModal && (
        <InningsSummaryModal
          session={session}
          onStartSecondInnings={handleStartSecondInnings}
        />
      )}
    </div>
  )
}
