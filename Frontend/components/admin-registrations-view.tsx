'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import {
  getAdminRegistrations,
  approveAdminRegistration,
  rejectAdminRegistration,
  deleteAdminRegistration,
  AdminRegistrationItem
} from '@/lib/services'

export function AdminRegistrationsView({ tournamentId }: { tournamentId?: string }) {
  const [registrations, setRegistrations] = useState<AdminRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Action Loading & Messages
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Modals
  const [selectedProofImg, setSelectedProofImg] = useState<{ src: string; team: string } | null>(null)
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null)
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null)

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminRegistrations({
        eventId: tournamentId || undefined,
        registrationStatus: filterStatus === 'ALL' ? undefined : filterStatus,
      })
      setRegistrations(data || [])
    } catch {
      // Keep state
    } finally {
      setLoading(false)
    }
  }, [filterStatus, tournamentId])

  useEffect(() => {
    loadRegistrations()
  }, [loadRegistrations])

  // Filter by search
  const filteredList = registrations.filter((reg) => {
    const q = searchQuery.toLowerCase()
    return (
      reg.teamName.toLowerCase().includes(q) ||
      reg.captainName.toLowerCase().includes(q) ||
      reg.captainEmail.toLowerCase().includes(q) ||
      (reg.registrationId && reg.registrationId.toLowerCase().includes(q))
    )
  })

  const handleVerifyRegistration = async (id: string) => {
    setActionLoadingId(id)
    setErrorMsg('')
    try {
      await approveAdminRegistration(id)
      setSuccessMsg('Registration verified successfully! Team has been approved.')
      setTimeout(() => setSuccessMsg(''), 4000)
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to verify registration')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectPromptId) return
    setActionLoadingId(rejectPromptId)
    setErrorMsg('')
    try {
      await rejectAdminRegistration(rejectPromptId, rejectReason)
      setSuccessMsg('Registration rejected')
      setTimeout(() => setSuccessMsg(''), 3000)
      setRejectPromptId(null)
      setRejectReason('')
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reject registration')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletePromptId) return
    setActionLoadingId(deletePromptId)
    setErrorMsg('')
    try {
      await deleteAdminRegistration(deletePromptId)
      setSuccessMsg('Registration deleted successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
      setDeletePromptId(null)
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete registration')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0b1329] border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#74c004]/10 border border-[#74c004]/30 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#74c004]">
              Admin Review
            </span>
            <span className="text-xs text-slate-400 font-bold">Registration Verification Desk</span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white">
            Review Submitted Registrations
          </h2>
          <p className="text-xs text-slate-400">
            Review team rosters (10 Main Players + 1 Substitute) and attached payment screenshots, and perform official verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadRegistrations()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold uppercase text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 p-3.5 text-xs font-bold text-[#74c004] animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs font-bold text-red-400 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0b1329] border border-white/10 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Registrations' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved Teams' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#74c004] text-[#080e1e] shadow-md shadow-[#74c004]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team, captain, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[#0b1329] border border-white/10 pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-[#74c004] focus:outline-none"
          />
        </div>
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#74c004] mx-auto" />
          <p className="text-xs text-slate-400">Loading registrations...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0b1329] border border-white/10 text-slate-400 text-xs">
          No registrations found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((reg) => {
            const isExpanded = expandedRegId === reg._id
            const isApproved = reg.registrationStatus === 'approved'
            const isRejected = reg.registrationStatus === 'rejected'

            const mainList = (reg.players || []).filter((p) => !p.isSubstitute)
            const substituteList = (reg.players || []).filter((p) => p.isSubstitute)

            return (
              <div
                key={reg._id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isApproved
                    ? 'bg-[#0b1329] border-emerald-500/30'
                    : isRejected
                    ? 'bg-[#0b1329] border-red-500/20 opacity-75'
                    : 'bg-[#0b1329] border-amber-500/30 shadow-lg'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {reg.teamLogo ? (
                        <img
                          src={reg.teamLogo}
                          alt={reg.teamName}
                          className="h-12 w-12 rounded-2xl object-cover border border-white/10 shrink-0 bg-[#162035]"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#74c004]/10 border border-[#74c004]/30 text-sm font-black text-[#74c004] uppercase shrink-0">
                          {reg.teamName?.slice(0, 2) || 'TT'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-display font-black uppercase text-white">
                            {reg.teamName}
                          </h3>
                          <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                            {reg.registrationId || reg._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          <span>Captain: <strong className="text-white">{reg.captainName}</strong></span>
                          <span>•</span>
                          <span>{reg.captainEmail}</span>
                          <span>•</span>
                          <span>{reg.captainPhone}</span>
                          {reg.whatsappNumber && (
                            <>
                              <span>•</span>
                              <span className="text-[#74c004]">WA: {reg.whatsappNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isRejected
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Actions Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-white/10 text-xs">
                    <div className="flex flex-wrap items-center gap-5 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Squad Size</span>
                        <span className="font-bold text-white">
                          {mainList.length} Main + {substituteList.length} Substitute
                        </span>
                      </div>

                      {/* Payment Screenshot Display */}
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Screenshot</span>
                        {reg.paymentProof ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofImg({ src: reg.paymentProof!, team: reg.teamName })}
                            className="inline-flex items-center gap-1.5 text-[#74c004] hover:text-[#86dc05] font-bold cursor-pointer underline"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>View Screenshot</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No payment screenshot uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls for Admin */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Toggle Roster Accordion */}
                      <button
                        type="button"
                        onClick={() => setExpandedRegId(isExpanded ? null : reg._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {/* Single Verify Registration Button */}
                      {!isApproved && (
                        <button
                          type="button"
                          disabled={actionLoadingId === reg._id}
                          onClick={() => handleVerifyRegistration(reg._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#74c004] hover:bg-[#86dc05] text-[#080e1e] px-4 py-1.5 text-xs font-black uppercase shadow-md shadow-[#74c004]/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === reg._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Verify Registration</span>
                        </button>
                      )}

                      {!isRejected && !isApproved && (
                        <button
                          type="button"
                          disabled={actionLoadingId === reg._id}
                          onClick={() => {
                            setRejectPromptId(reg._id)
                          }}
                          className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      )}

                      {/* Admin Delete Action */}
                      <button
                        type="button"
                        disabled={actionLoadingId === reg._id}
                        onClick={() => setDeletePromptId(reg._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer"
                        title="Permanently remove registration"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Player Roster & Screenshot View */}
                {isExpanded && (
                  <div className="bg-black/30 p-5 border-t border-white/10 space-y-5 animate-in fade-in">
                    {/* Payment Screenshot Preview Section */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-[#74c004]" />
                          <span>Payment Screenshot</span>
                        </span>
                      </div>

                      {reg.paymentProof ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <img
                            src={reg.paymentProof}
                            alt={`Payment Screenshot - ${reg.teamName}`}
                            className="h-32 w-auto rounded-lg object-contain bg-black/50 border border-white/10 cursor-pointer hover:opacity-90"
                            onClick={() => setSelectedProofImg({ src: reg.paymentProof!, team: reg.teamName })}
                          />
                          <div className="space-y-1 text-xs">
                            <p className="text-white font-bold">Screenshot uploaded by {reg.captainName}</p>
                            <p className="text-slate-400">Click thumbnail to expand full resolution receipt image.</p>
                            <button
                              type="button"
                              onClick={() => setSelectedProofImg({ src: reg.paymentProof!, team: reg.teamName })}
                              className="inline-flex items-center gap-1.5 text-[#74c004] hover:underline font-bold pt-1 cursor-pointer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Open Full Screenshot</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-black/20 text-slate-400 text-xs italic">
                          No payment screenshot uploaded
                        </div>
                      )}
                    </div>

                    {/* Squad Rosters: 10 Main + 1 Substitute */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Main Squad: 10 Players */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#74c004] block">
                          Main Squad ({mainList.length} Players)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mainList.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                            >
                              <span className="font-semibold text-white">
                                {pIdx + 1}. {p.name}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {p.role || 'Player'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Substitute: 1 Player */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                          Official Substitute (1)
                        </span>
                        {substituteList.length > 0 ? (
                          <div className="p-3 rounded-lg bg-white/5 border border-amber-500/30 flex items-center justify-between">
                            <span className="font-bold text-white">{substituteList[0].name}</span>
                            <span className="text-[10px] text-amber-400 uppercase font-bold">
                              {substituteList[0].role || 'Substitute'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No substitute specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Payment Proof Modal */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-2xl max-h-[85vh] p-4 bg-[#0b1329] rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase text-white">
                Payment Screenshot • {selectedProofImg.team}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProofImg(null)}
                className="rounded-full bg-white/10 text-white p-1.5 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedProofImg.src}
                alt="Payment Proof"
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Prompt Modal */}
      {rejectPromptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0b1329] border border-red-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase text-red-400">
                Reject Registration
              </h3>
              <button
                type="button"
                onClick={() => setRejectPromptId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 block">Reason for Rejection (Optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete squad roster or invalid details..."
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white focus:border-red-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectPromptId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectPromptId}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-black uppercase text-white shadow-md shadow-red-500/30"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePromptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0b1329] border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase text-rose-400 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete Registration</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletePromptId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this registration? This will remove the team from the tournament roster, groups, and any upcoming match fixtures. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletePromptId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === deletePromptId}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black uppercase text-white shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId === deletePromptId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
