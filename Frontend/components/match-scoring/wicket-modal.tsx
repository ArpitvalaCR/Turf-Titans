'use client'

import { useState } from 'react'
import { X, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { PlayerInfo } from '@/lib/match-service'

interface WicketModalProps {
  striker: string
  nonStriker: string
  bowler: string
  battingSquad: PlayerInfo[]
  bowlingSquad: PlayerInfo[]
  dismissedBatsmen: string[]
  onClose: () => void
  onConfirmWicket: (dismissalPayload: any) => void
}

export function WicketModal({
  striker,
  nonStriker,
  bowler,
  battingSquad,
  bowlingSquad,
  dismissedBatsmen,
  onClose,
  onConfirmWicket,
}: WicketModalProps) {
  const [batsmanOut, setBatsmanOut] = useState<string>(striker)
  const [dismissalType, setDismissalType] = useState<string>('BOWLED')
  const [fielderCatcher, setFielderCatcher] = useState<string>(bowlingSquad[0]?.name || '')
  const [wicketKeeper, setWicketKeeper] = useState<string>(bowlingSquad[0]?.name || '')
  
  // Run out specifics
  const [runOutThrower, setRunOutThrower] = useState<string>(bowlingSquad[0]?.name || '')
  const [isDirectHit, setIsDirectHit] = useState<boolean>(true)
  const [assistingFielder, setAssistingFielder] = useState<string>(bowlingSquad[1]?.name || '')

  // Remaining eligible batsmen for new batsman entry
  const remainingBatsmen = battingSquad
    .map((p) => p.name)
    .filter(
      (name) =>
        !dismissedBatsmen.includes(name) &&
        name !== striker &&
        name !== nonStriker
    )

  const [newBatsman, setNewBatsman] = useState<string>(remainingBatsmen[0] || '')
  const [newBatsmanStrike, setNewBatsmanStrike] = useState<'STRIKER' | 'NON_STRIKER'>('STRIKER')
  const [errorMsg, setErrorMsg] = useState('')

  const handleConfirm = () => {
    setErrorMsg('')
    if (!batsmanOut) {
      setErrorMsg('Please select which batsman is out')
      return
    }

    if (dismissalType === 'CAUGHT' && !fielderCatcher) {
      setErrorMsg('Please select the fielder who took the catch')
      return
    }

    if (dismissalType === 'RUN_OUT' && !runOutThrower) {
      setErrorMsg('Please select the thrower fielder for the run out')
      return
    }

    const payload: any = {
      batsmanOut,
      dismissalType,
      bowler,
      newBatsman: remainingBatsmen.length > 0 ? newBatsman : '',
      newBatsmanStrike,
    }

    if (dismissalType === 'CAUGHT') {
      payload.fielderCatcher = fielderCatcher
    } else if (dismissalType === 'CAUGHT_BEHIND') {
      payload.wicketKeeper = wicketKeeper || fielderCatcher
    } else if (dismissalType === 'STUMPED') {
      payload.wicketKeeper = wicketKeeper || fielderCatcher
    } else if (dismissalType === 'RUN_OUT') {
      payload.runOutDetails = {
        thrower: runOutThrower,
        isDirectHit,
        assistingFielder: !isDirectHit ? assistingFielder : undefined,
      }
    }

    onConfirmWicket(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1329] border border-red-500/30 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-500/20 border border-red-500/40 text-red-300 px-2.5 py-0.5 text-xs font-black uppercase">
              WICKET OUT
            </span>
            <span className="text-xs text-slate-400 font-semibold">Bowler: {bowler}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Which Batsman is Out */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            1. Batsman Dismissed
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBatsmanOut(striker)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                batsmanOut === striker
                  ? 'bg-red-500/20 border-red-500 text-white font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <div className="text-[10px] text-red-400 font-semibold uppercase">Striker</div>
              <div className="text-sm truncate">{striker}</div>
            </button>

            <button
              type="button"
              onClick={() => setBatsmanOut(nonStriker)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                batsmanOut === nonStriker
                  ? 'bg-red-500/20 border-red-500 text-white font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <div className="text-[10px] text-red-400 font-semibold uppercase">Non-Striker</div>
              <div className="text-sm truncate">{nonStriker}</div>
            </button>
          </div>
        </div>

        {/* 2. Dismissal Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2. How Was the Batsman Dismissed?
          </label>
          <select
            value={dismissalType}
            onChange={(e) => setDismissalType(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-xs font-bold text-white focus:border-red-500 focus:outline-none"
          >
            <option value="BOWLED" className="bg-[#0b1329]">Bowled (Clean Bowled)</option>
            <option value="CAUGHT" className="bg-[#0b1329]">Caught (Fielder Catch)</option>
            <option value="CAUGHT_BEHIND" className="bg-[#0b1329]">Caught Behind (Wicketkeeper)</option>
            <option value="RUN_OUT" className="bg-[#0b1329]">Run Out</option>
            <option value="STUMPED" className="bg-[#0b1329]">Stumped</option>
            <option value="LBW" className="bg-[#0b1329]">LBW</option>
            <option value="HIT_WICKET" className="bg-[#0b1329]">Hit Wicket</option>
            <option value="RETIRED_HURT" className="bg-[#0b1329]">Retired Hurt (No bowler wicket)</option>
          </select>
        </div>

        {/* Dynamic Details based on Dismissal */}
        {dismissalType === 'CAUGHT' && (
          <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <label className="text-xs font-semibold text-slate-300 block">
              Catcher Fielder (Bowling Team)
            </label>
            <select
              value={fielderCatcher}
              onChange={(e) => setFielderCatcher(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
            >
              {bowlingSquad.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#0b1329]">
                  {p.name} {p.name.toLowerCase() === bowler.toLowerCase() ? '(Caught & Bowled)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {(dismissalType === 'CAUGHT_BEHIND' || dismissalType === 'STUMPED') && (
          <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <label className="text-xs font-semibold text-slate-300 block">
              Wicketkeeper
            </label>
            <select
              value={wicketKeeper}
              onChange={(e) => setWicketKeeper(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
            >
              {bowlingSquad.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#0b1329]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {dismissalType === 'RUN_OUT' && (
          <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Thrower Fielder</label>
              <select
                value={runOutThrower}
                onChange={(e) => setRunOutThrower(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {bowlingSquad.map((p) => (
                  <option key={p.name} value={p.name} className="bg-[#0b1329]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={isDirectHit}
                onChange={(e) => setIsDirectHit(e.target.checked)}
                className="rounded accent-[#74c004]"
              />
              <span>Direct Hit</span>
            </label>

            {!isDirectHit && (
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Assisting Fielder (Wicketkeeper / Stumps)</label>
                <select
                  value={assistingFielder}
                  onChange={(e) => setAssistingFielder(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
                >
                  {bowlingSquad
                    .filter((p) => p.name !== runOutThrower)
                    .map((p) => (
                      <option key={p.name} value={p.name} className="bg-[#0b1329]">
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* 3. Next Batsman Selection */}
        {remainingBatsmen.length > 0 && dismissalType !== 'RETIRED_HURT' && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Select Incoming Batsman
            </label>
            <select
              value={newBatsman}
              onChange={(e) => setNewBatsman(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
            >
              {remainingBatsmen.map((name) => (
                <option key={name} value={name} className="bg-[#0b1329]">
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-red-500 hover:bg-red-600 px-6 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-red-500/30 transition-all cursor-pointer"
          >
            Confirm Dismissal
          </button>
        </div>
      </div>
    </div>
  )
}
