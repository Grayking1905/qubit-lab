'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { BlochCoords } from '@/lib/quantum'

interface EntanglementNetworkProps {
  qubits: number
  blochCoords: BlochCoords[]
  isEntangled: boolean
  isSuccess?: boolean
  entangledPairs?: [number, number][]
}

function SatelliteNode({
  index,
  total,
  coords,
  isEntangled,
}: {
  index: number
  total: number
  coords?: BlochCoords
  isEntangled: boolean
}) {
  const meshRef = useRef<THREE.Group>(null)
  const solarRef = useRef<THREE.Group>(null)

  const angle = (index / total) * Math.PI * 2
  const radius = total > 2 ? 1.9 : 1.5
  const posX = Math.cos(angle) * radius
  const posZ = Math.sin(angle) * radius

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4
    }
    if (solarRef.current) {
      solarRef.current.rotation.z += delta * 0.2
    }
  })

  const nodeColor = isEntangled ? '#87b89a' : '#f47c45'

  return (
    <group position={[posX, 0.2, posZ]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <group ref={meshRef}>
          {/* Central Satellite Body */}
          <mesh>
            <boxGeometry args={[0.26, 0.26, 0.26]} />
            <meshStandardMaterial
              color="#211e1a"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Central Quantum Qubit Core (Glowing Sphere) */}
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial
              color={nodeColor}
              emissive={nodeColor}
              emissiveIntensity={isEntangled ? 1.8 : 0.8}
              roughness={0.1}
            />
          </mesh>

          {/* Outer Protection Ring */}
          <mesh>
            <torusGeometry args={[0.38, 0.012, 16, 32]} />
            <meshBasicMaterial color={nodeColor} transparent opacity={0.6} />
          </mesh>

          {/* Solar Panel Wings */}
          <group ref={solarRef}>
            <mesh position={[0.42, 0, 0]}>
              <boxGeometry args={[0.32, 0.015, 0.16]} />
              <meshStandardMaterial color="#79a9d9" emissive="#79a9d9" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.42, 0, 0]}>
              <boxGeometry args={[0.32, 0.015, 0.16]} />
              <meshStandardMaterial color="#79a9d9" emissive="#79a9d9" emissiveIntensity={0.5} />
            </mesh>
          </group>

          {/* Downlink Transceiver Cone */}
          <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.09, 0.14, 16]} />
            <meshStandardMaterial color="#35312b" metalness={0.9} />
          </mesh>
        </group>

        {/* Floating Station Label */}
        <Text
          position={[0, 0.65, 0]}
          fontSize={0.15}
          color="#f2ead9"
          anchorX="center"
          anchorY="middle"
        >
          {`Station Q${index}`}
        </Text>

        {coords && (
          <Text
            position={[0, -0.5, 0]}
            fontSize={0.1}
            color={nodeColor}
            anchorX="center"
            anchorY="middle"
          >
            {`Z: ${coords.z.toFixed(2)}`}
          </Text>
        )}
      </Float>
    </group>
  )
}

function LaserBeam({
  fromIndex,
  toIndex,
  total,
  isSuccess,
}: {
  fromIndex: number
  toIndex: number
  total: number
  isSuccess?: boolean
}) {
  const pulseRef = useRef<THREE.Mesh>(null)

  const radius = total > 2 ? 1.9 : 1.5
  const angleA = (fromIndex / total) * Math.PI * 2
  const angleB = (toIndex / total) * Math.PI * 2

  const posA = new THREE.Vector3(Math.cos(angleA) * radius, 0.2, Math.sin(angleA) * radius)
  const posB = new THREE.Vector3(Math.cos(angleB) * radius, 0.2, Math.sin(angleB) * radius)

  const mid = posA.clone().add(posB).multiplyScalar(0.5)
  mid.y += 0.6 // Elevated arc

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(posA, mid, posB)
  }, [posA.x, posA.z, posB.x, posB.z, mid.y])

  const points = useMemo(() => curve.getPoints(40), [curve])

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = (clock.getElapsedTime() * 0.8) % 1
      const pos = curve.getPoint(t)
      pulseRef.current.position.copy(pos)
    }
  })

  const beamColor = isSuccess ? '#87b89a' : '#ffb478'

  return (
    <group>
      {/* Curved laser line */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={self => {
            const raw = new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))
            self.setAttribute('position', new THREE.BufferAttribute(raw, 3))
          }}
        />
        <lineBasicMaterial color={beamColor} linewidth={4} transparent opacity={0.95} />
      </line>

      {/* Flowing Laser Quantum Packet */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={beamColor}
          emissive={beamColor}
          emissiveIntensity={2.5}
        />
      </mesh>
    </group>
  )
}

function NetworkScene({ qubits, blochCoords, isEntangled, isSuccess, entangledPairs }: EntanglementNetworkProps) {
  const worldGroupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (worldGroupRef.current) {
      worldGroupRef.current.rotation.y += delta * 0.08
    }
  })

  const pairs: [number, number][] = entangledPairs && entangledPairs.length > 0
    ? entangledPairs
    : isEntangled
    ? qubits === 2
      ? [[0, 1]]
      : [[0, 1], [1, 2]]
    : []

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 14, 10]} intensity={2} color="#79a9d9" />
      <pointLight position={[-10, -6, -10]} intensity={0.9} color="#f47c45" />

      <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} dampingFactor={0.08} />

      <group ref={worldGroupRef}>
        {/* Central Quantum Relay Hub / Planet Core */}
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshStandardMaterial
            color="#141210"
            roughness={0.4}
            metalness={0.9}
            wireframe
          />
        </mesh>

        {/* Central Hub Core Crystal */}
        <mesh position={[0, -0.2, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={isEntangled ? '#87b89a' : '#35312b'}
            emissive={isEntangled ? '#87b89a' : '#f47c45'}
            emissiveIntensity={isEntangled ? 1.5 : 0.5}
          />
        </mesh>

        {/* Orbital Resonance Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
          <ringGeometry args={[1.88, 1.92, 64]} />
          <meshBasicMaterial color={isEntangled ? '#87b89a' : '#35312b'} transparent opacity={0.4} />
        </mesh>

        {/* Satellite Stations */}
        {Array.from({ length: qubits }, (_, i) => (
          <SatelliteNode
            key={i}
            index={i}
            total={qubits}
            coords={blochCoords[i]}
            isEntangled={isEntangled}
          />
        ))}

        {/* Flowing Laser Quantum Bridges */}
        {pairs.map(([a, b], idx) => (
          <LaserBeam
            key={idx}
            fromIndex={a}
            toIndex={b}
            total={qubits}
            isSuccess={isSuccess}
          />
        ))}
      </group>
    </>
  )
}

export default function EntanglementNetwork3D(props: EntanglementNetworkProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 360, position: 'relative' }}>
      <Canvas camera={{ position: [0, 3.4, 4.2], fov: 45 }}>
        <NetworkScene {...props} />
      </Canvas>
    </div>
  )
}
