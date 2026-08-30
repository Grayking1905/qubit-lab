'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ─────────── constants ───────────
type BellState = 'phi+' | 'phi-' | 'psi+' | 'psi-'

const BELL_INFO: Record<BellState, {
  label: string; formula: string; color: string; desc: string
  circuit: string[]; probabilities: Record<string, number>
  phaseQ0: string; phaseQ1: string; anti: boolean
}> = {
  'phi+': {
    label: '|Φ⁺⟩', formula: '(|00⟩ + |11⟩)/√2', color: '#f47c45',
    desc: 'Correlated — both qubits always agree', anti: false,
    circuit: ['H(q₀)', 'CNOT(q₀→q₁)'],
    probabilities: { '|00⟩': 0.5, '|01⟩': 0, '|10⟩': 0, '|11⟩': 0.5 },
    phaseQ0: '+1', phaseQ1: '+1',
  },
  'phi-': {
    label: '|Φ⁻⟩', formula: '(|00⟩ − |11⟩)/√2', color: '#ffb478',
    desc: 'Correlated with relative phase π', anti: false,
    circuit: ['H(q₀)', 'CNOT(q₀→q₁)', 'Z(q₀)'],
    probabilities: { '|00⟩': 0.5, '|01⟩': 0, '|10⟩': 0, '|11⟩': 0.5 },
    phaseQ0: '+1', phaseQ1: '−1',
  },
  'psi+': {
    label: '|Ψ⁺⟩', formula: '(|01⟩ + |10⟩)/√2', color: '#79a9d9',
    desc: 'Anti-correlated — qubits always differ', anti: true,
    circuit: ['H(q₀)', 'CNOT(q₀→q₁)', 'X(q₁)'],
    probabilities: { '|00⟩': 0, '|01⟩': 0.5, '|10⟩': 0.5, '|11⟩': 0 },
    phaseQ0: '+1', phaseQ1: '+1',
  },
  'psi-': {
    label: '|Ψ⁻⟩', formula: '(|01⟩ − |10⟩)/√2', color: '#e38d9b',
    desc: 'Anti-correlated with relative phase π', anti: true,
    circuit: ['H(q₀)', 'CNOT(q₀→q₁)', 'X(q₁)', 'Z(q₀)'],
    probabilities: { '|00⟩': 0, '|01⟩': 0.5, '|10⟩': 0.5, '|11⟩': 0 },
    phaseQ0: '+1', phaseQ1: '−1',
  },
}

const BELL_DIRS: Record<BellState, { q0: THREE.Vector3; q1: THREE.Vector3 }> = {
  'phi+': { q0: new THREE.Vector3(1, 0, 0), q1: new THREE.Vector3(1, 0, 0) },
  'phi-': { q0: new THREE.Vector3(1, 0, 0), q1: new THREE.Vector3(1, 0, 0) },
  'psi+': { q0: new THREE.Vector3(1, 0, 0), q1: new THREE.Vector3(-1, 0, 0) },
  'psi-': { q0: new THREE.Vector3(1, 0, 0), q1: new THREE.Vector3(-1, 0, 0) },
}

// ─────────── helpers ───────────
function makeRing(r: number, axis: 'xz' | 'xy' | 'yz', color: string, opacity: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2
    const c = Math.cos(t) * r, s = Math.sin(t) * r
    if (axis === 'xz') pts.push(new THREE.Vector3(c, 0, s))
    else if (axis === 'xy') pts.push(new THREE.Vector3(c, s, 0))
    else pts.push(new THREE.Vector3(0, c, s))
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  )
}

function makeLine(a: THREE.Vector3, b: THREE.Vector3, color: string, opacity: number) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  )
}

