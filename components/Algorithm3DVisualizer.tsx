'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sparkles, Text, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { BlochCoords } from '@/lib/quantum'
import type { ComplexNum, GateOp } from '@/lib/api'

export interface StepVisualizationData {
  stepIndex: number
  totalSteps: number
  qubits: number
  blochCoords: BlochCoords[]
  activeGates: GateOp[]
  probabilities: Record<string, number>
  statevector: ComplexNum[]
  entangledPairs: [number, number][]
}

interface Algorithm3DVisualizerProps {
  data: StepVisualizationData
  focusQubit?: number | 'all'
  onSelectQubit?: (q: number) => void
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry & Math Utilities
// ─────────────────────────────────────────────────────────────────────────────

const UP = new THREE.Vector3(0, 1, 0)

function toScene(c: BlochCoords) {
  return new THREE.Vector3(c.x, c.z, -c.y)
}

function slerpUnit(from: THREE.Vector3, to: THREE.Vector3, t: number, out: THREE.Vector3) {
  const a = from.clone().normalize()
  const b = to.clone().normalize()
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1)
  const theta = Math.acos(dot)
  if (theta < 1e-4) return out.copy(b)
  const sin = Math.sin(theta)
  out.copy(a).multiplyScalar(Math.sin((1 - t) * theta) / sin)
  out.addScaledVector(b, Math.sin(t * theta) / sin)
  return out.normalize()
}

function makeRing(radius: number, axis: 'xy' | 'xz' | 'yz', color: string, opacity: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2
    const c = Math.cos(t) * radius
    const s = Math.sin(t) * radius
    if (axis === 'xz') pts.push(new THREE.Vector3(c, 0, s))
    else if (axis === 'xy') pts.push(new THREE.Vector3(c, s, 0))
    else pts.push(new THREE.Vector3(0, c, s))
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  return new THREE.Line(geom, mat)
}

