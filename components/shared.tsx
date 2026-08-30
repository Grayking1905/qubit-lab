'use client'

export function Stat({ icon: Icon, value, label, accent }: any) {
  return <div className="stat-card"><Icon className={accent} size={19} /><strong>{value}</strong><span>{label}</span></div>
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="muted" style={{ padding: '24px 0' }}>{label}</p>
}

export function ErrorBox({ message }: { message: string }) {
  return <p className="auth-error" style={{ padding: '12px 0' }}>{message}</p>
}

export function difficultyColor(d: string) {
  return d === 'ADVANCED' ? 'pink' : d === 'INTERMEDIATE' ? 'blue' : 'orange'
}

export function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
