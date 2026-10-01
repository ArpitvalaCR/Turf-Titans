'use client'

import React, { useState } from 'react'
import { Flag, CheckCircle2, AlertOctagon, X, Loader2 } from 'lucide-react'

export interface EndMatchModalProps {
  onClose: () => void
  onConfirm: (payload: {
    action: 'COMPLETED' | 'STOPPED'
    stoppedReason?: string
    stoppedDetails?: string
  }) => Promise<void>
  loading?: boolean
}

export const STOPPED_REASONS = [
  'Technical Error',
  'Ground Issue',
  'Weather',
  'Medical Emergency',
  'Other',
]

export function EndMatchModal({ onClose, onConfirm, loading = false }: EndMatchModalProps) {
  const [decision, setDecision] = useState<'COMPLETED' | 'STOPPED'>('COMPLETED')
  const [stoppedReason, setStoppedReason] = useState<string>('Technical Error')
  const [stoppedDetails, setStoppedDetails] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleConfirm = async () => {
    setError('')
    try {
      if (decision === 'STOPPED') {
        if (!stoppedReason) {
          setError('Please select a reason for stopping the match.')
          return
        }
        await onConfirm({
          action: 'STOPPED',
          stoppedReason,
          stoppedDetails: stoppedDetails.trim(),
        })
      } else {
        await onConfirm({
          action: 'COMPLETED',
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to finalize match')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1329] border border-white/10 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black uppercase text-white tracking-wide">
                End Match Decision
              </h3>
              <p className="text-xs text-slate-400">
                Choose how this match should be concluded in the system
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Option A: Match Completed */}
          <label
            onClick={() => setDecision('COMPLETED')}
            className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
              decision === 'COMPLETED'
                ? 'bg-sky-500/10 border-sky-400 shadow-lg shadow-sky-500/10'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="endMatchDecision"
              checked={decision === 'COMPLETED'}
              onChange={() => setDecision('COMPLETED')}
              className="mt-1 text-sky-500 focus:ring-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                <span className="text-sm font-black uppercase text-white tracking-wide">
                  A. Match Completed
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The match concluded normally. The system will calculate the official winner, update the points table, and register complete tournament statistics.
              </p>
            </div>
          </label>

          {/* Option B: Match Stopped */}
          <label
            onClick={() => setDecision('STOPPED')}
            className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
              decision === 'STOPPED'
                ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="endMatchDecision"
              checked={decision === 'STOPPED'}
              onChange={() => setDecision('STOPPED')}
              className="mt-1 text-amber-500 focus:ring-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-black uppercase text-white tracking-wide">
                  B. Match Stopped
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The match was halted before completion (e.g. rain, technical problem). All recorded deliveries are preserved, but no final winner or incorrect NRR is awarded.
              </p>
            </div>
          </label>
        </div>

        {/* Stopped Details Input (Conditional) */}
        {decision === 'STOPPED' && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-3 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-amber-300 block">
                Reason for Stopping *
              </label>
              <select
                value={stoppedReason}
                onChange={(e) => setStoppedReason(e.target.value)}
                className="w-full rounded-xl bg-[#080e1e] border border-white/15 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                {STOPPED_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Additional Notes / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Heavy rain interrupted play after 1st innings"
                value={stoppedDetails}
                onChange={(e) => setStoppedDetails(e.target.value)}
                className="w-full rounded-xl bg-[#080e1e] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 font-semibold">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black uppercase transition-all shadow-lg cursor-pointer disabled:opacity-50 ${
              decision === 'STOPPED'
                ? 'bg-amber-500 hover:bg-amber-400 text-[#080e1e]'
                : 'bg-sky-500 hover:bg-sky-400 text-[#080e1e]'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Confirm {decision === 'STOPPED' ? 'Stop Match' : 'Complete Match'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
