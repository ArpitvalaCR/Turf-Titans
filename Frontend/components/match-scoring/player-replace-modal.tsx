'use client'

import { useState } from 'react'
import { X, Users, AlertCircle, RefreshCw } from 'lucide-react'
import { TeamSquad } from '@/lib/match-service'

interface PlayerReplaceModalProps {
  team1Squad: TeamSquad
  team2Squad: TeamSquad
  onClose: () => void
  onConfirmReplace: (payload: { teamName: string; playerOut: string; playerIn: string; reason: string }) => void
}

export function PlayerReplaceModal({
  team1Squad,
  team2Squad,
  onClose,
  onConfirmReplace,
}: PlayerReplaceModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(team1Squad.teamName)

  const activeSquad = selectedTeam.toLowerCase() === team1Squad.teamName.toLowerCase() ? team1Squad : team2Squad

  const [playerOut, setPlayerOut] = useState<string>(activeSquad.playing[0]?.name || '')
  const [playerIn, setPlayerIn] = useState<string>(activeSquad.substitutes[0]?.name || '')
  const [reason, setReason] = useState<string>('Tactical Substitution')
  const [errorMsg, setErrorMsg] = useState('')

  const handleConfirm = () => {
    setErrorMsg('')
    if (!playerOut || !playerIn) {
      setErrorMsg('Both outgoing player and substitute incoming player must be selected')
      return
    }
    if (activeSquad.substitutes.length === 0) {
      setErrorMsg(`No registered substitutes available for ${selectedTeam}`)
      return
    }
    onConfirmReplace({
      teamName: selectedTeam,
      playerOut,
      playerIn,
      reason,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0b1329] border border-white/10 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#74c004]" />
            <h3 className="text-base font-display font-black uppercase text-white">
              Player Substitution
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

        {/* Team Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 block">Team</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedTeam(team1Squad.teamName)
                setPlayerOut(team1Squad.playing[0]?.name || '')
                setPlayerIn(team1Squad.substitutes[0]?.name || '')
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                selectedTeam === team1Squad.teamName
                  ? 'bg-[#74c004]/20 border-[#74c004] text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {team1Squad.teamName}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTeam(team2Squad.teamName)
                setPlayerOut(team2Squad.playing[0]?.name || '')
                setPlayerIn(team2Squad.substitutes[0]?.name || '')
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                selectedTeam === team2Squad.teamName
                  ? 'bg-[#74c004]/20 border-[#74c004] text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {team2Squad.teamName}
            </button>
          </div>
        </div>

        {/* Player Out & Player In */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Player Leaving (Playing)
            </label>
            <select
              value={playerOut}
              onChange={(e) => setPlayerOut(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
            >
              {activeSquad.playing.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#0b1329]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Replacement (Substitute)
            </label>
            {activeSquad.substitutes.length > 0 ? (
              <select
                value={playerIn}
                onChange={(e) => setPlayerIn(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {activeSquad.substitutes.map((p) => (
                  <option key={p.name} value={p.name} className="bg-[#0b1329]">
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-amber-400 p-2 bg-amber-400/10 rounded-lg">
                No registered substitutes
              </div>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
          >
            <option value="Tactical Substitution" className="bg-[#0b1329]">Tactical Substitution</option>
            <option value="Player Injury" className="bg-[#0b1329]">Player Injury</option>
            <option value="Player Emergency" className="bg-[#0b1329]">Player Emergency</option>
          </select>
        </div>

        {/* Actions */}
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
            disabled={activeSquad.substitutes.length === 0}
            onClick={handleConfirm}
            className="rounded-xl bg-[#74c004] hover:bg-[#63a503] px-6 py-2.5 text-xs font-black uppercase text-[#080e1e] transition-colors cursor-pointer disabled:opacity-50"
          >
            Confirm Replacement
          </button>
        </div>
      </div>
    </div>
  )
}
