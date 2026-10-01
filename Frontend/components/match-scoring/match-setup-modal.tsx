'use client'

import { useState, useMemo } from 'react'
import {
  X,
  Trophy,
  Users,
  Shield,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react'
import { PlayerInfo, TeamSquad, setupMatch } from '@/lib/match-service'

interface MatchSetupModalProps {
  matchId: string
  team1: string
  team2: string
  team1Logo?: string | null
  team2Logo?: string | null
  team1AvailablePlayers: PlayerInfo[]
  team2AvailablePlayers: PlayerInfo[]
  onClose: () => void
  onSuccess: (sessionData: any, sessionId: string) => void
}

export function MatchSetupModal({
  matchId,
  team1,
  team2,
  team1Logo,
  team2Logo,
  team1AvailablePlayers,
  team2AvailablePlayers,
  onClose,
  onSuccess,
}: MatchSetupModalProps) {
  // Step in wizard: 1 = Config, 2 = Squads, 3 = Toss & Openers
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const defaultPlayersCount = Math.min(
    team1AvailablePlayers.length >= 10 && team2AvailablePlayers.length >= 10 ? 10 : 7,
    Math.max(2, Math.min(team1AvailablePlayers.length, team2AvailablePlayers.length))
  )

  // 1. Config State
  const [totalOvers, setTotalOvers] = useState(5)
  const [playersPerSide, setPlayersPerSide] = useState(defaultPlayersCount || 10)
  const [maxOversPerBowler, setMaxOversPerBowler] = useState(1)
  const [isBowlingLimitStrict, setIsBowlingLimitStrict] = useState(true)

  // 2. Squad Selection State (default to non-substitutes first, up to playersPerSide)
  const [team1Playing, setTeam1Playing] = useState<string[]>(() => {
    const nonSubs = team1AvailablePlayers.filter((p) => !p.isSubstitute).map((p) => p.name)
    if (nonSubs.length >= (defaultPlayersCount || 10)) {
      return nonSubs.slice(0, defaultPlayersCount || 10)
    }
    return team1AvailablePlayers.slice(0, defaultPlayersCount || 10).map((p) => p.name)
  })

  const [team2Playing, setTeam2Playing] = useState<string[]>(() => {
    const nonSubs = team2AvailablePlayers.filter((p) => !p.isSubstitute).map((p) => p.name)
    if (nonSubs.length >= (defaultPlayersCount || 10)) {
      return nonSubs.slice(0, defaultPlayersCount || 10)
    }
    return team2AvailablePlayers.slice(0, defaultPlayersCount || 10).map((p) => p.name)
  })

  // 3. Toss & Openers State
  const [tossWinner, setTossWinner] = useState(team1)
  const [tossElected, setTossElected] = useState<'BAT' | 'BOWL'>('BAT')

  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const [openingBowler, setOpeningBowler] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Determine Batting & Bowling First teams from Toss
  const { battingTeam, bowlingTeam } = useMemo(() => {
    let bat = ''
    let bowl = ''
    if (tossWinner.toLowerCase() === team1.toLowerCase()) {
      bat = tossElected === 'BAT' ? team1 : team2
      bowl = tossElected === 'BAT' ? team2 : team1
    } else {
      bat = tossElected === 'BAT' ? team2 : team1
      bowl = tossElected === 'BAT' ? team1 : team2
    }
    return { battingTeam: bat, bowlingTeam: bowl }
  }, [tossWinner, tossElected, team1, team2])

  // Get active playing squads based on selection
  const battingSquadPlaying = useMemo(() => {
    return battingTeam.toLowerCase() === team1.toLowerCase() ? team1Playing : team2Playing
  }, [battingTeam, team1, team1Playing, team2Playing])

  const bowlingSquadPlaying = useMemo(() => {
    return bowlingTeam.toLowerCase() === team1.toLowerCase() ? team1Playing : team2Playing
  }, [bowlingTeam, team1, team1Playing, team2Playing])

  // Toggle player in squad
  const handleToggleTeam1 = (playerName: string) => {
    if (team1Playing.includes(playerName)) {
      setTeam1Playing(team1Playing.filter((n) => n !== playerName))
    } else {
      setTeam1Playing([...team1Playing, playerName])
    }
  }

  const handleToggleTeam2 = (playerName: string) => {
    if (team2Playing.includes(playerName)) {
      setTeam2Playing(team2Playing.filter((n) => n !== playerName))
    } else {
      setTeam2Playing([...team2Playing, playerName])
    }
  }

  // Handle Submit & Start Match
  const handleStartMatch = async () => {
    setErrorMsg('')
    if (!striker || !nonStriker || !openingBowler) {
      setErrorMsg('Please select Striker, Non-striker, and Opening Bowler')
      return
    }
    if (striker.toLowerCase() === nonStriker.toLowerCase()) {
      setErrorMsg('Striker and Non-striker cannot be the same player')
      return
    }

    // Build Squad Objects
    const team1PlayingObjs: PlayerInfo[] = team1AvailablePlayers.filter((p) =>
      team1Playing.includes(p.name)
    )
    const team1SubObjs: PlayerInfo[] = team1AvailablePlayers.filter(
      (p) => !team1Playing.includes(p.name)
    )

    const team2PlayingObjs: PlayerInfo[] = team2AvailablePlayers.filter((p) =>
      team2Playing.includes(p.name)
    )
    const team2SubObjs: PlayerInfo[] = team2AvailablePlayers.filter(
      (p) => !team2Playing.includes(p.name)
    )

    setLoading(true)
    try {
      const generatedSessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`
      const response = await setupMatch(matchId, {
        config: {
          totalOvers: Number(totalOvers),
          playersPerSide: Number(playersPerSide),
          maxOversPerBowler: Number(maxOversPerBowler),
          isBowlingLimitStrict,
        },
        team1Squad: {
          teamName: team1,
          playing: team1PlayingObjs,
          substitutes: team1SubObjs,
        },
        team2Squad: {
          teamName: team2,
          playing: team2PlayingObjs,
          substitutes: team2SubObjs,
        },
        toss: {
          wonBy: tossWinner,
          electedTo: tossElected,
        },
        openers: {
          striker,
          nonStriker,
          openingBowler,
        },
        sessionId: generatedSessionId,
      })

      onSuccess(response.session, response.sessionId || generatedSessionId)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start match. Please check squad configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b1329] border border-white/10 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#74c004]/10 border border-[#74c004]/30 px-2 py-0.5 text-[10px] font-black uppercase text-[#74c004]">
                Match Setup
              </span>
              <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <div className="flex items-center gap-2">
                {team1Logo ? (
                  <img
                    src={team1Logo}
                    alt={team1}
                    className="h-6 w-6 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white text-[9px] font-bold shrink-0">
                    {team1.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xl font-display font-black uppercase text-white">{team1}</span>
              </div>
              <span className="text-[#74c004] font-black text-sm">vs</span>
              <div className="flex items-center gap-2">
                {team2Logo ? (
                  <img
                    src={team2Logo}
                    alt={team2}
                    className="h-6 w-6 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white text-[9px] font-bold shrink-0">
                    {team2.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xl font-display font-black uppercase text-white">{team2}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: MATCH CONFIGURATION */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              1. Match Overs & Field Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Overs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Total Overs per Side
                </label>
                <select
                  value={totalOvers}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setTotalOvers(val)
                    setMaxOversPerBowler(Math.max(1, Math.ceil(val / 4)))
                  }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-semibold text-white focus:border-[#74c004] focus:outline-none"
                >
                  <option value={3} className="bg-[#0b1329]">3 Overs (Super Quick)</option>
                  <option value={5} className="bg-[#0b1329]">5 Overs (Standard Turf)</option>
                  <option value={6} className="bg-[#0b1329]">6 Overs (Extended Turf)</option>
                  <option value={8} className="bg-[#0b1329]">8 Overs</option>
                  <option value={10} className="bg-[#0b1329]">10 Overs (T10)</option>
                  <option value={20} className="bg-[#0b1329]">20 Overs (T20)</option>
                </select>
              </div>

              {/* Players per Side */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Players per Side / on field
                </label>
                <select
                  value={playersPerSide}
                  onChange={(e) => setPlayersPerSide(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-semibold text-white focus:border-[#74c004] focus:outline-none"
                >
                  <option value={5} className="bg-[#0b1329]">5 Players</option>
                  <option value={6} className="bg-[#0b1329]">6 Players</option>
                  <option value={7} className="bg-[#0b1329]">7 Players (Standard Turf)</option>
                  <option value={8} className="bg-[#0b1329]">8 Players</option>
                  <option value={10} className="bg-[#0b1329]">10 Players (10 Main Squad)</option>
                  <option value={11} className="bg-[#0b1329]">11 Players (Full Ground)</option>
                </select>
              </div>

              {/* Max Overs per Bowler */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Max Overs per Bowler
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalOvers}
                  value={maxOversPerBowler}
                  onChange={(e) => setMaxOversPerBowler(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm font-semibold text-white focus:border-[#74c004] focus:outline-none"
                />
              </div>

              {/* Compulsory Limit Toggle */}
              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsBowlingLimitStrict(!isBowlingLimitStrict)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  {isBowlingLimitStrict ? (
                    <CheckSquare className="h-5 w-5 text-[#74c004]" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-500" />
                  )}
                  <span>Enforce Bowling Quota Limit (Strict)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-6 py-3 transition-colors cursor-pointer"
              >
                Next: Select Squads →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PLAYING SQUADS */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                2. Select Playing Squads (Registered 10 Main + 1 Sub)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select {playersPerSide} active players for each team. Remaining players become registered substitutes.
              </p>
            </div>

            {/* Team 1 Squad */}
            <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-2">
                  {team1Logo ? (
                    <img src={team1Logo} alt={team1} className="h-5 w-5 rounded-full object-cover border border-white/20 shrink-0" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#74c004]/20 text-[#74c004] text-[8px] font-bold shrink-0">
                      {team1.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span>{team1}</span>
                </div>
                <span className={team1Playing.length === playersPerSide ? 'text-[#74c004]' : 'text-amber-400'}>
                  Selected: {team1Playing.length} / {playersPerSide}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {team1AvailablePlayers.map((p) => {
                  const isSelected = team1Playing.includes(p.name)
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleToggleTeam1(p.name)}
                      className={`flex items-start justify-between p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#74c004]/20 border-[#74c004] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate space-y-0.5">
                        <span className="truncate block">{p.name}</span>
                        <div className="flex items-center gap-1">
                          {p.role && (
                            <span className="text-[9px] font-normal uppercase text-slate-400">
                              {p.role}
                            </span>
                          )}
                          {p.isSubstitute && (
                            <span className="rounded bg-amber-500/20 text-amber-300 text-[8px] font-black px-1 py-0.2 uppercase">
                              Sub
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[#74c004] shrink-0 mt-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Team 2 Squad */}
            <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className="flex items-center gap-2">
                  {team2Logo ? (
                    <img src={team2Logo} alt={team2} className="h-5 w-5 rounded-full object-cover border border-white/20 shrink-0" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#74c004]/20 text-[#74c004] text-[8px] font-bold shrink-0">
                      {team2.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span>{team2}</span>
                </div>
                <span className={team2Playing.length === playersPerSide ? 'text-[#74c004]' : 'text-amber-400'}>
                  Selected: {team2Playing.length} / {playersPerSide}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {team2AvailablePlayers.map((p) => {
                  const isSelected = team2Playing.includes(p.name)
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleToggleTeam2(p.name)}
                      className={`flex items-start justify-between p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#74c004]/20 border-[#74c004] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate space-y-0.5">
                        <span className="truncate block">{p.name}</span>
                        <div className="flex items-center gap-1">
                          {p.role && (
                            <span className="text-[9px] font-normal uppercase text-slate-400">
                              {p.role}
                            </span>
                          )}
                          {p.isSubstitute && (
                            <span className="rounded bg-amber-500/20 text-amber-300 text-[8px] font-black px-1 py-0.2 uppercase">
                              Sub
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[#74c004] shrink-0 mt-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold uppercase text-xs px-4 py-2.5 transition-colors cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (team1Playing.length < 2 || team2Playing.length < 2) {
                    setErrorMsg('Each team must have at least 2 playing players selected')
                    return
                  }
                  // Auto pick openers if not set
                  if (!striker && battingSquadPlaying[0]) setStriker(battingSquadPlaying[0])
                  if (!nonStriker && battingSquadPlaying[1]) setNonStriker(battingSquadPlaying[1])
                  if (!openingBowler && bowlingSquadPlaying[0]) setOpeningBowler(bowlingSquadPlaying[0])
                  setStep(3)
                }}
                className="rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-6 py-3 transition-colors cursor-pointer"
              >
                Next: Toss & Openers →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TOSS & OPENING PLAYERS */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              3. Toss Decision & Opening Batters / Bowler
            </h3>

            {/* Toss Section */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase text-[#74c004]">Toss Decision</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Toss Won By</label>
                  <select
                    value={tossWinner}
                    onChange={(e) => setTossWinner(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                  >
                    <option value={team1} className="bg-[#0b1329]">{team1}</option>
                    <option value={team2} className="bg-[#0b1329]">{team2}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Elected To</label>
                  <select
                    value={tossElected}
                    onChange={(e) => setTossElected(e.target.value as 'BAT' | 'BOWL')}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                  >
                    <option value="BAT" className="bg-[#0b1329]">BAT (Batting First)</option>
                    <option value="BOWL" className="bg-[#0b1329]">BOWL (Fielding First)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-300 pt-1">
                Batting 1st: <strong className="text-white">{battingTeam}</strong> • Bowling 1st:{' '}
                <strong className="text-white">{bowlingTeam}</strong>
              </div>
            </div>

            {/* Openers Section */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase text-[#74c004]">
                Innings 1 Starting Lineup
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Striker */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Striker ({battingTeam})
                  </label>
                  <select
                    value={striker}
                    onChange={(e) => setStriker(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                  >
                    <option value="">Select Striker</option>
                    {battingSquadPlaying.map((name) => (
                      <option key={name} value={name} className="bg-[#0b1329]">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Non-Striker */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Non-Striker ({battingTeam})
                  </label>
                  <select
                    value={nonStriker}
                    onChange={(e) => setNonStriker(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                  >
                    <option value="">Select Non-Striker</option>
                    {battingSquadPlaying
                      .filter((n) => n !== striker)
                      .map((name) => (
                        <option key={name} value={name} className="bg-[#0b1329]">
                          {name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Opening Bowler */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Opening Bowler ({bowlingTeam})
                  </label>
                  <select
                    value={openingBowler}
                    onChange={(e) => setOpeningBowler(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-2 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                  >
                    <option value="">Select Bowler</option>
                    {bowlingSquadPlaying.map((name) => (
                      <option key={name} value={name} className="bg-[#0b1329]">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold uppercase text-xs px-4 py-2.5 transition-colors cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleStartMatch}
                className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-8 py-3 transition-colors shadow-lg shadow-[#74c004]/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                <span>START MATCH (LIVE)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
