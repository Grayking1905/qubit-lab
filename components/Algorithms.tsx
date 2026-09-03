'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  BookOpen,
  Cpu,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { simulate, type Circuit, type SimulateResult, type ComplexNum } from '@/lib/api'
import { simulateLocal } from '@/lib/simulator'
import {
  ALGORITHMS,
  blochFromStatevector,
  type AlgorithmCategory,
  type AlgorithmItem,
  type BlochCoords,
} from '@/lib/quantum'
import { playPopUp, playPopDown, playSuccess, playError } from '@/lib/sounds'
import BlochSphere from '@/components/BlochSphereClient'
import Algorithm3DVisualizerClient from '@/components/Algorithm3DVisualizerClient'
import { ErrorBox } from '@/components/shared'

const CATEGORIES: AlgorithmCategory[] = [
  'All',
  'Entanglement',
  'Search & Oracles',
  'Communication',
  'Error Correction',
  'Arithmetic',
]

function sampleShots(probabilities: Record<string, number>, totalShots = 1024): Record<string, number> {
  const counts: Record<string, number> = {}
  const entries = Object.entries(probabilities).filter(([, p]) => p > 0.0001)
  if (entries.length === 0) return {}

  const sum = entries.reduce((acc, [, p]) => acc + p, 0) || 1

  for (let s = 0; s < totalShots; s++) {
    const r = Math.random() * sum
    let cum = 0
    for (const [bit, prob] of entries) {
      cum += prob
      if (r <= cum || bit === entries[entries.length - 1][0]) {
        counts[bit] = (counts[bit] ?? 0) + 1
        break
      }
    }
  }
  return counts
}