function phaseToColor(re: number, im: number): string {
  const theta = Math.atan2(im, re) // -PI to PI
  const norm = (theta + Math.PI) / (2 * Math.PI) // 0 to 1
  if (norm < 0.25) return '#79a9d9' // Negative real / -PI
  if (norm < 0.5) return '#e38d9b'  // -PI/2 imaginary
  if (norm < 0.75) return '#f47c45' // Positive real / 0
  return '#87b89a'                  // +PI/2 imaginary
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Qubit Node Component
// ─────────────────────────────────────────────────────────────────────────────

function QubitNode({
  index,
  totalQubits,
  coords,
  isEntangled,
  isSelected,
  onSelect,
}: {
  index: number
  totalQubits: number
  coords: BlochCoords
  isEntangled: boolean
  isSelected: boolean
  onSelect?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const arrowRef = useRef<THREE.Group>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const haloRingRef = useRef<THREE.Mesh>(null)

  const currentVec = useRef(new THREE.Vector3(0, 1, 0))
  const targetVec = useRef(new THREE.Vector3(0, 1, 0))
  const tmpVec = useRef(new THREE.Vector3())

  // Layout X position based on total qubits
  const xPos = useMemo(() => {
    if (totalQubits === 1) return 0
    if (totalQubits === 2) return (index - 0.5) * 2.8
    if (totalQubits === 3) return (index - 1) * 2.5
    return (index - (totalQubits - 1) / 2) * 2.2
  }, [index, totalQubits])

  // Coordinate conversion
  useEffect(() => {
    const next = toScene(coords)
    if (next.lengthSq() < 1e-6) next.set(0, 1, 0)
    else next.normalize()
    targetVec.current.copy(next)
  }, [coords.x, coords.y, coords.z])

  // Radius of vector length (pure state = 1, entangled state reduced purity < 1)
  const vectorLength = useMemo(() => {
    const r = Math.sqrt(coords.x * coords.x + coords.y * coords.y + coords.z * coords.z)
    return isEntangled ? Math.max(0.35, Math.min(0.85, r)) : 0.94
  }, [coords, isEntangled])

  const equator = useMemo(() => makeRing(1.002, 'xz', '#f47c45', 0.5), [])
  const meridian1 = useMemo(() => makeRing(1.002, 'xy', '#79a9d9', 0.25), [])
  const meridian2 = useMemo(() => makeRing(1.002, 'yz', '#87b89a', 0.2), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    slerpUnit(currentVec.current, targetVec.current, 1 - Math.exp(-dt * 4.5), tmpVec.current)
    currentVec.current.copy(tmpVec.current)

    const dir = currentVec.current
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0)

    if (arrowRef.current) {
      arrowRef.current.position.copy(dir).multiplyScalar(vectorLength * 0.42)
      arrowRef.current.quaternion.setFromUnitVectors(UP, dir.clone().normalize())
    }
    if (tipRef.current) {
      tipRef.current.position.copy(dir).multiplyScalar(vectorLength)
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 5 + index) * 0.08
      tipRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.position.copy(dir).multiplyScalar(vectorLength)
      const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.15
      glowRef.current.scale.setScalar(pulse)
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += dt * 0.15
    }
    if (haloRingRef.current && isEntangled) {
      haloRingRef.current.rotation.z += dt * 0.4
      const p = 1.05 + Math.sin(state.clock.elapsedTime * 4 + index) * 0.06
      haloRingRef.current.scale.setScalar(p)
    }
  })

  return (
    <group
      ref={groupRef}
      position={[xPos, 0.4, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
    >
      {/* Outer Glass Sphere */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={isSelected ? '#2e261f' : '#191512'}
          transparent
          opacity={isSelected ? 0.32 : 0.22}
          roughness={0.2}
          metalness={0.3}
          transmission={0.4}
          thickness={0.5}
        />
      </mesh>

      {/* Wireframe Mesh */}
      <mesh>
        <sphereGeometry args={[1.003, 16, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#f47c45' : '#a29a8c'}
          wireframe
          transparent
          opacity={isSelected ? 0.16 : 0.08}
        />
      </mesh>

      {/* Coordinate Axis Lines */}
      <primitive object={useMemo(() => {
        const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.15, 0), new THREE.Vector3(0, 1.15, 0)])
        return new THREE.Line(geom, new THREE.LineBasicMaterial({ color: '#79a9d9', transparent: true, opacity: 0.4 }))
      }, [])} />
      <primitive object={useMemo(() => {
        const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.15, 0, 0), new THREE.Vector3(1.15, 0, 0)])
        return new THREE.Line(geom, new THREE.LineBasicMaterial({ color: '#87b89a', transparent: true, opacity: 0.3 }))
      }, [])} />

      {/* Rotating Guide Rings */}
      <group ref={ringsRef}>
        <primitive object={equator} />
        <primitive object={meridian1} />
        <primitive object={meridian2} />
      </group>

      {/* Entanglement Resonance Ring */}
      {isEntangled && (
        <mesh ref={haloRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.18, 0.015, 12, 48]} />
          <meshBasicMaterial color="#e38d9b" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Statevector Needle */}
      <group ref={arrowRef}>
        <mesh>
          <cylinderGeometry args={[0.016, 0.024, vectorLength * 0.76, 12]} />
          <meshStandardMaterial
            color="#ffb478"
            emissive={isEntangled ? '#e38d9b' : '#f47c45'}
            emissiveIntensity={1.0}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Tip Glow and Cone */}
      <mesh ref={tipRef}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isEntangled ? '#e38d9b' : '#f47c45'}
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshBasicMaterial
          color={isEntangled ? '#e38d9b' : '#f47c45'}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Pole Markers */}
      <Text position={[0, 1.25, 0]} fontSize={0.16} color="#79a9d9" anchorX="center" anchorY="middle">
        |0⟩
      </Text>
      <Text position={[0, -1.25, 0]} fontSize={0.16} color="#e38d9b" anchorX="center" anchorY="middle">
        |1⟩
      </Text>

      {/* Qubit Label Badge */}
      <group position={[0, -1.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.34, 0.38, 0.06, 24]} />
          <meshStandardMaterial
            color={isSelected ? '#f47c45' : '#211e1a'}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
        <Text position={[0, 0.05, 0.08]} rotation={[-Math.PI / 3, 0, 0]} fontSize={0.18} color="#f2ead9" anchorX="center" anchorY="middle">
          {`q${index}`}
        </Text>
        {isEntangled && (
          <Text position={[0, -0.22, 0]} fontSize={0.1} color="#e38d9b" anchorX="center" anchorY="middle">
            ENTANGLED
          </Text>
        )}
      </group>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating 3D Holographic Gate Rune
// ─────────────────────────────────────────────────────────────────────────────

