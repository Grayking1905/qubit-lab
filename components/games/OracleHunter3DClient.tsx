'use client'

import dynamic from 'next/dynamic'

interface OracleHunterProps {
  probabilities: Record<string, number>
  targetKet?: string
  isSuccess?: boolean
}

const OracleHunter3D = dynamic(() => import('./OracleHunter3D'), {
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
        color: '#f47c45',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      INITIALIZING 3D MOLECULAR SEARCH PODS...
    </div>
  ),
})

export default function OracleHunter3DClient(props: OracleHunterProps) {
  return <OracleHunter3D {...props} />
}
