'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Atom, Binary } from 'lucide-react'

type Tab = 'machine' | 'chip' | 'compare' | 'circuits'

export default function HardwareViz({ mode = 'machine' }: { mode?: Tab | 'all' }) {
  const [tab, setTab] = useState<Tab>(mode === 'all' ? 'machine' : mode)
  const active = mode === 'all' ? tab : mode === 'compare' || mode === 'circuits' || mode === 'machine' || mode === 'chip' ? mode : 'machine'

  return (
    <div className="hw-viz">
      {(mode === 'all' || mode === 'machine') && mode === 'all' && (
        <div className="hw-tabs">
          {([
            ['machine', 'Dilution fridge'],
            ['chip', 'QPU chip'],
            ['compare', 'vs classical PC'],
            ['circuits', 'Circuit models'],
          ] as const).map(([t, label]) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{label}</button>
          ))}
        </div>
      )}
      {active === 'machine' && <FridgeModel />}
      {active === 'chip' && <ChipModel />}
      {active === 'compare' && <ClassicalVsQuantum />}
      {active === 'circuits' && <CircuitModels />}
    </div>
  )
}

function FridgeModel() {
  const [layer, setLayer] = useState(3)
  const layers = [
    { k: '300 K', name: 'Room temperature', hint: 'AWGs, FPGAs, and a classical CPU write pulse sequences. This rack looks like any HPC node — until the cables dive into the fridge.' },
    { k: '50 K', name: 'Thermal shield', hint: 'Gold-plated plates dump heat. Semi-rigid coax carries ~5 GHz microwave tones toward the chip.' },
    { k: '4 K', name: 'Cryocooler / still', hint: 'HEMT amplifiers sit here. They boost the tiny readout signal coming back from the qubits without adding much noise.' },
    { k: '10 mK', name: 'Mixing chamber · QPU', hint: 'Colder than deep space. Superconducting transmons on a silicon/sapphire chip. A “gate” is a calibrated π or π/2 pulse, not a transistor switch.' },
  ]
  return (
    <div className="hw-fridge-wrap">
      <div className="hw-fridge">
        <div className="hw-fridge-can">
          <motion.div
            className="hw-pulse"
            animate={{ y: ['8%', '78%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {[0, 1, 2, 3].map(i => (
            <motion.button
              key={i}
              className={`hw-plate ${layer === i ? 'on' : ''}`}
              style={{ top: `${10 + i * 21}%` }}
              onClick={() => setLayer(i)}
              animate={layer === i ? { scale: 1.04 } : { scale: 1 }}
            >
              <span>{layers[i].k}</span>
            </motion.button>
          ))}
          <div className="hw-chip" style={{ opacity: layer === 3 ? 1 : 0.28 }}>
            <i /><i /><i /><i />
          </div>
        </div>
        <div className="hw-fridge-copy">
          <p className="muted-label">DILUTION FRIDGE · SUPERCONDUCTING STACK</p>
          <h3>{layers[layer].name}</h3>
          <p>{layers[layer].hint}</p>
          <ul className="hw-facts">
            <li>IBM, Google, and Rigetti use this cryogenic stack for transmon qubits.</li>
            <li>IonQ / Quantinuum skip the millikelvin fridge — ions are trapped in vacuum with lasers.</li>
            <li>Xanadu photonic processors run closer to room temperature using squeezed light.</li>
            <li>Click a plate. The falling spark is a control pulse traveling down to the chip.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ChipModel() {
  const [sel, setSel] = useState(0)
  const nodes = [
    { id: 0, x: 28, y: 32, label: 'Q0', note: 'Transmon ~5 GHz. Lifetime T1 is tens of μs. Drive line implements X/Y rotations.' },
    { id: 1, x: 72, y: 32, label: 'Q1', note: 'Neighbor qubit. A CNOT is a cross-resonance or CZ pulse on the coupler between Q0–Q1.' },
    { id: 2, x: 28, y: 72, label: 'Q2', note: 'Not all pairs are connected. Compilers insert SWAPs when your circuit needs Q0↔Q2.' },
    { id: 3, x: 72, y: 72, label: 'Q3', note: 'Readout resonator (not shown) maps |0⟩/|1⟩ onto a microwave probe tone.' },
  ]
  const edges = [[0, 1], [0, 2], [1, 3], [2, 3]]
  return (
    <div className="hw-chip-wrap">
      <svg viewBox="0 0 100 100" className="hw-chip-svg">
        {edges.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke={sel === a || sel === b ? '#f47c45' : '#35312b'}
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
          />
        ))}
        {nodes.map(n => (
          <g key={n.id} onClick={() => setSel(n.id)} style={{ cursor: 'pointer' }}>
            <motion.circle
              cx={n.x} cy={n.y} r={sel === n.id ? 9 : 7}
              fill={sel === n.id ? '#f47c45' : '#211e1a'}
              stroke="#f47c45"
              animate={sel === n.id ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: sel === n.id ? Infinity : 0, duration: 1.6, ease: 'easeInOut' }}
            />
            <text x={n.x} y={n.y + 1.2} textAnchor="middle" fontSize="3.6" fill="#f2ead9">{n.label}</text>
          </g>
        ))}
      </svg>
      <div>
        <p className="muted-label">QPU FLOORPLAN · COUPLING MAP</p>
        <h3>{nodes[sel].label}</h3>
        <p className="hw-fridge-copy">{nodes[sel].note}</p>
        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>This is why Cirq uses GridQubit and Qiskit transpiles to a coupling map — hardware is a graph, not an all-to-all RAM array.</p>
      </div>
    </div>
  )
}