function GateHologram({
  gate,
  totalQubits,
}: {
  gate: GateOp
  totalQubits: number
}) {
  const meshRef = useRef<THREE.Group>(null)

  const xPos = useMemo(() => {
    const q = gate.qubit
    if (totalQubits === 1) return 0
    if (totalQubits === 2) return (q - 0.5) * 2.8
    if (totalQubits === 3) return (q - 1) * 2.5
    return (q - (totalQubits - 1) / 2) * 2.2
  }, [gate.qubit, totalQubits])

  const gateColor = useMemo(() => {
    switch (gate.type) {
      case 'H': return '#f47c45'
      case 'X': return '#79a9d9'
      case 'Y': return '#b38cd9'
      case 'Z': return '#87b89a'
      case 'CNOT': return '#e38d9b'
      case 'TOFFOLI': return '#ffb478'
      default: return '#f47c45'
    }
  }, [gate.type])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 1.95 + Math.sin(state.clock.elapsedTime * 2.5 + gate.qubit) * 0.08
    }
  })

  return (
    <group ref={meshRef} position={[xPos, 1.95, 0]}>
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.2}>
        <mesh>
          <boxGeometry args={[0.55, 0.45, 0.18]} />
          <meshStandardMaterial
            color={gateColor}
            emissive={gateColor}
            emissiveIntensity={0.65}
            transparent
            opacity={0.88}
            roughness={0.2}
          />
        </mesh>
        <Text position={[0, 0, 0.11]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle">
          {gate.type === 'CNOT' ? '• → ⊕' : gate.type}
        </Text>
      </Float>

      {/* Energy beam linking gate cube to sphere below */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.8, 8]} />
        <meshBasicMaterial color={gateColor} transparent opacity={0.45} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Entanglement Laser Resonance Bridge
// ─────────────────────────────────────────────────────────────────────────────

function EntanglementBridge({
  qA,
  qB,
  totalQubits,
}: {
  qA: number
  qB: number
  totalQubits: number
}) {
  const lineRef = useRef<THREE.Line>(null)

  const xA = useMemo(() => {
    if (totalQubits === 2) return (qA - 0.5) * 2.8
    if (totalQubits === 3) return (qA - 1) * 2.5
    return (qA - (totalQubits - 1) / 2) * 2.2
  }, [qA, totalQubits])

  const xB = useMemo(() => {
    if (totalQubits === 2) return (qB - 0.5) * 2.8
    if (totalQubits === 3) return (qB - 1) * 2.5
    return (qB - (totalQubits - 1) / 2) * 2.2
  }, [qB, totalQubits])

  const curvePoints = useMemo(() => {
    const start = new THREE.Vector3(xA, 0.4, 0)
    const end = new THREE.Vector3(xB, 0.4, 0)
    const midX = (xA + xB) / 2
    const midY = 1.35 + Math.abs(xB - xA) * 0.15
    const mid = new THREE.Vector3(midX, midY, 0.25)
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    return curve.getPoints(32)
  }, [xA, xB])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(curvePoints)
  }, [curvePoints])

  useFrame((state) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 6) * 0.25
    }
  })

  return (
    <group>
      <primitive
        ref={lineRef}
        object={new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: '#e38d9b',
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
          })
        )}
      />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Basis State Amplitude Crystal Pillars
// ─────────────────────────────────────────────────────────────────────────────

