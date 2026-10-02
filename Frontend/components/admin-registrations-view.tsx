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
  CreditCard,
  Check,
  Ban,
  DollarSign
} from 'lucide-react'
import {
  getAdminRegistrations,
  verifyAdminPayment,
  rejectAdminPayment,
  approveAdminRegistration,
  rejectAdminRegistration,
  deleteAdminRegistration,
  AdminRegistrationItem
} from '@/lib/services'

export function AdminRegistrationsView({ tournamentId }: { tournamentId?: string }) {
  const [registrations, setRegistrations] = useState<AdminRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRegStatus, setFilterRegStatus] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('ALL')
  const [filterPayStatus, setFilterPayStatus] = useState<'ALL' | 'pending' | 'verified' | 'rejected'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Action Loading & Messages
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Modals & Prompts
  const [selectedProofImg, setSelectedProofImg] = useState<{ src: string; team: string; amount?: number } | null>(null)
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null)

  // Rejection prompts
  const [rejectPrompt, setRejectPrompt] = useState<{ id: string; type: 'PAYMENT' | 'REGISTRATION' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null)

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminRegistrations({
        eventId: tournamentId || undefined,
        registrationStatus: filterRegStatus === 'ALL' ? undefined : filterRegStatus,
        paymentStatus: filterPayStatus === 'ALL' ? undefined : filterPayStatus,
      })
      setRegistrations(data || [])
    } catch {
      // Keep state
    } finally {
      setLoading(false)
    }
  }, [filterRegStatus, filterPayStatus, tournamentId])

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

  // 1. Verify Payment Action
  const handleVerifyPayment = async (id: string) => {
    setActionLoadingId(id)
    setErrorMsg('')
    try {
      await verifyAdminPayment(id)
      setSuccessMsg('Payment marked as VERIFIED! Confirmation email sent to captain.')
      setTimeout(() => setSuccessMsg(''), 4000)
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to verify payment')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 2. Reject Payment Action
  const handleConfirmRejectPayment = async () => {
    if (!rejectPrompt || rejectPrompt.type !== 'PAYMENT') return
    const id = rejectPrompt.id
    setActionLoadingId(id)
    setErrorMsg('')
    try {
      await rejectAdminPayment(id, rejectReason)
      setSuccessMsg('Payment marked as REJECTED. Notice sent to captain.')
      setTimeout(() => setSuccessMsg(''), 4000)
      setRejectPrompt(null)
      setRejectReason('')
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reject payment')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 3. Approve Registration Action
  const handleApproveRegistration = async (id: string) => {
    setActionLoadingId(id)
    setErrorMsg('')
    try {
      await approveAdminRegistration(id)
      setSuccessMsg('Registration APPROVED! Squad has been accepted into the tournament draw.')
      setTimeout(() => setSuccessMsg(''), 4000)
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to approve registration')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 4. Reject Registration Action
  const handleConfirmRejectRegistration = async () => {
    if (!rejectPrompt || rejectPrompt.type !== 'REGISTRATION') return
    const id = rejectPrompt.id
    setActionLoadingId(id)
    setErrorMsg('')
    try {
      await rejectAdminRegistration(id, rejectReason)
      setSuccessMsg('Registration marked as REJECTED.')
      setTimeout(() => setSuccessMsg(''), 4000)
      setRejectPrompt(null)
      setRejectReason('')
      await loadRegistrations()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reject registration')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 5. Delete Registration Action
  const handleConfirmDelete = async () => {
    if (!deletePromptId) return
    setActionLoadingId(deletePromptId)
    setErrorMsg('')
    try {
      await deleteAdminRegistration(deletePromptId)
      setSuccessMsg('Registration deleted permanently.')
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
              Admin Verification Desk
            </span>
            <span className="text-xs text-slate-400 font-bold">Payments & Squads Management</span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white">
            Review Submitted Registrations & Payments
          </h2>
          <p className="text-xs text-slate-400">
            Verify payment screenshots, manage payment states (Pending, Verified, Rejected), and approve official team entries.
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
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

          {/* Dual Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Registration Status Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0b1329] border border-white/10 overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Squad:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterRegStatus(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    filterRegStatus === tab.id
                      ? 'bg-[#74c004] text-[#080e1e] shadow-md shadow-[#74c004]/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0b1329] border border-white/10 overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Payment:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'pending', label: 'Pending Pay' },
                { id: 'verified', label: 'Verified Pay' },
                { id: 'rejected', label: 'Rejected Pay' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterPayStatus(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    filterPayStatus === tab.id
                      ? 'bg-amber-400 text-[#080e1e] shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#74c004] mx-auto" />
          <p className="text-xs text-slate-400">Loading registrations...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0b1329] border border-white/10 text-slate-400 text-xs">
          No registrations found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((reg) => {
            const isExpanded = expandedRegId === reg._id
            const isApproved = reg.registrationStatus === 'approved'
            const isRejected = reg.registrationStatus === 'rejected'
            const isPaymentVerified = reg.paymentStatus === 'verified'
            const isPaymentRejected = reg.paymentStatus === 'rejected'

            const mainList = (reg.players || []).filter((p) => !p.isSubstitute)
            const substituteList = (reg.players || []).filter((p) => p.isSubstitute)
            const regFee = reg.paymentAmount || reg.eventId?.registrationFee || 1500

            return (
              <div
                key={reg._id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isApproved && isPaymentVerified
                    ? 'bg-[#0b1329] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : isRejected
                    ? 'bg-[#0b1329] border-red-500/20 opacity-75'
                    : 'bg-[#0b1329] border-amber-500/30 shadow-lg'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                    {/* Team & Captain Details */}
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
                          <span>{reg.captainPhone || 'No Phone'}</span>
                          {reg.whatsappNumber && (
                            <>
                              <span>•</span>
                              <span className="text-[#74c004]">WA: {reg.whatsappNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badges: Payment + Squad */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Payment Status Badge */}
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                          isPaymentVerified
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isPaymentRejected
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}
                      >
                        Payment: {isPaymentVerified ? 'Verified' : isPaymentRejected ? 'Rejected' : 'Pending Verification'}
                      </span>

                      {/* Squad Registration Status Badge */}
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                          isApproved
                            ? 'bg-[#74c004]/20 text-[#74c004] border border-[#74c004]/40'
                            : isRejected
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}
                      >
                        Squad: {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                      </span>
                    </div>

                  </div>

                  {/* Summary Details & Admin Action Buttons */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-3 border-t border-white/10 text-xs">

                    {/* Amount, Squad & Screenshot metadata */}
                    <div className="flex flex-wrap items-center gap-5 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration Fee</span>
                        <span className="font-bold text-[#74c004] font-mono">
                          ₹{regFee.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Squad Size</span>
                        <span className="font-bold text-white">
                          {mainList.length} Main + {substituteList.length} Sub
                        </span>
                      </div>

                      {/* Payment Screenshot Display */}
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Screenshot</span>
                        {reg.paymentProof ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofImg({ src: reg.paymentProof!, team: reg.teamName, amount: regFee })}
                            className="inline-flex items-center gap-1.5 text-[#74c004] hover:text-[#86dc05] font-bold cursor-pointer underline"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No screenshot uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls for Admin */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">

                      {/* Toggle Roster Accordion */}
                      <button
                        type="button"
                        onClick={() => setExpandedRegId(isExpanded ? null : reg._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {/* Payment Verification Buttons */}
                      {!isPaymentVerified && (
                        <button
                          type="button"
                          disabled={actionLoadingId === reg._id}
                          onClick={() => handleVerifyPayment(reg._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#080e1e] px-3 py-1.5 text-xs font-black uppercase shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                          title="Verify payment receipt"
                        >
                          {actionLoadingId === reg._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          )}
                          <span>Verify Payment</span>
                        </button>
                      )}

                      {!isPaymentRejected && !isPaymentVerified && (
                        <button
                          type="button"
                          disabled={actionLoadingId === reg._id}
                          onClick={() => setRejectPrompt({ id: reg._id, type: 'PAYMENT' })}
                          className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer"
                          title="Reject invalid payment receipt"
                        >
                          Reject Payment
                        </button>
                      )}

                      {/* Squad Approval Buttons */}
                      {!isApproved && (
                        <button
                          type="button"
                          disabled={actionLoadingId === reg._id}
                          onClick={() => handleApproveRegistration(reg._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#74c004] hover:bg-[#86dc05] text-[#080e1e] px-3 py-1.5 text-xs font-black uppercase shadow-md shadow-[#74c004]/20 transition-all cursor-pointer disabled:opacity-50"
                          title="Approve team squad registration"
                        >
                          {actionLoadingId === reg._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Approve Squad</span>
                        </button>
                      )}

                      {!isRejected && !isApproved && (
                        <button
                          type="button"
                          disabled={actionLoadingId === reg._id}
                          onClick={() => setRejectPrompt({ id: reg._id, type: 'REGISTRATION' })}
                          className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer"
                        >
                          Reject Squad
                        </button>
                      )}

                      {/* Admin Delete Action */}
                      <button
                        type="button"
                        disabled={actionLoadingId === reg._id}
                        onClick={() => setDeletePromptId(reg._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer"
                        title="Permanently remove registration"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                          <span>Payment Receipt & Proof Details</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-[#74c004]">
                          Fee: ₹{regFee.toLocaleString()}
                        </span>
                      </div>

                      {reg.paymentProof ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <img
                            src={reg.paymentProof}
                            alt={`Payment Screenshot - ${reg.teamName}`}
                            className="h-36 w-auto rounded-lg object-contain bg-black/50 border border-white/10 cursor-pointer hover:opacity-90"
                            onClick={() => setSelectedProofImg({ src: reg.paymentProof!, team: reg.teamName, amount: regFee })}
                          />
                          <div className="space-y-1.5 text-xs">
                            <p className="text-white font-bold">Screenshot submitted by {reg.captainName}</p>
                            <p className="text-slate-400">Review UTR / Transaction ID and payment amount before verifying.</p>
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedProofImg({ src: reg.paymentProof!, team: reg.teamName, amount: regFee })}
                                className="inline-flex items-center gap-1 text-[#74c004] hover:underline font-bold cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Expand Screenshot</span>
                              </button>
                              {!isPaymentVerified && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(reg._id)}
                                  className="rounded bg-amber-500 hover:bg-amber-400 text-[#080e1e] px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Verify Payment Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-black/20 text-slate-400 text-xs italic">
                          No payment screenshot uploaded with this registration.
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

      {/* Payment Proof Full Image Modal */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full max-h-[90vh] p-5 bg-[#0b1329] rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-bold uppercase text-white block">
                  Payment Receipt • {selectedProofImg.team}
                </span>
                {selectedProofImg.amount && (
                  <span className="text-xs text-[#74c004] font-mono font-bold">
                    Expected Fee: ₹{selectedProofImg.amount.toLocaleString()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofImg(null)}
                className="rounded-full bg-white/10 text-white p-1.5 hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[72vh] flex items-center justify-center p-2 bg-black/50 rounded-xl">
              <img
                src={selectedProofImg.src}
                alt="Payment Receipt"
                className="max-h-[70vh] w-auto rounded-lg object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Prompt Modal (Payment or Registration) */}
      {rejectPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b1329] rounded-2xl border border-red-500/30 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-display text-sm font-bold uppercase text-red-400">
                {rejectPrompt.type === 'PAYMENT' ? 'Reject Payment Receipt' : 'Reject Squad Registration'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setRejectPrompt(null)
                  setRejectReason('')
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {rejectPrompt.type === 'PAYMENT'
                ? 'Please specify why this payment proof is being rejected (e.g. invalid transaction reference, incorrect amount, unreadable screenshot):'
                : 'Please specify the reason for rejecting this team registration:'}
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full rounded-xl border border-white/15 bg-[#080e1e] p-3 text-xs text-white placeholder:text-slate-500 focus:border-red-400 focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectPrompt(null)
                  setRejectReason('')
                }}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={
                  rejectPrompt.type === 'PAYMENT'
                    ? handleConfirmRejectPayment
                    : handleConfirmRejectRegistration
                }
                className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white uppercase"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePromptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0b1329] rounded-2xl border border-rose-500/30 p-6 space-y-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white uppercase text-sm">Permanently Delete Registration?</h4>
              <p className="text-xs text-slate-400">
                This will delete the registration and remove the team from tournament groups and fixtures. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletePromptId(null)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white uppercase"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
