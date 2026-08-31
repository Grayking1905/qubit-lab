'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, Code2, Flame, Menu, Moon, Play, RotateCcw, ShieldCheck, Sparkles, Sun, X } from 'lucide-react'
import {
  ApiError, adminLogin as apiAdminLogin, clearSession, getMyStats, getStoredUser, listCourses, login, saveSession, signup, simulate, updateStoredUser,
  type Circuit, type CourseListItem, type SimulateResult, type User,
} from '@/lib/api'
import { ErrorBox, Loading, difficultyColor } from '@/components/shared'
import Learn from '@/components/Learn'
import Dashboard from '@/components/Dashboard'
import Courses from '@/components/Courses'
import Builder from '@/components/Builder'
import Admin from '@/components/Admin'
import Assistant from '@/components/Assistant'
import InteractiveLearn from '@/components/InteractiveLearn'
import QuantumLab3D from '@/components/QuantumLab3DClient'
import Algorithms from '@/components/Algorithms'
import Questions from '@/components/Questions'

type View = 'home' | 'learn' | 'educate' | 'lab3d' | 'algorithms' | 'dashboard' | 'courses' | 'builder' | 'admin' | 'adminlogin' | 'questions' | 'login' | 'signup'
type Role = 'learner' | 'admin'

const DEFAULT_CIRCUIT: Circuit = { qubits: 2, gates: [] }

export default function Page() {
  const [view, setView] = useState<View>('home')
  const [role, setRole] = useState<Role>('learner')
  const [user, setUser] = useState<User | null>(null)
  const [dark, setDark] = useState(true)
  const [menu, setMenu] = useState(false)
  const [assistant, setAssistant] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)

  const [circuit, setCircuit] = useState<Circuit>(DEFAULT_CIRCUIT)
  const [builderProblemId, setBuilderProblemId] = useState<string | null>(null)

  const goTo = (next: View) => {
    // Guard admin view: requires either DB admin role OR a valid admin session token
    if (next === 'admin' && role !== 'admin' && !adminToken) return setView('adminlogin')
    setView(next)
  }

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
      setRole(stored.role === 'ADMIN' ? 'admin' : 'learner')
    }
    // Restore hardcoded-admin token if present
    const storedAdminToken = localStorage.getItem('qubitlab_admin_token')
    if (storedAdminToken) setAdminToken(storedAdminToken)
  }, [])

  const logout = () => {
    clearSession()
    setUser(null)
    setRole('learner')
    setView('home')
  }

  const adminLogout = () => {
    localStorage.removeItem('qubitlab_admin_token')
    setAdminToken(null)
    setView('home')
  }

  const openProblem = (id: string) => {
    setBuilderProblemId(id)
    setCircuit(DEFAULT_CIRCUIT)
    setView('builder')
  }

  const openSandbox = () => {
    setBuilderProblemId(null)
    setView('builder')
  }

  const openBuilderWithCircuit = (c: Circuit) => {
    setCircuit(c)
    setBuilderProblemId(null)
    setView('builder')
  }

  const refreshUser = async () => {
    if (!user) return
    try {
      const stats = await getMyStats()
      const updated = updateStoredUser({ xp: stats.xp, level: stats.level, streak: stats.streak })
      if (updated) setUser(updated)
    } catch {
      // Non-fatal: the user's local stats just won't refresh until next login.
    }
  }

  return <div className={dark ? 'app dark' : 'app'}>
    <Header dark={dark} setDark={setDark} menu={menu} setMenu={setMenu} setView={goTo} role={role} user={user} onLogout={logout} adminToken={adminToken} onAdminLogout={adminLogout} />
    {view === 'home' && <Home setView={goTo} openSandbox={openSandbox} user={user} />}
    {view === 'learn' && <Learn openProblem={openProblem} />}
    {view === 'educate' && <InteractiveLearn onComplete={() => goTo('builder')} />}
    {view === 'lab3d' && <QuantumLab3D onOpenBuilder={openSandbox} />}
    {view === 'algorithms' && <Algorithms openBuilder={openBuilderWithCircuit} />}
    {view === 'dashboard' && <Dashboard setView={goTo} user={user} openProblem={openProblem} />}
    {view === 'courses' && <Courses openProblem={openProblem} />}
    {view === 'questions' && <Questions user={user} onSolved={refreshUser} />}
    {view === 'builder' && <Builder circuit={circuit} setCircuit={setCircuit} problemId={builderProblemId} isLoggedIn={!!user} onSolved={refreshUser} />}
    {view === 'admin' && (role === 'admin' || !!adminToken) && <Admin setView={goTo} />}
    {view === 'adminlogin' && <AdminLogin setView={goTo} setAdminToken={setAdminToken} />}
    {(view === 'login' || view === 'signup') && <Auth mode={view} setView={goTo} setRole={setRole} setUser={setUser} />}
    {assistant && <Assistant circuit={circuit} setCircuit={setCircuit} close={() => setAssistant(false)} />}
    {view !== 'login' && view !== 'signup' && view !== 'adminlogin' && <button className="ai-fab" onClick={() => setAssistant(!assistant)} aria-label="Open Qubit AI"><Sparkles size={18} /> Qubit AI</button>}
  </div>
}

