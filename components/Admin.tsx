'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'
import {
  ApiError,
  adminAddCourseProblem, adminApproveQuestion, adminCreateCourse, adminCreateGate, adminCreateProblem,
  adminDeleteCourse, adminDeleteGate, adminDeleteProblem, adminEditQuestion, adminGetAnalytics, adminGetProblem,
  adminListPendingQuestions, adminListScheduled, adminListUsers, adminRemoveCourseProblem, adminReorderCourse,
  adminScheduleProblem, adminUpdateCourse, adminUpdateGate, adminUpdateProblem,
  getCourse, listCourses, listGates, listProblems,
  type AnalyticsResponse, type CourseDetail, type CourseInput, type CourseListItem, type Difficulty,
  type GateInput, type GateOut, type PaginatedQuestions, type PaginatedUsers, type ProblemAdminOut,
  type ProblemInput, type ProblemListItem, type QuestionOut, type Role,
} from '@/lib/api'
import { ErrorBox, Loading } from '@/components/shared'

const TABS = ['Problem of the day', 'Problems', 'Courses', 'Gates', 'Users', 'Questions', 'Analytics'] as const
type Tab = typeof TABS[number]

export default function Admin({ setView }: { setView: (v: any) => void }) {
  const [tab, setTab] = useState<Tab>('Problem of the day')
  return <main className="admin-page">
    <div className="admin-head">
      <div><p className="eyebrow">QUBITLAB / ADMIN</p><h1>Control room</h1><p>Curate the learning experience and keep the lab humming.</p></div>
      <button className="outline-btn" onClick={() => setView('home')}><ArrowRight size={15} /> Exit admin</button>
    </div>
    <div className="admin-tabs">{TABS.map(t => <button className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === 'Problem of the day' && <ScheduleTab />}
    {tab === 'Problems' && <ProblemsTab />}
    {tab === 'Courses' && <CoursesTab />}
    {tab === 'Gates' && <GatesTab />}
    {tab === 'Users' && <UsersTab />}
    {tab === 'Questions' && <QuestionsTab />}
    {tab === 'Analytics' && <AnalyticsTab />}
  </main>
}

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

// ============================== Problem of the day ==============================

function ScheduleTab() {
  const problems = useAsync(() => listProblems({ pageSize: 100 }), [])
  const scheduled = useAsync(() => adminListScheduled(), [])
  const [problemId, setProblemId] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!problemId || !date) { setError('Pick a problem and a date.'); return }
    setSaving(true); setError('')
    try {
      await adminScheduleProblem(problemId, date)
      setProblemId(''); setDate('')
      scheduled.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not schedule this problem.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="admin-columns">
    <div className="admin-panel editor">
      <div className="panel-title"><h2>Schedule a Problem of the Day</h2></div>
      {problems.loading && <Loading />}
      {problems.data && (
        <label>Problem
          <select value={problemId} onChange={e => setProblemId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 7, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: 11, color: 'var(--text)' }}>
            <option value="">Select a problem…</option>
            {problems.data.items.map(p => <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>)}
          </select>
        </label>
      )}
      <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      {error && <ErrorBox message={error} />}
      <button className="pill-btn full" onClick={submit} disabled={saving}>{saving ? 'Scheduling…' : 'Schedule'} <Check size={14} /></button>
    </div>
    <div className="admin-panel">
      <div className="panel-title"><h2>Upcoming schedule</h2></div>
      {scheduled.loading && <Loading />}
      {scheduled.error && <ErrorBox message={scheduled.error} />}
      {scheduled.data && scheduled.data.length === 0 && <p className="muted">Nothing scheduled yet.</p>}
      {scheduled.data && scheduled.data.length > 0 && (
        <div className="schedule-list">
          {scheduled.data.map(p => (
            <div key={p.id}>
              <span className="schedule-dot" />
              <span>{p.title}<small>{p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</small></span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
}

// ============================== Problems ==============================

const emptyProblem: ProblemInput = { title: '', description: '', difficulty: 'BEGINNER', topic: '', solutionCircuit: { qubits: 2, gates: [] }, hints: [], isDaily: false }

function ProblemsTab() {
  const list = useAsync(() => listProblems({ pageSize: 50 }), [])
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  if (editing) return <ProblemEditor id={editing === 'new' ? null : editing} onDone={() => { setEditing(null); list.refresh() }} />

  return <div className="admin-panel table-panel">
    <div className="panel-title"><h2>Problems</h2><button className="pill-btn small" onClick={() => setEditing('new')}><Plus size={14} /> Add new</button></div>
    {list.loading && <Loading />}
    {list.error && <ErrorBox message={list.error} />}
    {list.data && (
      <div className="admin-table">
        {list.data.items.map(p => (
          <div key={p.id}>
            <span className="table-avatar">{p.title[0]?.toUpperCase()}</span>
            <span><strong>{p.title}</strong><small>{p.difficulty} · {p.topic}{p.isDaily ? ' · daily' : ''}</small></span>
            <button className="link-btn" onClick={() => setEditing(p.id)}>Edit</button>
            <button className="icon-btn" onClick={() => deleteProblem(p.id, list.refresh)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    )}
  </div>
}

async function deleteProblem(id: string, refresh: () => void) {
  if (!confirm('Delete this problem? This cannot be undone.')) return
  try { await adminDeleteProblem(id); refresh() } catch (err) { alert(err instanceof ApiError ? err.message : 'Could not delete this problem.') }
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
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return <div className="admin-panel editor">
    <div className="panel-title"><h2>{id ? 'Edit problem' : 'New problem'}</h2><button className="icon-btn" onClick={onDone}><X size={15} /></button></div>
    <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
    <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
    <label>Difficulty
      <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })} style={{ display: 'block', width: '100%', marginTop: 7, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: 11, color: 'var(--text)' }}>
        <option value="BEGINNER">BEGINNER</option><option value="INTERMEDIATE">INTERMEDIATE</option><option value="ADVANCED">ADVANCED</option>
      </select>
    </label>
    <label>Topic<input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Entanglement" /></label>
    <label>Hints (one per line)<textarea value={hintsText} onChange={e => setHintsText(e.target.value)} /></label>
    <label>Solution circuit (JSON)<textarea value={circuitText} onChange={e => setCircuitText(e.target.value)} style={{ height: 140, fontFamily: 'ui-monospace,monospace', fontSize: 12 }} /></label>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" style={{ width: 'auto', display: 'inline' }} checked={form.isDaily} onChange={e => setForm({ ...form, isDaily: e.target.checked })} /> Eligible as Problem of the Day</label>
    {error && <ErrorBox message={error} />}
    <button className="pill-btn full" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save problem'}</button>
  </div>
}

// ============================== Courses ==============================

function CoursesTab() {
  const list = useAsync(() => listCourses(), [])
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [managing, setManaging] = useState<string | null>(null)

  if (managing) return <CourseProblemsManager courseId={managing} onBack={() => { setManaging(null); list.refresh() }} />
  if (editing) return <CourseEditor id={editing === 'new' ? null : editing} onDone={() => { setEditing(null); list.refresh() }} />

  return <div className="admin-panel table-panel">
    <div className="panel-title"><h2>Courses</h2><button className="pill-btn small" onClick={() => setEditing('new')}><Plus size={14} /> Add new</button></div>
    {list.loading && <Loading />}
    {list.error && <ErrorBox message={list.error} />}
    {list.data && (
      <div className="admin-table">
        {list.data.map((c: CourseListItem) => (
          <div key={c.id}>
            <span className="table-avatar">{c.title[0]?.toUpperCase()}</span>
            <span><strong>{c.title}</strong><small>{c.difficulty} · {c.problemCount} problems</small></span>
            <button className="link-btn" onClick={() => setManaging(c.id)}>Manage problems</button>
            <button className="link-btn" onClick={() => setEditing(c.id)}>Edit</button>
            <button className="icon-btn" onClick={() => deleteCourse(c.id, list.refresh)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    )}
  </div>
}

async function deleteCourse(id: string, refresh: () => void) {
  if (!confirm('Delete this course? This cannot be undone.')) return
  try { await adminDeleteCourse(id); refresh() } catch (err) { alert(err instanceof ApiError ? err.message : 'Could not delete this course.') }
}

function CourseEditor({ id, onDone }: { id: string | null; onDone: () => void }) {
  const list = useAsync(() => listCourses(), [])
  const existing = id ? list.data?.find(c => c.id === id) : null
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
    } finally {
      setSaving(false)
    }
  }

  if (id && list.loading) return <Loading />

  return <div className="admin-panel editor">
    <div className="panel-title"><h2>{id ? 'Edit course' : 'New course'}</h2><button className="icon-btn" onClick={onDone}><X size={15} /></button></div>
    <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
    <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
    <label>Difficulty
      <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })} style={{ display: 'block', width: '100%', marginTop: 7, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: 11, color: 'var(--text)' }}>
        <option value="BEGINNER">BEGINNER</option><option value="INTERMEDIATE">INTERMEDIATE</option><option value="ADVANCED">ADVANCED</option>
      </select>
    </label>
    <label>Order<input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></label>
    {error && <ErrorBox message={error} />}
    <button className="pill-btn full" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save course'}</button>
  </div>
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

  return <div className="admin-panel">
    <div className="panel-title"><h2>{course.data?.title ?? 'Course'} — problems</h2><button className="icon-btn" onClick={onBack}><X size={15} /></button></div>
    {course.loading && <Loading />}
    {error && <ErrorBox message={error} />}
    {course.data && (
      <div className="admin-table">
        {course.data.problems.map((p, i) => (
          <div key={p.problemId}>
            <span className="table-avatar">{i + 1}</span>
            <span><strong>{p.title}</strong><small>{p.difficulty} · {p.topic}</small></span>
            <button className="icon-btn" onClick={() => move(i, -1)}><ChevronUp size={14} /></button>
            <button className="icon-btn" onClick={() => move(i, 1)}><ChevronDown size={14} /></button>
            <button className="icon-btn" onClick={() => remove(p.problemId)}><Trash2 size={14} /></button>
          </div>
        ))}
        {course.data.problems.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No problems in this course yet.</p>}
      </div>
    )}
    {allProblems.data && (
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <select value={addId} onChange={e => setAddId(e.target.value)} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: 11, color: 'var(--text)' }}>
          <option value="">Add a problem…</option>
          {allProblems.data.items.filter(p => !course.data?.problems.some(cp => cp.problemId === p.id)).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button className="pill-btn small" onClick={add}><Plus size={14} /> Add</button>
      </div>
    )}
  </div>
}

// ============================== Gates ==============================

function GatesTab() {
  const list = useAsync(() => listGates(), [])
  const [editing, setEditing] = useState<GateOut | 'new' | null>(null)

  if (editing) return <GateEditor gate={editing === 'new' ? null : editing} onDone={() => { setEditing(null); list.refresh() }} />

  return <div className="admin-panel table-panel">
    <div className="panel-title"><h2>Gates</h2><button className="pill-btn small" onClick={() => setEditing('new')}><Plus size={14} /> Add new</button></div>
    {list.loading && <Loading />}
    {list.error && <ErrorBox message={list.error} />}
    {list.data && (
      <div className="admin-table">
        {list.data.map(g => (
          <div key={g.id}>
            <span className="table-avatar">{g.symbol}</span>
            <span><strong>{g.name}</strong><small>{g.description}</small></span>
            <button className="link-btn" onClick={() => setEditing(g)}>Edit</button>
            <button className="icon-btn" onClick={() => deleteGate(g.id, list.refresh)}><Trash2 size={14} /></button>
          </div>
        ))}
        {list.data.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No custom gates yet.</p>}
      </div>
    )}
  </div>
}

async function deleteGate(id: string, refresh: () => void) {
  if (!confirm('Delete this gate?')) return
  try { await adminDeleteGate(id); refresh() } catch (err) { alert(err instanceof ApiError ? err.message : 'Could not delete this gate.') }
}

function GateEditor({ gate, onDone }: { gate: GateOut | null; onDone: () => void }) {
  const [form, setForm] = useState<GateInput>(gate ? { name: gate.name, symbol: gate.symbol, description: gate.description, matrixDefinition: gate.matrixDefinition } : { name: '', symbol: '', description: '', matrixDefinition: {} })
  const [matrixText, setMatrixText] = useState(JSON.stringify(form.matrixDefinition, null, 2))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError('')
    let matrixDefinition
    try { matrixDefinition = JSON.parse(matrixText) } catch { setError('Matrix definition JSON is invalid.'); return }
    setSaving(true)
    try {
      const payload = { ...form, matrixDefinition }
      if (gate) await adminUpdateGate(gate.id, payload)
      else await adminCreateGate(payload)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this gate.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="admin-panel editor">
    <div className="panel-title"><h2>{gate ? 'Edit gate' : 'New gate'}</h2><button className="icon-btn" onClick={onDone}><X size={15} /></button></div>
    <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
    <label>Symbol<input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} /></label>
    <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
    <label>Matrix definition (JSON)<textarea value={matrixText} onChange={e => setMatrixText(e.target.value)} style={{ height: 100, fontFamily: 'ui-monospace,monospace', fontSize: 12 }} /></label>
    {error && <ErrorBox message={error} />}
    <button className="pill-btn full" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save gate'}</button>
  </div>
}

// ============================== Users ==============================

function UsersTab() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(1)
  const list = useAsync(() => adminListUsers({ search: search || undefined, role: role || undefined, page, pageSize: 15 }), [search, role, page])

  return <div className="admin-panel table-panel">
    <div className="panel-title">
      <h2>Users</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <input placeholder="Search name or email" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: 9, color: 'var(--text)', fontSize: 12 }} />
        <select value={role} onChange={e => { setRole(e.target.value as Role | ''); setPage(1) }} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: 9, color: 'var(--text)', fontSize: 12 }}>
          <option value="">All roles</option><option value="STUDENT">STUDENT</option><option value="ADMIN">ADMIN</option>
        </select>
      </div>
    </div>
    {list.loading && <Loading />}
    {list.error && <ErrorBox message={list.error} />}
    {list.data && (
      <div className="admin-table">
        {list.data.items.map(u => (
          <div key={u.id}>
            <span className="table-avatar">{u.name[0]?.toUpperCase()}</span>
            <span><strong>{u.name}</strong><small>{u.email} · {u.role}</small></span>
            <span className="muted">Lvl {u.level} · {u.xp} XP · {u.streak}d streak</span>
          </div>
        ))}
      </div>
    )}
    {list.data && list.data.totalPages > 1 && <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 16 }}>
      <button className="link-btn" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
      <span className="muted">Page {list.data.page} of {list.data.totalPages}</span>
      <button className="link-btn" onClick={() => setPage(p => p + 1)}>Next</button>
    </div>}
  </div>
}

