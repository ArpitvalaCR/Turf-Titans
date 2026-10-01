'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Missing or invalid reset token. Please request a new link.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      })
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <img
          src="/logo.png"
          alt="Turf Titans"
          className="inline-block h-16 w-16 rounded-2xl object-contain shadow-[0_0_25px_rgba(116,192,4,0.4)] mb-3"
        />
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          SET NEW <span className="text-[#74c004]">PASSWORD</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Create a secure password for your Turf Titans account
        </p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-white/10 bg-[#0d162a] p-8 shadow-2xl space-y-6">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#74c004] text-[#060b18]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-white">
              Password Updated
            </h3>
            <p className="text-xs text-slate-300">
              Your password has been changed successfully. Redirecting to login...
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#74c004] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md hover:bg-[#86dc05] transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold uppercase text-white">
              Invalid or Missing Token
            </h3>
            <p className="text-xs text-slate-400">
              No reset token found in this link. Please request a new password reset link.
            </p>
            <div className="pt-2">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 rounded-full bg-[#74c004] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md hover:bg-[#86dc05] transition-all"
              >
                <span>Request New Link</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                New Password <span className="text-[#74c004]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-3 pl-10 pr-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm New Password <span className="text-[#74c004]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-3 pl-10 pr-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 font-semibold flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] py-3.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-[0_0_20px_rgba(116,192,4,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
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
                SPORTS TOURNAMENT PLATFORM
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#74c004]/10 blur-3xl pointer-events-none" />

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 text-[#74c004] animate-spin" />
            <span className="text-xs uppercase font-bold tracking-wider">Loading Reset Portal...</span>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#050814] px-4 py-4 text-center text-xs text-slate-500">
        © 2025 Turf Titans Sports Championship Platform. All Rights Reserved.
      </footer>
    </div>
  )
}
