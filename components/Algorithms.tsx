'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, RotateCcw } from 'lucide-react'
import { simulate, type Circuit, type SimulateResult } from '@/lib/api'
import { ALGORITHMS, blochFromStatevector } from '@/lib/quantum'
import { playPopDown, playSuccess, playError } from '@/lib/sounds'
import BlochSphere from '@/components/BlochSphereClient'
import { ErrorBox } from '@/components/shared'

export default function Algorithms({ openBuilder }: { openBuilder: (circuit: Circuit) => void }) {
  const [selected, setSelected] = useState<string>(ALGORITHMS[0].id)
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const algo = ALGORITHMS.find(a => a.id === selected) ?? ALGORITHMS[0]

  const circuit: Circuit = useMemo(() => ({
    qubits: algo.qubits,
    gates: algo.gates.map(g => ({
      type: g.type as Circuit['gates'][0]['type'],
      qubit: g.qubit,
      target: 'target' in g ? g.target : undefined,
      step: g.step,
    })),
  }), [algo])

  const run = async () => {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await simulate(circuit)
      setResult(res)
      playSuccess()
    } catch {
      setError('Could not simulate — is the backend running?')
      playError()
    } finally {
      setRunning(false)
    }
  }

  const bloch = result ? blochFromStatevector(result.finalStatevector, 0, algo.qubits) : { x: 0, y: 0, z: 1 }

  const entries = result
    ? Object.entries(result.probabilities).filter(([, p]) => p > 0.001).sort(([a], [b]) => a.localeCompare(b))
    : []

  return (
    <main className="algo-page">
      <div className="algo-head">
        <div>
          <p className="eyebrow">QUANTUM ALGORITHMS</p>
          <h1>Interactive <em>algorithm lab.</em></h1>
          <p>Explore canonical quantum algorithms — run them, visualize states, then open in the circuit builder to modify.</p>
        </div>
      </div>

      <div className="algo-layout">
        <aside className="algo-sidebar">
          {ALGORITHMS.map(a => (
            <motion.button
              key={a.id}
              className={selected === a.id ? 'algo-item active' : 'algo-item'}
              onClick={() => { setSelected(a.id); setResult(null); playPopDown() }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <strong>{a.name}</strong>
              <span>{a.description}</span>
            </motion.button>
          ))}
        </aside>

        <section className="algo-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={algo.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="algo-panel">
                <div className="algo-panel-head">
                  <div>
                    <span className="tag orange">{algo.qubits} QUBITS</span>
                    <h2>{algo.name}</h2>
                    <p className="muted">{algo.description}</p>
                  </div>
                  <div className="algo-actions">
                    <button className="outline-btn small" onClick={() => { setResult(null); playPopDown() }}><RotateCcw size={14} /> Reset</button>
                    <button className="pill-btn small" onClick={run} disabled={running}><Play size={14} /> {running ? 'Running…' : 'Simulate'}</button>
                    <button className="outline-btn small" onClick={() => openBuilder(circuit)}>Open in builder <ArrowRight size={14} /></button>
                  </div>
                </div>

                <div className="algo-circuit-viz">
                  {Array.from({ length: algo.qubits }, (_, q) => (
                    <div className="algo-wire" key={q}>
                      <span className="qubit-label">q{q}</span>
                      <div className="algo-wire-line">
                        {Array.from({ length: Math.max(...algo.gates.map(g => g.step)) + 2 }, (_, step) => {
                          const gate = algo.gates.find(g => g.step === step && (g.qubit === q || ('target' in g && g.target === q)))
                          const isControl = algo.gates.some(g => g.step === step && g.type === 'CNOT' && g.qubit === q)
                          const isTarget = algo.gates.some(g => g.step === step && g.type === 'CNOT' && 'target' in g && g.target === q)
                          let symbol = ''
                          if (gate && gate.qubit === q && gate.type !== 'CNOT') symbol = gate.type
                          else if (isControl) symbol = '•'
                          else if (isTarget) symbol = '⊕'
                          return (
                            <motion.span
                              key={step}
                              className={symbol ? 'algo-gate filled' : 'algo-gate'}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: step * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              {symbol}
                            </motion.span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {error && <ErrorBox message={error} />}

                {result && (
                  <motion.div
                    className="algo-results"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="algo-viz-row">
                      <div className="algo-probs">
                        <p className="muted-label">MEASUREMENT PROBABILITIES</p>
                        <div className="prob-bars algo-prob-bars">
                          {entries.map(([state, p], i) => (
                            <motion.div
                              key={state}
                              initial={{ opacity: 0, scaleY: 0 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              transition={{ delay: i * 0.06, duration: 0.35 }}
                            >
                              <span>|{state}⟩</span>
                              <motion.i
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(4, p * 100)}%` }}
                                transition={{ delay: i * 0.06 + 0.1, duration: 0.5, ease: 'easeOut' }}
                              />
                              <strong>{(p * 100).toFixed(1)}%</strong>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="algo-bloch">
                        <p className="muted-label">BLOCH SPHERE (q0)</p>
                        <BlochSphere coords={bloch} animate />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}
