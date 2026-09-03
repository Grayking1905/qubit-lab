'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type Algorithm3DVisualizerType from './Algorithm3DVisualizer'

const Algorithm3DVisualizer = dynamic(
  () => import('@/components/Algorithm3DVisualizer'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '420px',
          borderRadius: 14,
          background: 'var(--panel2)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted)',
          fontSize: 13,
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <span>Initializing 3D Quantum Stage…</span>
        </div>
      </div>
    ),
  }
)

export default function Algorithm3DVisualizerClient(
  props: ComponentProps<typeof Algorithm3DVisualizerType>
) {
  return <Algorithm3DVisualizer {...props} />
}