export default function Algorithms({ openBuilder }: { openBuilder: (circuit: Circuit) => void }) {
  const [selectedId, setSelectedId] = useState<string>(ALGORITHMS[0].id)
  const [selectedCategory, setSelectedCategory] = useState<AlgorithmCategory>('All')
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [running, setRunning] = useState(false)
  const [hasSimulated, setHasSimulated] = useState(false)
  const [simulatedShots, setSimulatedShots] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0) // 0 = initial state, 1..N = steps
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1)
  const [viewMode, setViewMode] = useState<'3d-stage' | 'bloch-array' | 'probabilities' | 'theory'>('3d-stage')
  const [focusQubit, setFocusQubit] = useState<number | 'all'>('all')

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const algo: AlgorithmItem = useMemo(
    () => ALGORITHMS.find(a => a.id === selectedId) ?? ALGORITHMS[0],
    [selectedId]
  )

  const filteredAlgorithms = useMemo(() => {
    if (selectedCategory === 'All') return ALGORITHMS
    return ALGORITHMS.filter(a => a.category === selectedCategory)
  }, [selectedCategory])

  const circuit: Circuit = useMemo(() => ({
    qubits: algo.qubits,
    gates: algo.gates.map(g => ({
      type: g.type,
      qubit: g.qubit,
      target: g.target,
      controls: g.controls,
      step: g.step,
    })),
  }), [algo])

  // Unique time step columns in ascending order
  const stepColumns = useMemo(() => {
    return Array.from(new Set(algo.gates.map(g => g.step))).sort((a, b) => a - b)
  }, [algo.gates])

  const totalStepStages = stepColumns.length + 1 // 0 = initial, 1..N = after each step

  // Reset state when switching algorithms
  useEffect(() => {
    setResult(null)
    setActiveStep(0)
    setHasSimulated(false)
    setSimulatedShots(null)
    setIsPlaying(false)
    setError('')
    setFocusQubit('all')
  }, [selectedId])

  // Playback timer (manual scrub / play mode)
  useEffect(() => {
    if (isPlaying) {
      const interval = playbackSpeed === 1 ? 1600 : 850
      timerRef.current = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= totalStepStages - 1) {
            setIsPlaying(false)
            return prev
          }
          playPopUp()
          return prev + 1
        })
      }, interval)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, totalStepStages, playbackSpeed])

  // Action: Run Simulation with live step sweep and output generation
  const handleRun = async () => {
    if (running) return
    setRunning(true)
    setError('')
    setIsPlaying(false)
    setActiveStep(0)
    setHasSimulated(false)
    playPopUp()

    try {
      let res: SimulateResult
      try {
        res = await simulate(circuit)
      } catch {
        res = simulateLocal(circuit)
      }
      setResult(res)

      // Sample 1024 realistic measurement shots from final probabilities
      const shots = sampleShots(res.probabilities, 1024)
      setSimulatedShots(shots)

      // Animate execution step by step so the user watches the algorithm compute
      const totalSteps = stepColumns.length
      if (totalSteps > 0) {
        const stepDelay = Math.max(280, Math.min(500, 2400 / totalSteps))
        for (let s = 1; s <= totalSteps; s++) {
          await new Promise(resolve => setTimeout(resolve, stepDelay))
          setActiveStep(s)
          playPopUp()
        }
      }

      setHasSimulated(true)
      playSuccess()

      // Smoothly scroll to the generated output card
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 150)
    } catch (e: any) {
      setError(e?.message || 'Could not simulate algorithm.')
      playError()
    } finally {
      setRunning(false)
    }
  }

  // Derive step-specific statevector and probabilities
  const currentStepData = useMemo(() => {
    const dim = 1 << algo.qubits
    let sv: ComplexNum[] = Array.from({ length: dim }, (_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }))
    let activeGates: Circuit['gates'] = []
    let stepTitle = 'Initial Ground State'
    let stepDesc = `All ${algo.qubits} qubits are initialized in the ground state |0⟩. System state is |${'0'.repeat(algo.qubits)}⟩.`
    let stepFormula = `|${'0'.repeat(algo.qubits)}⟩`

    if (activeStep > 0 && result) {
      const colStep = stepColumns[activeStep - 1]
      activeGates = algo.gates.filter(g => g.step === colStep)

      if (result.intermediateStatevectors && result.intermediateStatevectors[activeStep - 1]) {
        sv = result.intermediateStatevectors[activeStep - 1]
      } else if (activeStep === totalStepStages - 1) {
        sv = result.finalStatevector
      }

      // Predefined pedagogical explanation
      const explanation = algo.stepDescriptions?.[colStep]
      if (explanation) {
        stepTitle = explanation.title
        stepDesc = explanation.description
        if (explanation.formula) stepFormula = explanation.formula
      } else {
        stepTitle = `Step ${activeStep}: ${activeGates.map(g => g.type).join(', ')} Applied`
        stepDesc = `Gates at time step ${colStep} transform the quantum amplitudes across basis states.`
      }
    }

    // Compute probabilities at this step (safely guarded against undefined sv[i])
    const probs: Record<string, number> = {}
    for (let i = 0; i < dim; i++) {
      const bitstring = i.toString(2).padStart(algo.qubits, '0')
      const amp = sv[i] ?? { re: 0, im: 0 }
      const p = amp.re * amp.re + amp.im * amp.im
      probs[bitstring] = p
    }

    // Compute Bloch vectors for each qubit at this step
    const blochCoords: BlochCoords[] = Array.from({ length: algo.qubits }, (_, q) => {
      return blochFromStatevector(sv, q, algo.qubits)
    })

    // Detect entangled pairs
    const entangledPairs: [number, number][] = []
    for (let q = 0; q < algo.qubits; q++) {
      const c = blochCoords[q]
      const r = Math.sqrt(c.x * c.x + c.y * c.y + c.z * c.z)
      if (r < 0.98) {
        algo.gates.forEach(g => {
          if (g.step <= (stepColumns[activeStep - 1] ?? -1)) {
            if (g.type === 'CNOT' && g.target !== undefined && g.target !== null) {
              if (!entangledPairs.some(([a, b]) => (a === g.qubit && b === g.target) || (a === g.target && b === g.qubit))) {
                entangledPairs.push([g.qubit, g.target])
              }
            }
          }
        })
      }
    }

    return {
      stepIndex: activeStep,
      totalSteps: totalStepStages,
      qubits: algo.qubits,
      statevector: sv,
      probabilities: probs,
      blochCoords,
      activeGates,
      entangledPairs,
      stepTitle,
      stepDesc,
      stepFormula,
    }
  }, [activeStep, algo, result, stepColumns, totalStepStages])

  // Filtered probabilities for charts (> 0.0005)
  const currentProbEntries = useMemo(() => {
    return Object.entries(currentStepData.probabilities)
      .filter(([, p]) => p > 0.0005)
      .sort(([a], [b]) => a.localeCompare(b))
  }, [currentStepData.probabilities])

  // Dominant measurement outcome(s)
  const dominantOutcomes = useMemo(() => {
    return currentProbEntries
      .filter(([, p]) => p >= 0.1)
      .map(([s, p]) => `|${s}⟩ (${(p * 100).toFixed(0)}%)`)
      .join(', ')
  }, [currentProbEntries])

  return (
    <main className="algo-page">
      {/* Page Header */}
      <div className="algo-head">
        <div>
          <p className="eyebrow">QUANTUM ALGORITHMS & STEP-BY-STEP LAB</p>
          <h1>
            Interactive <em>algorithm studio.</em>
          </h1>
          <p>
            Explore quantum superiority in action. Run canonical algorithms, step through their time evolution in 3D, and understand how interference, superposition, and entanglement compute answers impossible classically.
          </p>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="algo-category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={selectedCategory === cat ? 'cat-btn active' : 'cat-btn'}
            onClick={() => {
              setSelectedCategory(cat)
              playPopDown()
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="algo-layout">
        {/* Left Sidebar: Algorithms List */}
        <aside className="algo-sidebar">
          {filteredAlgorithms.map(a => (
            <motion.button
              key={a.id}
              className={selectedId === a.id ? 'algo-item active' : 'algo-item'}
              onClick={() => {
                setSelectedId(a.id)
                playPopDown()
              }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="algo-item-head">
                <strong>{a.name}</strong>
                <span className="qubit-badge">{a.qubits}Q</span>
              </div>
              <span className="algo-item-desc">{a.description}</span>
            </motion.button>
          ))}
        </aside>

        {/* Right Main Workbench */}
        <section className="algo-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={algo.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              <div className="algo-panel">
                {/* Header Actions */}
                <div className="algo-panel-head">
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span className="tag orange">{algo.qubits} QUBITS</span>
                      <span className="tag blue">{algo.category.toUpperCase()}</span>
                    </div>
                    <h2>{algo.name}</h2>
                    <p className="muted">{algo.description}</p>
                  </div>
                  <div className="algo-actions">
                    <button
                      className="outline-btn small"
                      onClick={() => {
                        setActiveStep(0)
                        setHasSimulated(false)
                        setSimulatedShots(null)
                        setIsPlaying(false)
                        playPopDown()
                      }}
                      title="Reset execution to step 0"
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                    <button
                      className={`pill-btn small ${!hasSimulated && !running ? 'simulate-cta-pulse' : ''}`}
                      onClick={handleRun}
                      disabled={running}
                    >
                      <Play size={14} /> {running ? `Simulating Step ${activeStep}…` : hasSimulated ? 'Re-Simulate' : 'Simulate'}
                    </button>
                    <button
                      className="outline-btn small"
                      onClick={() => openBuilder(circuit)}
                    >
                      Open in builder <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Circuit Grid Wire Visualizer */}
                <div className="algo-circuit-viz">
                  <div className="circuit-viz-header">
                    <span className="muted-label">CIRCUIT TIMELINE</span>
                    <span className="step-indicator">
                      Step {activeStep} of {totalStepStages - 1}
                    </span>
                  </div>
                  {Array.from({ length: algo.qubits }, (_, q) => (
                    <div className="algo-wire" key={q}>
                      <span className="qubit-label">q{q}</span>
                      <div className="algo-wire-line">
                        {/* Initial state wire cell */}
                        <div
                          className={`algo-gate-col initial-col ${activeStep === 0 ? 'current-step' : ''}`}
                          onClick={() => setActiveStep(0)}
                        >
                          <span className="initial-ket">|0⟩</span>
                        </div>

                        {stepColumns.map((step, colIdx) => {
                          const isCurrentStep = activeStep === colIdx + 1
                          const gate = algo.gates.find(
                            g => g.step === step && (g.qubit === q || ('target' in g && g.target === q))
                          )
                          const isControl = algo.gates.some(
                            g => g.step === step && (g.type === 'CNOT' || g.type === 'TOFFOLI') && (g.qubit === q || g.controls?.includes(q))
                          )
                          const isTarget = algo.gates.some(
                            g => g.step === step && (g.type === 'CNOT' || g.type === 'TOFFOLI') && g.target === q
                          )

                          let symbol = ''
                          if (gate && gate.qubit === q && gate.type !== 'CNOT' && gate.type !== 'TOFFOLI') {
                            symbol = gate.type
                          } else if (isControl) {
                            symbol = '•'
                          } else if (isTarget) {
                            symbol = '⊕'
                          }

                          return (
                            <div
                              key={step}
                              className={`algo-gate-col ${isCurrentStep ? 'current-step' : ''}`}
                              onClick={() => {
                                setActiveStep(colIdx + 1)
                                playPopUp()
                              }}
                              title={`Click to jump to Step ${colIdx + 1}`}
                            >
                              <span className={symbol ? 'algo-gate filled' : 'algo-gate'}>
                                {symbol}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step Playback Controls & Scrubber */}
                <div className="algo-scrubber-bar">
                  <div className="playback-btns">
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setActiveStep(prev => Math.max(0, prev - 1))
                        playPopDown()
                      }}
                      disabled={activeStep <= 0}
                      title="Previous Step"
                    >
                      <SkipBack size={15} />
                    </button>
                    <button
                      className="pill-btn small play-pause-btn"
                      onClick={() => {
                        if (activeStep >= totalStepStages - 1) setActiveStep(0)
                        setIsPlaying(!isPlaying)
                        playPopUp()
                      }}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setActiveStep(prev => Math.min(totalStepStages - 1, prev + 1))
                        playPopUp()
                      }}
                      disabled={activeStep >= totalStepStages - 1}
                      title="Next Step"
                    >
                      <SkipForward size={15} />
                    </button>
                    <button
                      className="outline-btn tiny speed-toggle"
                      onClick={() => setPlaybackSpeed(s => (s === 1 ? 2 : 1))}
                    >
                      {playbackSpeed}x
                    </button>
                  </div>

                  {/* Scrubber slider */}
                  <div className="scrubber-track-wrap">
                    <input
                      type="range"
                      min={0}
                      max={totalStepStages - 1}
                      value={activeStep}
                      onChange={e => {
                        setActiveStep(Number(e.target.value))
                        playPopUp()
                      }}
                      className="step-slider"
                    />
                    <div className="scrubber-ticks">
                      {Array.from({ length: totalStepStages }, (_, i) => (
                        <span
                          key={i}
                          className={activeStep === i ? 'tick active' : 'tick'}
                          onClick={() => setActiveStep(i)}
                        >
                          {i === 0 ? '0' : i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step Pedagogical Explanation Card */}
                <div className="algo-step-card">
                  <div className="step-card-header">
                    <div className="step-badge">
                      <Sparkles size={13} className="step-sparkle" />
                      <span>{currentStepData.stepTitle}</span>
                    </div>
                    {currentStepData.stepFormula && (
                      <code className="step-formula">{currentStepData.stepFormula}</code>
                    )}
                  </div>
                  <p className="step-desc-text">{currentStepData.stepDesc}</p>
                  {currentStepData.activeGates.length > 0 && (
                    <div className="active-gates-row">
                      <span className="muted-label">Active Gates:</span>
                      {currentStepData.activeGates.map((g, i) => (
                        <span key={i} className="gate-tag">
                          {g.type} on q{g.qubit}
                          {g.target !== undefined && g.target !== null ? ` → q${g.target}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {error && <ErrorBox message={error} />}

                {/* Visualization View Mode Switcher */}
                <div className="viz-mode-tabs">
                  <button
                    className={viewMode === '3d-stage' ? 'viz-tab active' : 'viz-tab'}
                    onClick={() => setViewMode('3d-stage')}
                  >
                    <Cpu size={14} /> 3D Quantum Stage
                  </button>
                  <button
                    className={viewMode === 'bloch-array' ? 'viz-tab active' : 'viz-tab'}
                    onClick={() => setViewMode('bloch-array')}
                  >
                    <Layers size={14} /> Multi-Qubit Bloch Array
                  </button>
                  <button
                    className={viewMode === 'probabilities' ? 'viz-tab active' : 'viz-tab'}
                    onClick={() => setViewMode('probabilities')}
                  >
                    <Activity size={14} /> State Amplitudes
                  </button>
                  <button
                    className={viewMode === 'theory' ? 'viz-tab active' : 'viz-tab'}
                    onClick={() => setViewMode('theory')}
                  >
                    <BookOpen size={14} /> Theory & Walkthrough
                  </button>
                </div>

                {/* Main Interactive Visualizer Display */}
                <div className="algo-viz-container">
                  {viewMode === '3d-stage' && (
                    <div className="stage-3d-wrap">
                      <Algorithm3DVisualizerClient
                        data={currentStepData}
                        focusQubit={focusQubit}
                        onSelectQubit={q => setFocusQubit(prev => (prev === q ? 'all' : q))}
                      />
                      <div className="stage-3d-caption">
                        <span>
                          <strong>3D Quantum Stage:</strong> Drag to rotate view • Scroll to zoom • Shows statevectors, active gate holograms, and entanglement beams at Step {activeStep}.
                        </span>
                        {focusQubit !== 'all' && (
                          <button
                            className="outline-btn tiny"
                            onClick={() => setFocusQubit('all')}
                          >
                            Reset Focus
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {viewMode === 'bloch-array' && (
                    <div className="bloch-array-grid">
                      {Array.from({ length: algo.qubits }, (_, q) => {
                        const bCoords = currentStepData.blochCoords[q]
                        const isSelected = focusQubit === q
                        return (
                          <div
                            key={q}
                            className={`bloch-item-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setFocusQubit(prev => (prev === q ? 'all' : q))}
                          >
                            <div className="bloch-item-head">
                              <strong>Qubit q{q}</strong>
                              <span className="bloch-coords-text">
                                x:{bCoords.x.toFixed(2)} y:{bCoords.y.toFixed(2)} z:{bCoords.z.toFixed(2)}
                              </span>
                            </div>
                            <BlochSphere coords={bCoords} animate size={220} />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {viewMode === 'probabilities' && (
                    <div className="algo-prob-panel">
                      <p className="muted-label">MEASUREMENT PROBABILITIES AT STEP {activeStep}</p>
                      <div className="prob-bars algo-prob-bars">
                        {currentProbEntries.map(([state, p], i) => (
                          <motion.div
                            key={state}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: i * 0.04, duration: 0.35 }}
                          >
                            <span>|{state}⟩</span>
                            <motion.i
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(4, p * 100)}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                            <strong>{(p * 100).toFixed(1)}%</strong>
                          </motion.div>
                        ))}
                      </div>

                      {/* State vector breakdown table */}
                      <div className="state-amplitudes-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Basis State</th>
                              <th>Probability</th>
                              <th>Amplitude (Re + i·Im)</th>
                              <th>Phase</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentProbEntries.map(([state, p]) => {
                              const idx = parseInt(state, 2)
                              const amp = currentStepData.statevector[idx] ?? { re: 0, im: 0 }
                              const phaseRad = Math.atan2(amp.im, amp.re)
                              const phaseDeg = (phaseRad * 180 / Math.PI).toFixed(0)
                              return (
                                <tr key={state}>
                                  <td className="basis-ket">|{state}⟩</td>
                                  <td>{(p * 100).toFixed(1)}%</td>
                                  <td>{amp.re.toFixed(3)} {amp.im >= 0 ? '+' : '−'} {Math.abs(amp.im).toFixed(3)}i</td>
                                  <td>{phaseDeg}°</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewMode === 'theory' && (
                    <div className="algo-theory-card">
                      <div className="theory-section">
                        <h3>Overview & How It Works</h3>
                        <p>{algo.overview}</p>
                      </div>
                      <div className="theory-section">
                        <h3>Quantum Advantage vs Classical</h3>
                        <p>{algo.advantage}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Output & Interpretation Card (Dynamically Generated on Simulate) */}
                <div ref={outputRef}>
                  {!hasSimulated && !running && (
                    <div className="algo-output-card unsimulated">
                      <div className="unsimulated-content">
                        <div className="unsimulated-icon-wrap">
                          <Zap size={26} className="unsimulated-zap" />
                        </div>
                        <div className="unsimulated-text">
                          <h3>Ready to Simulate</h3>
                          <p className="muted">
                            Click <strong>Simulate</strong> to execute this circuit on the statevector engine, observe quantum phase evolution across every time step, and generate measurement shots.
                          </p>
                        </div>
                        <button className="pill-btn simulate-cta-pulse" onClick={handleRun}>
                          <Play size={15} /> Simulate Algorithm Now
                        </button>
                      </div>
                    </div>
                  )}

                  {running && (
                    <div className="algo-output-card simulating">
                      <div className="simulating-content">
                        <div className="simulating-spinner" />
                        <div>
                          <h3>Quantum Simulation Running…</h3>
                          <p className="muted">
                            Executing unitary gates and stepping statevector through Step {activeStep} of {totalStepStages - 1}…
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasSimulated && (
                    <motion.div
                      className="algo-output-card simulated"
                      initial={{ opacity: 0, scale: 0.98, y: 14 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                      <div className="output-card-header">
                        <CheckCircle2 size={20} className="output-icon" />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h3>Algorithm Output & Physical Interpretation</h3>
                            <span className="execution-tag">✓ 1024 SHOTS GENERATED</span>
                          </div>
                          <p className="muted">Measured outcomes and physical state collapse from simulation</p>
                        </div>
                      </div>
                      <div className="output-body">
                        <div className="output-primary-box">
                          <span className="output-tag">COLLAPSED BASIS STATE</span>
                          <strong className="output-dominant">{dominantOutcomes || 'Superposition'}</strong>
                          <p className="output-explanation">{algo.outputExplanation}</p>

                          {/* Measurement Shots Breakdown */}
                          {simulatedShots && (
                            <div className="shots-breakdown">
                              <span className="muted-label">MEASURED SHOTS DISTRIBUTION (1024 SHOTS)</span>
                              <div className="shots-grid">
                                {Object.entries(simulatedShots)
                                  .sort(([, a], [, b]) => b - a)
                                  .map(([bit, count]) => {
                                    const pct = ((count / 1024) * 100).toFixed(1)
                                    return (
                                      <div key={bit} className="shot-item">
                                        <span className="shot-ket">|{bit}⟩</span>
                                        <div className="shot-bar-track">
                                          <motion.div
                                            className="shot-bar-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                          />
                                        </div>
                                        <strong className="shot-count">{count} ({pct}%)</strong>
                                      </div>
                                    )
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="output-stats-grid">
                          <div className="stat-pill">
                            <span className="stat-label">TOTAL QUBITS</span>
                            <strong className="stat-value">{algo.qubits}</strong>
                          </div>
                          <div className="stat-pill">
                            <span className="stat-label">TIME STEPS</span>
                            <strong className="stat-value">{totalStepStages - 1}</strong>
                          </div>
                          <div className="stat-pill">
                            <span className="stat-label">GATE COUNT</span>
                            <strong className="stat-value">{algo.gates.length}</strong>
                          </div>
                          <div className="stat-pill">
                            <span className="stat-label">SIMULATOR</span>
                            <strong className="stat-value" style={{ color: 'var(--green)', fontSize: 13 }}>Qiskit Aer</strong>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}
