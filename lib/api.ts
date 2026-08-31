const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Core types (mirror the FastAPI Pydantic schemas)
// ---------------------------------------------------------------------------

export type Role = 'STUDENT' | 'ADMIN'
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'TOFFOLI' | 'MEASURE'

export interface GateOp {
  type: GateType
  qubit: number
  target?: number | null
  controls?: number[] | null
  step: number
}

export interface Circuit {
  qubits: number
  gates: GateOp[]
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  xp: number
  level: number
  streak: number
  lastActiveDate: string | null
  createdAt: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ComplexNum {
  re: number
  im: number
}

export interface SimulateResult {
  finalStatevector: ComplexNum[]
  probabilities: Record<string, number>
  intermediateStatevectors: ComplexNum[][]
}

export interface BadgeOut {
  id: string
  name: string
  description: string
  icon: string
}

// All badge definitions including unearned ones (for locked/unlocked display)
export interface BadgePublicOut {
  id: string
  name: string
  description: string
  icon: string
}

export interface SubmitResponse {
  correct: boolean
  yourResult: SimulateResult
  expectedResult: SimulateResult | null
  xpEarned: number
  newBadges: BadgeOut[]
}

export interface ProblemListItem {
  id: string
  title: string
  difficulty: Difficulty
  topic: string
  isDaily: boolean
  scheduledDate: string | null
  createdAt: string
}

export interface PaginatedProblems {
  items: ProblemListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProblemDetail {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  topic: string
  hints: string[]
  isDaily: boolean
  scheduledDate: string | null
  createdAt: string
  solved: boolean
  solutionCircuit: Circuit | null
}

export interface DailyProblem {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  topic: string
  hints: string[]
  scheduledDate: string | null
}

export interface CourseListItem {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  order: number
  problemCount: number
  createdAt: string
}

export interface CourseProblemItem {
  orderIndex: number
  problemId: string
  title: string
  difficulty: Difficulty
  topic: string
}

export interface CourseDetail {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  order: number
  problems: CourseProblemItem[]
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  level: number
  xp: number
  periodXp: number
}

export interface LeaderboardResponse {
  period: 'all' | 'weekly'
  items: LeaderboardEntry[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface UserBadgeOut {
  badge: BadgeOut
  unlockedAt: string
}

export interface UserStats {
  userId: string
  name: string
  xp: number
  level: number
  streak: number
  badges: UserBadgeOut[]
  solvedByDifficulty: Record<string, number>
  activityMap: Record<string, number>
}

export interface QuestionOut {
  id: string
  problemId: string | null
  circuitContext: Circuit | null
  questionText: string
  options: string[]
  correctOptionIndex: number
  explanation: string
  aiGenerated: boolean
  approved: boolean
  createdAt: string
}

export interface AttemptResponse {
  correct: boolean
  correctOptionIndex: number
  explanation: string
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ChatResponse =
  | { type: 'explanation'; text: string }
  | { type: 'action'; action: 'add_gate' | 'remove_gate'; gate: GateOp }

export interface GateOut {
  id: string
  name: string
  symbol: string
  matrixDefinition: unknown
  description: string
  createdBy: string
  createdAt: string
}

// ---- Admin ----

export interface ProblemAdminOut extends ProblemListItem {
  description: string
  solutionCircuit: Circuit
  hints: string[]
}

export interface CourseOut {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  order: number
  createdAt: string
}

export interface UserAdminOut {
  id: string
  email: string
  name: string
  role: Role
  xp: number
  level: number
  streak: number
  createdAt: string
}

export interface PaginatedUsers {
  items: UserAdminOut[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginatedQuestions {
  items: QuestionOut[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AnalyticsResponse {
  activeUsers: { last7Days: number; last30Days: number }
  dailySubmissions: { date: string; count: number }[]
  mostAttemptedProblems: { problemId: string; title: string; attempts: number }[]
  completionRateByDifficulty: Record<string, number>
  hardestQuestions: { questionId: string; questionText: string; attempts: number; incorrectRate: number }[]
}

// ---------------------------------------------------------------------------
// Request plumbing
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const TOKEN_KEY = 'qubitlab_token'
const USER_KEY = 'qubitlab_user'
// Hardcoded-admin session token — stored separately from the regular user
// session (see AdminLogin in app/page.tsx), so it needs its own reader.
const ADMIN_TOKEN_KEY = 'qubitlab_admin_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.access_token)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function updateStoredUser(patch: Partial<User>): User | null {
  const current = getStoredUser()
  if (!current) return null
  const updated = { ...current, ...patch }
  localStorage.setItem(USER_KEY, JSON.stringify(updated))
  return updated
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
}

async function request<T>(path: string, options: RequestInit = {}, auth: boolean | 'admin' = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) }
  if (auth) {
    const token = auth === 'admin' ? getAdminToken() : getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = body?.detail
    const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ') : `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

const get = <T>(path: string, params?: Record<string, any>, auth: boolean | 'admin' = false) => request<T>(`${path}${buildQuery(params)}`, { method: 'GET' }, auth)
const post = <T>(path: string, body?: unknown, auth: boolean | 'admin' = false) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, auth)
const put = <T>(path: string, body?: unknown, auth: boolean | 'admin' = false) => request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }, auth)
const del = <T>(path: string, auth: boolean | 'admin' = false) => request<T>(path, { method: 'DELETE' }, auth)

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const signup = (email: string, password: string, name: string) => post<AuthResponse>('/auth/signup', { email, password, name })
export const login = (email: string, password: string) => post<AuthResponse>('/auth/login', { email, password })

// Hardcoded admin login — completely separate from the user auth system.
// Credentials are validated against ADMIN_EMAIL / ADMIN_PASSWORD env vars (no DB lookup).
export interface AdminAuthResponse {
  access_token: string
  token_type: string
}
export const adminLogin = (email: string, password: string) => post<AdminAuthResponse>('/admin/auth/login', { email, password })

// ---------------------------------------------------------------------------
// Problems / courses / simulation
// ---------------------------------------------------------------------------

export const listProblems = (params: { difficulty?: Difficulty; topic?: string; search?: string; page?: number; pageSize?: number } = {}) =>
  get<PaginatedProblems>('/problems', params)

export const getDailyProblem = () => get<DailyProblem>('/problems/daily')

export const getProblem = (id: string) => get<ProblemDetail>(`/problems/${id}`, undefined, true)

export const submitProblem = (id: string, circuit: Circuit) => post<SubmitResponse>(`/problems/${id}/submit`, circuit, true)

export const listCourses = () => get<CourseListItem[]>('/courses')

export const getCourse = (id: string) => get<CourseDetail>(`/courses/${id}`)

export const simulate = async (circuit: Circuit) => {
  try {
    return await post<SimulateResult>('/simulate', circuit)
  } catch {
    const { simulateLocal } = await import('@/lib/simulator')
    return simulateLocal(circuit)
  }
}

export const listGates = () => get<GateOut[]>('/gates')

// Returns the admin-stored solution circuit for a problem, always (no auth needed).
// Used by the 'View Solution' confirmation flow in the user questions panel.
export interface ProblemSolutionResult {
  problemId: string
  solutionCircuit: Circuit
}
export const getProblemSolution = (id: string) => get<ProblemSolutionResult>(`/problems/${id}/solution`)

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------

export const getLeaderboard = (period: 'all' | 'weekly' = 'all', page = 1, pageSize = 20) =>
  get<LeaderboardResponse>('/leaderboard', { period, page, pageSize })

export const getMyStats = () => get<UserStats>('/users/me/stats', undefined, true)

// Returns all badge definitions (public, no auth). Used to show locked/unlocked badges.
export const listAllBadges = () => get<BadgePublicOut[]>('/badges')

export const attemptQuestion = (id: string, selectedOptionIndex: number) =>
  post<AttemptResponse>(`/questions/${id}/attempt`, { selectedOptionIndex }, true)

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const aiChat = (circuitJson: Circuit, message: string, conversationHistory: ChatMessage[] = []) =>
  post<ChatResponse>('/ai/chat', { circuitJson, message, conversationHistory })

export const generateQuiz = (payload: { circuitJson?: Circuit; topic?: string }) =>
  post<QuestionOut>('/ai/quiz/generate', payload)

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface ProblemInput {
  title: string
  description: string
  difficulty: Difficulty
  topic: string
  solutionCircuit: Circuit
  hints: string[]
  isDaily?: boolean
}

export const adminCreateProblem = (payload: ProblemInput) => post<ProblemAdminOut>('/admin/problems', payload, 'admin')
export const adminGetProblem = (id: string) => get<ProblemAdminOut>(`/admin/problems/${id}`, undefined, 'admin')
export const adminUpdateProblem = (id: string, payload: Partial<ProblemInput>) => put<ProblemAdminOut>(`/admin/problems/${id}`, payload, 'admin')
export const adminDeleteProblem = (id: string) => del<void>(`/admin/problems/${id}`, 'admin')
export const adminScheduleProblem = (id: string, date: string) => post<ProblemAdminOut>(`/admin/problems/${id}/schedule`, { date }, 'admin')
export const adminListScheduled = () => get<ProblemAdminOut[]>('/admin/problems/scheduled/upcoming', undefined, 'admin')

export interface GateInput {
  name: string
  symbol: string
  matrixDefinition: unknown
  description: string
}

export const adminCreateGate = (payload: GateInput) => post<GateOut>('/admin/gates', payload, 'admin')
export const adminUpdateGate = (id: string, payload: Partial<GateInput>) => put<GateOut>(`/admin/gates/${id}`, payload, 'admin')
export const adminDeleteGate = (id: string) => del<void>(`/admin/gates/${id}`, 'admin')

export interface CourseInput {
  title: string
  description: string
  difficulty: Difficulty
  order: number
}

export const adminCreateCourse = (payload: CourseInput) => post<CourseOut>('/admin/courses', payload, 'admin')
export const adminUpdateCourse = (id: string, payload: Partial<CourseInput>) => put<CourseOut>(`/admin/courses/${id}`, payload, 'admin')
export const adminDeleteCourse = (id: string) => del<void>(`/admin/courses/${id}`, 'admin')
export const adminAddCourseProblem = (courseId: string, problemId: string, orderIndex?: number) =>
  post<CourseProblemItem[]>(`/admin/courses/${courseId}/problems`, { problemId, orderIndex }, 'admin')
export const adminRemoveCourseProblem = (courseId: string, problemId: string) =>
  del<CourseProblemItem[]>(`/admin/courses/${courseId}/problems/${problemId}`, 'admin')
export const adminReorderCourse = (courseId: string, problemIds: string[]) =>
  put<CourseProblemItem[]>(`/admin/courses/${courseId}/reorder`, { problemIds }, 'admin')

export const adminListUsers = (params: { search?: string; role?: Role; page?: number; pageSize?: number } = {}) =>
  get<PaginatedUsers>('/admin/users', params, 'admin')

export const adminListPendingQuestions = (page = 1, pageSize = 20) =>
  get<PaginatedQuestions>('/admin/questions', { page, pageSize }, 'admin')
export const adminApproveQuestion = (id: string) => put<QuestionOut>(`/admin/questions/${id}/approve`, undefined, 'admin')
export const adminEditQuestion = (
  id: string,
  payload: Partial<{ questionText: string; options: string[]; correctOptionIndex: number; explanation: string }>
) => put<QuestionOut>(`/admin/questions/${id}/edit`, payload, 'admin')

export const adminGetAnalytics = () => get<AnalyticsResponse>('/admin/analytics', undefined, 'admin')
