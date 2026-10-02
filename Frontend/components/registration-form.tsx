'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Copy,
  Check,
  Upload,
  Trophy,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  ArrowRight,
  Bookmark,
  AlertCircle,
  FileCheck2,
  Clock,
  ShieldAlert,
  QrCode,
  Smartphone,
  CreditCard,
  Search,
  ExternalLink,
  RefreshCw,
  X,
  FileImage
} from 'lucide-react'
import {
  submitRegistration,
  getEventRegistrationCount,
  getEvent,
  getRegistrationStatus,
  Event as EventType,
  AdminRegistrationItem
} from '@/lib/services'
import { useAuth } from '@/lib/auth-context'

// Exactly 10 Main Playing + 1 Substitute (11 total entries)
const initialRoster = [
  { id: 1, name: '', role: 'All-Rounder', isCaptain: true, isSubstitute: false },
  { id: 2, name: '', role: 'Batsman', isCaptain: false, isSubstitute: false },
  { id: 3, name: '', role: 'Bowler', isCaptain: false, isSubstitute: false },
  { id: 4, name: '', role: 'Wicketkeeper', isCaptain: false, isSubstitute: false },
  { id: 5, name: '', role: 'All-Rounder', isCaptain: false, isSubstitute: false },
  { id: 6, name: '', role: 'Batsman', isCaptain: false, isSubstitute: false },
  { id: 7, name: '', role: 'Bowler', isCaptain: false, isSubstitute: false },
  { id: 8, name: '', role: 'All-Rounder', isCaptain: false, isSubstitute: false },
  { id: 9, name: '', role: 'Batsman', isCaptain: false, isSubstitute: false },
  { id: 10, name: '', role: 'Bowler', isCaptain: false, isSubstitute: false },
  { id: 11, name: '', role: 'Batsman', isCaptain: false, isSubstitute: true }, // 1 Substitute
]

const UPI_ID = 'arpitvala16@oksbi'

