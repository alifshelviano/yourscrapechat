"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

type User = { email: string }
type AuthContextValue = {
  user: User | null
  signIn: (opts: { email: string; password: string }) => Promise<void>
  signUp: (opts: { email: string; password: string }) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "auth_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore corrupted storage
    }
  }, [])

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_KEY)
  }

  const signIn = useCallback(async ({ email }: { email: string; password: string }) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 400))
    const u = { email }
    setUser(u)
    persist(u)
  }, [])

  const signUp = useCallback(async ({ email }: { email: string; password: string }) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 500))
    const u = { email }
    setUser(u)
    persist(u)
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    persist(null)
  }, [])

  const value: AuthContextValue = { user, signIn, signUp, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