function Header({ dark, setDark, menu, setMenu, setView, role, user, onLogout, adminToken, onAdminLogout }: any) {
  const streak = user?.streak ?? 0
  return <header className="header"><button className="brand" onClick={() => setView('home')}><span className="brand-mark">◈</span><span>Qubit<span>Lab</span></span></button><nav className={menu ? 'nav open' : 'nav'}><button onClick={() => setView('educate')}>Educate</button><button onClick={() => setView('lab3d')}>3D Lab</button><button onClick={() => setView('builder')}>Playground</button><button onClick={() => setView('algorithms')}>Algorithms</button><button onClick={() => setView('learn')}>Problems</button><button onClick={() => setView('questions')}>Questions</button><button onClick={() => setView('courses')}>Courses</button>{(role === 'admin' || !!adminToken) && <button onClick={() => setView('admin')}><ShieldCheck size={14}/> Admin</button>}</nav><div className="header-actions">{user && streak > 0 && <div className="streak-badge" title={`${streak}-day streak`}><Flame size={14} className="streak-flame" /><span>{streak}</span></div>}<button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>{user ? <><button className="text-btn" onClick={() => setView('dashboard')}>{user.name}</button><button className="pill-btn small" onClick={onLogout}>Log out</button></> : <><button className="text-btn" onClick={() => setView('login')}>Log in</button><button className="pill-btn small" onClick={() => setView('signup')}>Sign up</button></>}{adminToken && !user && <button className="outline-btn small" onClick={onAdminLogout} style={{fontSize:11}}>Admin Logout</button>}{!adminToken && !user && <button className="text-btn" onClick={() => setView('adminlogin')} style={{fontSize:11,opacity:0.5}} title="Admin login">Admin</button>}<button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X/> : <Menu/>}</button></div></header>
}

function Home({ setView, openSandbox, user }: any) {
  const [courses, setCourses] = useState<CourseListItem[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [stats, setStats] = useState<{ streak: number; activityMap: Record<string, number> } | null>(null)

  useEffect(() => {
    listCourses().then(cs => setCourses(cs.slice(0, 3))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) { setStats(null); return }
    getMyStats().then(s => setStats({ streak: s.streak, activityMap: s.activityMap })).catch(() => {})
  }, [user])

  return <main>
    <section className="hero section-wrap">
      <div className="hero-copy">
        <p className="eyebrow">LEARN THE LOGIC BEHIND THE MAGIC</p>
        <h1>Make quantum<br /><em>click.</em></h1>
        <p className="hero-lede">QubitLab makes quantum computing tangible. Learn the concepts, build the circuits, and see every idea come alive.</p>
        <div className="hero-actions">
          <button className="pill-btn" onClick={() => setView('educate')}>Start learning <ArrowRight size={16} /></button>
          <button className="outline-btn" onClick={() => setView('lab3d')}>Enter 3D Lab</button>
          <button className="outline-btn" onClick={openSandbox}>Open playground <Code2 size={16} /></button>
        </div>
      </div>
      <CircuitPreview />
    </section>

    {courses.length > 0 && <section className="section-wrap content-section">
      <div className="section-heading">
        <div><p className="eyebrow">A PATH THAT MEETS YOU THERE</p><h2>Pick your <em>starting point.</em></h2></div>
        <button className="link-btn" onClick={() => setView('courses')}>View all courses <ArrowRight size={15} /></button>
      </div>
      <div className="track-grid">
        {courses.map(c => (
          <button key={c.id} className="track-card" onClick={() => setView('courses')}>
            <span className={'tag ' + difficultyColor(c.difficulty)}>{c.difficulty}</span>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <div className="track-foot"><span>{c.problemCount} problem{c.problemCount === 1 ? '' : 's'}</span><ArrowRight size={16} /></div>
          </button>
        ))}
      </div>
    </section>}

    {user && stats && <section className="section-wrap content-section roadmap">
      <div className="section-heading"><div><p className="eyebrow">YOUR MOMENTUM</p><h2>Small steps. <em>Real progress.</em></h2></div><button className="outline-btn small" onClick={() => setView('dashboard')}>Open dashboard</button></div>
      <div className="roadmap-card">
        <div className="roadmap-top"><div><span className="tag orange">CURRENT STREAK</span><strong>{stats.streak} day{stats.streak === 1 ? '' : 's'}</strong><p>Keep the chain alive with one concept today.</p></div><Flame className="flame" size={28} /></div>
        <div className="heatmap">{Array.from({ length: 84 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (83 - i))
          const count = stats.activityMap[d.toISOString().slice(0, 10)] ?? 0
          return <i key={i} className={count >= 3 ? 'hot' : count >= 1 ? 'warm' : ''} />
        })}</div>
        <div className="roadmap-bottom"><span>Less</span><span>More</span><div className="legend"><i /><i className="warm" /><i className="hot" /></div><span>Last 12 weeks</span></div>
      </div>
    </section>}
  </main>
}

