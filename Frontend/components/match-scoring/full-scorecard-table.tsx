'use client'

import { useState } from 'react'
import { MatchSessionData, InningsData } from '@/lib/match-service'

interface FullScorecardTableProps {
  session: MatchSessionData
}

export function FullScorecardTable({ session }: FullScorecardTableProps) {
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(session.currentInnings || 1)

  const innings = session.innings[selectedInnings - 1]

  if (!innings) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        Innings {selectedInnings} data not yet available.
      </div>
    )
  }

  const crr =
    innings.totalLegalBalls > 0
      ? ((innings.totalRuns / innings.totalLegalBalls) * 6).toFixed(2)
      : '0.00'

  return (
    <div className="space-y-6">
      {/* Innings Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {session.innings.map((inn, idx) => {
          const innNum = (idx + 1) as 1 | 2
          const isActive = selectedInnings === innNum
          return (
            <button
              key={innNum}
              type="button"
              onClick={() => setSelectedInnings(innNum)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#74c004] text-[#080e1e] shadow-md shadow-[#74c004]/20'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {inn.battingTeam} (Inn {innNum}) • {inn.totalRuns}/{inn.totalWickets} ({inn.oversFormatted} ov)
            </button>
          )
        })}
      </div>

      {/* Innings Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#74c004]">
            {innings.battingTeam} Innings
          </span>
          <h3 className="text-2xl font-display font-black text-white">
            {innings.totalRuns} / {innings.totalWickets}{' '}
            <span className="text-sm font-semibold text-slate-400">
              ({innings.oversFormatted} / {session.config.totalOvers} Overs)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">Current RR</span>
            <span className="font-bold text-white">{crr}</span>
          </div>
          <div className="text-right border-l border-white/10 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase">Extras</span>
            <span className="font-bold text-[#74c004]">
              {innings.extras.total}{' '}
              <span className="text-[10px] text-slate-400 font-normal">
                (wd {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 1. BATTING TABLE */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/10">
          Batting
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                <th className="px-4 py-2.5">Batter</th>
                <th className="px-4 py-2.5">Dismissal</th>
                <th className="px-4 py-2.5 text-right">R</th>
                <th className="px-4 py-2.5 text-right">B</th>
                <th className="px-4 py-2.5 text-right">4s</th>
                <th className="px-4 py-2.5 text-right">6s</th>
                <th className="px-4 py-2.5 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {innings.battingScorecard.map((b) => {
                const sr = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : '0.0'
                let dismissalDesc = 'not out'
                if (b.isOut && b.dismissal) {
                  const d = b.dismissal
                  if (d.dismissalType === 'BOWLED') dismissalDesc = `b ${d.bowler || ''}`
                  else if (d.dismissalType === 'CAUGHT') dismissalDesc = `c ${d.fielderCatcher} b ${d.bowler}`
                  else if (d.dismissalType === 'CAUGHT_BEHIND') dismissalDesc = `c †${d.wicketKeeper || d.fielderCatcher} b ${d.bowler}`
                  else if (d.dismissalType === 'RUN_OUT') dismissalDesc = `run out (${d.runOutDetails?.thrower || ''})`
                  else if (d.dismissalType === 'STUMPED') dismissalDesc = `st †${d.wicketKeeper} b ${d.bowler}`
                  else if (d.dismissalType === 'LBW') dismissalDesc = `lbw b ${d.bowler}`
                  else if (d.dismissalType === 'HIT_WICKET') dismissalDesc = `hit wicket b ${d.bowler}`
                } else if (!b.isOut && b.ballsFaced > 0) {
                  dismissalDesc = 'batting*'
                }

                return (
                  <tr key={b.playerName} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-white flex items-center gap-1.5">
                      <span>{b.playerName}</span>
                      {!b.isOut && b.ballsFaced > 0 && <span className="text-[#74c004] text-[10px]">*</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px] truncate max-w-[180px]">
                      {dismissalDesc}
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-white">{b.runs}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{b.ballsFaced}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{b.fours}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{b.sixes}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{sr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. BOWLING TABLE */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/10">
          Bowling
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                <th className="px-4 py-2.5">Bowler</th>
                <th className="px-4 py-2.5 text-right">O</th>
                <th className="px-4 py-2.5 text-right">M</th>
                <th className="px-4 py-2.5 text-right">R</th>
                <th className="px-4 py-2.5 text-right">W</th>
                <th className="px-4 py-2.5 text-right">Econ</th>
                <th className="px-4 py-2.5 text-right">Dots</th>
                <th className="px-4 py-2.5 text-right">Wd</th>
                <th className="px-4 py-2.5 text-right">Nb</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {innings.bowlingScorecard.map((bw) => {
                const econ =
                  bw.ballsBowled > 0
                    ? ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2)
                    : '0.00'

                return (
                  <tr key={bw.playerName} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-white">{bw.playerName}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{bw.oversBowled}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{bw.maidens}</td>
                    <td className="px-4 py-2.5 text-right font-black text-white">{bw.runsConceded}</td>
                    <td className="px-4 py-2.5 text-right font-black text-[#74c004]">{bw.wickets}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{econ}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{bw.dotBalls}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{bw.wides}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{bw.noBalls}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. FALL OF WICKETS */}
      {innings.fallOfWickets.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Fall of Wickets
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {innings.fallOfWickets.map((fow) => (
              <span
                key={fow.wicketNumber}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-slate-300"
              >
                <strong className="text-white">{fow.score}/{fow.wicketNumber}</strong>{' '}
                <span className="text-slate-400 text-[10px]">({fow.batsmanOut}, {fow.over} ov)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
