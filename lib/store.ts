'use client'

import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import {
  adminGetAnalytics, adminListPendingQuestions, adminListScheduled,
  clearSession as clearPersistedSession, getDailyProblem, getMyStats,
  getStoredUser, listAllBadges, listCourses, listProblems,
  saveSession as persistSession, updateStoredUser,
  type AnalyticsResponse, type AuthResponse, type BadgePublicOut,
  type CourseListItem, type DailyProblem, type PaginatedQuestions,
  type ProblemAdminOut, type User, type UserStats,
} from './api'

// ---------------------------------------------------------------------------
// Session store — single source of truth for the logged-in user.
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
      // Non-fatal
    }
  },
}))

// ---------------------------------------------------------------------------
// Courses store — shared cache across Home, Courses, and admin Courses tab.
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
// Dashboard store — stats, daily problem, badges with auto-polling support.
// ---------------------------------------------------------------------------

interface DashboardState {
  stats: UserStats | null
  daily: DailyProblem | null
  dailyChecked: boolean
  allBadges: BadgePublicOut[]
  statsError: string
  loading: boolean
  lastFetched: number
  fetchAll: (user: User | null, opts?: { silent?: boolean }) => Promise<void>
  fetchBadges: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  daily: null,
  dailyChecked: false,
  allBadges: [],
  statsError: '',
  loading: false,
  lastFetched: 0,

  fetchBadges: async () => {
    try {
      const allBadges = await listAllBadges()
      set({ allBadges })
    } catch {
      // non-fatal
    }
  },

  fetchAll: async (user, opts) => {
    if (!opts?.silent) set({ loading: true, statsError: '' })
    const promises: Promise<void>[] = []

    // Stats (requires auth)
    if (user) {
      promises.push(
        getMyStats()
          .then(stats => set({ stats }))
          .catch(err => set({ statsError: err?.message ?? 'Could not load your stats.' }))
      )
    }

    // Daily problem
    promises.push(
      getDailyProblem()
        .then(daily => set({ daily, dailyChecked: true }))
        .catch(() => set({ daily: null, dailyChecked: true }))
    )

    // Badges (only fetch once unless allBadges is empty)
    if (get().allBadges.length === 0) {
      promises.push(
        listAllBadges()
          .then(allBadges => set({ allBadges }))
          .catch(() => {})
      )
    }

    await Promise.allSettled(promises)
    set({ loading: false, lastFetched: Date.now() })
  },
}))

// ---------------------------------------------------------------------------
// Admin store — analytics, pending questions, scheduled problems.
// ---------------------------------------------------------------------------

interface AdminState {
  analytics: AnalyticsResponse | null
  analyticsLoading: boolean
  analyticsError: string
  pendingQuestions: PaginatedQuestions | null
  pendingLoading: boolean
  scheduled: ProblemAdminOut[]
  scheduledLoading: boolean
  problemsTotal: number
  fetchAnalytics: (opts?: { silent?: boolean }) => Promise<void>
  fetchPending: (opts?: { silent?: boolean }) => Promise<void>
  fetchScheduled: (opts?: { silent?: boolean }) => Promise<void>
  fetchProblemsTotal: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set) => ({
  analytics: null,
  analyticsLoading: false,
  analyticsError: '',
  pendingQuestions: null,
  pendingLoading: false,
  scheduled: [],
  scheduledLoading: false,
  problemsTotal: 0,

  fetchAnalytics: async (opts) => {
    if (!opts?.silent) set({ analyticsLoading: true, analyticsError: '' })
    try {
      const analytics = await adminGetAnalytics()
      set({ analytics, analyticsLoading: false })
    } catch (err: any) {
      set({ analyticsError: err?.message ?? 'Could not load analytics.', analyticsLoading: false })
    }
  },

  fetchPending: async (opts) => {
    if (!opts?.silent) set({ pendingLoading: true })
    try {
      const pendingQuestions = await adminListPendingQuestions(1, 50)
      set({ pendingQuestions, pendingLoading: false })
    } catch {
      set({ pendingLoading: false })
    }
  },

  fetchScheduled: async (opts) => {
    if (!opts?.silent) set({ scheduledLoading: true })
    try {
      const scheduled = await adminListScheduled()
      set({ scheduled, scheduledLoading: false })
    } catch {
      set({ scheduledLoading: false })
    }
  },

  fetchProblemsTotal: async () => {
    try {
      const data = await listProblems({ pageSize: 1 })
      set({ problemsTotal: data.total })
    } catch {
      // non-fatal
    }
  },
}))

// ---------------------------------------------------------------------------
// usePolling — calls fn(true) immediately, then fn(false) every intervalMs,
// so lists pick up changes made elsewhere without a full page reload.
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
