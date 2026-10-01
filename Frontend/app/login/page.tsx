'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

declare global {
  interface Window {
    google?: any
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/tournaments'
  const { login, loginWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isInitializedRef = useRef(false)

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle(credential)
      setSuccess(true)
      setTimeout(() => {
        router.push(redirectUrl)
      }, 700)
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }, [loginWithGoogle, redirectUrl, router])

  const initGoogleAuth = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
    if (!clientId) {
      return
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      const container = document.getElementById('googleSignInBtnContainer')
      if (!container) return

      if (!isInitializedRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response?.credential) {
                handleGoogleSuccess(response.credential)
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          isInitializedRef.current = true
        } catch (err) {
          console.error('Google Auth Init Error:', err)
          return
        }
      }

      try {
        container.innerHTML = ''
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 384,
          logo_alignment: 'left',
        })
      } catch (err) {
        console.error('Google Button Render Error:', err)
      }
    }
  }, [handleGoogleSuccess])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initGoogleAuth()
    }
  }, [initGoogleAuth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      setSuccess(true)
      setTimeout(() => {
        router.push(redirectUrl)
      }, 700)
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleAuth}
      />

      {/* Brand Header */}
      <div className="text-center mb-8">
        <img
          src="/logo.png"
          alt="Turf Titans"
          className="inline-block h-16 w-16 rounded-2xl object-contain shadow-[0_0_25px_rgba(116,192,4,0.4)] mb-3"
        />
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          SIGN IN TO <span className="text-[#74c004]">TURF TITANS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Access tournament management, fixtures, squad rosters & live scoring
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl border border-white/10 bg-[#0d162a] p-8 shadow-2xl space-y-6">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#74c004] text-[#060b18]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-white">
              Authenticated Successfully
            </h3>
            <p className="text-xs text-slate-300">
              Redirecting to the Tournament Page...
            </p>
            <div className="pt-2">
              <Link
                href={redirectUrl}
                className="inline-flex items-center gap-2 rounded-full bg-[#74c004] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-md hover:bg-[#86dc05] transition-all"
              >
                <span>Proceed to Tournaments</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Google Sign In Button Container */}
            <div className="w-full flex flex-col items-center justify-center">
              {googleLoading ? (
                <div className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-[#162035] py-3.5 px-4 text-xs font-bold text-white shadow-md">
                  <Loader2 className="h-4 w-4 text-[#74c004] animate-spin" />
                  <span>Authenticating with Google...</span>
                </div>
              ) : (
                <div className="w-full flex justify-center items-center min-h-[44px]">
                  <div
                    id="googleSignInBtnContainer"
                    className="w-full flex justify-center [&_iframe]:!rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                OR CONTINUE WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address <span className="text-[#74c004]">*</span>
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password <span className="text-[#74c004]">*</span>
                  </label>
                  <Link href="/forgot-password" className="text-[11px] text-slate-400 hover:text-[#74c004] transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-[#060b18] px-4 py-3 pl-10 pr-10 text-sm text-white focus:border-[#74c004] focus:outline-none focus:ring-1 focus:ring-[#74c004] placeholder:text-slate-500"
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#060b18] text-[#74c004] focus:ring-[#74c004] accent-[#74c004]"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-300 font-medium">
                  Remember my credentials
                </label>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 font-semibold space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                  {(error.toLowerCase().includes('not verified') || error.toLowerCase().includes('verify your otp') || error.toLowerCase().includes('otp')) && (
                    <div className="pt-1 pl-6">
                      <Link
                        href={`/signup?email=${encodeURIComponent(email)}&step=otp`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#74c004] hover:underline"
                      >
                        <span>Enter OTP Code & Verify Account</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#74c004] hover:bg-[#86dc05] py-3.5 text-xs font-black uppercase tracking-wider text-[#060b18] shadow-[0_0_20px_rgba(116,192,4,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Tournament'}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          <span>Don&apos;t have an account? </span>
          <Link href="/signup" className="text-[#74c004] font-bold hover:underline">
            Create Account / Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
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
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Back to Home
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#162035] hover:bg-[#1f2d4a] px-4 py-1.5 text-xs text-white border border-white/10 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#74c004]/10 blur-3xl pointer-events-none" />

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 text-[#74c004] animate-spin" />
            <span className="text-xs uppercase font-bold tracking-wider">Loading Sign In Portal...</span>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#050814] px-4 py-4 text-center text-xs text-slate-500">
        © 2025 Turf Titans Sports Championship Platform. All Rights Reserved.
      </footer>
    </div>
  )
}