// ─────────── Qubit sphere ───────────
function QubitOrb({
  color, accentColor, targetDir, measured, measuredDir,
}: {
  color: string; accentColor: string; targetDir: THREE.Vector3
  measured: boolean; measuredDir: THREE.Vector3
}) {
  const tipRef = useRef<THREE.Mesh>(null)
  const arrowRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const outerGlowRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const cur = useRef(targetDir.clone().normalize())
  const burst = useRef(0)
  const movingRef = useRef(0)
  const prevMeasured = useRef(measured)

  const equator  = useMemo(() => makeRing(1, 'xz', color, 0.35), [color])
  const meridXY  = useMemo(() => makeRing(1, 'xy', accentColor, 0.18), [accentColor])
  const meridYZ  = useMemo(() => makeRing(1, 'yz', color, 0.12), [color])
  const axisY    = useMemo(() => makeLine(new THREE.Vector3(0, -1.22, 0), new THREE.Vector3(0, 1.22, 0), accentColor, 0.5), [accentColor])
  const axisX    = useMemo(() => makeLine(new THREE.Vector3(-1.22, 0, 0), new THREE.Vector3(1.22, 0, 0), color, 0.25), [color])
  const axisZ    = useMemo(() => makeLine(new THREE.Vector3(0, 0, -1.22), new THREE.Vector3(0, 0, 1.22), color, 0.18), [color])

  useEffect(() => {
    if (measured && !prevMeasured.current) burst.current = 2.0
    prevMeasured.current = measured
  }, [measured])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const dest = measured ? measuredDir : targetDir
    const speed = measured ? 9 : 3.5
    const t = 1 - Math.exp(-dt * speed)
    cur.current.lerp(dest.clone().normalize(), t).normalize()
    burst.current = Math.max(0, burst.current - dt * 2.2)
    movingRef.current = THREE.MathUtils.lerp(movingRef.current, cur.current.distanceTo(dest.clone().normalize()) > 0.04 ? 1 : 0, 0.1)

    const d = cur.current
    const up = new THREE.Vector3(0, 1, 0)

    if (arrowRef.current) {
      arrowRef.current.position.copy(d).multiplyScalar(0.38)
      if (Math.abs(d.dot(up)) < 0.9999) {
        arrowRef.current.quaternion.setFromUnitVectors(up, d.clone().normalize())
      }
    }
    if (tipRef.current) {
      tipRef.current.position.copy(d).multiplyScalar(0.97)
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.1 + burst.current * 0.7
      tipRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.position.copy(d).multiplyScalar(0.97)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.18 + burst.current * 0.55
      glowRef.current.scale.setScalar(1.2 + burst.current * 2.2)
    }
    if (outerGlowRef.current) {
      const mat = outerGlowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.04 + burst.current * 0.12 + Math.sin(state.clock.elapsedTime * 2) * 0.02
      outerGlowRef.current.scale.setScalar(1.02 + Math.sin(state.clock.elapsedTime * 1.5) * 0.01)
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += dt * (0.15 + movingRef.current * 0.8)
    }
  })

  return (
    <>
      {/* outer glow shell */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      {/* glass sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#1a1612" transparent opacity={0.20}
          roughness={0.08} metalness={0.25}
        />
      </mesh>
      {/* wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.003, 20, 20]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.08} />
      </mesh>

      <group ref={ringsRef}>
        <primitive object={equator} />
        <primitive object={meridXY} />
        <primitive object={meridYZ} />
      </group>
      <primitive object={axisY} />
      <primitive object={axisX} />
      <primitive object={axisZ} />

      {/* state vector arrow */}
      <group ref={arrowRef}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.026, 0.76, 14]} />
          <meshStandardMaterial color={accentColor} emissive={color} emissiveIntensity={0.9} roughness={0.15} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <coneGeometry args={[0.052, 0.18, 18]} />
          <meshStandardMaterial color={accentColor} emissive={color} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* tip glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* tip sphere */}
      <mesh ref={tipRef}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={1.8} roughness={0.05} metalness={0.2} />
      </mesh>

    </>
  )
}

