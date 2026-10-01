'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch } from './api'

export type AuthUser = {
  _id: string
  name?: string
  username?: string
  email: string
  phone?: string
  role: 'user' | 'admin' | string
  isVerified?: boolean
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  loginWithGoogle: (payload: string | { credential?: string; idToken?: string; userInfo?: any }) => Promise<AuthUser>
  register: (name: string, email: string, phone: string, password: string) => Promise<{ email: string; message: string }>
  verifyOtp: (email: string, otp: string) => Promise<AuthUser>
  resendOtp: (email: string) => Promise<{ email: string; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const data = await apiFetch<AuthUser>('/api/v1/auth/me')
      setUser(data)
      return data
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tt_token')
      localStorage.removeItem('tt_refresh_token')
    }
    setUser(null)
    try {
      const res = await apiFetch<{ user: AuthUser; admin?: AuthUser; accessToken: string; refreshToken?: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const loggedUser = res.user || res.admin
      if (typeof window !== 'undefined') {
        if (res.accessToken) localStorage.setItem('tt_token', res.accessToken)
        if (res.refreshToken) localStorage.setItem('tt_refresh_token', res.refreshToken)
      }
      setUser(loggedUser)
      return loggedUser
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async (payload: string | { credential?: string; idToken?: string; userInfo?: any }): Promise<AuthUser> => {
    setLoading(true)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tt_token')
      localStorage.removeItem('tt_refresh_token')
    }
    setUser(null)
    try {
      const body = typeof payload === 'string' ? { credential: payload, idToken: payload } : payload
      const res = await apiFetch<{ user: AuthUser; admin?: AuthUser; accessToken: string; refreshToken?: string }>('/api/v1/auth/google', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const loggedUser = res.user || res.admin
      if (typeof window !== 'undefined') {
        if (res.accessToken) localStorage.setItem('tt_token', res.accessToken)
        if (res.refreshToken) localStorage.setItem('tt_refresh_token', res.refreshToken)
      }
      setUser(loggedUser)
      return loggedUser
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    setLoading(true)
    try {
      const res = await apiFetch<{ email: string; message: string }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password }),
      })
      return res
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (email: string, otp: string): Promise<AuthUser> => {
    setLoading(true)
    try {
      const res = await apiFetch<{ user: AuthUser; accessToken: string; refreshToken?: string }>('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      })
      if (typeof window !== 'undefined') {
        if (res.accessToken) localStorage.setItem('tt_token', res.accessToken)
        if (res.refreshToken) localStorage.setItem('tt_refresh_token', res.refreshToken)
      }
      setUser(res.user)
      return res.user
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async (email: string) => {
    return apiFetch<{ email: string; message: string }>('/api/v1/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
  }

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors during logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tt_token')
        localStorage.removeItem('tt_refresh_token')
      }
      setUser(null)
      router.push('/login')
    }
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role?.toLowerCase() === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
