'use client'

import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import {
  clearSession as clearPersistedSession, getMyStats, getStoredUser, listCourses,
  saveSession as persistSession, updateStoredUser,
  type AuthResponse, type CourseListItem, type User,
} from './api'

// ---------------------------------------------------------------------------
// Session store — single source of truth for the logged-in user. Replaces
// the localStorage-hydrated useState that used to live directly in
// app/page.tsx, so any component can read it without prop drilling.
// ---------------------------------------------------------------------------

export type Role = 'learner' | 'admin'

interface SessionState {
  user: User | null
  role: Role
  hydrated: boolean
  hydrate: () => void
  setSession: (auth: AuthResponse) => void
  clearSession: () => void
  refreshStats: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  role: 'learner',
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return
    const stored = getStoredUser()
    set({ user: stored, role: stored?.role === 'ADMIN' ? 'admin' : 'learner', hydrated: true })
  },
  setSession: (auth) => {
    persistSession(auth)
    set({ user: auth.user, role: auth.user.role === 'ADMIN' ? 'admin' : 'learner' })
  },
  clearSession: () => {
    clearPersistedSession()
    set({ user: null, role: 'learner' })
  },
  refreshStats: async () => {
    if (!get().user) return
    try {
      const stats = await getMyStats()
      const updated = updateStoredUser({ xp: stats.xp, level: stats.level, streak: stats.streak })
      if (updated) set({ user: updated })
    } catch {
      // Non-fatal: local stats just won't refresh until the next successful call.
    }
  },
}))

// ---------------------------------------------------------------------------
// Courses store — shared cache so Home, Courses, and the admin Courses tab
// all read the same data instead of each firing their own listCourses() call.
// ---------------------------------------------------------------------------

interface CoursesState {
  items: CourseListItem[]
  loading: boolean
  error: string
  fetch: (opts?: { silent?: boolean }) => Promise<void>
}

export const useCoursesStore = create<CoursesState>((set, get) => ({
  items: [],
  loading: false,
  error: '',
  fetch: async (opts) => {
    if (!opts?.silent) set({ loading: get().items.length === 0, error: '' })
    try {
      const items = await listCourses()
      set({ items, loading: false })
    } catch {
      set({ error: 'Could not load courses. Is the backend running?', loading: false })
    }
  },
}))

// ---------------------------------------------------------------------------
// usePolling — calls fn(true) immediately, then fn(false) every intervalMs,
// so lists pick up changes made elsewhere (e.g. an admin adding a problem)
// without the viewer needing to manually refresh the page.
// ---------------------------------------------------------------------------

export function usePolling(fn: (isInitial: boolean) => void, intervalMs: number, deps: unknown[] = []) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    fnRef.current(true)
    const id = setInterval(() => fnRef.current(false), intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
