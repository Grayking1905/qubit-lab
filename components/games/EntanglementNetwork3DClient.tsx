'use client'

import dynamic from 'next/dynamic'
import type { BlochCoords } from '@/lib/quantum'

interface EntanglementNetworkProps {
  qubits: number
  blochCoords: BlochCoords[]
  isEntangled: boolean
  isSuccess?: boolean
  entangledPairs?: [number, number][]
}

const EntanglementNetwork3D = dynamic(() => import('./EntanglementNetwork3D'), {
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
        color: '#79a9d9',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      INITIALIZING QUANTUM NETWORK STAGE...
    </div>
  ),
})

export default function EntanglementNetwork3DClient(props: EntanglementNetworkProps) {
  return <EntanglementNetwork3D {...props} />
}
