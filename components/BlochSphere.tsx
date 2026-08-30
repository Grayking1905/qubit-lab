'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { BlochCoords } from '@/lib/quantum'

interface BlochSphereProps {
  coords: BlochCoords
  animate?: boolean
  size?: number | 'fill'
  className?: string
}

const TRAIL_LEN = 80
const UP = new THREE.Vector3(0, 1, 0)

function toScene(c: BlochCoords) {
  return new THREE.Vector3(c.x, c.z, -c.y)
}

function slerpUnit(from: THREE.Vector3, to: THREE.Vector3, t: number, out: THREE.Vector3) {
  const a = from.clone().normalize()
  const b = to.clone().normalize()
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1)
  const theta = Math.acos(dot)
  if (theta < 1e-4) {
    return out.copy(b)
  }
  const sin = Math.sin(theta)
  out.copy(a).multiplyScalar(Math.sin((1 - t) * theta) / sin)
  out.addScaledVector(b, Math.sin(t * theta) / sin)
  return out.normalize()
}

function makeCircle(radius: number, axis: 'xy' | 'xz' | 'yz', color: string, opacity: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2
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

function AxisLine({ a, b, color }: { a: [number, number, number]; b: [number, number, number]; color: string }) {
  const object = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)])
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
    return new THREE.Line(geom, mat)
  }, [a, b, color])
  return <primitive object={object} />
}

