'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
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
                SPORTS TOURNAMENT PLATFORM
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#74c004]/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Turf Titans"
              className="inline-block h-16 w-16 rounded-2xl object-contain shadow-[0_0_25px_rgba(116,192,4,0.4)] mb-3"
            />
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              FORGOT <span className="text-[#74c004]">PASSWORD</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Enter your registered email address to receive secure reset instructions
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d162a] p-8 shadow-2xl space-y-6">
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#74c004] text-[#060b18]">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-white">
                  Reset Link Sent
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If an account exists for <span className="text-[#74c004] font-bold">{email}</span>, a secure password reset link has been sent to your inbox.
                </p>
                <p className="text-[11px] text-slate-400">
                  Please check your spam or promotions folder if it doesn&apos;t arrive within a couple of minutes.
                </p>
                <div className="pt-4 border-t border-white/10">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-[#74c004] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md hover:bg-[#86dc05] transition-all"
                  >
                    <span>Return to Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Registered Email Address <span className="text-[#74c004]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="captain@turftitans.com"
                      className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-3 pl-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
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
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={3} />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
                  <span>Remembered your password? </span>
                  <Link href="/login" className="text-[#74c004] font-bold hover:underline">
                    Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#050814] px-4 py-4 text-center text-xs text-slate-500">
        © 2025 Turf Titans Sports Championship Platform. All Rights Reserved.
      </footer>
    </div>
  )
}
