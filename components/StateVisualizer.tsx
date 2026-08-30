'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import BlochSphere from '@/components/BlochSphereClient'
import { blochFromStatevector } from '@/lib/quantum'
import type { SimulateResult } from '@/lib/api'

export default function StateVisualizer({
  result,
  qubits,
  selectedQubit = 0,
  onSelectQubit,
}: {
  result: SimulateResult | null
  qubits: number
  selectedQubit?: number
  onSelectQubit?: (q: number) => void
}) {
  const bloch = useMemo(() => {
    if (!result) return { x: 0, y: 0, z: 1 }
    return blochFromStatevector(result.finalStatevector, selectedQubit, qubits)
  }, [result, selectedQubit, qubits])

  const entries = useMemo(
    () => result ? Object.entries(result.probabilities).filter(([, p]) => p > 0.0005).sort(([a], [b]) => a.localeCompare(b)) : [],
    [result]
  )

  if (!result) {
    return (
      <div className="state-viz empty">
        <p className="muted-label">VISUALIZATION</p>
        <p className="muted">Run the circuit to see the Bloch sphere and measurement probabilities.</p>
      </div>
    )
  }

  return (
    <div className="state-viz">
      <div className="state-viz-head">
        <p className="muted-label">QUANTUM STATE</p>
        {qubits > 1 && onSelectQubit && (
          <div className="qubit-tabs">
            {Array.from({ length: qubits }, (_, i) => (
              <button
                key={i}
                className={selectedQubit === i ? 'qubit-tab active' : 'qubit-tab'}
                onClick={() => onSelectQubit(i)}
              >
                q{i}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="state-viz-body">
        <BlochSphere coords={bloch} animate size={240} />
        <div className="state-probs">
          {entries.map(([state, p], i) => (
            <motion.div
              key={state}
              className="state-prob-row"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <span>|{state}⟩</span>
              <div className="state-prob-track">
                <motion.div
                  className="state-prob-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${p * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <strong>{(p * 100).toFixed(1)}%</strong>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
