'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ShieldAlert, Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [loading, isAuthenticated, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b18] text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-[#0d162a] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(116,192,4,0.2)]">
              <img src="/logo.png" alt="Turf Titans" className="h-10 w-10 object-contain" />
            </div>
            <Loader2 className="absolute -bottom-2 -right-2 h-6 w-6 text-[#74c004] animate-spin" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Verifying Session Access...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
