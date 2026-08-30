'use client'

import dynamic from 'next/dynamic'

const QuantumLab3D = dynamic(() => import('@/components/QuantumLab3D'), {
  ssr: false,
  loading: () => (
    <main className="lab3d-page">
      <div className="lab3d-hero">
        <p className="muted">Loading 3D quantum lab…</p>
      </div>
    </main>
  ),
})

export default QuantumLab3D
