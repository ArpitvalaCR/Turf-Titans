'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  RefreshCw,
  GitBranch,
  MapPin,
  AlertCircle,
  Loader2,
  Users
} from 'lucide-react'
import { getTournamentPointsTable, GroupPointsTable } from '@/lib/services'

export function PointsTableView({ tournamentId = 'turf-titans-2025' }: { tournamentId?: string }) {
  const [activeGroup, setActiveGroup] = useState<string>('ALL')
  const [groupTables, setGroupTables] = useState<GroupPointsTable[]>([])
  const [loading, setLoading] = useState(true)

  const loadPointsTable = useCallback(() => {
    setLoading(true)
    getTournamentPointsTable(tournamentId)
      .then((data) => setGroupTables(data || []))
      .catch(() => setGroupTables([]))
      .finally(() => setLoading(false))
  }, [tournamentId])

  useEffect(() => {
    loadPointsTable()
  }, [loadPointsTable])

  const totalAssignedTeams = groupTables.reduce(
    (acc, grp) => acc + (grp.standings?.length || 0),
    0
  )

  // Find top overall team if any points exist
  const allTeamsFlat = groupTables.flatMap((g) => g.standings || [])
  const leaderTeam = allTeamsFlat.find((t) => t.points > 0)?.team || 'TBD'

  const groupColors: Record<string, string> = {
    'GROUP A': 'bg-[#74c004]',
    'GROUP B': 'bg-sky-400',
    'GROUP C': 'bg-amber-400',
    'GROUP D': 'bg-purple-400',
  }

  const renderGroupTable = (group: GroupPointsTable) => {
    const groupName = group.groupName.toUpperCase()
    const teams = group.standings || []
    const colorClass = groupColors[groupName] || 'bg-[#74c004]'

    return (
      <div key={groupName} className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className={`h-6 w-1.5 rounded-full ${colorClass}`} />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
              {groupName} MATRIX
            </h2>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-slate-300">
              {teams.length} SQUADS ASSIGNED
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              5 Overs Tape Ball Rules • Lush Arena
            </span>
            <span className="rounded-full bg-[#74c004]/20 border border-[#74c004]/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#74c004]">
              TOP 2 AUTO-QUALIFY
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-black uppercase text-slate-400">
                <th className="pb-3 pl-2">POS</th>
                <th className="pb-3">SQUAD / TEAM</th>
                <th className="pb-3 text-center">M</th>
                <th className="pb-3 text-center">W</th>
                <th className="pb-3 text-center">L</th>
                <th className="pb-3 text-center">T</th>
                <th className="pb-3 text-center text-[#74c004]">PTS</th>
                <th className="pb-3 text-right">NRR</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="h-5 w-5 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-300">
                        No registered teams assigned to {groupName} yet
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Admin will assign registered squads to this group.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                teams.map((entry, idx) => (
                  <tr
                    key={entry.team}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors font-medium text-slate-200"
                  >
                    <td className="py-3 pl-2 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        {entry.teamLogo ? (
                          <img
                            src={entry.teamLogo}
                            alt={entry.team}
                            className="h-6 w-6 rounded-full object-cover border border-[#74c004]/30 shrink-0"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74c004]/20 border border-[#74c004]/30 text-[#74c004] text-[9px] font-black shrink-0">
                            {entry.team.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-white uppercase">{entry.team}</span>
                        {idx < 2 && (
                          <span className="rounded bg-[#74c004]/10 text-[#74c004] text-[9px] px-1.5 py-0.5 font-black uppercase">
                            Q
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono">{entry.played}</td>
                    <td className="py-3 text-center font-mono">{entry.won}</td>
                    <td className="py-3 text-center font-mono">{entry.lost}</td>
                    <td className="py-3 text-center font-mono">{entry.tied}</td>
                    <td className="py-3 text-center font-mono font-bold text-[#74c004]">{entry.points}</td>
                    <td className="py-3 text-right font-mono text-slate-300 font-semibold">{entry.nrr}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const availableGroupNames = groupTables.map((g) => g.groupName.toUpperCase())
  const filteredTables =
    activeGroup === 'ALL'
      ? groupTables
      : groupTables.filter((g) => g.groupName.toUpperCase() === activeGroup)

  return (
    <div className="w-full bg-[#080e1e] text-slate-100 min-h-screen pb-20">

      {/* 1. HERO & METRIC SUMMARY CARDS */}
      <div className="w-full border-b border-white/10 bg-[#070c1a] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Title & Stage Details */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#74c004]">
                  STAGE 01: GROUP PHASE • LUSH TURF ARENA MIRA ROAD
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white leading-none">
                TOURNAMENT <span className="text-[#74c004]">POINTS TABLE</span> & STANDINGS
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium pt-1">
                Official standings across all tournament groups. Top 2 teams from each group qualify for the Knockout Stage (Quarter-Finals).
              </p>
            </div>

            {/* 4 Summary Cards */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex justify-end items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <button
                  type="button"
                  onClick={loadPointsTable}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 text-[#74c004] ${loading ? 'animate-spin' : ''}`} />
                  <span>REFRESH TABLE</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                {/* Knockout Cutoff */}
                <div className="rounded-xl border border-white/10 bg-[#0f182e] p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    KNOCKOUT CUTOFF
                  </span>
                  <div className="mt-1">
                    <span className="font-display text-lg font-black text-[#74c004]">TOP 2 / GRP</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">Advance to QF</span>
                  </div>
                </div>

                {/* Tie Breaker */}
                <div className="rounded-xl border border-white/10 bg-[#0f182e] p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    TIE-BREAKER
                  </span>
                  <div className="mt-1">
                    <span className="font-display text-lg font-black text-sky-400">NRR</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">To 3 Decimals</span>
                  </div>
                </div>

                {/* League Leader */}
                <div className="rounded-xl border border-white/10 bg-[#0f182e] p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    LEAGUE LEADER
                  </span>
                  <div className="mt-1">
                    <span className="font-display text-lg font-black text-amber-400 truncate block">
                      {leaderTeam}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-semibold">Match Results Sync</span>
                  </div>
                </div>

                {/* Total Squads */}
                <div className="rounded-xl border border-white/10 bg-[#0f182e] p-3 flex flex-col justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    ASSIGNED SQUADS
                  </span>
                  <div className="mt-1">
                    <span className="font-display text-lg font-black text-white">{totalAssignedTeams} TEAMS</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">{groupTables.length} Groups</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. FILTER TABS & LEGEND BAR */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveGroup('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeGroup === 'ALL'
                  ? 'bg-[#74c004] text-[#080e1e] shadow-[0_0_12px_rgba(116,192,4,0.3)]'
                  : 'bg-[#0f182e] text-slate-300 hover:text-white border border-white/10'
                }`}
            >
              ALL GROUPS
            </button>
            {availableGroupNames.map((grpName) => (
              <button
                key={grpName}
                type="button"
                onClick={() => setActiveGroup(grpName)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeGroup === grpName
                    ? 'bg-[#74c004] text-[#080e1e] shadow-[0_0_12px_rgba(116,192,4,0.3)]'
                    : 'bg-[#0f182e] text-slate-300 hover:text-white border border-white/10'
                  }`}
              >
                {grpName}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
            <span className="font-bold text-slate-300">RULES:</span>
            <span><strong className="text-white">PTS:</strong> W=2, T=1, L=0</span>
            <span>•</span>
            <span><strong className="text-white">M:</strong> Matches</span>
            <span>•</span>
            <span><strong className="text-white">W:</strong> Won</span>
            <span>•</span>
            <span><strong className="text-white">L:</strong> Lost</span>
            <span>•</span>
            <span><strong className="text-white">T:</strong> Tied</span>
            <span>•</span>
            <span><strong className="text-white">NRR:</strong> Net Run Rate</span>
          </div>

        </div>
      </div>

      {/* 3. TABLES & SIDEBAR GRID */}
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT 2/3: GROUP TABLES */}
          <div className="lg:col-span-8 space-y-8">

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-12 text-center shadow-xl space-y-3">
                <Loader2 className="h-8 w-8 text-[#74c004] animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Loading Group Standings...
                </p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-12 text-center shadow-xl space-y-3">
                <Users className="h-8 w-8 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-300 font-bold uppercase tracking-wider">
                  No groups configured yet
                </p>
                <p className="text-xs text-slate-500">
                  Groups will appear here once configured in the tournament fixtures desk.
                </p>
              </div>
            ) : (
              filteredTables.map((group) => renderGroupTable(group))
            )}

          </div>

          {/* RIGHT 1/3: PLAYOFF BRACKET & ARENA DESK */}
          <div className="lg:col-span-4 space-y-6">

            {/* Playoff Trajectory Bracket */}
            <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-5">

              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <GitBranch className="h-5 w-5 text-[#74c004]" />
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                    PLAYOFF TRAJECTORY
                  </h3>
                </div>
                <span className="rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-2 py-0.5 text-[9px] font-black uppercase text-[#74c004]">
                  SINGLE ELIMINATION
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Top 2 seeds from Group A & Group B cross over into the Quarter-Final knockout bracket:
              </p>

              {/* Bracket Matches */}
              <div className="space-y-4">

                {/* QF 1 */}
                <div className="rounded-xl border border-white/10 bg-[#080e1e] p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span className="text-[#74c004]">QUARTER-FINAL 01</span>
                    <span>PITCH 1</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                      <span className="font-bold text-slate-300">A1. 1st Seed Group A</span>
                      <span className="text-[10px] text-[#74c004] font-bold">Group A</span>
                    </div>
                    <div className="flex items-center justify-center text-[10px] font-bold text-slate-500">
                      VS
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                      <span className="font-bold text-slate-300">B2. 2nd Seed Group B</span>
                      <span className="text-[10px] text-sky-400 font-bold">Group B</span>
                    </div>
                  </div>
                </div>

                {/* QF 2 */}
                <div className="rounded-xl border border-white/10 bg-[#080e1e] p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span className="text-sky-400">QUARTER-FINAL 02</span>
                    <span>PITCH 2</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                      <span className="font-bold text-slate-300">B1. 1st Seed Group B</span>
                      <span className="text-[10px] text-amber-300 font-bold">Group B</span>
                    </div>
                    <div className="flex items-center justify-center text-[10px] font-bold text-slate-500">
                      VS
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                      <span className="font-bold text-slate-300">A2. 2nd Seed Group A</span>
                      <span className="text-[10px] text-sky-400 font-bold">Group A</span>
                    </div>
                  </div>
                </div>

                {/* Grand Finale Card */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase text-amber-300 block">
                        GRAND FINALE
                      </span>
                      <span className="text-[10px] text-slate-300">
                        Winner SF1 vs Winner SF2
                      </span>
                    </div>
                  </div>
                  <span className="font-display font-black text-amber-300 text-sm">
                    SEASON 2025
                  </span>
                </div>

              </div>

            </div>

            {/* Arena Desk Info Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <MapPin className="h-4 w-4 text-[#74c004]" />
                <span>LUSH ARENA LIVE DESK</span>
              </div>
              <h4 className="font-display text-lg font-black uppercase text-white">
                Official Match Standings
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rankings and NRR automatically calculate from certified match results.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-white/10">
                <span className="text-slate-300">Mira Road East, Mumbai</span>
                <span className="text-[#74c004] font-bold">LUSH TURF ARENA</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}

