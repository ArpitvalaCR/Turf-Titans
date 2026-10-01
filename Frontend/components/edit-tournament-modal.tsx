'use client'

import React, { useState } from 'react'
import { X, Edit3, Loader2, Save, Calendar, MapPin, Trophy, DollarSign, Users, Shield } from 'lucide-react'
import { Event as BackendEvent, updateAdminEvent } from '@/lib/services'

interface EditTournamentModalProps {
  tournament: BackendEvent
  onClose: () => void
  onSuccess: (updated: BackendEvent) => void
}

const SPORTS_OPTIONS = [
  { value: 'cricket', label: 'Cricket' },
  { value: 'football', label: 'Football' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'registration_open', label: 'Registration Open' },
  { value: 'registration_closed', label: 'Registration Closed' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function EditTournamentModal({
  tournament,
  onClose,
  onSuccess,
}: EditTournamentModalProps) {
  const [title, setTitle] = useState(tournament.title || '')
  const [sport, setSport] = useState(tournament.sport || 'cricket')
  const [description, setDescription] = useState(tournament.description || '')
  const [location, setLocation] = useState(tournament.location || '')
  const [venue, setVenue] = useState(tournament.venue || '')
  
  // Format dates for <input type="date" />
  const formatDateForInput = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const [startDate, setStartDate] = useState(formatDateForInput(tournament.startDate))
  const [endDate, setEndDate] = useState(formatDateForInput(tournament.endDate))
  const [registrationStartDate, setRegistrationStartDate] = useState(
    formatDateForInput(tournament.registrationStartDate) || formatDateForInput(tournament.startDate)
  )
  const [registrationEndDate, setRegistrationEndDate] = useState(
    formatDateForInput(tournament.registrationEndDate) || formatDateForInput(tournament.endDate)
  )

  const [registrationFee, setRegistrationFee] = useState<number>(tournament.registrationFee || 0)
  const [maxTeams, setMaxTeams] = useState<number>(tournament.maxTeams || 16)
  const [prizes, setPrizes] = useState(tournament.prizes || '₹50,000 Total Prize Pool')
  const [rules, setRules] = useState(tournament.rules || '')
  const [status, setStatus] = useState(tournament.status || 'registration_open')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const payload = {
        title: title.trim(),
        sport: sport.trim().toLowerCase(),
        description: description.trim(),
        location: location.trim(),
        venue: venue.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate || startDate).toISOString(),
        registrationStartDate: new Date(registrationStartDate || startDate).toISOString(),
        registrationEndDate: new Date(registrationEndDate || endDate || startDate).toISOString(),
        registrationFee: Number(registrationFee),
        maxTeams: Number(maxTeams),
        prizes: prizes.trim(),
        rules: rules.trim(),
        status,
      }

      const updated = await updateAdminEvent(tournament._id, payload)
      onSuccess(updated)
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update tournament details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0b1329] border border-[#74c004]/30 p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 text-[#74c004]">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black uppercase text-white tracking-wide">
                Edit Tournament Details
              </h2>
              <p className="text-xs text-slate-400">
                Update tournament schedule, location, prize pool, or configuration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Tournament Title <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 text-xs text-white focus:border-[#74c004] focus:outline-none font-bold"
              />
            </div>

            {/* Sport */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Sport <span className="text-[#74c004]">*</span>
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {SPORTS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Tournament Status <span className="text-[#74c004]">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#74c004] focus:outline-none"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Start Date <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                End Date <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2 text-xs text-white focus:border-[#74c004] focus:outline-none font-bold"
              />
            </div>

            {/* Venue & Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Venue Name <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Lush Turf Stadium"
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 text-xs text-white focus:border-[#74c004] focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                City / Location <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mira Road, Mumbai"
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 text-xs text-white focus:border-[#74c004] focus:outline-none font-medium"
              />
            </div>

            {/* Prize Pool & Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Prize Pool <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="text"
                required
                value={prizes}
                onChange={(e) => setPrizes(e.target.value)}
                placeholder="e.g. ₹50,000 Total Prize Pool"
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 text-xs text-white focus:border-[#74c004] focus:outline-none font-bold text-amber-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Entry Fee (₹) <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={registrationFee}
                onChange={(e) => setRegistrationFee(Number(e.target.value))}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 text-xs text-white focus:border-[#74c004] focus:outline-none font-bold text-[#74c004]"
              />
            </div>

            {/* Max Teams */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Team Capacity (Max Teams) <span className="text-[#74c004]">*</span>
              </label>
              <input
                type="number"
                min="2"
                required
                value={maxTeams}
                onChange={(e) => setMaxTeams(Number(e.target.value))}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 text-xs text-white focus:border-[#74c004] focus:outline-none font-bold"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060b18] p-3.5 text-xs text-white focus:border-[#74c004] focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-xs font-bold uppercase text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-2.5 text-xs font-black uppercase text-[#080e1e] shadow-lg shadow-[#74c004]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Tournament Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