function SphereScene({ coords, animate }: { coords: BlochCoords; animate: boolean }) {
  const arrowRef = useRef<THREE.Group>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const burstRef = useRef(0)
  const movingRef = useRef(0)
  const current = useRef(new THREE.Vector3(0, 1, 0))
  const target = useRef(new THREE.Vector3(0, 1, 0))
  const lastTarget = useRef(new THREE.Vector3(0, 1, 0))
  const tmp = useRef(new THREE.Vector3())
  const trailPts = useRef<THREE.Vector3[]>([])

  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(TRAIL_LEN * 3)
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setDrawRange(0, 0)
    return g
  }, [])

  const trailLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: '#ffb478',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Line(trailGeo, mat)
  }, [trailGeo])

  const equator = useMemo(() => makeCircle(1.001, 'xz', '#f47c45', 0.45), [])
  const meridian = useMemo(() => makeCircle(1.001, 'xy', '#79a9d9', 0.22), [])
  const meridian2 = useMemo(() => makeCircle(1.001, 'yz', '#87b89a', 0.18), [])

  useEffect(() => {
    const next = toScene(coords)
    if (next.lengthSq() < 1e-6) next.set(0, 1, 0)
    else next.normalize()
    if (next.distanceToSquared(lastTarget.current) > 0.0008) {
      burstRef.current = 1
      movingRef.current = 1
      lastTarget.current.copy(next)
    }
    target.current.copy(next)
  }, [coords.x, coords.y, coords.z])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = 1 - Math.exp(-dt * 3.2)

    if (animate) {
      slerpUnit(current.current, target.current, t, tmp.current)
      current.current.copy(tmp.current)
    } else {
      current.current.copy(target.current)
    }

    const dist = current.current.distanceTo(target.current)
    movingRef.current = THREE.MathUtils.lerp(movingRef.current, dist > 0.04 ? 1 : 0, 0.08)
    burstRef.current = Math.max(0, burstRef.current - dt * 1.4)

    const dir = current.current
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0)

    if (arrowRef.current) {
      arrowRef.current.position.copy(dir).multiplyScalar(0.38)
      arrowRef.current.quaternion.setFromUnitVectors(UP, dir.clone().normalize())
    }
    if (tipRef.current) {
      tipRef.current.position.copy(dir).multiplyScalar(0.94)
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08 + burstRef.current * 0.55
      tipRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.position.copy(dir).multiplyScalar(0.94)
      const g = 0.35 + burstRef.current * 0.9 + movingRef.current * 0.25
      glowRef.current.scale.setScalar(1.4 + burstRef.current * 2.4)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = g * 0.45
    }
    if (haloRef.current) {
      haloRef.current.position.copy(dir).multiplyScalar(0.94)
      haloRef.current.lookAt(0, 0, 0)
      haloRef.current.rotateX(Math.PI / 2)
      const s = 0.22 + burstRef.current * 0.55 + Math.sin(state.clock.elapsedTime * 4) * 0.03
      haloRef.current.scale.setScalar(s)
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25 + burstRef.current * 0.6
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += dt * (0.18 + movingRef.current * 1.4)
      ringsRef.current.rotation.x += dt * (0.06 + movingRef.current * 0.35)
    }

    const attr = trailGeo.getAttribute('position') as THREE.BufferAttribute
    if (movingRef.current > 0.08 || burstRef.current > 0.12) {
      const p = dir.clone().multiplyScalar(1.012)
      trailPts.current.push(p)
      if (trailPts.current.length > TRAIL_LEN) trailPts.current.shift()
    } else if (trailPts.current.length > 0 && Math.random() < dt * 8) {
      trailPts.current.shift()
    }
    for (let i = 0; i < trailPts.current.length; i++) {
      const p = trailPts.current[i]
      attr.setXYZ(i, p.x, p.y, p.z)
    }
    trailGeo.setDrawRange(0, trailPts.current.length)
    attr.needsUpdate = true
  })

  return (
    <>
      <color attach="background" args={['#12100e']} />
      <fog attach="fog" args={['#12100e', 6, 12]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[3.5, 4.5, 3]} intensity={1.6} color="#f47c45" />
      <pointLight position={[-3, -1.5, -3]} intensity={0.7} color="#79a9d9" />
      <pointLight position={[0, 2.5, -2]} intensity={0.4} color="#ffb478" />

      <Sparkles count={28} scale={2.4} size={1.6} speed={0.35} opacity={0.45} color="#f47c45" />

      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#1c1814"
          transparent
          opacity={0.22}
          roughness={0.15}
          metalness={0.35}
          transmission={0.35}
          thickness={0.4}
          envMapIntensity={0.6}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.005, 28, 28]} />
        <meshBasicMaterial color="#f47c45" wireframe transparent opacity={0.12} />
      </mesh>

      <group ref={ringsRef}>
        <primitive object={equator} />
        <primitive object={meridian} />
        <primitive object={meridian2} />
      </group>

      <AxisLine a={[0, -1.18, 0]} b={[0, 1.18, 0]} color="#79a9d9" />
      <AxisLine a={[-1.18, 0, 0]} b={[1.18, 0, 0]} color="#87b89a" />
      <AxisLine a={[0, 0, -1.18]} b={[0, 0, 1.18]} color="#e38d9b" />

      <primitive object={trailLine} />

      <group ref={arrowRef}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.028, 0.68, 12]} />
          <meshStandardMaterial color="#ffb478" emissive="#f47c45" emissiveIntensity={0.85} roughness={0.25} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <coneGeometry args={[0.055, 0.16, 16]} />
          <meshStandardMaterial color="#ffb478" emissive="#f47c45" emissiveIntensity={1.1} />
        </mesh>
      </group>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color="#f47c45" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={haloRef}>
        <ringGeometry args={[0.7, 1, 48]} />
        <meshBasicMaterial color="#ffb478" transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={tipRef}>
        <sphereGeometry args={[0.07, 20, 20]} />
        <meshStandardMaterial color="#ffe0c2" emissive="#f47c45" emissiveIntensity={1.4} roughness={0.15} metalness={0.3} />
      </mesh>

      <OrbitControls enablePan={false} minDistance={2.15} maxDistance={5} enableDamping dampingFactor={0.08} autoRotate autoRotateSpeed={0.35} />
    </>
  )
}

export default function BlochSphere({ coords, animate = true, size = 280, className }: BlochSphereProps) {
  const fill = size === 'fill'
  return (
    <div
      className={className}
      style={{
        width: fill ? '100%' : size,
        height: fill ? '100%' : size,
        maxWidth: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'radial-gradient(circle at 40% 30%, #2a221c 0%, #12100e 70%)',
        position: 'relative',
        boxShadow: 'inset 0 0 40px #f47c4514',
      }}
    >
      <Canvas camera={{ position: [2.15, 1.65, 2.15], fov: 42 }} gl={{ antialias: true, alpha: true }} style={{ width: '100%', height: '100%', display: 'block' }}>
        <SphereScene coords={coords} animate={animate} />
      </Canvas>
      <span className="bloch-ket bloch-ket-top">|0⟩</span>
      <span className="bloch-ket bloch-ket-bot">|1⟩</span>
    </div>
  )
}
