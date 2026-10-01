'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Medal,
  Flame,
  Shield,
  Target,
  RefreshCw,
  Loader2,
  Users,
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react'
import {
  getTournamentLeaderboard,
  getRegisteredTeams,
  RegisteredTeam,
  LeaderboardEntry,
  LeaderboardCategory
} from '@/lib/services'

type StatOption = {
  id: string
  label: string
  valueHeader: string
}

const STATISTIC_OPTIONS: Record<LeaderboardCategory, StatOption[]> = {
  batting: [
    { id: 'top_run_scorer', label: 'Top Run Scorer', valueHeader: 'Runs' },
    { id: 'highest_individual_score', label: 'Highest Individual Score', valueHeader: 'HS' },
    { id: 'highest_strike_rate', label: 'Highest Strike Rate (Min 15 Balls)', valueHeader: 'Strike Rate' },
    { id: 'highest_batting_average', label: 'Highest Batting Average', valueHeader: 'Average' },
    { id: 'most_sixes', label: 'Most Sixes', valueHeader: 'Sixes (6s)' },
    { id: 'most_fours', label: 'Most Fours', valueHeader: 'Fours (4s)' },
    { id: 'most_fifties', label: 'Most Fifties (50s)', valueHeader: '50s' },
    { id: 'most_centuries', label: 'Most Centuries (100s)', valueHeader: '100s' },
  ],
  bowling: [
    { id: 'most_wickets', label: 'Most Wickets', valueHeader: 'Wickets' },
    { id: 'best_bowling_average', label: 'Best Bowling Average (Min 2 Wkts)', valueHeader: 'Average' },
    { id: 'best_economy', label: 'Best Economy (Min 2 Overs)', valueHeader: 'Economy' },
    { id: 'best_bowling_strike_rate', label: 'Best Bowling Strike Rate (Min 2 Wkts)', valueHeader: 'Strike Rate' },
    { id: 'highest_wickets_in_an_innings', label: 'Highest Wickets in an Innings', valueHeader: 'Best Figures' },
    { id: 'most_maiden_overs', label: 'Most Maiden Overs', valueHeader: 'Maidens' },
    { id: 'most_dot_balls', label: 'Most Dot Balls', valueHeader: 'Dot Balls' },
  ],
  fielding: [
    { id: 'most_dismissals', label: 'Most Dismissals', valueHeader: 'Dismissals' },
    { id: 'most_catches', label: 'Most Catches', valueHeader: 'Catches' },
    { id: 'most_stumpings', label: 'Most Stumpings', valueHeader: 'Stumpings' },
    { id: 'most_run_outs', label: 'Most Run Outs (Direct)', valueHeader: 'Run Outs' },
    { id: 'most_assisted_run_outs', label: 'Most Assisted Run Outs', valueHeader: 'Assisted' },
    { id: 'best_wicket_keeper', label: 'Best Wicket Keeper', valueHeader: 'WK Dismissals' },
  ],
  mvp: [
    { id: 'impact_score', label: 'Tournament Impact Score (MVP)', valueHeader: 'Impact Pts' },
  ],
}

