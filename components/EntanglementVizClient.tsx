'use client'

import dynamic from 'next/dynamic'

const EntanglementViz = dynamic(() => import('@/components/EntanglementViz'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: 420, borderRadius: 14,
      background: 'radial-gradient(circle at 30% 40%, #1e1208 0%, #0e0c0a 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #f47c45', opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, #f47c4550, #79a9d950)', borderRadius: 2 }} />
        <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #79a9d9', opacity: 0.5, animation: 'pulse 1.5s infinite 0.75s' }} />
      </div>
      <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'ui-monospace,monospace' }}>
        Loading Entanglement Visualizer…
      </span>
    </div>
  ),
})

export default EntanglementViz
