'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Award, Check, Flame, Play, Trophy, Zap } from 'lucide-react'
import { ApiError, getDailyProblem, getMyStats, type DailyProblem, type User, type UserStats } from '@/lib/api'
import { ErrorBox, Loading, Stat } from '@/components/shared'

export default function Dashboard({ user, setView, openProblem }: { user: User | null; setView: (v: any) => void; openProblem: (id: string) => void }) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsError, setStatsError] = useState('')
  const [daily, setDaily] = useState<DailyProblem | null>(null)
  const [dailyChecked, setDailyChecked] = useState(false)

  useEffect(() => {
    if (!user) return
    getMyStats().then(setStats).catch(err => setStatsError(err instanceof ApiError ? err.message : 'Could not load your stats.'))
  }, [user])

  useEffect(() => {
    getDailyProblem().then(setDaily).catch(() => setDaily(null)).finally(() => setDailyChecked(true))
  }, [])

  const displayName = (user?.name || 'learner').split(' ')[0].toUpperCase()
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const streak = user?.streak ?? 0
  const solvedTotal = stats ? Object.values(stats.solvedByDifficulty).reduce((a, b) => a + b, 0) : 0

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return { key, count: stats?.activityMap[key] ?? 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }
  })
  const maxCount = Math.max(1, ...last7.map(d => d.count))

  return <main className="workspace">
    <section className="workspace-main dashboard">
      <div className="dashboard-container">
        <div className="dashboard-hero">
          <div className="dashboard-intro">
            <p className="eyebrow">WELCOME BACK, {displayName}</p>
            <h1>Your learning dashboard</h1>
            <p>{today} · {streak > 0 ? `You’re on a ${streak} day streak.` : 'Solve a problem today to start your streak.'}</p>
          </div>
          <button className="pill-btn dashboard-cta" onClick={() => setView('learn')}>Practice now <ArrowRight size={15} /></button>
        </div>

        {statsError && <ErrorBox message={statsError} />}

        <div className="stats-grid">
          <Stat icon={Flame} value={String(streak)} label="day streak" accent="orange" />
          <Stat icon={Zap} value={String(user?.xp ?? 0)} label="total XP" accent="green" />
          <Stat icon={Trophy} value={`Lvl ${user?.level ?? 1}`} label="level" accent="blue" />
          <Stat icon={Check} value={String(solvedTotal)} label="problems solved" accent="pink" />
        </div>

        <div className="dashboard-columns">
          <div className="panel">
            <div className="panel-title"><h2>Problem of the day</h2><button className="link-btn" onClick={() => setView('learn')}>Browse all</button></div>
            {!dailyChecked && <Loading label="Checking today's problem…" />}
            {dailyChecked && !daily && <p className="muted">No problem of the day is scheduled right now. <button className="link-btn" style={{ display: 'inline' }} onClick={() => setView('learn')}>Browse problems</button> instead.</p>}
            {daily && (
              <div className="continue-card">
                <div className="course-orb orange"><Zap size={22} /></div>
                <div>
                  <span className="tag orange">{daily.difficulty} · {daily.topic}</span>
                  <h3>{daily.title}</h3>
                  <p>{daily.description.slice(0, 90)}{daily.description.length > 90 ? '…' : ''}</p>
                </div>
                <button className="icon-btn" onClick={() => openProblem(daily.id)}><Play size={16} /></button>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title"><h2>Activity</h2><span className="muted">Last 7 days</span></div>
            <div className="chart">
              <div className="chart-line">
                {last7.map(d => <i key={d.key} style={{ height: `${Math.max(4, (d.count / maxCount) * 100)}%` }} title={`${d.label}: ${d.count}`} />)}
              </div>
              <div className="chart-axis"><span>{last7[0].label}</span><span>{last7[3].label}</span><span>{last7[6].label}</span></div>
            </div>
          </div>
        </div>

        {stats && stats.badges.length > 0 && (
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-title"><h2>Badges earned</h2></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {stats.badges.map(ub => (
                <div key={ub.badge.id} className="tag orange" style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px' }}>
                  <Award size={14} /> {ub.badge.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  </main>
}