export function LeaderboardView({ tournamentId = 'turf-titans-2025' }: { tournamentId?: string }) {
  const [category, setCategory] = useState<LeaderboardCategory>('batting')
  const [statistic, setStatistic] = useState<string>('top_run_scorer')
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL')

  const [standings, setStandings] = useState<LeaderboardEntry[]>([])
  const [registeredTeams, setRegisteredTeams] = useState<RegisteredTeam[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch registered teams on mount
  useEffect(() => {
    getRegisteredTeams(tournamentId)
      .then((data) => setRegisteredTeams(data || []))
      .catch(() => setRegisteredTeams([]))
  }, [tournamentId])

  // Reset statistic when category changes
  const handleCategoryChange = (newCat: LeaderboardCategory) => {
    setCategory(newCat)
    const firstOption = STATISTIC_OPTIONS[newCat][0]?.id || ''
    setStatistic(firstOption)
  }

  // Load leaderboard data
  const loadLeaderboard = useCallback(() => {
    setLoading(true)
    getTournamentLeaderboard(tournamentId, {
      category,
      statistic,
      team: selectedTeam,
    })
      .then((res) => {
        setStandings(res?.standings || [])
      })
      .catch(() => setStandings([]))
      .finally(() => setLoading(false))
  }, [tournamentId, category, statistic, selectedTeam])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  const currentStatObj = STATISTIC_OPTIONS[category]?.find((s) => s.id === statistic) || STATISTIC_OPTIONS[category][0]

  // Top 3 Leader Highlights
  const top1 = standings[0]
  const top2 = standings[1]
  const top3 = standings[2]

  return (
    <div className="w-full bg-[#080e1e] text-slate-100 min-h-screen pb-20">
      
      {/* 1. HERO HEADER */}
      <div className="w-full border-b border-white/10 bg-[#070c1a] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#74c004]">
                  OFFICIAL TOURNAMENT LEADERBOARD • 2025
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white leading-tight">
                PLAYER STATS & <span className="text-[#74c004]">IMPACT RANKINGS</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium pt-1">
                Certified individual performance statistics across Batting, Bowling, Fielding and MVP Impact standings.
              </p>
            </div>

            {/* Quick Refresh & Stats Sync */}
            <div className="lg:col-span-4 flex justify-start lg:justify-end items-center gap-3">
              <button
                type="button"
                onClick={loadLeaderboard}
                className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#74c004] ${loading ? 'animate-spin' : ''}`} />
                <span>SYNC LIVE STATS</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 2. CONTROLS: CATEGORY TABS + 2 DROPDOWNS ONLY */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Category Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/10">
          {[
            { id: 'batting', label: 'Batting', icon: Zap },
            { id: 'bowling', label: 'Bowling', icon: Target },
            { id: 'fielding', label: 'Fielding', icon: Shield },
            { id: 'mvp', label: 'MVP / Impact', icon: Flame },
          ].map((cat) => {
            const Icon = cat.icon
            const isActive = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as LeaderboardCategory)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#74c004] text-[#080e1e] shadow-[0_0_15px_rgba(116,192,4,0.3)]'
                    : 'bg-[#0f182e] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#080e1e]' : 'text-[#74c004]'}`} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* 2 DROPDOWNS BAR: TEAM DROPDOWN & STATISTIC DROPDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Dropdown 1: Team Filter */}
          <div className="space-y-1.5">
            <label htmlFor="team-select" className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Filter by Team
            </label>
            <div className="relative">
              <select
                id="team-select"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f182e] px-4 py-2.5 text-xs font-bold text-white uppercase focus:border-[#74c004] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="ALL">All Teams (Tournament Wide)</option>
                {registeredTeams.map((t) => (
                  <option key={t.teamName} value={t.teamName}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dropdown 2: Single Dynamic Statistic Dropdown */}
          <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
            <label htmlFor="stat-select" className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Selected Statistic
            </label>
            <div className="relative">
              <select
                id="stat-select"
                value={statistic}
                onChange={(e) => setStatistic(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f182e] px-4 py-2.5 text-xs font-bold text-white uppercase focus:border-[#74c004] focus:outline-none transition-colors cursor-pointer"
              >
                {STATISTIC_OPTIONS[category]?.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

      </div>

      {/* 3. PODIUM LEADERS CARDS (TOP 3) */}
      {!loading && standings.length > 0 && standings.some((s) => s.value > 0) && (
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div className="order-2 md:order-1 rounded-2xl border border-slate-400/20 bg-[#0f182e] p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-400/10 border border-slate-400/30 flex items-center justify-center font-black text-slate-300 font-display">
                    #2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white uppercase truncate max-w-[140px]">{top2.player}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{top2.team}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-xl text-slate-200">{top2.displayValue}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">{currentStatObj?.valueHeader}</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold / Leader) */}
            {top1 && (
              <div className="order-1 md:order-2 rounded-2xl border border-[#74c004]/40 bg-gradient-to-br from-[#74c004]/10 to-[#0f182e] p-5 flex items-center justify-between shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-[#74c004]/20 border border-[#74c004] flex items-center justify-center font-black text-[#74c004] text-lg font-display">
                    <Trophy className="h-6 w-6 text-[#74c004]" />
                  </div>
                  <div>
                    <span className="rounded bg-[#74c004]/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-[#74c004] inline-block mb-1">
                      LEADER #1
                    </span>
                    <h3 className="font-bold text-base text-white uppercase truncate max-w-[160px]">{top1.player}</h3>
                    <span className="text-xs text-slate-300 font-semibold">{top1.team}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-2xl text-[#74c004]">{top1.displayValue}</span>
                  <span className="text-[10px] font-black uppercase text-slate-300 block">{currentStatObj?.valueHeader}</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div className="order-3 rounded-2xl border border-amber-600/20 bg-[#0f182e] p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center font-black text-amber-500 font-display">
                    #3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white uppercase truncate max-w-[140px]">{top3.player}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{top3.team}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-xl text-amber-500">{top3.displayValue}</span>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">{currentStatObj?.valueHeader}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. MAIN STANDINGS TABLE */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full bg-[#74c004]" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                {currentStatObj?.label} STANDINGS
              </h2>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-slate-300">
                {standings.length} CONTENDERS
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase text-slate-400">
                  <th className="pb-3 pl-2">RANK</th>
                  <th className="pb-3">PLAYER / SQUAD</th>
                  <th className="pb-3 text-right text-[#74c004]">{currentStatObj?.valueHeader}</th>
                  
                  {/* Category-specific Supporting Columns */}
                  {category === 'batting' && (
                    <>
                      <th className="pb-3 text-center">INNS</th>
                      <th className="pb-3 text-center">RUNS</th>
                      <th className="pb-3 text-center">BALLS</th>
                      <th className="pb-3 text-center">4s</th>
                      <th className="pb-3 text-center">6s</th>
                      <th className="pb-3 text-center">SR</th>
                      <th className="pb-3 text-right pr-2">AVG</th>
                    </>
                  )}

                  {category === 'bowling' && (
                    <>
                      <th className="pb-3 text-center">OVERS</th>
                      <th className="pb-3 text-center">RUNS</th>
                      <th className="pb-3 text-center">WKTS</th>
                      <th className="pb-3 text-center">ECON</th>
                      <th className="pb-3 text-center">AVG</th>
                      <th className="pb-3 text-center">MDN</th>
                      <th className="pb-3 text-right pr-2">DOTS</th>
                    </>
                  )}

                  {category === 'fielding' && (
                    <>
                      <th className="pb-3 text-center">CATCHES</th>
                      <th className="pb-3 text-center">STUMPINGS</th>
                      <th className="pb-3 text-center">DIRECT RO</th>
                      <th className="pb-3 text-right pr-2">TOTAL DISMISSALS</th>
                    </>
                  )}

                  {category === 'mvp' && (
                    <>
                      <th className="pb-3 text-center">BATTING IMPACT</th>
                      <th className="pb-3 text-center">BOWLING IMPACT</th>
                      <th className="pb-3 text-center">FIELDING IMPACT</th>
                      <th className="pb-3 text-right pr-2">PRIMARY CONTRIBUTIONS</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="h-6 w-6 text-[#74c004] animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Computing Tournament Leaderboards...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : standings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="h-6 w-6 text-slate-500" />
                        <p className="text-sm font-semibold text-slate-300">
                          No registered player stats available for this selection
                        </p>
                        <p className="text-xs text-slate-500">
                          Player statistics and MVP impact will dynamically compute once certified match scorecards are completed.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  standings.map((entry) => (
                    <tr
                      key={`${entry.team}-${entry.player}`}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors font-medium text-slate-200"
                    >
                      {/* Rank */}
                      <td className="py-3 pl-2 font-mono font-bold">
                        {entry.rank === 1 && <span className="text-[#74c004]">#1</span>}
                        {entry.rank === 2 && <span className="text-slate-300">#2</span>}
                        {entry.rank === 3 && <span className="text-amber-500">#3</span>}
                        {entry.rank > 3 && <span className="text-slate-500">#{entry.rank}</span>}
                      </td>

                      {/* Player & Team */}
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white uppercase flex items-center gap-1.5">
                            {entry.player}
                            {!entry.qualified && (
                              <span className="text-[9px] text-amber-400/80 font-normal">
                                (Unqualified)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{entry.team}</span>
                        </div>
                      </td>

                      {/* Primary Value */}
                      <td className="py-3 text-right font-mono font-black text-sm text-[#74c004]">
                        {entry.displayValue}
                      </td>

                      {/* Supporting Batting */}
                      {category === 'batting' && (
                        <>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.innings ?? 0}</td>
                          <td className="py-3 text-center font-mono font-bold text-white">{entry.supporting.runs ?? 0}</td>
                          <td className="py-3 text-center font-mono text-slate-400">{entry.supporting.balls ?? 0}</td>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.fours ?? 0}</td>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.sixes ?? 0}</td>
                          <td className="py-3 text-center font-mono text-sky-400">{entry.supporting.strikeRate ?? '0.00'}</td>
                          <td className="py-3 text-right pr-2 font-mono text-slate-300">{entry.supporting.average ?? '0.00'}</td>
                        </>
                      )}

                      {/* Supporting Bowling */}
                      {category === 'bowling' && (
                        <>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.overs ?? '0.0'}</td>
                          <td className="py-3 text-center font-mono text-slate-400">{entry.supporting.runsConceded ?? 0}</td>
                          <td className="py-3 text-center font-mono font-bold text-white">{entry.supporting.wickets ?? 0}</td>
                          <td className="py-3 text-center font-mono text-amber-400">{entry.supporting.economy ?? '0.00'}</td>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.average ?? '—'}</td>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.maidens ?? 0}</td>
                          <td className="py-3 text-right pr-2 font-mono text-sky-400">{entry.supporting.dotBalls ?? 0}</td>
                        </>
                      )}

                      {/* Supporting Fielding */}
                      {category === 'fielding' && (
                        <>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.catches ?? 0}</td>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.stumpings ?? 0}</td>
                          <td className="py-3 text-center font-mono text-slate-300">{entry.supporting.directRunOuts ?? 0}</td>
                          <td className="py-3 text-right pr-2 font-mono font-bold text-white">{entry.supporting.totalDismissals ?? 0}</td>
                        </>
                      )}

                      {/* Supporting MVP */}
                      {category === 'mvp' && (
                        <>
                          <td className="py-3 text-center font-mono text-sky-400">+{entry.supporting.battingImpact ?? 0}</td>
                          <td className="py-3 text-center font-mono text-amber-400">+{entry.supporting.bowlingImpact ?? 0}</td>
                          <td className="py-3 text-center font-mono text-purple-400">+{entry.supporting.fieldingImpact ?? 0}</td>
                          <td className="py-3 text-right pr-2 text-[10px] text-slate-400 font-mono">
                            {entry.supporting.runs || 0} Runs • {entry.supporting.wickets || 0} Wkts • {entry.supporting.catches || 0} Catches
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  )
}