// ─────────── Correlation beam ───────────
function CorrelationBeam({ measured, bellState }: { measured: boolean; bellState: BellState }) {
  const coreRef  = useRef<THREE.Mesh>(null)
  const haloRef  = useRef<THREE.Mesh>(null)
  const pts1Ref  = useRef<THREE.Points>(null)
  const pts2Ref  = useRef<THREE.Points>(null)
  const shockRef = useRef<THREE.Mesh>(null)
  const shockT   = useRef(0)
  const prevMeasured = useRef(measured)

  const isAnti = bellState === 'psi+' || bellState === 'psi-'
  const beamColor = isAnti ? '#e38d9b' : '#79a9d9'
  const beamColor2 = isAnti ? '#f47c45' : '#b3d4f0'

  const makeParticles = useCallback((count: number, speed: number) => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = -3.0 + Math.random() * 6.0
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.06
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.06
      speeds[i] = speed * (0.7 + Math.random() * 0.6)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))
    return geo
  }, [])

  const geo1 = useMemo(() => makeParticles(55, 2.5), [makeParticles])
  const geo2 = useMemo(() => makeParticles(30, 1.8), [makeParticles])

  useEffect(() => {
    if (measured && !prevMeasured.current) shockT.current = 1.0
    prevMeasured.current = measured
  }, [measured])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    shockT.current = Math.max(0, shockT.current - dt * 3)

    const alive = !measured
    const dir = isAnti ? -1 : 1

    // core beam
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = alive ? 0.1 + Math.sin(t * 2.5) * 0.06 : 0.02
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = alive ? 0.05 + Math.sin(t * 1.8) * 0.03 : 0.01
      haloRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.05)
    }

    // particles
    for (const pRef of [pts1Ref, pts2Ref]) {
      if (!pRef.current) continue
      const pos = pRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      const spd = pRef.current.geometry.getAttribute('speed') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i)
        x += dt * spd.getX(i) * dir * (alive ? 1 : 0.1)
        if (x > 3.1) x = -3.1
        if (x < -3.1) x = 3.1
        pos.setX(i, x)
      }
      pos.needsUpdate = true
      const mat = pRef.current.material as THREE.PointsMaterial
      mat.opacity = alive ? 0.65 + Math.sin(t * 4) * 0.25 : 0.04
    }

    // shockwave ring
    if (shockRef.current) {
      if (shockT.current > 0) {
        const s = (1 - shockT.current) * 5 + 0.5
        shockRef.current.scale.setScalar(s)
        const mat = shockRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = shockT.current * 0.7
        shockRef.current.visible = true
      } else {
        shockRef.current.visible = false
      }
    }
  })

  return (
    <>
      {/* core glow tube */}
      <mesh ref={coreRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 6.2, 10]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* outer halo tube */}
      <mesh ref={haloRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 6.2, 10]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* primary particles — fast */}
      <points ref={pts1Ref} geometry={geo1}>
        <pointsMaterial color={beamColor} size={0.06} transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      {/* secondary particles — slower, different color */}
      <points ref={pts2Ref} geometry={geo2}>
        <pointsMaterial color={beamColor2} size={0.045} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      {/* shockwave ring on collapse */}
      <mesh ref={shockRef} rotation={[0, 0, Math.PI / 2]} visible={false}>
        <ringGeometry args={[0.5, 0.55, 48]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

// ─────────── Star field (pure Three.js, no async) ───────────
function StarField() {
  const geo = useMemo(() => {
    const count = 180
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 28
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18 - 4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])
  const mat = useMemo(() => new THREE.PointsMaterial({ color: '#ffffff', size: 0.04, transparent: true, opacity: 0.28 }), [])
  return <points geometry={geo} material={mat} />
}

// ─────────── Full 3D scene ───────────
function EntanglementScene({ bellState, measured, measuredResult }: {
  bellState: BellState; measured: boolean; measuredResult: number
}) {
  const dirs  = BELL_DIRS[bellState]
  const info  = BELL_INFO[bellState]
  const isAnti = info.anti

  const q0Collapsed = useMemo(() => measuredResult === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0), [measuredResult])
  const q1Collapsed = useMemo(() => isAnti
    ? (measuredResult === 0 ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 1, 0))
    : (measuredResult === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0)), [isAnti, measuredResult])

  return (
    <>
      <ambientLight intensity={0.28} />
      <pointLight position={[-5.5, 4, 3]} intensity={2.5} color="#f47c45" />
      <pointLight position={[5.5, 4, 3]}  intensity={2.5} color="#79a9d9" />
      <pointLight position={[0, -3, 2]}   intensity={0.6} color="#ffb478" />
      <pointLight position={[0, 0, 5]}    intensity={0.4} color="#87b89a" />

      <StarField />

      {/* Alice — q₀ */}
      <group position={[-3.5, 0, 0]}>
        <QubitOrb
          color="#f47c45" accentColor="#ffb478"
          targetDir={dirs.q0}
          measured={measured} measuredDir={q0Collapsed}
        />
      </group>

      {/* Bob — q₁ */}
      <group position={[3.5, 0, 0]}>
        <QubitOrb
          color="#79a9d9" accentColor="#b3d4f0"
          targetDir={dirs.q1}
          measured={measured} measuredDir={q1Collapsed}
        />
      </group>

      <CorrelationBeam measured={measured} bellState={bellState} />

      <OrbitControls
        enablePan={false}
        minDistance={7} maxDistance={16}
        enableDamping dampingFactor={0.07}
        autoRotate={!measured} autoRotateSpeed={0.22}
      />
    </>
  )
}

