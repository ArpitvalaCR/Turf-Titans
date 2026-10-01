'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, KeyRound, RefreshCw, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, verifyOtp, resendOtp } = useAuth()

  const initialEmail = searchParams.get('email') || ''
  const initialStep = searchParams.get('step') === 'otp' && initialEmail ? 2 : 1

  // Form step: 1 = Register form, 2 = OTP verification form
  const [step, setStep] = useState<1 | 2>(initialStep)

  // Registration form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  useEffect(() => {
    const qEmail = searchParams.get('email')
    const qStep = searchParams.get('step')
    if (qEmail) {
      setEmail(qEmail)
      if (qStep === 'otp') {
        setStep(2)
      }
    }
  }, [searchParams])

  // OTP state
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const [resendSuccessMsg, setResendSuccessMsg] = useState('')

  // UI status
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      await register(name, email, phone, password)
      setStep(2)
      setOtp('')
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResendSuccessMsg('')

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email, otp)
      setSuccess(true)
      setTimeout(() => {
        router.push('/tournaments')
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return
    setError('')
    setResending(true)
    setResendSuccessMsg('')

    try {
      const res = await resendOtp(email)
      setResendSuccessMsg(res?.message || 'Verification code resent successfully!')
      setOtp('')
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060b18] text-white flex flex-col justify-between selection:bg-[#74c004] selection:text-[#060b18]">
      {/* Top Header */}
      <header className="w-full bg-[#060b18]/90 border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Turf Titans"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <div className="flex flex-col">
              <span className="font-display text-sm font-black tracking-wider uppercase text-white leading-none">
                TURF <span className="text-[#74c004]">TITANS</span>
              </span>
              <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                BOX CRICKET SHOWDOWN
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Back to Home
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#74c004] hover:bg-[#86dc05] px-4 py-1.5 text-xs text-[#060b18] font-black transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Signup Form Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#74c004]/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">

          {/* Brand Header */}
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Turf Titans"
              className="inline-block h-16 w-16 rounded-2xl object-contain shadow-[0_0_25px_rgba(116,192,4,0.4)] mb-3"
            />
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              {step === 1 ? (
                <>CREATE YOUR <span className="text-[#74c004]">ACCOUNT</span></>
              ) : (
                <>VERIFY <span className="text-[#74c004]">SECURITY OTP</span></>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {step === 1
                ? 'Join Turf Titans to manage teams, track matches, and access official features'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Signup Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0d162a] p-8 shadow-2xl space-y-6">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#74c004] text-[#060b18]">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-white">
                  Account Verified & Activated
                </h3>
                <p className="text-xs text-slate-300">
                  Welcome aboard! Redirecting you to the Tournament Portal...
                </p>
                <div className="pt-2">
                  <Link
                    href="/tournaments"
                    className="inline-flex items-center gap-2 rounded-full bg-[#74c004] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md hover:bg-[#86dc05] transition-all"
                  >
                    <span>Go to Tournaments</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Full Name <span className="text-[#74c004]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Captain or Player Name"
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 pl-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address <span className="text-[#74c004]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="captain@turftitans.com"
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 pl-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Mobile Number <span className="text-[#74c004]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98201 44598"
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 pl-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Password <span className="text-[#74c004]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 pl-10 pr-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                      />
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Confirm <span className="text-[#74c004]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-2.5 pl-10 pr-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                      />
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-[#060b18] text-[#74c004] focus:ring-[#74c004] accent-[#74c004]"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-slate-300 font-medium">
                    I agree to the Turf Titans tournament regulations & terms
                  </label>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 font-semibold">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] py-3.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-[0_0_20px_rgba(116,192,4,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Sending Verification OTP...' : 'Send OTP & Continue'}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="rounded-2xl bg-[#060b18] border border-white/10 p-4 text-center">
                  <span className="text-xs text-slate-400">Verifying address:</span>
                  <p className="text-sm font-bold text-[#74c004]">{email}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 text-center">
                    Enter 6-Digit OTP Code <span className="text-[#74c004]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] text-2xl font-black rounded-xl border border-white/20 bg-[#060b18] py-3 text-[#74c004] focus:border-[#74c004] focus:outline-none focus:ring-2 focus:ring-[#74c004]/50 placeholder:text-slate-600 placeholder:tracking-normal"
                    />
                    <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 font-semibold">
                    {error}
                  </div>
                )}

                {resendSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#74c004]/10 border border-[#74c004]/30 p-3 text-xs text-[#74c004] font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{resendSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] py-3.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-[0_0_20px_rgba(116,192,4,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Verify & Activate Account'}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setError('')
                      setResendSuccessMsg('')
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || resending}
                    onClick={handleResendOtp}
                    className="flex items-center gap-1.5 text-[#74c004] hover:underline font-bold disabled:text-slate-500 disabled:no-underline cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
              <span>Already have an account? </span>
              <Link href="/login" className="text-[#74c004] font-bold hover:underline">
                Sign In to Portal
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#050814] px-4 py-4 text-center text-xs text-slate-500">
        © 2025 Turf Titans Box Cricket Championship. All Rights Reserved.
      </footer>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060b18] text-white flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="h-8 w-8 text-[#74c004] animate-spin" />
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Loading Registration Portal...</span>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
