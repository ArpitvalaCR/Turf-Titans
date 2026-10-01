'use client'

import { useState } from 'react'
import { X, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PlayerInfo, BowlerCard } from '@/lib/match-service'

interface BowlerSelectModalProps {
  currentBowler: string
  bowlingSquad: PlayerInfo[]
  bowlingScorecard: BowlerCard[]
  maxOversPerBowler: number
  isBowlingLimitStrict: boolean
  onClose: () => void
  onSelectBowler: (newBowler: string) => void
}

export function BowlerSelectModal({
  currentBowler,
  bowlingSquad,
  bowlingScorecard,
  maxOversPerBowler,
  isBowlingLimitStrict,
  onClose,
  onSelectBowler,
}: BowlerSelectModalProps) {
  // Find first eligible bowler
  const isEligible = (name: string) => {
    // Cannot bowl consecutive overs
    if (name.toLowerCase() === currentBowler.toLowerCase()) return false

    // Check quota
    if (isBowlingLimitStrict) {
      const card = bowlingScorecard.find((b) => b.playerName.toLowerCase() === name.toLowerCase())
      if (card) {
        const completedOvers = Math.floor(card.ballsBowled / 6)
        if (completedOvers >= maxOversPerBowler) return false
      }
    }
    return true
  }

  const eligibleList = bowlingSquad.filter((p) => isEligible(p.name))
  const [selectedBowler, setSelectedBowler] = useState<string>(eligibleList[0]?.name || '')
  const [errorMsg, setErrorMsg] = useState('')

  const handleConfirm = () => {
    if (!selectedBowler) {
      setErrorMsg('Please select a bowler')
      return
    }
    onSelectBowler(selectedBowler)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0b1329] border border-white/10 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="rounded bg-[#74c004]/10 border border-[#74c004]/30 px-2 py-0.5 text-[10px] font-black uppercase text-[#74c004]">
              Over Completed
            </span>
            <h3 className="text-base font-display font-black uppercase text-white mt-1">
              Select Next Bowler
            </h3>
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

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Available Bowlers (Max {maxOversPerBowler} over{maxOversPerBowler > 1 ? 's' : ''}/bowler)
          </label>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {bowlingSquad.map((p) => {
              const card = bowlingScorecard.find((b) => b.playerName.toLowerCase() === p.name.toLowerCase())
              const oversBowled = card?.oversBowled || '0.0'
              const wickets = card?.wickets || 0
              const runs = card?.runsConceded || 0

              const isConsecutive = p.name.toLowerCase() === currentBowler.toLowerCase()
              const isQuotaReached =
                isBowlingLimitStrict && card && Math.floor(card.ballsBowled / 6) >= maxOversPerBowler

              const disabled = isConsecutive || isQuotaReached

              return (
                <button
                  key={p.name}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedBowler(p.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    disabled
                      ? 'opacity-40 bg-white/5 border-white/5 cursor-not-allowed text-slate-500'
                      : selectedBowler === p.name
                      ? 'bg-[#74c004]/20 border-[#74c004] text-white font-bold cursor-pointer'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {oversBowled} ov • {wickets} wkts • {runs} runs
                    </div>
                  </div>

                  <div>
                    {isConsecutive ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        Last Bowler
                      </span>
                    ) : isQuotaReached ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                        Quota Max
                      </span>
                    ) : selectedBowler === p.name ? (
                      <CheckCircle2 className="h-4 w-4 text-[#74c004]" />
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedBowler}
            onClick={handleConfirm}
            className="rounded-xl bg-[#74c004] hover:bg-[#63a503] px-6 py-2.5 text-xs font-black uppercase text-[#080e1e] transition-colors cursor-pointer disabled:opacity-50"
          >
            Confirm Bowler
          </button>
        </div>
      </div>
    </div>
  )
}