// ─────────── Probability bar ───────────
function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: 'var(--muted)', width: 36, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${prob * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          borderRadius: 3,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: prob > 0 ? `0 0 6px ${color}80` : 'none',
        }} />
      </div>
      <span style={{ fontSize: 10, color: prob > 0 ? color : 'var(--muted)', fontFamily: 'ui-monospace,monospace', width: 32, textAlign: 'right', flexShrink: 0 }}>
        {(prob * 100).toFixed(0)}%
      </span>
    </div>
  )
}

// ─────────── Circuit chip diagram ───────────
function CircuitDiagram({ bellState }: { bellState: BellState }) {
  const info = BELL_INFO[bellState]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 2 }}>CIRCUIT RECIPE</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace,monospace', marginRight: 4 }}>|00⟩→</div>
        {info.circuit.map((gate, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              padding: '3px 8px', borderRadius: 5, fontSize: 11,
              background: i === 0 ? '#f47c4520' : i === 1 ? '#79a9d920' : '#87b89a20',
              border: `1px solid ${i === 0 ? '#f47c4560' : i === 1 ? '#79a9d960' : '#87b89a60'}`,
              color: i === 0 ? '#f47c45' : i === 1 ? '#79a9d9' : '#87b89a',
              fontFamily: 'ui-monospace,monospace', fontWeight: 600,
            }}>
              {gate}
            </div>
            {i < info.circuit.length - 1 && <span style={{ color: 'var(--muted)', fontSize: 10 }}>→</span>}
          </div>
        ))}
        <div style={{ fontSize: 11, color: info.color, fontFamily: 'ui-monospace,monospace', marginLeft: 4, fontWeight: 700 }}>→ {info.label}</div>
      </div>
    </div>
  )
}

