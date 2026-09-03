'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float } from '@react-three/drei'
import * as THREE from 'three'

interface OracleHunterProps {
  probabilities: Record<string, number>
  targetKet?: string
  isSuccess?: boolean
}

function MolecularPod({
  state,
  prob,
  isTarget,
  index,
  total,
}: {
  state: string
  prob: number
  isTarget: boolean
  index: number
  total: number
}) {
  const pillarRef = useRef<THREE.Group>(null)
  const currentHeight = useRef(0.2)

  const angle = (index / total) * Math.PI * 2
  const radius = total > 4 ? 2.3 : 1.7
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius

  const targetHeight = Math.max(0.18, prob * 2.4)

  useFrame((_, delta) => {
    // Smooth height animation
    currentHeight.current = THREE.MathUtils.lerp(currentHeight.current, targetHeight, Math.min(1, delta * 8))

    if (pillarRef.current) {
      pillarRef.current.scale.set(1, currentHeight.current, 1)
    }
  })

  const podColor = isTarget
    ? prob > 0.6
      ? '#87b89a'
      : '#f47c45'
    : prob > 0.08
    ? '#ffb478'
    : '#35312b'

  return (
    <group position={[x, 0, z]}>
      {/* Base Hexagonal Docking Well */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.28, 6]} />
        <meshBasicMaterial
          color={isTarget ? '#f47c45' : '#221f1b'}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dynamic Crystal Pillar */}
      <group ref={pillarRef}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 1, 6]} />
          <meshStandardMaterial
            color={podColor}
            emissive={podColor}
            emissiveIntensity={isTarget ? 1.6 : prob * 0.9}
            roughness={0.15}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* Vertical Laser Spire on Amplified State */}
      {prob > 0.35 && (
        <mesh position={[0, targetHeight + 0.6, 0]}>
          <cylinderGeometry args={[0.015, 0.07, 1.2, 8]} />
          <meshBasicMaterial
            color={isTarget ? '#87b89a' : '#ffb478'}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Floating State Ket & Probability */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
        <Text
          position={[0, targetHeight + 0.35, 0]}
          fontSize={0.15}
          color={isTarget ? '#ffb478' : '#f2ead9'}
          anchorX="center"
          anchorY="bottom"
        >
          {`|${state}⟩`}
        </Text>
        <Text
          position={[0, -0.16, 0]}
          fontSize={0.11}
          color={isTarget ? '#87b89a' : '#79a9d9'}
          anchorX="center"
          anchorY="top"
        >
          {`${(prob * 100).toFixed(0)}%`}
        </Text>
      </Float>
    </group>
  )
}

function HunterScene({ probabilities, targetKet, isSuccess }: OracleHunterProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06
    }
  })

  const entries = Object.entries(probabilities).sort(([a], [b]) => a.localeCompare(b))
  const cleanTarget = targetKet?.replace(/[|⟩]/g, '').trim()

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 14, 8]} intensity={2} color="#ffb478" />
      <pointLight position={[-10, -6, -8]} intensity={0.9} color="#79a9d9" />

      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={7} dampingFactor={0.08} />

      <group ref={groupRef}>
        {/* Holographic Molecular Lattice Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[7, 7]} />
          <meshBasicMaterial color="#141210" wireframe transparent opacity={0.6} />
        </mesh>

        {/* Center Target Hologram Radar */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.54, 32]} />
          <meshBasicMaterial
            color={isSuccess ? '#87b89a' : '#f47c45'}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Molecular Conformation Pods */}
        {entries.map(([st, p], i) => (
          <MolecularPod
            key={st}
            state={st}
            prob={p}
            isTarget={cleanTarget ? cleanTarget.includes(st) : false}
            index={i}
            total={entries.length}
          />
        ))}
      </group>
    </>
  )
}

export default function OracleHunter3D(props: OracleHunterProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 360, position: 'relative' }}>
      <Canvas camera={{ position: [0, 3, 4.2], fov: 45 }}>
        <HunterScene {...props} />
      </Canvas>
    </div>
  )
}
