'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity, ArrowRight, BarChart3, BookOpen, Calendar, Check,
  ChevronDown, ChevronUp, CircuitBoard, HelpCircle, Plus, Settings,
  ShieldCheck, Trash2, Users, X, Zap,
} from 'lucide-react'
import {
  ApiError,
  adminAddCourseProblem, adminApproveQuestion, adminCreateCourse, adminCreateGate,
  adminCreateProblem, adminDeleteCourse, adminDeleteGate, adminDeleteProblem, adminEditQuestion,
  adminGetProblem, adminListUsers, adminRemoveCourseProblem, adminReorderCourse,
  adminScheduleProblem, adminUpdateCourse, adminUpdateGate, adminUpdateProblem,
  getCourse, listGates, listProblems,
  type AnalyticsResponse, type CourseDetail, type CourseInput, type CourseListItem,
  type Difficulty, type GateInput, type GateOut, type ProblemAdminOut,
  type ProblemInput, type ProblemListItem, type QuestionOut, type Role,
} from '@/lib/api'
import { useAdminStore, useCoursesStore, usePolling } from '@/lib/store'
import { ErrorBox, Loading } from '@/components/shared'

const TABS = [
  { id: 'schedule',  label: 'Daily Problem',  icon: Calendar },
  { id: 'problems',  label: 'Problems',        icon: CircuitBoard },
  { id: 'courses',   label: 'Courses',         icon: BookOpen },
  { id: 'gates',     label: 'Gates',           icon: Zap },
  { id: 'users',     label: 'Users',           icon: Users },
  { id: 'questions', label: 'Questions',       icon: HelpCircle },
  { id: 'analytics', label: 'Analytics',       icon: BarChart3 },
] as const
type TabId = typeof TABS[number]['id']

export default function Admin({ setView }: { setView: (v: any) => void }) {
  const [tab, setTab] = useState<TabId>('schedule')

  return (
    <div className="admin-page">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="adm-header">
        <div className="adm-header-left">
          <p className="eyebrow">QUBITLAB / ADMIN</p>
          <h1 className="adm-title">Control room</h1>
          <p className="adm-subtitle">Curate the learning experience and keep the lab humming.</p>
        </div>
        <button className="outline-btn adm-exit-btn" onClick={() => setView('home')}>
          <ArrowRight size={14} /> Exit admin
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="adm-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`adm-tab${tab === id ? ' adm-tab-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab panels ──────────────────────────────────────── */}
      <div className="adm-body">
        {tab === 'schedule'  && <ScheduleTab />}
        {tab === 'problems'  && <ProblemsTab />}
        {tab === 'courses'   && <CoursesTab />}
        {tab === 'gates'     && <GatesTab />}
        {tab === 'users'     && <UsersTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  )
}

/* ── useAsync: local fetch helper for per-tab data ────────────────────────── */
function useAsync<T>(fn: () => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    setLoading(true); setError('')
    fn().then(setData).catch(err => setError(err instanceof ApiError ? err.message : 'Request failed.')).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { data, error, loading, refresh: () => setTick(t => t + 1) }
}

/* ── Shared panel wrapper ──────────────────────────────────────────────────── */
function AdminPanel({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`adm-panel ${className}`} style={style}>{children}</div>
}

/* ── SELECT helper ─────────────────────────────────────────────────────────── */
const selectStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 7,
  background: 'var(--bg)', border: '1px solid var(--line)',
  borderRadius: 7, padding: '10px 12px', color: 'var(--text)',
  fontSize: 13, outline: 'none',
}

/* ═══════════════════════════ SCHEDULE TAB ══════════════════════════════════ */