function AmplitudePillars({
  probabilities,
  statevector,
  qubits,
}: {
  probabilities: Record<string, number>
  statevector: ComplexNum[]
  qubits: number
}) {
  const entries = useMemo(() => {
    const dim = 1 << qubits
    const list: Array<{
      bitstring: string
      prob: number
      re: number
      im: number
    }> = []
    for (let i = 0; i < dim; i++) {
      const bitstring = i.toString(2).padStart(qubits, '0')
      const prob = probabilities[bitstring] ?? 0
      const amp = statevector[i] ?? { re: 0, im: 0 }
      list.push({ bitstring, prob, re: amp.re, im: amp.im })
    }
    return list
  }, [probabilities, statevector, qubits])

  const totalStates = entries.length
  const spacing = totalStates <= 4 ? 0.95 : 0.62
  const startX = -((totalStates - 1) * spacing) / 2

  return (
    <group position={[0, -1.9, 1.3]}>
      {/* Base Platform Bar */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[totalStates * spacing + 0.5, 0.08, 0.7]} />
        <meshStandardMaterial color="#161411" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Amplitude Bars */}
      {entries.map((item, idx) => {
        const x = startX + idx * spacing
        const height = Math.max(0.04, item.prob * 1.5)
        const color = phaseToColor(item.re, item.im)
        const isHigh = item.prob > 0.01

        return (
          <group key={item.bitstring} position={[x, 0.04, 0]}>
            {/* Crystal Pillar */}
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[spacing * 0.65, height, 0.35]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isHigh ? 0.55 : 0.05}
                transparent
                opacity={isHigh ? 0.9 : 0.35}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            {/* Glowing Cap */}
            {isHigh && (
              <mesh position={[0, height + 0.02, 0]}>
                <boxGeometry args={[spacing * 0.68, 0.04, 0.37]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive={color}
                  emissiveIntensity={1.2}
                />
              </mesh>
            )}

            {/* State Ket Label */}
            <Text position={[0, -0.16, 0.2]} fontSize={0.12} color="#a29a8c" anchorX="center" anchorY="middle">
              {`|${item.bitstring}⟩`}
            </Text>

            {/* Percentage Readout if noticeable */}
            {item.prob > 0.01 && (
              <Text position={[0, height + 0.14, 0]} fontSize={0.11} color="#ffb478" anchorX="center" anchorY="middle">
                {`${(item.prob * 100).toFixed(0)}%`}
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main 3D Scene
// ─────────────────────────────────────────────────────────────────────────────

function VisualizerScene({
  data,
  focusQubit,
  onSelectQubit,
}: {
  data: StepVisualizationData
  focusQubit?: number | 'all'
  onSelectQubit?: (q: number) => void
}) {
  const { qubits, blochCoords, activeGates, probabilities, statevector, entangledPairs } = data

  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 5, 14]} />

      <ambientLight intensity={0.4} />
      <pointLight position={[3.5, 5, 4]} intensity={1.8} color="#f47c45" />
      <pointLight position={[-4, 3, -3]} intensity={1.1} color="#79a9d9" />
      <pointLight position={[0, 4, -2]} intensity={0.6} color="#ffb478" />

      <Sparkles count={36} scale={7} size={1.8} speed={0.4} opacity={0.35} color="#f47c45" />

      {/* Render Qubit Nodes */}
      {Array.from({ length: qubits }, (_, q) => {
        const coords = blochCoords[q] ?? { x: 0, y: 0, z: 1 }
        const isEntangled = entangledPairs.some(([a, b]) => a === q || b === q)
        const isSelected = focusQubit === 'all' || focusQubit === q

        return (
          <QubitNode
            key={q}
            index={q}
            totalQubits={qubits}
            coords={coords}
            isEntangled={isEntangled}
            isSelected={isSelected}
            onSelect={() => onSelectQubit?.(q)}
          />
        )
      })}

      {/* Active Holographic Gates for Current Step */}
      {activeGates.map((g, idx) => (
        <GateHologram key={`${g.type}-${g.qubit}-${g.step}-${idx}`} gate={g} totalQubits={qubits} />
      ))}

      {/* Entanglement Bridges */}
      {entangledPairs.map(([a, b], idx) => (
        <EntanglementBridge key={`${a}-${b}-${idx}`} qA={a} qB={b} totalQubits={qubits} />
      ))}

      {/* Basis State Probability Crystal Pillars */}
      <AmplitudePillars probabilities={probabilities} statevector={statevector} qubits={qubits} />

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={8.5}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 + 0.15}
        minPolarAngle={Math.PI / 5}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Export Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Algorithm3DVisualizer({
  data,
  focusQubit = 'all',
  onSelectQubit,
  className,
}: Algorithm3DVisualizerProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '420px',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 35%, #1f1a15 0%, #0a0908 80%)',
        position: 'relative',
        boxShadow: 'inset 0 0 50px #f47c4512',
        border: '1px solid var(--line)',
      }}
    >
      <Canvas
        camera={{ position: [0, 2.2, 5.6], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <VisualizerScene
          data={data}
          focusQubit={focusQubit}
          onSelectQubit={onSelectQubit}
        />
      </Canvas>

      {/* Subtle UI Overlay Legend */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        background: '#11100ecc',
        padding: '6px 12px',
        borderRadius: 8,
        border: '1px solid var(--line)',
        backdropFilter: 'blur(8px)',
        fontSize: 11,
        color: 'var(--muted)',
        pointerEvents: 'none',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i style={{ width: 8, height: 8, borderRadius: '50%', background: '#f47c45', display: 'inline-block' }} />
          Statevector
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i style={{ width: 8, height: 8, borderRadius: '50%', background: '#e38d9b', display: 'inline-block' }} />
          Entanglement
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i style={{ width: 8, height: 8, borderRadius: '50%', background: '#79a9d9', display: 'inline-block' }} />
          Basis Pillars
        </span>
      </div>
    </div>
  )
}
