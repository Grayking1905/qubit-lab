'use client'

import dynamic from 'next/dynamic'
import type { BlochCoords } from '@/lib/quantum'

interface BlochNavigatorProps {
  currentCoords: BlochCoords
  targetCoords?: BlochCoords
  obstacles?: Array<{ center: BlochCoords; radius: number; label: string }>
  isSuccess?: boolean
}

const BlochNavigator3D = dynamic(() => import('./BlochNavigator3D'), {
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
        color: '#ffb478',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      INITIALIZING 3D BLOCH NAVIGATOR...
    </div>
  ),
})

export default function BlochNavigator3DClient(props: BlochNavigatorProps) {
  return <BlochNavigator3D {...props} />
}
