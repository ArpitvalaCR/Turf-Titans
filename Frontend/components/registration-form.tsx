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
  ShieldAlert
} from 'lucide-react'
import { submitRegistration, getEventRegistrationCount } from '@/lib/services'
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

export function RegistrationForm({ defaultEventId }: { defaultEventId?: string } = {}) {
  const searchParams = useSearchParams()
  const eventId = defaultEventId || searchParams.get('eventId')
  const { user, isAdmin } = useAuth()

  const [registrationId, setRegistrationId] = useState('TT-REG-NEW')
  const [copiedId, setCopiedId] = useState(false)

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

  // Optional Payment Screenshot (no UTR/Transaction fields)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  const [declaration, setDeclaration] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [regCount, setRegCount] = useState<{ registeredTeams: number; maxTeams: number } | null>(null)

  useEffect(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    setRegistrationId(`TT-2025-REG-${randomNum}`)

    if (eventId && /^[0-9a-fA-F]{24}$/.test(eventId)) {
      getEventRegistrationCount(eventId)
        .then((data) => setRegCount(data))
        .catch(() => setRegCount(null))
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
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setPaymentProofPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(registrationId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
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

      await submitRegistration({
        registrationId,
        teamName: teamName.trim() || 'Unnamed Squad',
        teamLogo: teamLogoPreview,
        captainName: captainName.trim() || 'Captain',
        captainEmail: emailAddress.trim() || 'contact@turftitans.com',
        captainPhone: mobileNumber.trim(),
        whatsappNumber: whatsappNumber.trim(),
        sport: 'cricket',
        paymentProof: paymentProofPreview,
        players: formattedPlayers,
        eventId: targetEventId,
      })

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
              href="/tournaments/turf-titans-2025?tab=registrations"
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

          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] uppercase tracking-wider font-semibold">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Admin Review & Verification</span>
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
              <span>/</span>
              <span className="text-[#74c004]">OFFICIAL SQUAD REGISTRATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display uppercase tracking-tight text-white leading-none">
              TEAM REGISTRATION & <span className="text-[#74c004]">SQUAD ROSTER</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Submit your official 10 Main Players + 1 Substitute team roster. Once reviewed and verified by the tournament desk, your team will be seeded into tournament groups.
            </p>
          </div>

          {/* Floating Registration ID card */}
          <div className="rounded-2xl border border-white/15 bg-[#0f182e] p-5 shadow-xl min-w-[280px]">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                REGISTRATION ID
              </span>
              <span className="rounded-full bg-[#74c004]/20 border border-[#74c004]/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#74c004]">
                AUTO-GENERATED
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-1">
              <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
                {registrationId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
                title="Copy Registration ID"
              >
                {copiedId ? <Check className="h-4 w-4 text-[#74c004]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Reference ID for registration verification & scorecards
            </p>
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
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                <span>● Awaiting Admin Verification</span>
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
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Squad Composition</span>
                <span className="font-bold text-[#74c004]">10 Main Players + 1 Substitute</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 max-w-lg mx-auto text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white flex items-center justify-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-[#74c004]" />
                <span>Next Step: Admin Verification</span>
              </p>
              <p className="text-slate-400">
                The tournament desk will verify your squad roster. Once approved, your team will be placed into the tournament draw and you can view live match schedules.
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
                      Confirmation letter & fixture schedules sent here
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        WHATSAPP NUMBER
                      </label>
                      <span className="text-[9px] font-bold uppercase text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        OPTIONAL
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full rounded-xl border border-white/15 bg-[#080e1e] px-4 py-3 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      For official captain WhatsApp announcement group
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TEAM DETAILS */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md">
                <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#74c004]">🛡️</span>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                      SECTION 2: TEAM DETAILS & CREST
                    </h2>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    CLUB BRAND
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
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

              {/* SECTION 4: PAYMENT SCREENSHOT (OPTIONAL ATTACHMENT) */}
              <div className="rounded-2xl border border-white/10 bg-[#0f182e] p-6 sm:p-8 shadow-md">
                <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#74c004]">📸</span>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                      SECTION 4: PAYMENT SCREENSHOT
                    </h2>
                  </div>
                  <span className="rounded bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-300">
                    OPTIONAL UPLOAD
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      ATTACH PAYMENT RECEIPT / SCREENSHOT
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-dashed border-white/15 bg-[#080e1e]/60 p-4 hover:border-[#74c004]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {paymentProofPreview ? (
                        <img
                          src={paymentProofPreview}
                          alt="Payment Proof"
                          className="h-14 w-14 rounded-lg object-cover border border-[#74c004]"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                          <Upload className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-white">
                          {paymentProofPreview ? 'Payment Screenshot Attached' : 'Attach payment screenshot (optional)'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          JPEG, PNG or image file. Allows tournament administrators to verify payment directly.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {paymentProofPreview && (
                        <button
                          type="button"
                          onClick={() => setPaymentProofPreview(null)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <label className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors shrink-0 cursor-pointer">
                        <span>{paymentProofPreview ? 'Change Screenshot' : 'Browse File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: FINAL DECLARATION */}
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
                    I confirm that the roster provided (10 Main Players + 1 Substitute) is accurate. I agree to Turf Titans tournament rules, code of conduct, and understand that registration is subject to Admin verification.
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
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-200 transition-colors"
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
                      SEASON 2025 SLOT PASS
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
                    <span>LUSH TURF MIRA RD</span>
                  </div>
                </div>

                {/* Roster Breakdown */}
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-semibold">
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
                    <span>₹35,000 CASH PRIZE POOL</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 font-medium">
                    Winner: ₹20,000 + Mega Trophy • Runner: ₹10,000
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
                  Lush Turf Arena
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Behind GCC Club, Mira Road East, Mumbai - 401107. Dual court floodlit arenas.
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
    </div>
  )
}