function ScheduleTab() {
  const { scheduled, scheduledLoading, fetchScheduled } = useAdminStore()
  const problems = useAsync(() => listProblems({ pageSize: 100 }), [])
  const [problemId, setProblemId] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const pollScheduled = useCallback((isInitial: boolean) => fetchScheduled({ silent: !isInitial }), [fetchScheduled])
  usePolling(pollScheduled, 60_000)

  const submit = async () => {
    if (!problemId || !date) { setError('Pick a problem and a date.'); return }
    setSaving(true); setError('')
    try {
      await adminScheduleProblem(problemId, date)
      setProblemId(''); setDate('')
      fetchScheduled()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not schedule this problem.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="adm-two-col">
      <AdminPanel>
        <div className="panel-title"><h2 className="adm-panel-h">Schedule a Daily Problem</h2></div>
        {problems.loading && <Loading />}
        {problems.data && (
          <label className="adm-label">Problem
            <select value={problemId} onChange={e => setProblemId(e.target.value)} style={selectStyle}>
              <option value="">Select a problem…</option>
              {problems.data.items.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
              ))}
            </select>
          </label>
        )}
        <label className="adm-label">Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="adm-input" />
        </label>
        {error && <ErrorBox message={error} />}
        <button className="pill-btn full" onClick={submit} disabled={saving} style={{ marginTop: 18 }}>
          {saving ? 'Scheduling…' : 'Schedule'} <Check size={14} />
        </button>
      </AdminPanel>

      <AdminPanel>
        <div className="panel-title">
          <h2 className="adm-panel-h">Upcoming schedule</h2>
          <span className="muted" style={{ fontSize: 11 }}>auto-refreshing</span>
        </div>
        {scheduledLoading && <Loading />}
        {!scheduledLoading && scheduled.length === 0 && (
          <p className="muted" style={{ fontSize: 13 }}>Nothing scheduled yet.</p>
        )}
        <div className="adm-schedule-list">
          {scheduled.map((p, i) => (
            <div key={p.id} className="adm-schedule-row">
              <span className={`adm-schedule-dot${i === 0 ? ' next' : ''}`} />
              <div className="adm-schedule-info">
                <strong>{p.title}</strong>
                <small>{p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</small>
              </div>
              {i === 0 && <span className="adm-next-badge">Next up</span>}
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  )
}

/* ═══════════════════════════ PROBLEMS TAB ══════════════════════════════════ */

const emptyProblem: ProblemInput = { title: '', description: '', difficulty: 'BEGINNER', topic: '', solutionCircuit: { qubits: 2, gates: [] }, hints: [], isDaily: false }

function ProblemsTab() {
  const list = useAsync(() => listProblems({ pageSize: 50 }), [])
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  if (editing) return <ProblemEditor id={editing === 'new' ? null : editing} onDone={() => { setEditing(null); list.refresh() }} />

  return (
    <AdminPanel className="adm-full">
      <div className="panel-title">
        <h2 className="adm-panel-h">Problems <span className="adm-count">{list.data?.total ?? ''}</span></h2>
        <button className="pill-btn small" onClick={() => setEditing('new')}><Plus size={13} /> Add new</button>
      </div>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} />}
      {list.data && (
        <div className="adm-table">
          {list.data.items.map(p => (
            <div key={p.id} className="adm-row">
              <span className="adm-avatar">{p.title[0]?.toUpperCase()}</span>
              <div className="adm-row-info">
                <strong>{p.title}</strong>
                <small>
                  <span className={`adm-diff-tag ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                  {' · '}{p.topic}{p.isDaily ? ' · daily' : ''}
                </small>
              </div>
              <button className="link-btn" onClick={() => setEditing(p.id)}>Edit</button>
              <button className="adm-icon-btn danger" onClick={() => deleteProblem(p.id, list.refresh)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </AdminPanel>
  )
}

async function deleteProblem(id: string, refresh: () => void) {
  if (!confirm('Delete this problem? This cannot be undone.')) return
  try { await adminDeleteProblem(id); refresh() }
  catch (err) { alert(err instanceof ApiError ? err.message : 'Could not delete this problem.') }
}

function ProblemEditor({ id, onDone }: { id: string | null; onDone: () => void }) {
  const [form, setForm] = useState<ProblemInput>(emptyProblem)
  const [hintsText, setHintsText] = useState('')
  const [circuitText, setCircuitText] = useState(JSON.stringify(emptyProblem.solutionCircuit, null, 2))
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    adminGetProblem(id).then(p => {
      setForm({ title: p.title, description: p.description, difficulty: p.difficulty, topic: p.topic, solutionCircuit: p.solutionCircuit, hints: p.hints, isDaily: p.isDaily })
      setHintsText(p.hints.join('\n'))
      setCircuitText(JSON.stringify(p.solutionCircuit, null, 2))
    }).catch(err => setError(err instanceof ApiError ? err.message : 'Could not load this problem.')).finally(() => setLoading(false))
  }, [id])

  const submit = async () => {
    setError('')
    let solutionCircuit
    try { solutionCircuit = JSON.parse(circuitText) } catch { setError('Solution circuit JSON is invalid.'); return }
    const hints = hintsText.split('\n').map(h => h.trim()).filter(Boolean)
    const payload: ProblemInput = { ...form, hints, solutionCircuit }
    setSaving(true)
    try {
      if (id) await adminUpdateProblem(id, payload)
      else await adminCreateProblem(payload)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this problem.')
    } finally { setSaving(false) }
  }

  if (loading) return <Loading />

  return (
    <AdminPanel className="adm-full editor">
      <div className="panel-title">
        <h2 className="adm-panel-h">{id ? 'Edit problem' : 'New problem'}</h2>
        <button className="adm-icon-btn" onClick={onDone}><X size={15} /></button>
      </div>
      <div className="adm-form-grid">
        <label className="adm-label">Title<input className="adm-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label className="adm-label">Topic<input className="adm-input" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Entanglement" /></label>
        <label className="adm-label" style={{ gridColumn: '1 / -1' }}>Description<textarea className="adm-input adm-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="adm-label">Difficulty
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })} style={selectStyle}>
            <option value="BEGINNER">BEGINNER</option>
            <option value="INTERMEDIATE">INTERMEDIATE</option>
            <option value="ADVANCED">ADVANCED</option>
          </select>
        </label>
        <label className="adm-label">Hints (one per line)<textarea className="adm-input adm-textarea" value={hintsText} onChange={e => setHintsText(e.target.value)} /></label>
        <label className="adm-label" style={{ gridColumn: '1 / -1' }}>Solution circuit (JSON)
          <textarea className="adm-input adm-textarea adm-mono" style={{ height: 130 }} value={circuitText} onChange={e => setCircuitText(e.target.value)} />
        </label>
        <label className="adm-label adm-checkbox-label">
          <input type="checkbox" checked={form.isDaily ?? false} onChange={e => setForm({ ...form, isDaily: e.target.checked })} />
          Eligible as Problem of the Day
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      <button className="pill-btn full" onClick={submit} disabled={saving} style={{ marginTop: 18 }}>
        {saving ? 'Saving…' : 'Save problem'}
      </button>
    </AdminPanel>
  )
}

/* ═══════════════════════════ COURSES TAB ═══════════════════════════════════ */

function CoursesTab() {
  const { items, loading, error, fetch } = useCoursesStore()
  useEffect(() => { fetch() }, [fetch])
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [managing, setManaging] = useState<string | null>(null)

  if (managing) return <CourseProblemsManager courseId={managing} onBack={() => { setManaging(null); fetch() }} />
  if (editing) return <CourseEditor id={editing === 'new' ? null : editing} onDone={() => { setEditing(null); fetch() }} />

  return (
    <AdminPanel className="adm-full">
      <div className="panel-title">
        <h2 className="adm-panel-h">Courses <span className="adm-count">{items.length}</span></h2>
        <button className="pill-btn small" onClick={() => setEditing('new')}><Plus size={13} /> Add new</button>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {items.length > 0 && (
        <div className="adm-table">
          {items.map((c: CourseListItem) => (
            <div key={c.id} className="adm-row">
              <span className="adm-avatar">{c.title[0]?.toUpperCase()}</span>
              <div className="adm-row-info">
                <strong>{c.title}</strong>
                <small>
                  <span className={`adm-diff-tag ${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
                  {' · '}{c.problemCount} problems
                </small>
              </div>
              <button className="link-btn" onClick={() => setManaging(c.id)}>Manage</button>
              <button className="link-btn" onClick={() => setEditing(c.id)}>Edit</button>
              <button className="adm-icon-btn danger" onClick={() => deleteCourse(c.id, fetch)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </AdminPanel>
  )
}

async function deleteCourse(id: string, refresh: () => void) {
  if (!confirm('Delete this course? This cannot be undone.')) return
  try { await adminDeleteCourse(id); refresh() }
  catch (err) { alert(err instanceof ApiError ? err.message : 'Could not delete this course.') }
}

function CourseEditor({ id, onDone }: { id: string | null; onDone: () => void }) {
  const { items, loading, fetch } = useCoursesStore()
  useEffect(() => { fetch() }, [fetch])
  const existing = id ? items.find(c => c.id === id) : null
  const [form, setForm] = useState<CourseInput>({ title: '', description: '', difficulty: 'BEGINNER', order: 0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) setForm({ title: existing.title, description: existing.description, difficulty: existing.difficulty, order: existing.order })
  }, [existing])

  const submit = async () => {
    setSaving(true); setError('')
    try {
      if (id) await adminUpdateCourse(id, form)
      else await adminCreateCourse(form)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this course.')
    } finally { setSaving(false) }
  }

  if (id && loading && !existing) return <Loading />

  return (
    <AdminPanel className="adm-full editor">
      <div className="panel-title">
        <h2 className="adm-panel-h">{id ? 'Edit course' : 'New course'}</h2>
        <button className="adm-icon-btn" onClick={onDone}><X size={15} /></button>
      </div>
      <div className="adm-form-grid">
        <label className="adm-label">Title<input className="adm-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label className="adm-label">Order<input type="number" className="adm-input" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></label>
        <label className="adm-label" style={{ gridColumn: '1 / -1' }}>Description<textarea className="adm-input adm-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="adm-label">Difficulty
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })} style={selectStyle}>
            <option value="BEGINNER">BEGINNER</option><option value="INTERMEDIATE">INTERMEDIATE</option><option value="ADVANCED">ADVANCED</option>
          </select>
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      <button className="pill-btn full" onClick={submit} disabled={saving} style={{ marginTop: 18 }}>
        {saving ? 'Saving…' : 'Save course'}
      </button>
    </AdminPanel>
  )
}

function CourseProblemsManager({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const course = useAsync(() => getCourse(courseId), [courseId])
  const allProblems = useAsync(() => listProblems({ pageSize: 100 }), [])
  const [addId, setAddId] = useState('')
  const [error, setError] = useState('')

  const add = async () => {
    if (!addId) return
    setError('')
    try { await adminAddCourseProblem(courseId, addId); setAddId(''); course.refresh() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not add this problem.') }
  }

  const remove = async (problemId: string) => {
    try { await adminRemoveCourseProblem(courseId, problemId); course.refresh() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not remove this problem.') }
  }

  const move = async (index: number, dir: -1 | 1) => {
    if (!course.data) return
    const ids = course.data.problems.map(p => p.problemId)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    try { await adminReorderCourse(courseId, ids); course.refresh() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not reorder problems.') }
  }

  return (
    <AdminPanel className="adm-full">
      <div className="panel-title">
        <h2 className="adm-panel-h">{course.data?.title ?? 'Course'} — problems</h2>
        <button className="adm-icon-btn" onClick={onBack}><X size={15} /></button>
      </div>
      {course.loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {course.data && (
        <div className="adm-table">
          {course.data.problems.map((p, i) => (
            <div key={p.problemId} className="adm-row">
              <span className="adm-avatar">{i + 1}</span>
              <div className="adm-row-info">
                <strong>{p.title}</strong>
                <small><span className={`adm-diff-tag ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>{' · '}{p.topic}</small>
              </div>
              <button className="adm-icon-btn" onClick={() => move(i, -1)}><ChevronUp size={13} /></button>
              <button className="adm-icon-btn" onClick={() => move(i, 1)}><ChevronDown size={13} /></button>
              <button className="adm-icon-btn danger" onClick={() => remove(p.problemId)}><Trash2 size={13} /></button>
            </div>
          ))}
          {course.data.problems.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No problems in this course yet.</p>}
        </div>
      )}
      {allProblems.data && (
        <div className="adm-add-row">
          <select value={addId} onChange={e => setAddId(e.target.value)} style={{ ...selectStyle, flex: 1, marginTop: 0 }}>
            <option value="">Add a problem…</option>
            {allProblems.data.items
              .filter(p => !course.data?.problems.some(cp => cp.problemId === p.id))
              .map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button className="pill-btn small" onClick={add}><Plus size={13} /> Add</button>
        </div>
      )}
    </AdminPanel>
  )
}

/* ═══════════════════════════ GATES TAB ═════════════════════════════════════ */

function GatesTab() {
  const list = useAsync(() => listGates(), [])
  const [editing, setEditing] = useState<GateOut | 'new' | null>(null)

  if (editing) return <GateEditor gate={editing === 'new' ? null : editing} onDone={() => { setEditing(null); list.refresh() }} />

  return (
    <AdminPanel className="adm-full">
      <div className="panel-title">
        <h2 className="adm-panel-h">Custom Gates</h2>
        <button className="pill-btn small" onClick={() => setEditing('new')}><Plus size={13} /> Add new</button>
      </div>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} />}
      {list.data && (
        <div className="adm-table">
          {list.data.map(g => (
            <div key={g.id} className="adm-row">
              <span className="adm-avatar adm-gate-avatar">{g.symbol}</span>
              <div className="adm-row-info">
                <strong>{g.name}</strong>
                <small>{g.description}</small>
              </div>
              <button className="link-btn" onClick={() => setEditing(g)}>Edit</button>
              <button className="adm-icon-btn danger" onClick={() => deleteGate(g.id, list.refresh)}><Trash2 size={13} /></button>
            </div>
          ))}
          {list.data.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No custom gates yet.</p>}
        </div>
      )}
    </AdminPanel>
  )
}

async function deleteGate(id: string, refresh: () => void) {
  if (!confirm('Delete this gate?')) return
  try { await adminDeleteGate(id); refresh() }
  catch (err) { alert(err instanceof ApiError ? err.message : 'Could not delete this gate.') }
}

function GateEditor({ gate, onDone }: { gate: GateOut | null; onDone: () => void }) {
  const [form, setForm] = useState<GateInput>(gate
    ? { name: gate.name, symbol: gate.symbol, description: gate.description, matrixDefinition: gate.matrixDefinition }
    : { name: '', symbol: '', description: '', matrixDefinition: {} })
  const [matrixText, setMatrixText] = useState(JSON.stringify(form.matrixDefinition, null, 2))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError('')
    let matrixDefinition
    try { matrixDefinition = JSON.parse(matrixText) } catch { setError('Matrix definition JSON is invalid.'); return }
    setSaving(true)
    try {
      if (gate) await adminUpdateGate(gate.id, { ...form, matrixDefinition })
      else await adminCreateGate({ ...form, matrixDefinition })
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this gate.')
    } finally { setSaving(false) }
  }

  return (
    <AdminPanel className="adm-full editor">
      <div className="panel-title">
        <h2 className="adm-panel-h">{gate ? 'Edit gate' : 'New gate'}</h2>
        <button className="adm-icon-btn" onClick={onDone}><X size={15} /></button>
      </div>
      <div className="adm-form-grid">
        <label className="adm-label">Name<input className="adm-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="adm-label">Symbol<input className="adm-input" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} /></label>
        <label className="adm-label" style={{ gridColumn: '1 / -1' }}>Description<textarea className="adm-input adm-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="adm-label" style={{ gridColumn: '1 / -1' }}>Matrix definition (JSON)
          <textarea className="adm-input adm-textarea adm-mono" style={{ height: 100 }} value={matrixText} onChange={e => setMatrixText(e.target.value)} />
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      <button className="pill-btn full" onClick={submit} disabled={saving} style={{ marginTop: 18 }}>
        {saving ? 'Saving…' : 'Save gate'}
      </button>
    </AdminPanel>
  )
}

/* ═══════════════════════════ USERS TAB ═════════════════════════════════════ */

function UsersTab() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(1)
  const list = useAsync(() => adminListUsers({ search: search || undefined, role: role || undefined, page, pageSize: 15 }), [search, role, page])

  return (
    <AdminPanel className="adm-full">
      <div className="panel-title">
        <h2 className="adm-panel-h">Users <span className="adm-count">{list.data?.total ?? ''}</span></h2>
        <div className="adm-filter-row">
          <input
            placeholder="Search name or email"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="adm-input adm-search"
          />
          <select
            value={role}
            onChange={e => { setRole(e.target.value as Role | ''); setPage(1) }}
            style={{ ...selectStyle, width: 'auto', marginTop: 0, padding: '8px 10px', fontSize: 12 }}
          >
            <option value="">All roles</option>
            <option value="STUDENT">STUDENT</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>
      {list.loading && <Loading />}
      {list.error && <ErrorBox message={list.error} />}
      {list.data && (
        <div className="adm-table">
          {list.data.items.map(u => (
            <div key={u.id} className="adm-row">
              <span className="adm-avatar">{u.name[0]?.toUpperCase()}</span>
              <div className="adm-row-info">
                <strong>{u.name}</strong>
                <small>{u.email} · <span className={u.role === 'ADMIN' ? 'adm-role-admin' : 'adm-role-student'}>{u.role}</span></small>
              </div>
              <div className="adm-user-stats">
                <span className="adm-stat-pill blue">Lvl {u.level}</span>
                <span className="adm-stat-pill orange">{u.xp} XP</span>
                <span className="adm-stat-pill green">{u.streak}d 🔥</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {list.data && list.data.totalPages > 1 && (
        <div className="adm-pagination">
          <button className="link-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="muted" style={{ fontSize: 12 }}>Page {list.data.page} of {list.data.totalPages}</span>
          <button className="link-btn" onClick={() => setPage(p => p + 1)} disabled={page >= list.data!.totalPages}>Next</button>
        </div>
      )}
    </AdminPanel>
  )
}

/* ═══════════════════════════ QUESTIONS TAB ═════════════════════════════════ */

function QuestionsTab() {
  const { pendingQuestions, pendingLoading, fetchPending } = useAdminStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const poll = useCallback((isInitial: boolean) => fetchPending({ silent: !isInitial }), [fetchPending])
  usePolling(poll, 30_000)

  const items = pendingQuestions?.items ?? []

  return (
    <AdminPanel className="adm-full">
      <div className="panel-title">
        <h2 className="adm-panel-h">
          Pending review
          {items.length > 0 && <span className="adm-count adm-count-warn">{items.length}</span>}
        </h2>
        <span className="muted" style={{ fontSize: 11 }}>auto-refreshing every 30s</span>
      </div>
      {pendingLoading && <Loading />}
      {!pendingLoading && items.length === 0 && (
        <div className="adm-empty">
          <ShieldCheck size={32} style={{ color: 'var(--green)', opacity: 0.7 }} />
          <p>Nothing pending review — all caught up!</p>
        </div>
      )}
      {items.map(q => (
        <QuestionReviewRow
          key={q.id}
          question={q}
          editing={editingId === q.id}
          onEdit={() => setEditingId(q.id)}
          onCancel={() => setEditingId(null)}
          onChanged={() => fetchPending()}
        />
      ))}
    </AdminPanel>
  )
}

function QuestionReviewRow({ question, editing, onEdit, onCancel, onChanged }: {
  question: QuestionOut; editing: boolean; onEdit: () => void; onCancel: () => void; onChanged: () => void
}) {
  const [text, setText] = useState(question.questionText)
  const [options, setOptions] = useState(question.options.join('\n'))
  const [correctIndex, setCorrectIndex] = useState(question.correctOptionIndex)
  const [explanation, setExplanation] = useState(question.explanation)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const approve = async () => {
    try { await adminApproveQuestion(question.id); onChanged() }
    catch (err) { alert(err instanceof ApiError ? err.message : 'Could not approve this question.') }
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      await adminEditQuestion(question.id, { questionText: text, options: options.split('\n').map(o => o.trim()).filter(Boolean), correctOptionIndex: correctIndex, explanation })
      onCancel(); onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this question.')
    } finally { setSaving(false) }
  }

  if (editing) return (
    <div className="adm-q-editor">
      <label className="adm-label">Question<textarea className="adm-input adm-textarea" value={text} onChange={e => setText(e.target.value)} /></label>
      <label className="adm-label">Options (one per line)<textarea className="adm-input adm-textarea" value={options} onChange={e => setOptions(e.target.value)} /></label>
      <label className="adm-label">Correct option index (0–3)<input type="number" min={0} max={3} className="adm-input" value={correctIndex} onChange={e => setCorrectIndex(Number(e.target.value))} /></label>
      <label className="adm-label">Explanation<textarea className="adm-input adm-textarea" value={explanation} onChange={e => setExplanation(e.target.value)} /></label>
      {error && <ErrorBox message={error} />}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className="pill-btn small" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button className="outline-btn small" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div className="adm-q-row">
      <p className="adm-q-text">{question.questionText}</p>
      <ul className="adm-q-opts">
        {question.options.map((o, i) => (
          <li key={i} className={i === question.correctOptionIndex ? 'adm-q-opt-correct' : 'adm-q-opt'}>{o}</li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="pill-btn small" onClick={approve}>
          <Check size={12} /> Approve
        </button>
        <button className="outline-btn small" onClick={onEdit}>Edit</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════ ANALYTICS TAB ════════════════════════════════ */

function AnalyticsTab() {
  const { analytics, analyticsLoading, analyticsError, fetchAnalytics } = useAdminStore()

  const poll = useCallback((isInitial: boolean) => fetchAnalytics({ silent: !isInitial }), [fetchAnalytics])
  usePolling(poll, 60_000)

  if (analyticsLoading && !analytics) return <Loading label="Loading analytics…" />
  if (analyticsError && !analytics) return <ErrorBox message={analyticsError} />
  if (!analytics) return null

  const maxDaily = Math.max(1, ...analytics.dailySubmissions.map(d => d.count))
  const totalSubs = analytics.dailySubmissions.reduce((a, d) => a + d.count, 0)
  const diffRates = Object.entries(analytics.completionRateByDifficulty)

  return (
    <div>
      {/* KPI row */}
      <div className="adm-kpi-row">
        <KpiCard icon={<Users size={18} />} value={analytics.activeUsers.last7Days} label="Active users (7d)" accent="blue" />
        <KpiCard icon={<Users size={18} />} value={analytics.activeUsers.last30Days} label="Active users (30d)" accent="green" />
        <KpiCard icon={<Activity size={18} />} value={totalSubs} label="Submissions (30d)" accent="orange" />
        <KpiCard icon={<BarChart3 size={18} />} value={analytics.mostAttemptedProblems.length} label="Active problems" accent="pink" />
      </div>

      <div className="adm-two-col" style={{ marginTop: 16 }}>
        {/* Daily submissions chart */}
        <AdminPanel>
          <div className="panel-title">
            <h2 className="adm-panel-h">Daily submissions</h2>
            <span className="muted" style={{ fontSize: 11 }}>Last 14 days · auto-refresh 60s</span>
          </div>
          <div className="adm-bar-chart">
            {analytics.dailySubmissions.slice(-14).map(d => (
              <div key={d.date} className="adm-bar-col" title={`${d.date}: ${d.count}`}>
                <div
                  className="adm-bar-fill"
                  style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%` }}
                />
                <span className="adm-bar-label">{new Date(d.date).getDate()}</span>
              </div>
            ))}
          </div>
        </AdminPanel>

        {/* Completion rate */}
        <AdminPanel>
          <div className="panel-title"><h2 className="adm-panel-h">Completion rate</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {diffRates.map(([diff, rate]) => {
              const accent = diff === 'BEGINNER' ? 'orange' : diff === 'INTERMEDIATE' ? 'blue' : 'pink'
              return (
                <div key={diff}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className={`adm-diff-tag ${diff.toLowerCase()}`}>{diff}</span>
                    <strong style={{ fontSize: 13 }}>{(rate * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="adm-prog-track">
                    <div className={`adm-prog-fill ${accent}`} style={{ width: `${(rate * 100).toFixed(0)}%`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </AdminPanel>
      </div>

      {/* Most attempted */}
      <AdminPanel className="adm-full" style={{ marginTop: 16 }}>
        <div className="panel-title"><h2 className="adm-panel-h">Most attempted problems</h2></div>
        <div className="adm-table">
          {analytics.mostAttemptedProblems.map((p, i) => (
            <div key={p.problemId} className="adm-row">
              <span className="adm-avatar" style={{ fontSize: 11 }}>#{i + 1}</span>
              <div className="adm-row-info"><strong>{p.title}</strong></div>
              <span className="adm-stat-pill orange">{p.attempts} attempts</span>
            </div>
          ))}
          {analytics.mostAttemptedProblems.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No submissions yet.</p>}
        </div>
      </AdminPanel>

      {/* Hardest questions */}
      <AdminPanel className="adm-full" style={{ marginTop: 16 }}>
        <div className="panel-title"><h2 className="adm-panel-h">Hardest quiz questions</h2></div>
        <div className="adm-table">
          {analytics.hardestQuestions.map(q => (
            <div key={q.questionId} className="adm-row">
              <div className="adm-row-info"><strong>{q.questionText}</strong><small>{q.attempts} attempts</small></div>
              <span className="adm-stat-pill pink">{(q.incorrectRate * 100).toFixed(0)}% incorrect</span>
            </div>
          ))}
          {analytics.hardestQuestions.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No quiz attempts recorded yet.</p>}
        </div>
      </AdminPanel>
    </div>
  )
}

function KpiCard({ icon, value, label, accent }: {
  icon: React.ReactNode; value: number; label: string; accent: 'orange' | 'green' | 'blue' | 'pink'
}) {
  return (
    <div className={`adm-kpi-card adm-kpi-${accent}`}>
      <span className={`adm-kpi-icon ${accent}`}>{icon}</span>
      <strong className="adm-kpi-value">{value.toLocaleString()}</strong>
      <span className="adm-kpi-label">{label}</span>
    </div>
  )
}