// ─────────── Main component ───────────
export default function EntanglementViz() {
  const [bellState, setBellState] = useState<BellState>('phi+')
  const [measured, setMeasured] = useState(false)
  const [measuredResult, setMeasuredResult] = useState(0)
  const [measureLog, setMeasureLog] = useState<{ q0: string; q1: string; state: BellState; corr: boolean }[]>([])
  const [activeProbs, setActiveProbs] = useState<Record<string, number>>(BELL_INFO['phi+'].probabilities)
  const [showInfo, setShowInfo] = useState(false)
  const [collapseCount, setCollapseCount] = useState<Record<string, number>>({ '|0⟩': 0, '|1⟩': 0 })

  const info  = BELL_INFO[bellState]
  const isAnti = info.anti

  // Update probability bars on state change
  useEffect(() => {
    setActiveProbs(measured
      ? measuredResult === 0
        ? isAnti ? { '|00⟩': 0, '|01⟩': 1, '|10⟩': 0, '|11⟩': 0 } : { '|00⟩': 1, '|01⟩': 0, '|10⟩': 0, '|11⟩': 0 }
        : isAnti ? { '|00⟩': 0, '|01⟩': 0, '|10⟩': 1, '|11⟩': 0 } : { '|00⟩': 0, '|01⟩': 0, '|10⟩': 0, '|11⟩': 1 }
      : info.probabilities
    )
  }, [measured, measuredResult, bellState, isAnti, info.probabilities])

  const handleMeasure = useCallback(() => {
    const result = Math.random() < 0.5 ? 0 : 1
    setMeasuredResult(result)
    setMeasured(true)
    const q0 = result === 0 ? '|0⟩' : '|1⟩'
    const q1 = isAnti ? (result === 0 ? '|1⟩' : '|0⟩') : (result === 0 ? '|0⟩' : '|1⟩')
    setMeasureLog(prev => [{ q0, q1, state: bellState, corr: !isAnti }, ...prev.slice(0, 6)])
    setCollapseCount(prev => ({ ...prev, [result === 0 ? '|0⟩' : '|1⟩']: (prev[result === 0 ? '|0⟩' : '|1⟩'] || 0) + 1 }))
  }, [isAnti, bellState])

  const handleReset = useCallback(() => setMeasured(false), [])

  const handleBellChange = useCallback((s: BellState) => {
    setBellState(s)
    setMeasured(false)
    setCollapseCount({ '|0⟩': 0, '|1⟩': 0 })
  }, [])

  const totalMeasures = collapseCount['|0⟩'] + collapseCount['|1⟩']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#0b0906', borderRadius: 0 }}>

      {/* ── Header: Bell state selector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--line)' }}>
        {(Object.keys(BELL_INFO) as BellState[]).map(s => {
          const bi = BELL_INFO[s]
          const active = bellState === s
          return (
            <button
              key={s}
              onClick={() => handleBellChange(s)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '10px 6px', borderRight: '1px solid var(--line)',
                background: active ? `${bi.color}12` : 'transparent',
                borderBottom: active ? `2.5px solid ${bi.color}` : '2.5px solid transparent',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 800, color: bi.color, letterSpacing: '-0.01em' }}>{bi.label}</span>
              <span style={{ fontSize: 9, fontFamily: 'ui-monospace,monospace', color: active ? bi.color + 'cc' : 'var(--muted)', textAlign: 'center' }}>{bi.formula}</span>
              <span style={{
                fontSize: 8, padding: '1px 6px', borderRadius: 10,
                background: active ? `${bi.color}20` : 'transparent',
                color: active ? bi.color : 'var(--muted)',
                border: active ? `1px solid ${bi.color}50` : '1px solid transparent',
              }}>
                {bi.anti ? 'ANTI-CORR' : 'CORRELATED'}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 3D + side panel row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px' }}>

        {/* 3D Canvas */}
        <div style={{ position: 'relative', height: 420, background: '#0b0906' }}>
          {/* HTML Qubit labels — no drei Text needed */}
          <div style={{ position: 'absolute', top: 14, left: '18%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, zIndex: 2, pointerEvents: 'none' }}>
            <span style={{ color: '#f47c45', fontWeight: 800, fontSize: 13 }}>q₀</span>
            <span style={{ color: 'var(--muted)', fontSize: 9 }}>Alice</span>
          </div>
          <div style={{ position: 'absolute', top: 14, right: '18%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, zIndex: 2, pointerEvents: 'none' }}>
            <span style={{ color: '#79a9d9', fontWeight: 800, fontSize: 13 }}>q₁</span>
            <span style={{ color: 'var(--muted)', fontSize: 9 }}>Bob</span>
          </div>
          {/* State badge */}
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: '#0b090699', border: `1px solid ${info.color}60`, borderRadius: 9,
            padding: '7px 16px', backdropFilter: 'blur(8px)', zIndex: 2, pointerEvents: 'none',
            minWidth: 200, textAlign: 'center',
          }}>
            <span style={{ color: info.color, fontWeight: 800, fontSize: 16 }}>{info.label}</span>
            <span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: 'ui-monospace,monospace' }}>{info.formula}</span>
            <span style={{ color: 'var(--muted)', fontSize: 9 }}>{info.desc}</span>
          </div>

          {/* Collapse readout */}
          {measured && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: '#0e1f0fdd', border: '1px solid #87b89a60', borderRadius: 9,
              padding: '8px 16px', backdropFilter: 'blur(8px)', zIndex: 2, pointerEvents: 'none',
              animation: 'evFadeUp 0.4s ease',
            }}>
              <span style={{ color: '#87b89a', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>⚡ WAVEFUNCTION COLLAPSED</span>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ color: '#f47c45', fontSize: 13, fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>
                  q₀ = {measuredResult === 0 ? '|0⟩' : '|1⟩'}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 10 }}>→</span>
                <span style={{ color: '#79a9d9', fontSize: 13, fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>
                  q₁ = {isAnti ? (measuredResult === 0 ? '|1⟩' : '|0⟩') : (measuredResult === 0 ? '|0⟩' : '|1⟩')}
                </span>
              </div>
              <span style={{ color: isAnti ? '#e38d9b' : '#87b89a', fontSize: 9, letterSpacing: '0.05em' }}>
                {isAnti ? '↑ ANTI-CORRELATED: outcomes always differ' : '↑ CORRELATED: outcomes always match'}
              </span>
            </div>
          )}

          <Canvas
            camera={{ position: [0, 1.8, 11], fov: 44 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
          >
            <EntanglementScene bellState={bellState} measured={measured} measuredResult={measuredResult} />
          </Canvas>
        </div>

        {/* ── Side panel ── */}
        <div style={{
          borderLeft: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column', gap: 0,
          overflowY: 'auto',
        }}>
          {/* Probability amplitudes */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>MEASUREMENT PROBABILITIES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(activeProbs).map(([label, prob]) => (
                <ProbBar key={label} label={label} prob={prob} color={info.color} />
              ))}
            </div>
          </div>

          {/* Amplitude table */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>STATE AMPLITUDES</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 6px' }}>
              {Object.entries(info.probabilities).filter(([, p]) => p > 0).map(([ket]) => (
                <div key={ket} style={{
                  padding: '4px 8px', borderRadius: 5,
                  background: `${info.color}15`, border: `1px solid ${info.color}30`,
                  fontSize: 11, fontFamily: 'ui-monospace,monospace',
                  color: info.color, textAlign: 'center',
                }}>
                  {ket}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
              Each amplitude = <span style={{ color: info.color, fontFamily: 'ui-monospace,monospace' }}>1/√2</span>
              <br />Probability = <span style={{ color: info.color, fontFamily: 'ui-monospace,monospace' }}>|1/√2|² = 50%</span>
            </div>
          </div>

          {/* Stats — collapse histogram */}
          {totalMeasures > 0 && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
                BORN RULE STATS ({totalMeasures} trials)
              </div>
              {['|0⟩', '|1⟩'].map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontFamily: 'ui-monospace,monospace', color: '#f47c45', width: 28 }}>q₀={k}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${totalMeasures > 0 ? ((collapseCount[k] || 0) / totalMeasures) * 100 : 0}%`,
                      height: '100%', background: '#f47c45', borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--muted)', width: 28, textAlign: 'right', fontFamily: 'ui-monospace,monospace' }}>
                    {collapseCount[k] || 0}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>
                Theory: 50/50 — runs converge as n → ∞
              </div>
            </div>
          )}

          {/* Circuit recipe */}
          <div style={{ padding: '12px 14px' }}>
            <CircuitDiagram bellState={bellState} />
          </div>
        </div>
      </div>

      {/* ── Controls row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderTop: '1px solid var(--line)', background: '#0e0c0a', flexWrap: 'wrap',
      }}>
        {!measured ? (
          <button
            onClick={handleMeasure}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', background: info.color, color: '#1a0e08',
              borderRadius: 8, fontWeight: 800, fontSize: 13,
              boxShadow: `0 0 24px ${info.color}40`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = `0 6px 30px ${info.color}70`)}
            onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = `0 0 24px ${info.color}40`)}
          >
            ⚡ Collapse q₀ — Observe Correlation
          </button>
        ) : (
          <button
            onClick={handleReset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', background: 'transparent', color: info.color,
              border: `1px solid ${info.color}`, borderRadius: 8, fontWeight: 700, fontSize: 13,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${info.color}15`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ↺ Restore Entanglement
          </button>
        )}

        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace,monospace', flex: 1 }}>
          {measured
            ? `q₁ collapsed ${isAnti ? 'OPPOSITE' : 'SAME'} as q₀ — instantly, regardless of distance`
            : 'Both qubits are entangled — measuring one determines the other'}
        </div>

        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            padding: '7px 12px', borderRadius: 7, fontSize: 11,
            background: showInfo ? '#87b89a20' : 'transparent',
            border: '1px solid var(--line)', color: 'var(--muted)',
            transition: 'background 0.2s',
          }}
        >
          {showInfo ? '▲ Less' : '▼ EPR Insight'}
        </button>
      </div>

      {/* ── EPR insight panel ── */}
      {showInfo && (
        <div style={{
          padding: '14px 18px', borderTop: '1px solid var(--line)',
          background: '#0f1a0f', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px',
          animation: 'evFadeUp 0.3s ease',
        }}>
          {[
            { title: 'Einstein\'s View', text: '"Hidden variables" determine both outcomes before measurement. Disproved by Bell experiments.', color: '#e38d9b' },
            { title: 'Quantum Reality', text: 'No predetermined values. Measurement creates the outcome. Confirmed by Aspect (1982) & Hensen (2015).', color: '#87b89a' },
            { title: 'CHSH Violation', text: 'Experiments find |S| ≈ 2.7 > 2 (classical limit). Quantum predicts ≤ 2√2 ≈ 2.83.', color: info.color },
            { title: 'No FTL Signal', text: 'Outcomes are random — you need a classical channel to compare. No information travels faster than light.', color: '#79a9d9' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: '0.06em' }}>{item.title}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Measurement history ── */}
      {measureLog.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', background: '#0e0c0a' }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
            MEASUREMENT HISTORY — {measureLog.length} shot{measureLog.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {measureLog.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '6px 16px', borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                opacity: 1 - i * 0.12,
              }}>
                <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'ui-monospace,monospace', width: 36 }}>
                  #{measureLog.length - i}
                </span>
                <span style={{ fontSize: 10, color: BELL_INFO[m.state].color, fontFamily: 'ui-monospace,monospace', width: 52 }}>
                  {BELL_INFO[m.state].label}
                </span>
                <span style={{ fontSize: 11, color: '#f47c45', fontFamily: 'ui-monospace,monospace' }}>q₀={m.q0}</span>
                <span style={{ color: 'var(--muted)', fontSize: 9 }}>→</span>
                <span style={{ fontSize: 11, color: '#79a9d9', fontFamily: 'ui-monospace,monospace' }}>q₁={m.q1}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                  color: m.corr ? '#87b89a' : '#e38d9b',
                  padding: '2px 7px', borderRadius: 10,
                  background: m.corr ? '#87b89a15' : '#e38d9b15',
                  border: `1px solid ${m.corr ? '#87b89a40' : '#e38d9b40'}`,
                }}>
                  {m.corr ? '✓ CORRELATED' : '✗ ANTI-CORR'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes evFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