function ClassicalVsQuantum() {
  const [bits, setBits] = useState([1, 0, 1, 0])
  const [superposed, setSuperposed] = useState(false)
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="hw-compare">
      <motion.div className="hw-card classic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Binary size={18} />
        <h3>Classical computer</h3>
        <table>
          <tbody>
            <tr><th>Bit</th><td>Exactly 0 or 1</td></tr>
            <tr><th>Copy</th><td>Free — RAM duplicates bytes</td></tr>
            <tr><th>Logic</th><td>AND / OR / NOT, irreversible</td></tr>
            <tr><th>Temp</th><td>~300 K, fans and heat sinks</td></tr>
            <tr><th>Error</th><td>ECC; a flipped bit is rare</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Click a bit to toggle. It never sits “in between”.</p>
        <div className="hw-bit-row">
          {bits.map((b, i) => (
            <button key={i} className={b ? 'on' : ''} onClick={() => setBits(v => v.map((x, j) => j === i ? 1 - x : x))}>{b}</button>
          ))}
        </div>
      </motion.div>
      <motion.div className="hw-card quantum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Atom size={18} />
        <h3>Quantum computer</h3>
        <table>
          <tbody>
            <tr><th>Qubit</th><td>α|0⟩ + β|1⟩ until measured</td></tr>
            <tr><th>Copy</th><td>Forbidden (no-cloning)</td></tr>
            <tr><th>Logic</th><td>Unitary gates, then measure</td></tr>
            <tr><th>Temp</th><td>~10 mK (superconducting)</td></tr>
            <tr><th>Error</th><td>Decoherence in μs–ms (NISQ)</td></tr>
          </tbody>
        </table>
        <div className="hw-q-actions">
          <button className="outline-btn small" onClick={() => { setSuperposed(s => !s); setFlipped(false) }}>{superposed ? 'Reset |0⟩' : 'Apply H'}</button>
          <button className="outline-btn small" onClick={() => setFlipped(f => !f)} disabled={superposed}>Apply X</button>
        </div>
        <div className="hw-qubit-state">
          {superposed ? '(|0⟩ + |1⟩)/√2  ·  50% / 50%' : flipped ? '|1⟩  ·  100%' : '|0⟩  ·  100%'}
        </div>
      </motion.div>
    </div>
  )
}

function CircuitModels() {
  const [mode, setMode] = useState<'classic' | 'quantum'>('quantum')
  const [tick, setTick] = useState(0)
  const classicSteps = ['A=1, B=0 enter AND', 'AND discards information → 0', 'Wire C XOR flips to 1']
  const quantumSteps = ['q0, q1 start in |00⟩', 'H on q0 → superposition', 'CNOT entangles → (|00⟩+|11⟩)/√2', 'Measure collapses the pair together']

  const steps = mode === 'classic' ? classicSteps : quantumSteps

  return (
    <div className="hw-circuits">
      <div className="hw-tabs">
        <button className={mode === 'classic' ? 'active' : ''} onClick={() => { setMode('classic'); setTick(0) }}>Classical logic</button>
        <button className={mode === 'quantum' ? 'active' : ''} onClick={() => { setMode('quantum'); setTick(0) }}>Quantum circuit</button>
      </div>
      <AnimatePresence mode="wait">
        {mode === 'classic' ? (
          <motion.div key="c" className="hw-wire-board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="muted">AND is irreversible: 1 AND 0 = 0, and you cannot recover A,B from the output. Copying bits is free.</p>
            <div className="hw-wire"><em>A=1</em><b className={tick >= 1 ? 'lit' : ''}>AND</b><span /><strong>{tick >= 1 ? '0' : '?'}</strong></div>
            <div className="hw-wire"><em>B=0</em><span /></div>
            <div className="hw-wire"><em>C=1</em><b className={tick >= 2 ? 'lit' : ''}>XOR</b><span /><strong>{tick >= 2 ? '1' : '?'}</strong></div>
          </motion.div>
        ) : (
          <motion.div key="q" className="hw-wire-board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="muted">H then CNOT is reversible until measurement. You cannot read q0 mid-circuit without collapsing the Bell pair.</p>
            <div className="hw-wire q"><em>q0</em><b className={tick >= 1 ? 'lit' : ''}>H</b><span /><b className={`dot ${tick >= 2 ? 'lit' : ''}`}>•</b><span /><b className={tick >= 3 ? 'lit' : ''}>M</b></div>
            <div className="hw-wire q"><em>q1</em><span /><b className={tick >= 2 ? 'lit' : ''}>⊕</b><span /><b className={tick >= 3 ? 'lit' : ''}>M</b></div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="hw-output">
        <Zap size={14} />
        <span>{steps[Math.min(tick, steps.length - 1)]}</span>
      </div>
      <button
        className="pill-btn small"
        style={{ marginTop: 12 }}
        onClick={() => setTick(t => (t + 1) % steps.length)}
      >
        Step circuit ({tick + 1}/{steps.length})
      </button>
    </div>
  )
}
