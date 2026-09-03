'use client'

import dynamic from 'next/dynamic'
import type { BlochCoords } from '@/lib/quantum'

interface QuantumShieldProps {
  qubits: number
  blochCoords: BlochCoords[]
  isSuccess?: boolean
  initialErrors?: number[]
}

const QuantumShield3D = dynamic(() => import('./QuantumShield3D'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: 340,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#141210',
        borderRadius: 12,
        color: '#87b89a',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      INITIALIZING QUANTUM CHIP SURFACE CODE...
    </div>
  ),
})

export default function QuantumShield3DClient(props: QuantumShieldProps) {
  return <QuantumShield3D {...props} />
}
