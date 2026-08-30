'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { ApiError, listProblems, type Difficulty, type PaginatedProblems } from '@/lib/api'
import { ErrorBox, Loading, difficultyColor, formatDate } from '@/components/shared'

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export default function Learn({ openProblem }: { openProblem: (id: string) => void }) {
  const [topics, setTopics] = useState<string[]>([])
  const [topic, setTopic] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedProblems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listProblems({ pageSize: 100 })
      .then(res => setTopics(Array.from(new Set(res.items.map(p => p.topic))).sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    listProblems({ topic: topic ?? undefined, difficulty: difficulty ?? undefined, search: search || undefined, page, pageSize: 10 })
      .then(setData)
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load problems. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [topic, difficulty, search, page])

  return <main className="workspace">
    <aside className="sidebar">
      <p className="muted-label">TOPICS</p>
      <button className={topic === null ? 'side-active' : ''} onClick={() => { setTopic(null); setPage(1) }}><BookOpen size={16} /> All topics</button>
      {topics.map(t => <button key={t} className={topic === t ? 'side-active' : ''} onClick={() => { setTopic(t); setPage(1) }}>{t}</button>)}
      <div className="side-divider" />
      <p className="muted-label">DIFFICULTY</p>
      <button className={difficulty === null ? 'side-active' : ''} onClick={() => { setDifficulty(null); setPage(1) }}>All levels</button>
      {DIFFICULTIES.map(d => <button key={d} className={difficulty === d ? 'side-active' : ''} onClick={() => { setDifficulty(d); setPage(1) }}>{d[0] + d.slice(1).toLowerCase()}</button>)}
    </aside>
    <section className="workspace-main">
      <div className="workspace-heading">
        <div><p className="eyebrow">PROBLEM LIBRARY</p><h1>Problems for you</h1><p>Solve a problem to earn XP and grow your streak.</p></div>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search problems" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }} />
        </div>
      </div>

      {loading && <Loading label="Loading problems…" />}
      {!loading && error && <ErrorBox message={error} />}
      {!loading && !error && data && data.items.length === 0 && <p className="muted">No problems match those filters yet.</p>}

      {!loading && !error && data && data.items.length > 0 && <>
        <div className="problem-table">
          {data.items.map(p => (
            <button key={p.id} className="problem-row" onClick={() => openProblem(p.id)}>
              <span className="problem-status" />
              <span><strong>{p.title}</strong><small>{p.topic}</small></span>
              <span className="difficulty" style={{ color: `var(--${difficultyColor(p.difficulty)})` }}>{p.difficulty}</span>
              <span className="muted">{formatDate(p.createdAt)}</span>
              <span className="success">{p.isDaily ? 'Daily' : ''}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
        {data.totalPages > 1 && <div style={{ display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center', marginTop: 20 }}>
          <button className="icon-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
          <span className="muted">Page {data.page} of {data.totalPages}</span>
          <button className="icon-btn" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
        </div>}
      </>}
    </section>
  </main>
}
