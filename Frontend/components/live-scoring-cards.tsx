'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Radio,
  ArrowRight,
  MapPin,
  Loader2,
  Calendar
} from 'lucide-react'
import { getLiveMatchesList, LiveMatchSummary } from '@/lib/match-service'

export function LiveScoringCards() {
  const [liveMatches, setLiveMatches] = useState<LiveMatchSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLive = async () => {
    try {
      const data = await getLiveMatchesList()
      setLiveMatches(data || [])
    } catch {
      setLiveMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLive()
    // Poll every 5 seconds for real-time live matches
    const timer = setInterval(fetchLive, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="bg-[#080e1e] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10 min-h-[70vh]">
      <div className="mx-auto max-w-7xl">
        
        {/* LIVE MATCHES LIST */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight flex items-center gap-2">
                  <span>LIVE MATCHES</span>
                  {liveMatches.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-pulse">
                      {liveMatches.length} LIVE
                    </span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Real-time ball-by-ball score updates for active tournament matches.
                </p>
              </div>
            </div>

            <Link
              href="/tournaments/turf-titans-2025?tab=fixtures"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#74c004] transition-colors"
            >
              <span>View All Fixtures</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading && liveMatches.length === 0 ? (
            <div className="rounded-2xl bg-[#0f182e] p-12 text-center border border-white/10 shadow-xl space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#74c004] mx-auto" />
              <p className="text-xs text-slate-400">Checking for active live matches...</p>
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => {
                const targetUrl = match.tournamentId
                  ? `/tournaments/${match.tournamentId}?tab=scoring&matchId=${match.matchId}`
                  : `/scoring/${match.matchId}`

                return (
                  <div
                    key={match._id || match.matchId}
                    className="flex flex-col justify-between rounded-2xl bg-[#0b1329] border border-white/10 p-5 text-white shadow-lg hover:border-[#74c004]/50 transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Top badge & group */}
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                          <span className="text-[11px] font-bold text-slate-300">
                            {match.matchTitle || match.round || 'Match'}
                          </span>
                        </div>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#74c004]">
                          {match.groupName || 'Tournament'}
                        </span>
                      </div>

                      {/* Teams & Score display */}
                      <div className="space-y-3 py-1">
                        {/* Team 1 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            {match.team1Logo ? (
                              <img
                                src={match.team1Logo}
                                alt={match.team1}
                                className="h-7 w-7 rounded-lg object-cover border border-white/15 shrink-0"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/10 font-bold text-xs shrink-0">
                                {match.team1.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className={`text-sm font-bold truncate ${
                              match.currentScore?.battingTeam?.toLowerCase() === match.team1.toLowerCase()
                                ? 'text-white font-black'
                                : 'text-slate-300'
                            }`}>
                              {match.team1}
                            </span>
                            {match.currentScore?.battingTeam?.toLowerCase() === match.team1.toLowerCase() && (
                              <span className="text-[10px] text-[#74c004]">🏏</span>
                            )}
                          </div>

                          {match.currentScore?.battingTeam?.toLowerCase() === match.team1.toLowerCase() && (
                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-white">
                                {match.currentScore.runs} / {match.currentScore.wickets}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                ({match.currentScore.overs} ov)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            {match.team2Logo ? (
                              <img
                                src={match.team2Logo}
                                alt={match.team2}
                                className="h-7 w-7 rounded-lg object-cover border border-white/15 shrink-0"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/10 font-bold text-xs shrink-0">
                                {match.team2.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className={`text-sm font-bold truncate ${
                              match.currentScore?.battingTeam?.toLowerCase() === match.team2.toLowerCase()
                                ? 'text-white font-black'
                                : 'text-slate-300'
                            }`}>
                              {match.team2}
                            </span>
                            {match.currentScore?.battingTeam?.toLowerCase() === match.team2.toLowerCase() && (
                              <span className="text-[10px] text-[#74c004]">🏏</span>
                            )}
                          </div>

                          {match.currentScore?.battingTeam?.toLowerCase() === match.team2.toLowerCase() && (
                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-white">
                                {match.currentScore.runs} / {match.currentScore.wickets}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                ({match.currentScore.overs} ov)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ground & Venue */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-white/10 pt-2.5">
                        <MapPin className="h-3.5 w-3.5 text-[#74c004] shrink-0" />
                        <span className="truncate">{match.ground || 'Turf Arena'}</span>
                      </div>
                    </div>

                    {/* View Live Score Action */}
                    <div className="pt-4 mt-2">
                      <Link
                        href={targetUrl}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black text-xs uppercase tracking-wider transition-all shadow-md group-hover:scale-[1.02]"
                      >
                        <span>View Live Score</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0f182e] p-8 sm:p-12 text-center border border-white/10 shadow-xl space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 mx-auto">
                <Radio className="h-7 w-7 text-[#74c004]" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white font-display">
                  No Live Matches Right Now
                </h3>
                <p className="text-xs text-slate-400">
                  There are no ongoing live box cricket matches at this moment. You can view scheduled upcoming matches in the tournament fixtures.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/tournaments/turf-titans-2025?tab=fixtures"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] text-[#080e1e] font-black text-xs uppercase px-5 py-2.5 transition-colors shadow-md"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>View Upcoming Fixtures</span>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