// ============================== Questions ==============================

function QuestionsTab() {
  const list = useAsync(() => adminListPendingQuestions(1, 50), [])
  const [editingId, setEditingId] = useState<string | null>(null)

  return <div className="admin-panel table-panel">
    <div className="panel-title"><h2>AI-generated questions pending review</h2></div>
    {list.loading && <Loading />}
    {list.error && <ErrorBox message={list.error} />}
    {list.data && list.data.items.length === 0 && <p className="muted">Nothing pending review.</p>}
    {list.data && list.data.items.map(q => (
      <QuestionReviewRow key={q.id} question={q} editing={editingId === q.id} onEdit={() => setEditingId(q.id)} onCancel={() => setEditingId(null)} onChanged={list.refresh} />
    ))}
  </div>
}

function QuestionReviewRow({ question, editing, onEdit, onCancel, onChanged }: { question: QuestionOut; editing: boolean; onEdit: () => void; onCancel: () => void; onChanged: () => void }) {
  const [text, setText] = useState(question.questionText)
  const [options, setOptions] = useState(question.options.join('\n'))
  const [correctIndex, setCorrectIndex] = useState(question.correctOptionIndex)
  const [explanation, setExplanation] = useState(question.explanation)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const approve = async () => {
    try { await adminApproveQuestion(question.id); onChanged() } catch (err) { alert(err instanceof ApiError ? err.message : 'Could not approve this question.') }
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      await adminEditQuestion(question.id, { questionText: text, options: options.split('\n').map(o => o.trim()).filter(Boolean), correctOptionIndex: correctIndex, explanation })
      onCancel(); onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this question.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) return <div className="editor" style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 10 }}>
    <label>Question<textarea value={text} onChange={e => setText(e.target.value)} /></label>
    <label>Options (one per line)<textarea value={options} onChange={e => setOptions(e.target.value)} /></label>
    <label>Correct option index (0-3)<input type="number" min={0} max={3} value={correctIndex} onChange={e => setCorrectIndex(Number(e.target.value))} /></label>
    <label>Explanation<textarea value={explanation} onChange={e => setExplanation(e.target.value)} /></label>
    {error && <ErrorBox message={error} />}
    <div style={{ display: 'flex', gap: 10 }}>
      <button className="pill-btn small" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      <button className="outline-btn small" onClick={onCancel}>Cancel</button>
    </div>
  </div>

  return <div style={{ borderTop: '1px solid var(--line)', padding: '16px 0' }}>
    <p style={{ fontWeight: 700, margin: '0 0 8px' }}>{question.questionText}</p>
    <ul className="muted" style={{ fontSize: 12, margin: '0 0 10px', paddingLeft: 18 }}>
      {question.options.map((o, i) => <li key={i} style={i === question.correctOptionIndex ? { color: 'var(--green)' } : undefined}>{o}</li>)}
    </ul>
    <div style={{ display: 'flex', gap: 10 }}>
      <button className="pill-btn small" onClick={approve}>Approve</button>
      <button className="outline-btn small" onClick={onEdit}>Edit</button>
    </div>
  </div>
}

