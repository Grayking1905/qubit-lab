'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { BlochCoords } from '@/lib/quantum'

interface QuantumShieldProps {
  qubits: number
  blochCoords: BlochCoords[]
  isSuccess?: boolean
  initialErrors?: number[]
}

function TransmonQubitPad({
  index,
  total,
  coords,
  isError,
  isSuccess,
}: {
  index: number
  total: number
  coords?: BlochCoords
  isError: boolean
  isSuccess?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const shieldRingRef = useRef<THREE.Mesh>(null)

  const spacing = 1.45
  const startX = -((total - 1) * spacing) / 2
  const posX = startX + index * spacing

  useFrame(({ clock }, delta) => {
    if (groupRef.current && isError && !isSuccess) {
      // Glitch jitter
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 25) * 0.03
    }
    if (shieldRingRef.current && isSuccess) {
      shieldRingRef.current.rotation.z += delta * 1.5
    }
  })

  const coreColor = isSuccess ? '#87b89a' : isError ? '#e38d9b' : '#ffb478'

  return (
    <group position={[posX, 0, 0]} ref={groupRef}>
      {/* Superconducting Substrate Pocket */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[1.15, 0.08, 1.15]} />
        <meshStandardMaterial color="#1a1814" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Gold Josephson Junction Cross Transmon */}
      <group position={[0, 0.04, 0]}>
        <mesh>
          <boxGeometry args={[0.65, 0.04, 0.18]} />
          <meshStandardMaterial
            color={coreColor}
            emissive={coreColor}
            emissiveIntensity={isError ? 1.8 : isSuccess ? 1.4 : 0.6}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[0.18, 0.04, 0.65]} />
          <meshStandardMaterial
            color={coreColor}
            emissive={coreColor}
            emissiveIntensity={isError ? 1.8 : isSuccess ? 1.4 : 0.6}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Defusal Shield Hologram Ring */}
      {isSuccess && (
        <mesh ref={shieldRingRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.55, 32]} />
          <meshBasicMaterial color="#87b89a" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Cosmic Glitch Lightning Indicator */}
      {isError && !isSuccess && (
        <mesh position={[0, 0.4, 0]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#e38d9b" emissive="#e38d9b" emissiveIntensity={2} wireframe />
        </mesh>
      )}

      {/* Qubit Label */}
      <Text position={[0, 0.52, 0]} fontSize={0.15} color="#f2ead9" anchorX="center">
        {`Qubit Q${index}`}
      </Text>

      {coords && (
        <Text
          position={[0, -0.28, 0]}
          fontSize={0.1}
          color={isSuccess ? '#87b89a' : '#79a9d9'}
          anchorX="center"
        >
          {`Z: ${coords.z.toFixed(2)}`}
        </Text>
      )}
    </group>
  )
}

function ShieldScene({ qubits, blochCoords, isSuccess, initialErrors = [] }: QuantumShieldProps) {
  const chipRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (chipRef.current) {
      chipRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.12
    }
  })

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[6, 10, 6]} intensity={1.8} color="#87b89a" />
      <pointLight position={[-6, -4, -6]} intensity={0.9} color="#ffb478" />

      <OrbitControls enablePan={false} minDistance={2.2} maxDistance={6.5} dampingFactor={0.08} />

      <group ref={chipRef}>
        {/* Cryogenic Chip Wafer */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[qubits * 1.5 + 0.8, 0.12, 2.7]} />
          <meshStandardMaterial
            color="#13110e"
            roughness={0.2}
            metalness={0.95}
          />
        </mesh>

        {/* Silicon Wafer Edge Gold Traces */}
        <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[qubits * 1.5 + 0.6, 2.5]} />
          <meshBasicMaterial color="#2a251e" wireframe transparent opacity={0.4} />
        </mesh>

        {/* Qubit instances */}
        {Array.from({ length: qubits }, (_, i) => (
          <TransmonQubitPad
            key={i}
            index={i}
            total={qubits}
            coords={blochCoords[i]}
            isError={initialErrors.includes(i)}
            isSuccess={isSuccess}
          />
        ))}
      </group>
    </>
  )
}

export default function QuantumShield3D(props: QuantumShieldProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 360, position: 'relative' }}>
      <Canvas camera={{ position: [0, 2.6, 3.4], fov: 45 }}>
        <ShieldScene {...props} />
      </Canvas>
    </div>
  )
}
