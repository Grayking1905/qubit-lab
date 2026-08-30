'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars, Text } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function QubitCore() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4
  })
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#f47c45" emissive="#f47c45" emissiveIntensity={0.5} wireframe />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffb478" emissive="#ffb478" emissiveIntensity={0.8} />
      </mesh>
    </Float>
  )
}

function OrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  )
}

function GateOrb({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.5 + position[0]) * 0.08
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.85} />
      </mesh>
      <Text position={[0, 0, 0.2]} fontSize={0.12} color="#fff" anchorX="center" anchorY="middle">{label}</Text>
    </group>
  )
}

function LabScene() {
  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 4, 12]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 4, 3]} intensity={1.5} color="#f47c45" />
      <pointLight position={[-4, 2, -2]} intensity={0.8} color="#79a9d9" />
      <Stars radius={50} depth={30} count={2000} factor={3} saturation={0.2} fade speed={0.5} />
      <QubitCore />
      <OrbitRing radius={1.2} speed={0.3} color="#f47c45" />
      <OrbitRing radius={1.6} speed={-0.2} color="#79a9d9" />
      <OrbitRing radius={2.0} speed={0.15} color="#87b89a" />
      <GateOrb position={[-1.8, 0.5, 0.8]} label="H" color="#f47c45" />
      <GateOrb position={[1.6, -0.3, 0.6]} label="X" color="#79a9d9" />
      <GateOrb position={[0.2, 1.2, -1.2]} label="CNOT" color="#e38d9b" />
      <GateOrb position={[-0.5, -1.0, 1.0]} label="Z" color="#87b89a" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={8} enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

export default function QuantumLab3D({ onOpenBuilder }: { onOpenBuilder: () => void }) {
  return (
    <main className="lab3d-page">
      <motion.div
        className="lab3d-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="lab3d-copy">
          <p className="eyebrow">3D QUANTUM LAB</p>
          <h1>Step inside the <em>quantum realm.</em></h1>
          <p className="hero-lede">Explore qubits, gates, and entanglement in an immersive 3D environment. Drag gates, run circuits, and watch states evolve in real time.</p>
          <div className="hero-actions">
            <button className="pill-btn" onClick={onOpenBuilder}>Open circuit builder</button>
            <button className="outline-btn" onClick={onOpenBuilder}>Start experiment</button>
          </div>
        </div>
        <div className="lab3d-canvas-wrap">
          <Suspense fallback={<div className="lab3d-loading">Loading 3D lab…</div>}>
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true }}>
              <LabScene />
            </Canvas>
          </Suspense>
        </div>
      </motion.div>

      <motion.section
        className="lab3d-features section-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="lab3d-grid">
          {[
            { title: 'Bloch Sphere', desc: 'Interactive 3D state visualization with smooth animated transitions', icon: '◯' },
            { title: 'Drag & Drop', desc: 'Build circuits intuitively — hear satisfying pop sounds as gates snap in', icon: '⊕' },
            { title: 'Live Simulation', desc: 'Run circuits on Qiskit Aer and see probabilities update instantly', icon: '⚡' },
            { title: 'Algorithm Lab', desc: 'Pre-built Deutsch-Jozsa, Grover, Bell state, and teleportation circuits', icon: '⬡' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              className="lab3d-feature-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <span className="lab3d-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </main>
  )
}