// ============================== Analytics ==============================

function AnalyticsTab() {
  const { data, loading, error } = useAsync<AnalyticsResponse>(() => adminGetAnalytics(), [])
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />
  if (!data) return null

  const maxDaily = Math.max(1, ...data.dailySubmissions.map(d => d.count))

  return <>
    <div className="admin-stats">
      <div className="stat-card"><strong>{data.activeUsers.last7Days}</strong><span>active users (7d)</span></div>
      <div className="stat-card"><strong>{data.activeUsers.last30Days}</strong><span>active users (30d)</span></div>
      <div className="stat-card"><strong>{data.dailySubmissions.reduce((a, d) => a + d.count, 0)}</strong><span>submissions (30d)</span></div>
    </div>
    <div className="admin-columns">
      <div className="admin-panel">
        <div className="panel-title"><h2>Daily submissions</h2></div>
        <div className="chart"><div className="chart-line">
          {data.dailySubmissions.slice(-14).map(d => <i key={d.date} style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%` }} title={`${d.date}: ${d.count}`} />)}
        </div></div>
      </div>
      <div className="admin-panel">
        <div className="panel-title"><h2>Completion rate by difficulty</h2></div>
        {Object.entries(data.completionRateByDifficulty).map(([d, rate]) => (
          <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <span className="muted">{d}</span><strong>{(rate * 100).toFixed(0)}%</strong>
          </div>
        ))}
      </div>
    </div>
    <div className="admin-panel table-panel" style={{ marginTop: 16 }}>
      <div className="panel-title"><h2>Most-attempted problems</h2></div>
      <div className="admin-table">
        {data.mostAttemptedProblems.map(p => (
          <div key={p.problemId}><span><strong>{p.title}</strong></span><span className="muted">{p.attempts} attempts</span></div>
        ))}
        {data.mostAttemptedProblems.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No submissions yet.</p>}
      </div>
    </div>
    <div className="admin-panel table-panel" style={{ marginTop: 16 }}>
      <div className="panel-title"><h2>Hardest quiz questions</h2></div>
      <div className="admin-table">
        {data.hardestQuestions.map(q => (
          <div key={q.questionId}><span><strong>{q.questionText}</strong><small>{q.attempts} attempts</small></span><span className="muted">{(q.incorrectRate * 100).toFixed(0)}% incorrect</span></div>
        ))}
        {data.hardestQuestions.length === 0 && <p className="muted" style={{ padding: '14px 0' }}>No quiz attempts recorded yet.</p>}
      </div>
    </div>
  </>
}
