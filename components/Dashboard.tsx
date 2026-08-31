'use client'

import { useCallback } from 'react'
import { ArrowRight, Award, BookOpen, Flame, Lock, Play, Star, Trophy, Zap } from 'lucide-react'
import { ApiError, type User } from '@/lib/api'
import { useDashboardStore, usePolling } from '@/lib/store'
import { ErrorBox, Loading } from '@/components/shared'

// XP required to reach the next level (simple formula matching backend)
const xpForNextLevel = (level: number) => Math.round(100 * Math.pow(level, 1.4))

export default function Dashboard({ user, setView, openProblem }: {
  user: User | null
  setView: (v: any) => void
  openProblem: (id: string) => void
}) {
  const { stats, daily, dailyChecked, allBadges, statsError, loading, fetchAll } = useDashboardStore()

  const poll = useCallback(
    (isInitial: boolean) => fetchAll(user, { silent: !isInitial }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  )
  usePolling(poll, 30_000)

  const displayName = (user?.name || 'learner').split(' ')[0]
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const streak = user?.streak ?? 0
  const xp = user?.xp ?? 0
  const level = user?.level ?? 1
  const nextXp = xpForNextLevel(level)
  const xpPct = Math.min(100, Math.round((xp / nextXp) * 100))
  const solvedTotal = stats ? Object.values(stats.solvedByDifficulty).reduce((a, b) => a + b, 0) : 0
  const earnedBadgeIds = new Set(stats?.badges.map(ub => ub.badge.id) ?? [])

  // 7-day activity sparkline
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      key,
      count: stats?.activityMap[key] ?? 0,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    }
  })
  const maxCount = Math.max(1, ...last7.map(d => d.count))

  // SVG area sparkline points (100×56 viewbox)
  const sparkW = 100, sparkH = 56
  const pts = last7.map((d, i) => ({
    x: (i / 6) * sparkW,
    y: sparkH - Math.max(3, (d.count / maxCount) * (sparkH - 6)),
  }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L${sparkW},${sparkH} L0,${sparkH} Z`

  if (loading && !stats) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <Loading label="Loading your dashboard…" />
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">

        {/* ── Hero ─────────────────────────────────────────── */}
          <div className="db-hero">
            <div className="db-hero-left">
              <p className="eyebrow">WELCOME BACK</p>
              <h1 className="db-hero-name">
                {displayName}
                {streak > 0 && (
                  <span className="db-streak-badge">
                    <Flame size={13} />
                    {streak}d
                  </span>
                )}
              </h1>
              <p className="db-hero-date">{today}</p>
              <p className="db-hero-sub">
                {streak > 0
                  ? `🔥 You're on a ${streak}-day streak — keep it up!`
                  : 'Solve a problem today to start your streak.'}
              </p>
            </div>

            {/* XP Ring */}
            <div className="db-xp-ring-wrap">
              <svg className="db-xp-ring" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="var(--line)" strokeWidth="6" />
                <circle
                  cx="44" cy="44" r="38" fill="none"
                  stroke="var(--orange)" strokeWidth="6"
                  strokeDasharray={`${(xpPct / 100) * 238.76} 238.76`}
                  strokeLinecap="round"
                  strokeDashoffset="59.69" /* rotate so gap is at bottom */
                  style={{ transition: 'stroke-dasharray 0.8s ease', filter: 'drop-shadow(0 0 6px var(--orange))' }}
                />
              </svg>
              <div className="db-xp-ring-inner">
                <strong>{xp.toLocaleString()}</strong>
                <span>XP</span>
              </div>
              <div className="db-level-pill">Lvl {level}</div>
            </div>

            <button className="pill-btn db-cta" onClick={() => setView('learn')}>
              Practice now <ArrowRight size={14} />
            </button>
          </div>

          {statsError && <ErrorBox message={statsError} />}

          {/* ── Stat cards ───────────────────────────────────── */}
          <div className="db-stats-row">
            <StatCard
              icon={<Flame size={20} />}
              value={String(streak)}
              label="Day streak"
              accent="orange"
              glow
            />
            <StatCard
              icon={<Zap size={20} />}
              value={xp.toLocaleString()}
              label="Total XP"
              accent="green"
            />
            <StatCard
              icon={<Trophy size={20} />}
              value={`Lvl ${level}`}
              label="Current level"
              accent="blue"
            />
            <StatCard
              icon={<Award size={20} />}
              value={String(solvedTotal)}
              label="Problems solved"
              accent="pink"
            />
          </div>

          {/* ── XP Progress bar ──────────────────────────────── */}
          <div className="db-xp-bar-wrap">
            <div className="db-xp-bar-labels">
              <span className="muted" style={{ fontSize: 11 }}>
                Level {level} → {level + 1}
              </span>
              <span className="muted" style={{ fontSize: 11 }}>
                {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
              </span>
            </div>
            <div className="db-xp-bar">
              <div className="db-xp-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>

          {/* ── Two-col: Problem of the Day + Activity ────────── */}
          <div className="db-columns">

            {/* Problem of the Day */}
            <div className="db-panel">
              <div className="panel-title">
                <h2 className="db-panel-h">Problem of the day</h2>
                <button className="link-btn" onClick={() => setView('learn')}>Browse all</button>
              </div>
              {!dailyChecked && <Loading label="Checking today's problem…" />}
              {dailyChecked && !daily && (
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  No daily problem scheduled right now.{' '}
                  <button className="link-btn" style={{ display: 'inline' }} onClick={() => setView('learn')}>
                    Browse problems
                  </button>{' '}
                  instead.
                </p>
              )}
              {daily && (
                <div className="db-daily-card">
                  <div className={`db-daily-orb ${daily.difficulty === 'BEGINNER' ? 'orange' : daily.difficulty === 'INTERMEDIATE' ? 'blue' : 'pink'}`}>
                    <Zap size={22} />
                  </div>
                  <div className="db-daily-body">
                    <span className={`tag ${daily.difficulty === 'BEGINNER' ? 'orange' : daily.difficulty === 'INTERMEDIATE' ? 'blue' : 'pink'}`} style={{ letterSpacing: 1 }}>
                      {daily.difficulty} · {daily.topic}
                    </span>
                    <h3 className="db-daily-title">{daily.title}</h3>
                    <p className="db-daily-desc">
                      {daily.description.slice(0, 110)}{daily.description.length > 110 ? '…' : ''}
                    </p>
                  </div>
                  <button className="db-play-btn" onClick={() => openProblem(daily.id)} title="Solve now">
                    <Play size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Activity chart */}
            <div className="db-panel">
              <div className="panel-title">
                <h2 className="db-panel-h">Activity</h2>
                <span className="muted" style={{ fontSize: 11 }}>Last 7 days</span>
              </div>
              <div className="db-spark-wrap">
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="db-spark-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--orange)" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={areaD} fill="url(#sparkGrad)" />
                  <path d={pathD} fill="none" stroke="var(--orange)" strokeWidth="1.5" strokeLinejoin="round" />
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={last7[i].count > 0 ? 2.5 : 1.5}
                      fill={last7[i].count > 0 ? 'var(--orange)' : 'var(--line)'}
                      style={{ filter: last7[i].count > 0 ? 'drop-shadow(0 0 4px var(--orange))' : undefined }}
                    />
                  ))}
                </svg>
                <div className="db-spark-axis">
                  {last7.map(d => <span key={d.key}>{d.label}</span>)}
                </div>
                <div className="db-spark-summary">
                  <span className="muted" style={{ fontSize: 11 }}>
                    {last7.reduce((a, d) => a + d.count, 0)} submissions this week
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick Links ────────────────────────────────────── */}
          <div className="db-quick-links">
            {[
              { icon: <BookOpen size={16} />, label: 'Courses', view: 'courses' },
              { icon: <Zap size={16} />, label: 'Circuit Builder', view: 'builder' },
              { icon: <Star size={16} />, label: 'Algorithms', view: 'algorithms' },
              { icon: <Trophy size={16} />, label: 'Leaderboard', view: 'learn' },
            ].map(({ icon, label, view }) => (
              <button key={view} className="db-quick-btn" onClick={() => setView(view)}>
                <span className="db-quick-icon">{icon}</span>
                {label}
                <ArrowRight size={12} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
              </button>
            ))}
          </div>

          {/* ── Badges ─────────────────────────────────────────── */}
          {allBadges.length > 0 && (
            <div className="db-panel" style={{ marginTop: 16 }}>
              <div className="panel-title">
                <h2 className="db-panel-h">Badges</h2>
                <span className="muted" style={{ fontSize: 11 }}>
                  {earnedBadgeIds.size} of {allBadges.length} earned
                </span>
              </div>
              <div className="db-badge-grid">
                {allBadges.map(badge => {
                  const earned = earnedBadgeIds.has(badge.id)
                  return (
                    <div
                      key={badge.id}
                      className={`db-badge ${earned ? 'db-badge-earned' : 'db-badge-locked'}`}
                      title={badge.description}
                    >
                      <span className="db-badge-icon">{badge.icon}</span>
                      <span className="db-badge-name">{badge.name}</span>
                      {!earned && (
                        <span className="db-badge-lock">
                          <Lock size={10} />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Solved breakdown ───────────────────────────────── */}
          {stats && solvedTotal > 0 && (
            <div className="db-panel" style={{ marginTop: 16 }}>
              <div className="panel-title">
                <h2 className="db-panel-h">Solved by difficulty</h2>
                <span className="muted" style={{ fontSize: 11 }}>{solvedTotal} total</span>
              </div>
              <div className="db-difficulty-bars">
                {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(diff => {
                  const count = stats.solvedByDifficulty[diff] ?? 0
                  const pct = solvedTotal > 0 ? Math.round((count / solvedTotal) * 100) : 0
                  const accent = diff === 'BEGINNER' ? 'orange' : diff === 'INTERMEDIATE' ? 'blue' : 'pink'
                  return (
                    <div key={diff} className="db-diff-row">
                      <span className={`db-diff-label ${accent}`}>{diff}</span>
                      <div className="db-diff-track">
                        <div
                          className={`db-diff-fill ${accent}`}
                          style={{ width: `${pct}%`, transition: 'width 0.8s ease' }}
                        />
                      </div>
                      <span className="muted" style={{ fontSize: 11, minWidth: 28, textAlign: 'right' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard({ icon, value, label, accent, glow }: {
  icon: React.ReactNode
  value: string
  label: string
  accent: 'orange' | 'green' | 'blue' | 'pink'
  glow?: boolean
}) {
  return (
    <div className={`db-stat-card db-stat-${accent}${glow ? ' db-stat-glow' : ''}`}>
      <span className={`db-stat-icon ${accent}`}>{icon}</span>
      <strong className="db-stat-value">{value}</strong>
      <span className="db-stat-label">{label}</span>
    </div>
  )
}