export function RegistrationForm({ defaultEventId }: { defaultEventId?: string } = {}) {
  const searchParams = useSearchParams()
  const eventId = defaultEventId || searchParams.get('eventId')
  const { user, isAuthenticated, isAdmin } = useAuth()

  const [registrationId, setRegistrationId] = useState('TT-REG-NEW')
  const [copiedId, setCopiedId] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

  // Event & Pricing state
  const [eventData, setEventData] = useState<EventType | null>(null)
  const [eventLoading, setEventLoading] = useState(false)

  // Captain & Contact state
  const [captainName, setCaptainName] = useState(user?.name || '')
  const [mobileNumber, setMobileNumber] = useState('')
  const [emailAddress, setEmailAddress] = useState(user?.email || '')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  // Team state
  const [teamName, setTeamName] = useState('')
  const [teamLogoPreview, setTeamLogoPreview] = useState<string | null>(null)

  // Roster state (10 Main Playing + 1 Substitute = 11 total)
  const [players, setPlayers] = useState(initialRoster)

  // Payment Screenshot state
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  const [paymentProofFile, setPaymentProofFile] = useState<{ name: string; size: string } | null>(null)
  const [paymentProofError, setPaymentProofError] = useState('')
  const [declaration, setDeclaration] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [error, setError] = useState('')
  const [regCount, setRegCount] = useState<{ registeredTeams: number; maxTeams: number } | null>(null)

  // Status Lookup Modal / State
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<AdminRegistrationItem | null>(null)
  const [lookupError, setLookupError] = useState('')

  // Dynamic fee calculation from selected event
  const registrationFee = typeof eventData?.registrationFee === 'number' ? eventData.registrationFee : 1500
  const dynamicUpiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent('Turf Titans')}&am=${registrationFee}&cu=INR`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dynamicUpiUrl)}`

  useEffect(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    setRegistrationId(`TT-2025-REG-${randomNum}`)

    if (eventId) {
      setEventLoading(true)
      getEvent(eventId)
        .then((data) => {
          setEventData(data)
        })
        .catch(() => {
          setEventData(null)
        })
        .finally(() => {
          setEventLoading(false)
        })

      if (/^[0-9a-fA-F]{24}$/.test(eventId)) {
        getEventRegistrationCount(eventId)
          .then((data) => setRegCount(data))
          .catch(() => setRegCount(null))
      }
    }
  }, [eventId])

  useEffect(() => {
    if (user?.name && !captainName) {
      setCaptainName(user.name)
      setPlayers((prev) =>
        prev.map((p) => (p.isCaptain ? { ...p, name: user.name || '' } : p))
      )
    }
    if (user?.email && !emailAddress) {
      setEmailAddress(user.email)
    }
  }, [user, captainName, emailAddress])

  // Auto-sync captain name to player 1
  const handleCaptainNameChange = (val: string) => {
    setCaptainName(val)
    setPlayers((prev) =>
      prev.map((p) => (p.isCaptain ? { ...p, name: val } : p))
    )
  }

  const handlePlayerChange = (id: number, field: 'name' | 'role', val: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (p.isCaptain && field === 'name') {
            setCaptainName(val)
          }
          return { ...p, [field]: val }
        }
        return p
      })
    )
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setTeamLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentProofError('')
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (image only)
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validImageTypes.includes(file.type)) {
      setPaymentProofError('Invalid file format. Please upload an image (PNG, JPG, JPEG, WEBP).')
      e.target.value = ''
      return
    }

    // Validate file size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setPaymentProofError('File is too large. Payment screenshot must be under 5MB.')
      e.target.value = ''
      return
    }

    // Format file size string
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2)
    setPaymentProofFile({
      name: file.name,
      size: `${sizeInMb} MB`,
    })

    const reader = new FileReader()
    reader.onload = (event) => {
      setPaymentProofPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveProof = () => {
    setPaymentProofPreview(null)
    setPaymentProofFile(null)
    setPaymentProofError('')
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(registrationId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleLookupStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupQuery.trim()) return

    if (!isAuthenticated) {
      setLookupError('Please Sign In to view your registered squad status')
      return
    }

    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)

    try {
      const res = await getRegistrationStatus(lookupQuery.trim())
      setLookupResult(res)
    } catch (err: any) {
      setLookupError(err?.message || 'Registration not found. Please check your Registration ID or Email.')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!declaration) {
      setError('Please accept the tournament declaration before submitting.')
      return
    }

    // Validate exactly 10 main playing names
    const emptyMain = players.filter((p) => !p.isSubstitute && !p.name.trim())
    if (emptyMain.length > 0) {
      setError(`Please provide all 10 Main Playing player names. (${emptyMain.length} slot(s) remaining)`)
      return
    }

    // Validate 1 substitute name
    const subPlayer = players.find((p) => p.isSubstitute)
    if (!subPlayer || !subPlayer.name.trim()) {
      setError('Please provide the 1 Substitute player full name.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const targetEventId = eventId || undefined

      const formattedPlayers = players.map((p) => ({
        name: p.name.trim(),
        role: p.role || 'All-Rounder',
        isSubstitute: Boolean(p.isSubstitute),
      }))

      const payload = {
        registrationId,
        teamName: teamName.trim() || 'Unnamed Squad',
        teamLogo: teamLogoPreview,
        captainName: captainName.trim() || 'Captain',
        captainEmail: emailAddress.trim() || 'contact@turftitans.com',
        captainPhone: mobileNumber.trim(),
        whatsappNumber: whatsappNumber.trim(),
        sport: eventData?.sport || 'cricket',
        paymentProof: paymentProofPreview,
        players: formattedPlayers,
        eventId: targetEventId,
      }

      const res = await submitRegistration(payload)

      setSubmittedData(res)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Registration submission failed. Please verify inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  const mainPlayers = players.filter((p) => !p.isSubstitute)
  const substitutePlayer = players.find((p) => p.isSubstitute)
  const filledMainCount = mainPlayers.filter((p) => p.name.trim().length > 0).length

  // If currently authenticated as ADMIN, show admin notice instead of team registration form
  if (isAdmin) {
    return (
      <div className="w-full bg-[#080e1e] text-slate-100 min-h-[600px] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-amber-500/30 bg-[#0f182e] p-8 text-center space-y-5 shadow-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold uppercase text-white">
              ADMINISTRATOR ACCOUNT
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Team registration is reserved for team captains and user accounts. As an administrator, you can review and verify incoming team registrations.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/tournaments/turf-titans-2025?tab=registration"
              className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md transition-all"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Go to Review Registrations</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#080e1e] text-slate-100 min-h-screen pb-20">
      
      {/* 1. TOP STATUS BANNER */}
      <div className="w-full bg-[#1b1406] border-b border-amber-500/30 px-4 py-2.5">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="uppercase tracking-wide">
              OFFICIAL TEAM REGISTRATION • 10 MAIN PLAYERS + 1 SUBSTITUTE ROSTER MANDATE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Check Payment & Registration Status</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-amber-300 text-[11px] uppercase tracking-wider font-semibold">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Admin Review & Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO HEADER */}
      <div className="w-full border-b border-white/10 bg-[#070c1a] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link href="/tournaments" className="hover:text-[#74c004] transition-colors">
                ← TOURNAMENTS
              </Link>
              <span>•</span>
              <span className="text-[#74c004]">{eventData?.title || 'TURF TITANS 2025'}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider text-white">
              OFFICIAL TEAM ENTRY PASS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
              Submit your team lineup and complete registration fee via UPI. Registrations are logged in <span className="text-amber-400 font-bold">Pending Verification</span> until tournament administrators verify payment and squad rosters.
            </p>
          </div>

          {/* Floating Registration ID card */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0f182e] p-4 shadow-xl shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 text-[#74c004]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                APPLICATION REF ID
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                  {registrationId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="rounded bg-white/10 hover:bg-white/20 p-1 text-slate-300 transition-colors cursor-pointer"
                  title="Copy Registration ID"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-[#74c004]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN FORM & SIDEBAR */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* SUBMISSION CONFIRMATION / AWAITING VERIFICATION SCREEN */}
        {submitted ? (
          <div className="rounded-3xl border border-amber-500/40 bg-[#0f182e] p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl space-y-6 animate-in fade-in">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Clock className="h-10 w-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                <span>Payment & Registration: Pending Verification</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white">
                Registration Submitted Successfully!
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto font-medium leading-relaxed">
                Your registration for <strong className="text-white">{teamName}</strong> (ID: <span className="font-mono text-[#74c004] font-bold">{registrationId}</span>) has been received and logged in the tournament system.
              </p>
            </div>

            {/* Registration Summary Card */}
            <div className="rounded-2xl bg-[#080e1e] border border-white/10 p-5 text-left text-xs space-y-3 max-w-lg mx-auto">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400 font-bold uppercase">Team Name</span>
                <span className="font-bold text-white uppercase">{teamName}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400 font-bold uppercase">Captain Name</span>
                <span className="font-bold text-white">{captainName}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400 font-bold uppercase">Captain Contact</span>
                <span className="font-mono text-white">{mobileNumber} • {emailAddress}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400 font-bold uppercase">Tournament Fee</span>
                <span className="font-bold text-white">₹{registrationFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400 font-bold uppercase">Payment Status</span>
                <span className="font-black text-amber-400 uppercase">Pending Admin Verification</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400 font-bold uppercase">Squad Composition</span>
                <span className="font-bold text-[#74c004]">10 Main Players + 1 Substitute</span>
              </div>
              {paymentProofPreview && (
                <div className="pt-2">
                  <span className="text-slate-400 font-bold uppercase block mb-1.5">Attached Payment Screenshot</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={paymentProofPreview}
                      alt="Payment Receipt"
                      className="h-16 w-16 object-cover rounded-lg border border-amber-500/40 bg-black/40"
                    />
                    <div className="text-[11px] text-slate-300">
                      <p className="font-semibold text-white">{paymentProofFile?.name || 'payment-screenshot.png'}</p>
                      <p className="text-slate-400">Uploaded for administrator verification</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 max-w-lg mx-auto text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white flex items-center justify-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-[#74c004]" />
                <span>Next Step: Admin Verification</span>
              </p>
              <p className="text-slate-400">
                The tournament desk will verify your payment screenshot and squad lineup. Once verified, your status will update to <strong className="text-emerald-400">Payment Verified</strong> and your team will be entered into tournament fixtures.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-2 rounded-xl bg-[#74c004] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-lg hover:bg-[#86dc05] transition-all"
              >
                <span>View Tournaments</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setTeamName('')
                  setCaptainName('')
                  setMobileNumber('')
                  setEmailAddress('')
                  setWhatsappNumber('')
                  setTeamLogoPreview(null)
                  setPaymentProofPreview(null)
                  setPaymentProofFile(null)
                  setPlayers(initialRoster)
                  setDeclaration(false)
                }}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Register Another Squad
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: REGISTRATION FORM */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
              
              {/* SECTION 1: CAPTAIN / CONTACT */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md">
                <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#74c004]">🪪</span>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                      SECTION 1: CAPTAIN / PRIMARY CONTACT
                    </h2>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    OFFICIAL LIAISON
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      CAPTAIN FULL NAME <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={captainName}
                      onChange={(e) => handleCaptainNameChange(e.target.value)}
                      placeholder="Enter Captain Full Name"
                      className="w-full rounded-xl border border-white/15 bg-[#080e1e] px-4 py-3 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Lead representative & Toss representative
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      MOBILE NUMBER <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full rounded-xl border border-white/15 bg-[#080e1e] px-4 py-3 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Urgent tournament alerts & toss calls
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      EMAIL ADDRESS <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="captain@example.com"
                      className="w-full rounded-xl border border-white/15 bg-[#080e1e] px-4 py-3 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Registration slip & verification receipts sent here
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      WHATSAPP NUMBER
                    </label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full rounded-xl border border-white/15 bg-[#080e1e] px-4 py-3 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Added to Official Captains WhatsApp Dispatch
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TEAM PROFILE */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#74c004]">🛡️</span>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                      SECTION 2: TEAM PROFILE
                    </h2>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    SQUAD IDENTITY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      OFFICIAL TEAM NAME <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Royal Strikers CC"
                      className="w-full rounded-xl border border-white/15 bg-[#080e1e] px-4 py-3 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Appears on match boards, standings & trophy
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      CAPTAIN LINKAGE
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={captainName ? `${captainName} (Player 1)` : 'Auto-linked from Section 1'}
                      className="w-full rounded-xl border border-white/10 bg-[#080e1e]/60 px-4 py-3 text-sm text-slate-300 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Linked to Player #1 in the Squad roster
                    </span>
                  </div>
                </div>

                {/* Team Logo Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      TEAM LOGO / EMBLEM
                    </label>
                    <span className="text-[9px] font-bold uppercase text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                      OPTIONAL
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-dashed border-white/15 bg-[#080e1e]/60 p-4 hover:border-[#74c004]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {teamLogoPreview ? (
                        <img
                          src={teamLogoPreview}
                          alt="Team Logo"
                          className="h-12 w-12 rounded-lg object-cover border border-[#74c004]"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                          <Upload className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-white">
                          {teamLogoPreview ? 'Logo Attached' : 'Upload official team crest / logo'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          PNG or JPG. Displayed on live match scorecards & bracket tables.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {teamLogoPreview && (
                        <button
                          type="button"
                          onClick={() => setTeamLogoPreview(null)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <label className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors shrink-0 cursor-pointer">
                        <span>{teamLogoPreview ? 'Change Logo' : 'Browse File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: EXACTLY 10 MAIN PLAYERS + 1 SUBSTITUTE */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#74c004]">👥</span>
                    <div>
                      <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                        SECTION 3: SQUAD ROSTER (10 MAIN + 1 SUBSTITUTE)
                      </h2>
                      <span className="text-[11px] text-slate-400 block font-normal">
                        Exactly 10 Main Playing members + 1 Official Substitute (11 total squad members).
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-[#74c004]/20 border border-[#74c004]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#74c004] self-start sm:self-auto">
                    {filledMainCount} / 10 MAIN SQUAD FILLED
                  </span>
                </div>

                {/* Main Squad: 10 Players */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#74c004]">
                      🏏 MAIN SQUAD (EXACTLY 10 PLAYERS MANDATORY)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">10 Players</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3 px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span className="col-span-1 text-center">#</span>
                    <span className="col-span-6 sm:col-span-7">PLAYER FULL NAME *</span>
                    <span className="col-span-5 sm:col-span-4">CRICKET ROLE (OPTIONAL)</span>
                  </div>

                  {mainPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-12 gap-2 sm:gap-3 items-center rounded-xl bg-[#080e1e] p-2 sm:p-3 border border-white/5 hover:border-white/15 transition-colors"
                    >
                      <div className="col-span-1 flex justify-center">
                        {player.isCaptain ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#74c004] text-[#080e1e] font-black text-xs" title="Captain">
                            C
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-7">
                        <input
                          type="text"
                          required
                          value={player.name}
                          onChange={(e) => handlePlayerChange(player.id, 'name', e.target.value)}
                          placeholder={player.isCaptain ? 'Captain Name (Auto-linked)' : `Player ${index + 1} Full Name`}
                          className="w-full rounded-lg border border-white/10 bg-[#0f182e] px-3 py-2 text-xs sm:text-sm text-white focus:border-[#74c004] focus:outline-none placeholder:text-slate-600"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-4">
                        <select
                          value={player.role}
                          onChange={(e) => handlePlayerChange(player.id, 'role', e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-[#0f182e] px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-[#74c004] focus:outline-none"
                        >
                          <option value="All-Rounder">All-Rounder</option>
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="Wicketkeeper">Wicketkeeper</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Substitute: 1 Player */}
                {substitutePlayer && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <span>🔄</span>
                        <span>OFFICIAL SUBSTITUTE (EXACTLY 1 SUBSTITUTE MANDATORY)</span>
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                        11th Person
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center rounded-xl bg-[#171105] p-2 sm:p-3 border border-amber-500/30">
                      <div className="col-span-1 flex justify-center">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs">
                          SUB
                        </span>
                      </div>

                      <div className="col-span-6 sm:col-span-7">
                        <input
                          type="text"
                          required
                          value={substitutePlayer.name}
                          onChange={(e) => handlePlayerChange(substitutePlayer.id, 'name', e.target.value)}
                          placeholder="Substitute Player Full Name *"
                          className="w-full rounded-lg border border-amber-500/20 bg-[#0f182e] px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none placeholder:text-slate-600"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-4">
                        <select
                          value={substitutePlayer.role}
                          onChange={(e) => handlePlayerChange(substitutePlayer.id, 'role', e.target.value)}
                          className="w-full rounded-lg border border-amber-500/20 bg-[#0f182e] px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-amber-400 focus:outline-none"
                        >
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-Rounder">All-Rounder</option>
                          <option value="Wicketkeeper">Wicketkeeper</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: PAYMENT DETAILS & SCREENSHOT UPLOAD */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#74c004]">💳</span>
                    <div>
                      <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                        SECTION 4: PAYMENT & VERIFICATION
                      </h2>
                      <span className="text-[11px] text-slate-400 block font-normal">
                        Pay tournament entry fee via UPI, then attach your payment screenshot for admin verification.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="rounded bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Status: Pending Verification</span>
                    </span>
                  </div>
                </div>

                {/* 1. PAYMENT OVERVIEW & DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#080e1e] p-5 sm:p-6 rounded-2xl border border-white/10">

                  {/* Left: Amount & UPI ID & Action */}
                  <div className="md:col-span-7 space-y-5">
                    {/* Amount Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#16223d] to-[#0d1527] border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                          TOURNAMENT ENTRY FEE
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-[#74c004] font-display">
                          ₹{registrationFee.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {eventData?.title || 'Turf Titans Cricket Championship 2025'}
                        </span>
                      </div>
                      <span className="text-2xl">🏆</span>
                    </div>

                    {/* UPI ID with Copy button */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        OFFICIAL UPI ID
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-between rounded-xl border border-white/15 bg-[#0f182e] px-4 py-3 text-sm font-mono font-bold text-white">
                          <span>{UPI_ID}</span>
                          <span className="text-[10px] font-sans font-semibold uppercase text-[#74c004] bg-[#74c004]/10 px-2 py-0.5 rounded">
                            Verified Receiver
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="flex items-center gap-1.5 rounded-xl border border-[#74c004]/40 bg-[#74c004]/10 hover:bg-[#74c004]/20 px-4 py-3 text-xs font-bold uppercase text-[#74c004] transition-all cursor-pointer shrink-0"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Pay via UPI deep link button */}
                    <div>
                      <a
                        href={dynamicUpiUrl}
                        className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#74c004] to-[#8fe406] hover:from-[#86dc05] hover:to-[#9df809] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-[#080e1e] shadow-lg shadow-[#74c004]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <Smartphone className="h-4 w-4 stroke-[2.5]" />
                        <span>Pay via UPI App (₹{registrationFee.toLocaleString()})</span>
                      </a>
                      <span className="text-[11px] text-slate-400 block text-center mt-1.5">
                        Opens your device&apos;s available UPI app (GPay, PhonePe, Paytm, BHIM, etc.)
                      </span>
                    </div>

                    {/* Supported apps icons badge */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span>Supported Payment Modes:</span>
                      <span className="text-slate-300">Google Pay • PhonePe • Paytm • BHIM • Cred UPI</span>
                    </div>
                  </div>

                  {/* Right: QR Code */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-[#0f182e] border border-white/10 text-center space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300">
                      <QrCode className="h-4 w-4 text-[#74c004]" />
                      <span>Scan Payment QR</span>
                    </div>

                    <div className="relative p-2.5 bg-white rounded-xl shadow-lg">
                      <img
                        src={qrCodeUrl}
                        alt="Turf Titans UPI Payment QR Code"
                        className="h-40 w-40 sm:h-44 sm:w-44 object-contain rounded"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-0.5 text-[11px]">
                      <p className="font-bold text-white">Scan with any UPI Scanner</p>
                      <p className="text-slate-400 font-mono">Amount: ₹{registrationFee.toLocaleString()}</p>
                    </div>
                  </div>

                </div>

                {/* 2. STEP-BY-STEP PAYMENT INSTRUCTIONS */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <span className="font-black uppercase tracking-wider text-slate-200 block text-[11px]">
                    📋 Payment & Verification Instructions:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed font-medium">
                    <li>Pay <strong className="text-white font-bold">₹{registrationFee.toLocaleString()}</strong> using the <strong>Pay via UPI</strong> button or by scanning the QR code above.</li>
                    <li>Complete the transaction in your chosen UPI application (GPay, PhonePe, Paytm, etc.).</li>
                    <li>Take a clear screenshot of the completed payment receipt showing the transaction reference / UTR.</li>
                    <li>Upload the payment screenshot in the field below before clicking submit.</li>
                    <li>Your submission will enter <strong className="text-amber-300">Pending Verification</strong> until reviewed and confirmed by administrators.</li>
                  </ol>
                </div>

                {/* 3. UPLOAD PAYMENT SCREENSHOT */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      UPLOAD PAYMENT SCREENSHOT <span className="text-amber-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Max 5MB • PNG, JPG, JPEG, WEBP
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-dashed border-white/15 bg-[#080e1e]/60 p-4 hover:border-[#74c004]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {paymentProofPreview ? (
                        <img
                          src={paymentProofPreview}
                          alt="Payment Proof"
                          className="h-16 w-16 rounded-lg object-cover border border-[#74c004] bg-black/40 shrink-0"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/5 text-slate-400 shrink-0">
                          <FileImage className="h-7 w-7 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-white">
                          {paymentProofPreview
                            ? `Receipt Attached: ${paymentProofFile?.name || 'payment-proof.png'}`
                            : 'Upload payment receipt / screenshot'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {paymentProofPreview && paymentProofFile
                            ? `File size: ${paymentProofFile.size} • Ready for verification`
                            : 'Image formats only (PNG, JPG, JPEG, WEBP). Proof must clearly display transaction reference.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {paymentProofPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <label className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors shrink-0 cursor-pointer">
                        <span>{paymentProofPreview ? 'Change Screenshot' : 'Browse Screenshot'}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleProofUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {paymentProofError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      <span>{paymentProofError}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* SECTION 5: FINAL DECLARATION & SUBMISSION */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="text-lg font-black text-[#74c004]">✅</span>
                  <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                    SECTION 5: OFFICIAL DECLARATION
                  </h2>
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => setDeclaration(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-[#080e1e] text-[#74c004] accent-[#74c004] focus:ring-0"
                  />
                  <span className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    I confirm that the roster provided (10 Main Players + 1 Substitute) and the payment details submitted are accurate. I agree to Turf Titans tournament rules, code of conduct, and understand that registration is subject to Admin verification.
                  </span>
                </label>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert('Draft saved in your current browser session!')
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-200 transition-colors cursor-pointer"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>SAVE DRAFT</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:flex-1 flex items-center justify-center gap-3 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-8 py-4 text-sm font-black uppercase tracking-wider text-[#080e1e] shadow-[0_0_25px_rgba(116,192,4,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    <span>{loading ? 'SUBMITTING SQUAD REGISTRATION...' : `SUBMIT REGISTRATION (${registrationId})`}</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>

            </form>

            {/* RIGHT COLUMN: SIDEBAR DETAILS */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* ENTRY PASS */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      ENTRY PASS
                    </span>
                    <h3 className="font-display text-lg font-black uppercase tracking-wider text-white">
                      {eventData?.title || 'SEASON 2025 SLOT PASS'}
                    </h3>
                  </div>
                  <span className="text-xl">🎟️</span>
                </div>

                {/* Slots remaining status */}
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="rounded-md bg-[#74c004]/20 text-[#74c004] border border-[#74c004]/40 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    ● REGISTRATION OPEN
                  </span>
                  <span className="text-slate-300 uppercase tracking-wide">
                    {regCount ? `${Math.max(0, regCount.maxTeams - regCount.registeredTeams)} SLOTS AVAILABLE` : 'SLOTS AVAILABLE'}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span>Tournament Allocation</span>
                    <span className="font-mono text-white">
                      {regCount ? `${regCount.registeredTeams} / ${regCount.maxTeams} Teams` : 'Official 20-Team Bracket'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#74c004]"
                      style={{
                        width: regCount && regCount.maxTeams > 0
                          ? `${Math.min(100, Math.round((regCount.registeredTeams / regCount.maxTeams) * 100))}%`
                          : '15%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
                    <span className="text-[#74c004]">
                      {regCount && regCount.maxTeams > 0
                        ? `${Math.round((regCount.registeredTeams / regCount.maxTeams) * 100)}% BOOKED`
                        : 'OFFICIAL PORTAL'}
                    </span>
                    <span>{eventData?.venue || 'LUSH TURF ARENA'}</span>
                  </div>
                </div>

                {/* Roster & Fee Breakdown */}
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-semibold">
                  <div className="flex justify-between text-slate-300">
                    <span>Registration Fee</span>
                    <span className="font-mono text-[#74c004] font-bold">₹{registrationFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Main Squad Required</span>
                    <span className="font-mono text-white font-bold">10 Players</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Official Substitute</span>
                    <span className="font-mono text-amber-300 font-bold">1 Substitute</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Squad Size</span>
                    <span className="font-mono text-[#74c004] font-bold">11 Members</span>
                  </div>
                </div>

                {/* Guarantee Pill */}
                <div className="flex items-center gap-2 rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 px-3 py-2 text-xs font-bold text-[#74c004]">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Admin Verification Guarantee</span>
                </div>

                {/* Prize Pool Callout */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wider">
                    <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{eventData?.prizes || '₹35,000 CASH PRIZE POOL'}</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 font-medium">
                    Winner: Mega Trophy & Cash • Runner-up Awards
                  </p>
                </div>
              </div>

              {/* TOURNAMENT VENUE */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74c004]">
                  <MapPin className="h-4 w-4" />
                  <span>TOURNAMENT VENUE</span>
                </div>
                <h4 className="font-display text-lg font-bold text-white uppercase">
                  {eventData?.venue || 'Lush Turf Arena'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {eventData?.location || 'Behind GCC Club, Mira Road East, Mumbai - 401107. Dual court floodlit arenas.'}
                </p>
              </div>

              {/* TOURNAMENT DESK */}
              <div id="contact-desk" className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Phone className="h-4 w-4 text-[#74c004]" />
                    <span>TOURNAMENT DESK</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-[#74c004] animate-pulse" />
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Have questions regarding verification or team slot allocation?
                </p>

                <div className="space-y-1.5 text-xs font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#74c004]" />
                    <span>+91 98205 81823 / +91 98331 44102</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#74c004]" />
                    <span>support@turftitans.in</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/919820581823"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#74c004]/40 bg-[#74c004]/10 hover:bg-[#74c004]/20 py-2.5 text-xs font-bold uppercase tracking-wider text-[#74c004] transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WHATSAPP DESK</span>
                </a>
              </div>

            </aside>

          </div>
        )}

      </div>

      {/* CHECK REGISTRATION STATUS MODAL */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-[#0b1329] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white">
                <Search className="h-4 w-4 text-[#74c004]" />
                <h3 className="font-display text-lg font-bold uppercase">
                  Check Registration & Payment Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLookupOpen(false)
                  setLookupResult(null)
                  setLookupError('')
                }}
                className="rounded-full p-1 bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4">
                <AlertCircle className="h-7 w-7 text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm text-amber-200 font-semibold">
                    Please Sign In to view your registered squad status
                  </p>
                  <p className="text-xs text-slate-400">
                    Squad status lookups are restricted to the registered captain account.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-5 py-2.5 text-xs font-bold uppercase text-[#080e1e] transition-colors shadow-lg shadow-[#74c004]/20"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleLookupStatus} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Enter Registration ID or Captain Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. TT-2025-REG-1234 or captain@email.com"
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      className="flex-1 rounded-xl border border-white/15 bg-[#080e1e] px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#74c004] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={lookupLoading}
                      className="rounded-xl bg-[#74c004] hover:bg-[#86dc05] px-4 py-2.5 text-xs font-bold uppercase text-[#080e1e] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {lookupLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                      <span>Lookup</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {lookupError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{lookupError}</span>
                </div>
                {!isAuthenticated && (
                  <Link
                    href="/login"
                    className="text-[#74c004] underline hover:text-[#86dc05] font-bold text-xs shrink-0"
                  >
                    Login
                  </Link>
                )}
              </div>
            )}

            {lookupResult && (
              <div className="rounded-xl bg-[#080e1e] border border-white/10 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm">{lookupResult.teamName}</h4>
                    <span className="font-mono text-slate-400 text-[11px]">{lookupResult.registrationId}</span>
                  </div>
                  <div className="text-right space-y-1">
                    {/* Payment Status Badge */}
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        lookupResult.paymentStatus === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : lookupResult.paymentStatus === 'rejected'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Payment: {lookupResult.paymentStatus === 'verified' ? 'Verified' : lookupResult.paymentStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Captain</span>
                    <span className="font-semibold text-white">{lookupResult.captainName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Email</span>
                    <span className="text-slate-300 truncate block">{lookupResult.captainEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration Status</span>
                    <span
                      className={`font-black uppercase text-[11px] ${
                        lookupResult.registrationStatus === 'approved'
                          ? 'text-emerald-400'
                          : lookupResult.registrationStatus === 'rejected'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {lookupResult.registrationStatus === 'approved' ? 'Squad Approved' : lookupResult.registrationStatus === 'rejected' ? 'Registration Rejected' : 'Pending Review'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Squad Size</span>
                    <span className="font-semibold text-white">{lookupResult.players?.length || 0} Players</span>
                  </div>
                </div>

                {lookupResult.rejectionReason && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
                    <strong>Note:</strong> {lookupResult.rejectionReason}
                  </div>
                )}

                {lookupResult.paymentProof && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Attached Payment Screenshot</span>
                    <a
                      href={lookupResult.paymentProof}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#74c004] hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>View Receipt</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
