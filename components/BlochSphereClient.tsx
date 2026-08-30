'use client'

import dynamic from 'next/dynamic'

const BlochSphere = dynamic(() => import('@/components/BlochSphere'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', aspectRatio: '1', borderRadius: 14, background: 'var(--panel2)', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 11 }}>
      Loading Bloch sphere…
    </div>
  ),
})

export default BlochSphere
