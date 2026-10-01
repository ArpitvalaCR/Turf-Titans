'use client'

import { useState } from 'react'
import { Trophy, Play, CheckCircle2, AlertCircle, ArrowRight, Flag } from 'lucide-react'
import { MatchSessionData } from '@/lib/match-service'

interface InningsSummaryModalProps {
  session: MatchSessionData
  onStartSecondInnings: (payload: { striker: string; nonStriker: string; openingBowler: string }) => void
}

export function InningsSummaryModal({ session, onStartSecondInnings }: InningsSummaryModalProps) {
  const innings1 = session.innings[0]
  const target = session.target || (innings1 ? innings1.totalRuns + 1 : 1)

  const team2Name = session.toss.bowlingFirst
  const team1Name = session.toss.battingFirst

  const isTeam1 = team2Name.toLowerCase() === session.team1Squad.teamName.toLowerCase()
  const battingSquad = isTeam1 ? session.team1Squad.playing : session.team2Squad.playing
  const bowlingSquad = !isTeam1 ? session.team1Squad.playing : session.team2Squad.playing

  const [striker, setStriker] = useState(battingSquad[0]?.name || '')
  const [nonStriker, setNonStriker] = useState(battingSquad[1]?.name || '')
  const [openingBowler, setOpeningBowler] = useState(bowlingSquad[0]?.name || '')
  const [errorMsg, setErrorMsg] = useState('')

  const handleStart = () => {
    setErrorMsg('')
    if (!striker || !nonStriker || !openingBowler) {
      setErrorMsg('Please select Striker, Non-striker, and Opening Bowler for Innings 2')
      return
    }
    if (striker.toLowerCase() === nonStriker.toLowerCase()) {
      setErrorMsg('Striker and Non-striker cannot be the same player')
      return
    }
    onStartSecondInnings({ striker, nonStriker, openingBowler })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b1329] border border-[#74c004]/30 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Banner */}
        <div className="text-center space-y-2 pb-4 border-b border-white/10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-1 text-xs font-black uppercase text-[#74c004]">
            <Flag className="h-3.5 w-3.5" />
            Innings 1 Complete • Innings Break
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-white">
            Target: <span className="text-[#74c004]">{target} Runs</span>
          </h2>
          <p className="text-xs text-slate-400">
            {team2Name} needs {target} runs in {session.config.totalOvers} overs (RRR:{' '}
            {((target / session.config.totalOvers)).toFixed(2)})
          </p>
        </div>

        {/* 1st Innings Summary Box */}
        {innings1 && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-300">
              <span>{innings1.battingTeam} Score</span>
              <span className="text-base text-white font-black">
                {innings1.totalRuns} / {innings1.totalWickets}{' '}
                <span className="text-xs font-normal text-slate-400">({innings1.oversFormatted} ov)</span>
              </span>
            </div>

            {/* Quick Top Batters & Bowlers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-white/5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Batting Highlights
                </span>
                <div className="space-y-1">
                  {innings1.battingScorecard.slice(0, 3).map((b) => (
                    <div key={b.playerName} className="flex items-center justify-between text-slate-200">
                      <span>{b.playerName}</span>
                      <span className="font-bold text-white">
                        {b.runs} ({b.ballsFaced}b)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Bowling Figures
                </span>
                <div className="space-y-1">
                  {innings1.bowlingScorecard.slice(0, 3).map((bw) => (
                    <div key={bw.playerName} className="flex items-center justify-between text-slate-200">
                      <span>{bw.playerName}</span>
                      <span className="font-bold text-white">
                        {bw.wickets}/{bw.runsConceded} ({bw.oversBowled} ov)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2nd Innings Openers Form */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#74c004]">
            Select 2nd Innings Opening Lineup ({team2Name})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Striker */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Striker ({team2Name})
              </label>
              <select
                value={striker}
                onChange={(e) => setStriker(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {battingSquad.map((p) => (
                  <option key={p.name} value={p.name} className="bg-[#0b1329]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Non-Striker ({team2Name})
              </label>
              <select
                value={nonStriker}
                onChange={(e) => setNonStriker(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {battingSquad
                  .filter((p) => p.name !== striker)
                  .map((p) => (
                    <option key={p.name} value={p.name} className="bg-[#0b1329]">
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Opening Bowler */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Opening Bowler ({team1Name})
              </label>
              <select
                value={openingBowler}
                onChange={(e) => setOpeningBowler(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {bowlingSquad.map((p) => (
                  <option key={p.name} value={p.name} className="bg-[#0b1329]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#63a503] text-[#080e1e] font-black uppercase text-xs px-8 py-3.5 transition-colors shadow-lg shadow-[#74c004]/20 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>START 2ND INNINGS →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