function CircuitPreview() {
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bellState: Circuit = { qubits: 2, gates: [{ type: 'H', qubit: 0, step: 0 }, { type: 'CNOT', qubit: 0, target: 1, step: 1 }] }

  const run = async () => {
    if (result) { setResult(null); return }
    setLoading(true); setError('')
    try { setResult(await simulate(bellState)) }
    catch { setError('Backend unreachable') }
    finally { setLoading(false) }
  }

  const entries = result ? Object.entries(result.probabilities).filter(([, p]) => p > 0.001) : []

  return <div className="circuit-hero">
    <div className="circuit-label"><span className="live-dot" /> LIVE CIRCUIT <span>bell-state / 2 qubits</span></div>
    <div className="circuit-board">
      {[0, 1].map(q => <div className="wire" key={q}><span className="wire-label">q{q}</span><div className="wire-line"><b className={result ? 'gate active' : 'gate'}>{q === 0 ? 'H' : '•'}</b><span /><b className={result && q === 1 ? 'gate active' : 'gate'}>{q === 1 ? '⊕' : ''}</b><span /><b className="measure">M</b></div></div>)}
      <div className="probability">
        <span>{error ? 'ERROR' : 'MEASUREMENT'}</span>
        {error ? <strong>{error}</strong> : entries.length > 0
          ? entries.map(([state, p]) => <strong key={state}>|{state}⟩ {(p * 100).toFixed(0)}%</strong>)
          : <strong>Run to see real results</strong>}
      </div>
    </div>
    <button className="run-btn" onClick={run} disabled={loading}>{result ? <RotateCcw size={15} /> : <Play size={15} />} {loading ? 'Running…' : result ? 'Reset circuit' : 'Run circuit'}</button>
  </div>
}

function Auth({ mode, setView, setRole, setUser }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Enter an email and password to continue.'); return }
    if (mode === 'signup' && !name.trim()) { setError('Enter your name to continue.'); return }

    setLoading(true)
    try {
      const auth = mode === 'login'
        ? await login(email.trim(), password)
        : await signup(email.trim(), password, name.trim())
      saveSession(auth)
      setUser(auth.user)
      setRole(auth.user.role === 'ADMIN' ? 'admin' : 'learner')
      setView(auth.user.role === 'ADMIN' ? 'admin' : 'dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-page"><div className="auth-card"><button className="brand" onClick={() => setView('home')}><span className="brand-mark">◈</span><span>Qubit<span>Lab</span></span></button><p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE LAB'}</p><h1>{mode === 'login' ? 'Log in to learn.' : 'Start your quantum journey.'}</h1><p className="muted">{mode === 'login' ? 'Pick up right where you left off.' : 'Create a free account and make your first circuit.'}</p>{mode === 'signup' && <label>Name<input placeholder="Ada Lovelace" value={name} onChange={e => setName(e.target.value)} /></label>}<label>Email<input placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="auth-error">{error}</p>}<button className="pill-btn full" onClick={submit} disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={15}/></button><p className="auth-switch">{mode === 'login' ? 'New to QubitLab?' : 'Already have an account?'} <button onClick={() => setView(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Sign up' : 'Log in'}</button></p></div></main>
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login — completely separate from the user auth system.
// Validates against ADMIN_EMAIL / ADMIN_PASSWORD env vars (no DB lookup).
// ─────────────────────────────────────────────────────────────────────────────

function AdminLogin({ setView, setAdminToken }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Enter admin email and password.'); return }
    setLoading(true)
    try {
      const res = await apiAdminLogin(email.trim(), password)
      localStorage.setItem('qubitlab_admin_token', res.access_token)
      setAdminToken(res.access_token)
      setView('admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card admin-login-card">
        <button className="brand" onClick={() => setView('home')}>
          <span className="brand-mark">◈</span><span>Qubit<span>Lab</span></span>
        </button>
        <p className="eyebrow">ADMIN ACCESS</p>
        <h1>Admin Login</h1>
        <p className="muted">This is a separate admin portal. Regular user accounts cannot log in here.</p>
        <div className="admin-login-separator" />
        <label>
          Admin Email
          <input
            id="admin-email"
            placeholder="admin@qubitlab.dev"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
        </label>
        <label>
          Admin Password
          <input
            id="admin-password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button className="pill-btn full" onClick={submit} disabled={loading} id="admin-login-submit">
          {loading ? 'Authenticating…' : 'Access Admin Panel'} <ShieldCheck size={15} />
        </button>
        <p className="auth-switch">
          <button onClick={() => setView('home')}>← Back to QubitLab</button>
        </p>
      </div>
    </main>
  )
}

