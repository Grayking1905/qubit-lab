'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, ChevronRight, Eye, EyeOff, Flame, Search, X } from 'lucide-react'
import {
  ApiError, getProblem, getProblemSolution, listProblems, submitProblem,
  type Circuit, type Difficulty, type PaginatedProblems, type ProblemDetail, type User,
} from '@/lib/api'
import { ErrorBox, Loading, difficultyColor } from '@/components/shared'
import Builder from '@/components/Builder'

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

// ─────────────────────────────────────────────────────────────────────────────
// Solution Reveal Modal
// ─────────────────────────────────────────────────────────────────────────────

function SolutionModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="solution-modal-overlay" onClick={onCancel}>
      <div className="solution-modal-card" onClick={e => e.stopPropagation()}>
        <div className="solution-modal-icon">
          <EyeOff size={28} />
        </div>
        <h2>Peek at the solution?</h2>
        <p>Try solving it yourself first! Viewing the solution before attempting may reduce the XP and learning value.</p>
        <p className="solution-modal-warning">Are you sure you want to view the solution?</p>
        <div className="solution-modal-actions">
          <button className="pill-btn" onClick={onCancel}>
            Keep Trying
          </button>
          <button className="outline-btn" onClick={onConfirm}>
            <Eye size={14} /> Show Solution Anyway
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Solution Display Panel
// ─────────────────────────────────────────────────────────────────────────────

