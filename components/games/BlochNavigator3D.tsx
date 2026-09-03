'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { BlochCoords } from '@/lib/quantum'

interface BlochNavigatorProps {
  currentCoords: BlochCoords
  targetCoords?: BlochCoords
  obstacles?: Array<{ center: BlochCoords; radius: number; label: string }>
  isSuccess?: boolean
  historyCoords?: BlochCoords[]
}

function NavigatorScene({
  currentCoords,
  targetCoords,
  obstacles,
  isSuccess,
  historyCoords = [],
}: BlochNavigatorProps) {
  const needleGroupRef = useRef<THREE.Group>(null)
  const targetRing1Ref = useRef<THREE.Mesh>(null)
  const targetRing2Ref = useRef<THREE.Mesh>(null)
  const auraRef = useRef<THREE.Mesh>(null)
  const currentVec = useRef(new THREE.Vector3(0, 1, 0))

  useFrame(({ clock }, delta) => {
    // Smooth responsive vector lerping
    const dest = new THREE.Vector3(currentCoords.x, currentCoords.z, -currentCoords.y)
    currentVec.current.lerp(dest, Math.min(1, delta * 9))

    if (needleGroupRef.current) {
      needleGroupRef.current.position.copy(currentVec.current)
    }

    if (targetRing1Ref.current) {
      targetRing1Ref.current.rotation.z += delta * 1.8
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15
      targetRing1Ref.current.scale.set(s, s, s)
    }

    if (targetRing2Ref.current) {
      targetRing2Ref.current.rotation.z -= delta * 1.2
    }

    if (auraRef.current) {
      auraRef.current.rotation.y += delta * 0.2
    }
  })

  // Convert target coords to Three.js orientation
  const targetPos = useMemo(() => {
    return targetCoords
      ? new THREE.Vector3(targetCoords.x, targetCoords.z, -targetCoords.y)
      : null
  }, [targetCoords])

  // Generate background particle stars
  const particles = useMemo(() => {
    const count = 70
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return pos
  }, [])

  return (
    <>
      <ambientLight intensity={0.9} />
      <pointLight position={[10, 12, 10]} intensity={2} color={isSuccess ? '#87b89a' : '#ffb478'} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#79a9d9" />

      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={6} dampingFactor={0.08} />

      {/* Floating Starfield Dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#ffb478" transparent opacity={0.5} />
      </points>

      <group>
        {/* Outer Atmospheric Aura */}
        <mesh ref={auraRef}>
          <sphereGeometry args={[1.08, 32, 32]} />
          <meshBasicMaterial
            color={isSuccess ? '#87b89a' : '#f47c45'}
            transparent
            opacity={0.08}
            wireframe
          />
        </mesh>

        {/* Semi-transparent Glass Bloch Sphere */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            roughness={0.15}
            transmission={0.9}
            thickness={0.6}
            color={isSuccess ? '#87b89a' : '#1a1814'}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Glowing Coordinate Wireframe Rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.994, 1.006, 64]} />
          <meshBasicMaterial
            color={isSuccess ? '#87b89a' : '#f47c45'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.6}
          />
        </mesh>
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[0.996, 1.004, 64]} />
          <meshBasicMaterial color="#35312b" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.996, 1.004, 64]} />
          <meshBasicMaterial color="#35312b" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>

        {/* Target Landing Zone with Double Radar Rings & Beacon Spire */}
        {targetPos && (
          <group position={targetPos}>
            {/* Outer radar ring */}
            <mesh ref={targetRing1Ref}>
              <ringGeometry args={[0.14, 0.19, 32]} />
              <meshBasicMaterial
                color={isSuccess ? '#87b89a' : '#f47c45'}
                side={THREE.DoubleSide}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Inner counter-rotating ring */}
            <mesh ref={targetRing2Ref}>
              <ringGeometry args={[0.07, 0.1, 24]} />
              <meshBasicMaterial
                color={isSuccess ? '#87b89a' : '#ffb478'}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Center target beacon core */}
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial
                color={isSuccess ? '#87b89a' : '#ffb478'}
                emissive={isSuccess ? '#87b89a' : '#f47c45'}
                emissiveIntensity={2}
              />
            </mesh>
            {/* Text label */}
            <Text
              position={[0, 0.24, 0]}
              fontSize={0.11}
              color={isSuccess ? '#87b89a' : '#ffb478'}
              anchorX="center"
              anchorY="middle"
            >
              TARGET ZONE
            </Text>
          </group>
        )}

        {/* Obstacle Decoherence Zones */}
        {obstacles?.map((obs, i) => {
          const obsPos = new THREE.Vector3(obs.center.x, obs.center.z, -obs.center.y)
          return (
            <group key={i} position={obsPos}>
              <mesh>
                <sphereGeometry args={[obs.radius * 0.95, 24, 24]} />
                <meshBasicMaterial color="#e38d9b" wireframe transparent opacity={0.7} />
              </mesh>
              <Text
                position={[0, obs.radius + 0.12, 0]}
                fontSize={0.09}
                color="#e38d9b"
                anchorX="center"
                anchorY="middle"
              >
                ⚠ {obs.label}
              </Text>
            </group>
          )
        })}

        {/* Dynamic Statevector Needle */}
        <group>
          {/* Laser Stem */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={self => {
                const positions = new Float32Array([
                  0, 0, 0,
                  currentVec.current.x, currentVec.current.y, currentVec.current.z,
                ])
                self.setAttribute('position', new THREE.BufferAttribute(positions, 3))
              }}
            />
            <lineBasicMaterial
              color={isSuccess ? '#87b89a' : '#f47c45'}
              linewidth={4}
              transparent
              opacity={0.95}
            />
          </line>

          {/* Needle Arrow Tip with Corona */}
          <group ref={needleGroupRef}>
            <mesh>
              <sphereGeometry args={[0.075, 24, 24]} />
              <meshStandardMaterial
                color={isSuccess ? '#87b89a' : '#f47c45'}
                emissive={isSuccess ? '#87b89a' : '#f47c45'}
                emissiveIntensity={2.2}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial
                color={isSuccess ? '#87b89a' : '#ffb478'}
                transparent
                opacity={0.3}
              />
            </mesh>
          </group>
        </group>

        {/* Center Anchor Sphere */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.06, 24, 24]} />
          <meshStandardMaterial
            color="#ffb478"
            emissive="#ffb478"
            emissiveIntensity={1}
            roughness={0.2}
          />
        </mesh>

        {/* Pole labels with floating effects */}
        <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
          <Text position={[0, 1.28, 0]} fontSize={0.16} color="#f2ead9" anchorX="center">
            |0⟩
          </Text>
          <Text position={[0, -1.28, 0]} fontSize={0.16} color="#f2ead9" anchorX="center">
            |1⟩
          </Text>
          <Text position={[1.28, 0, 0]} fontSize={0.13} color="#79a9d9" anchorX="center">
            |+⟩
          </Text>
          <Text position={[-1.28, 0, 0]} fontSize={0.13} color="#79a9d9" anchorX="center">
            |−⟩
          </Text>
          <Text position={[0, 0, -1.28]} fontSize={0.13} color="#e38d9b" anchorX="center">
            |+i⟩
          </Text>
          <Text position={[0, 0, 1.28]} fontSize={0.13} color="#e38d9b" anchorX="center">
            |−i⟩
          </Text>
        </Float>
      </group>
    </>
  )
}

export default function BlochNavigator3D(props: BlochNavigatorProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 360, position: 'relative' }}>
      <Canvas camera={{ position: [2.2, 1.6, 2.5], fov: 45 }}>
        <NavigatorScene {...props} />
      </Canvas>
    </div>
  )
}