function SolutionDisplay({ problemId, onClose }: { problemId: string; onClose: () => void }) {
  const [solution, setSolution] = useState<Circuit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProblemSolution(problemId)
      .then(r => setSolution(r.solutionCircuit))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load solution.'))
      .finally(() => setLoading(false))
  }, [problemId])

  return (
    <div className="solution-display">
      <div className="solution-display-header">
        <div className="solution-display-title">
          <Eye size={16} />
          <span>Admin Solution</span>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close solution"><X size={15} /></button>
      </div>
      {loading && <Loading label="Loading solution…" />}
      {error && <ErrorBox message={error} />}
      {solution && (
        <div className="solution-content">
          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            {solution.qubits} qubit{solution.qubits !== 1 ? 's' : ''} · {solution.gates.length} gate{solution.gates.length !== 1 ? 's' : ''}
          </p>
          <div className="solution-circuit-grid">
            {Array.from({ length: solution.qubits }, (_, q) => (
              <div key={q} className="solution-wire">
                <span className="solution-wire-label">q{q}</span>
                <div className="solution-wire-track">
                  {solution.gates
                    .filter(g => g.qubit === q || g.target === q || (g.controls ?? []).includes(q))
                    .sort((a, b) => a.step - b.step)
                    .map((g, i) => (
                      <span
                        key={i}
                        className={`solution-gate ${g.qubit === q ? '' : 'solution-gate-target'}`}
                        title={`Step ${g.step}`}
                      >
                        {g.type === 'CNOT' ? (g.qubit === q ? '●' : '⊕') :
                         g.type === 'TOFFOLI' ? (g.qubit === q ? '●' : '⊕') :
                         g.type === 'MEASURE' ? 'M' : g.type}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <details style={{ marginTop: 14 }}>
            <summary className="muted" style={{ cursor: 'pointer', fontSize: 12, userSelect: 'none' }}>
              Raw circuit JSON
            </summary>
            <pre className="solution-json">{JSON.stringify(solution, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Problem Detail / Solve View
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CIRCUIT: Circuit = { qubits: 2, gates: [] }

function QuestionDetail({
  problemId,
  user,
  onBack,
  onSolved,
}: {
  problemId: string
  user: User | null
  onBack: () => void
  onSolved?: () => void
}) {
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [circuit, setCircuit] = useState<Circuit>(DEFAULT_CIRCUIT)
  const [showModal, setShowModal] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  useEffect(() => {
    getProblem(problemId)
      .then(p => { setProblem(p); setCircuit(DEFAULT_CIRCUIT) })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load this problem.'))
      .finally(() => setLoading(false))
  }, [problemId])

  const handleViewSolution = () => {
    if (showSolution) {
      setShowSolution(false)
    } else {
      setShowModal(true)
    }
  }

  const handleConfirmSolution = () => {
    setShowModal(false)
    setShowSolution(true)
  }

  if (loading) return <div className="questions-detail"><Loading label="Loading problem…" /></div>
  if (error) return <div className="questions-detail"><ErrorBox message={error} /></div>
  if (!problem) return null

  const dc = difficultyColor(problem.difficulty)

  return (
    <div className="questions-detail">
      {showModal && (
        <SolutionModal
          onConfirm={handleConfirmSolution}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="questions-detail-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to questions">
          <ArrowLeft size={16} />
        </button>
        <div className="questions-detail-meta">
          <span className={`tag ${dc}`}>{problem.difficulty}</span>
          <span className="muted" style={{ fontSize: 12 }}>{problem.topic}</span>
        </div>
        <button
          className={showSolution ? 'pill-btn small' : 'outline-btn small'}
          onClick={handleViewSolution}
          style={{ marginLeft: 'auto' }}
        >
          {showSolution ? <><EyeOff size={13} /> Hide Solution</> : <><Eye size={13} /> View Solution</>}
        </button>
      </div>

      <h1 className="questions-detail-title">{problem.title}</h1>
      <p className="questions-detail-desc">{problem.description}</p>

      {problem.hints && problem.hints.length > 0 && (
        <details className="questions-hints">
          <summary>Hints ({problem.hints.length})</summary>
          <ul>
            {problem.hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </details>
      )}

      {showSolution && (
        <SolutionDisplay
          problemId={problemId}
          onClose={() => setShowSolution(false)}
        />
      )}

      <div className="questions-builder-wrap">
        <Builder
          circuit={circuit}
          setCircuit={setCircuit}
          problemId={problemId}
          isLoggedIn={!!user}
          onSolved={onSolved}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Questions List View
// ─────────────────────────────────────────────────────────────────────────────

export default function Questions({ user, onSolved }: { user: User | null; onSolved?: () => void }) {
  const [topics, setTopics] = useState<string[]>([])
  const [topic, setTopic] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedProblems | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    listProblems({ pageSize: 100 })
      .then(res => setTopics(Array.from(new Set(res.items.map(p => p.topic))).sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setListLoading(true)
    setListError('')
    listProblems({
      topic: topic ?? undefined,
      difficulty: difficulty ?? undefined,
      search: search || undefined,
      page,
      pageSize: 12,
    })
      .then(setData)
      .catch(err => setListError(err instanceof ApiError ? err.message : 'Could not load questions. Is the backend running?'))
      .finally(() => setListLoading(false))
  }, [topic, difficulty, search, page])

  // Problem detail view
  if (selectedId) {
    return (
      <main className="workspace">
        <QuestionDetail
          problemId={selectedId}
          user={user}
          onBack={() => setSelectedId(null)}
          onSolved={onSolved}
        />
      </main>
    )
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <p className="muted-label">TOPICS</p>
        <button className={topic === null ? 'side-active' : ''} onClick={() => { setTopic(null); setPage(1) }}>
          <BookOpen size={16} /> All topics
        </button>
        {topics.map(t => (
          <button key={t} className={topic === t ? 'side-active' : ''} onClick={() => { setTopic(t); setPage(1) }}>
            {t}
          </button>
        ))}
        <div className="side-divider" />
        <p className="muted-label">DIFFICULTY</p>
        <button className={difficulty === null ? 'side-active' : ''} onClick={() => { setDifficulty(null); setPage(1) }}>
          All levels
        </button>
        {DIFFICULTIES.map(d => (
          <button key={d} className={difficulty === d ? 'side-active' : ''} onClick={() => { setDifficulty(d); setPage(1) }}>
            {d[0] + d.slice(1).toLowerCase()}
          </button>
        ))}
      </aside>

      <section className="workspace-main">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">SOLVE · LEARN · GROW</p>
            <h1>Questions</h1>
            <p>Tackle quantum circuit problems. Build the circuit, submit your answer, earn XP.</p>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search questions"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
            />
          </div>
        </div>

        {listLoading && <Loading label="Loading questions…" />}
        {!listLoading && listError && <ErrorBox message={listError} />}
        {!listLoading && !listError && data && data.items.length === 0 && (
          <p className="muted">No questions match those filters yet.</p>
        )}

        {!listLoading && !listError && data && data.items.length > 0 && (
          <>
            <div className="questions-grid">
              {data.items.map(p => {
                const dc = difficultyColor(p.difficulty)
                return (
                  <button
                    key={p.id}
                    className="question-card"
                    onClick={() => setSelectedId(p.id)}
                  >
                    <div className="question-card-top">
                      <span className={`tag ${dc}`}>{p.difficulty}</span>
                      {p.isDaily && <span className="tag orange" style={{ marginLeft: 6 }}>Daily</span>}
                    </div>
                    <h3 className="question-card-title">{p.title}</h3>
                    <div className="question-card-foot">
                      <span className="muted">{p.topic}</span>
                      <ChevronRight size={15} />
                    </div>
                  </button>
                )
              })}
            </div>

            {data.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center', marginTop: 24 }}>
                <button className="icon-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ArrowLeft size={16} />
                </button>
                <span className="muted">Page {data.page} of {data.totalPages}</span>
                <button className="icon-btn" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
