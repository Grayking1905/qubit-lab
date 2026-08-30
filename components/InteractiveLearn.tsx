'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Check, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react'
import { simulate, type Circuit, type GateOp, type GateType, type SimulateResult } from '@/lib/api'
import { LESSONS, blochFromStatevector } from '@/lib/quantum'
import { playPopUp, playPopDown, playSuccess, playError } from '@/lib/sounds'
import { simulateLocal } from '@/lib/simulator'
import BlochSphere from '@/components/BlochSphereClient'
import HardwareViz from '@/components/HardwareViz'
import CodeSandbox from '@/components/CodeSandbox'
import LessonQuiz from '@/components/LessonQuiz'
import { ErrorBox } from '@/components/shared'
import EntanglementViz from '@/components/EntanglementVizClient'

function YtIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

const STEPS = 6
const GATES: { type: GateType; label: string }[] = [
  { type: 'H', label: 'Hadamard' },
  { type: 'X', label: 'Pauli-X' },
  { type: 'Y', label: 'Pauli-Y' },
  { type: 'Z', label: 'Pauli-Z' },
  { type: 'CNOT', label: 'CNOT' },
  { type: 'MEASURE', label: 'Measure' },
]

const GATE_MIME = 'application/x-qubit-gate'

function GateChip({ type, label, selected, onSelect }: { type: GateType; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={selected ? 'gate-draggable selected' : 'gate-draggable'}
      draggable
      onClick={() => { onSelect(); playPopUp() }}
      onDragStart={e => {
        e.dataTransfer.setData(GATE_MIME, type)
        e.dataTransfer.setData('text/plain', type)
        e.dataTransfer.effectAllowed = 'copy'
        onSelect()
        playPopUp()
      }}
    >
      <b>{type === 'MEASURE' ? 'M' : type}</b>
      <span>{label}</span>
    </button>
  )
}

function DropCell({
  q, step, gate, onPlace,
}: {
  q: number
  step: number
  gate: string | null
  onPlace: (type?: GateType) => void
}) {
  const [over, setOver] = useState(false)
  return (
    <button
      type="button"
      className={`grid-cell ${gate ? 'filled' : ''} ${over ? 'drop-hover' : ''}`}
      onClick={() => onPlace()}
      onDragOver={e => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault()
        setOver(false)
        const type = (e.dataTransfer.getData(GATE_MIME) || e.dataTransfer.getData('text/plain')) as GateType
        onPlace(type || undefined)
      }}
    >
      {gate ?? ''}
    </button>
  )
}

export default function InteractiveLearn({ onComplete }: { onComplete?: () => void }) {
  const [lessonIdx, setLessonIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [circuit, setCircuit] = useState<Circuit>({ qubits: 1, gates: [] })
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [selectedGate, setSelectedGate] = useState<GateType>('H')
  const [pendingCnot, setPendingCnot] = useState<{ step: number; control: number } | null>(null)

  const lesson = LESSONS[lessonIdx]
  const step = lesson.steps[stepIdx]

  const initExperiment = useCallback((s: typeof step) => {
    if (s.type === 'experiment' && 'circuit' in s) {
      const c = s.circuit as { qubits: number; gates: GateOp[] }
      setCircuit({ qubits: c.qubits, gates: [...(c.gates as GateOp[])] })
      setResult(null)
      setCompleted(false)
      setError('')
      setPendingCnot(null)
    }
  }, [])

  const gateAt = (q: number, s: number): string | null => {
    for (const g of circuit.gates) {
      if (g.step !== s) continue
      if (g.type === 'CNOT') {
        if (g.qubit === q) return '•'
        if (g.target === q) return '⊕'
      } else if (g.qubit === q) {
        return g.type === 'MEASURE' ? 'M' : g.type
      }
    }
    return null
  }

  const addGate = (type: GateType, q: number, stepIndex: number) => {
    if (type === 'CNOT') {
      if (pendingCnot && pendingCnot.step === stepIndex && pendingCnot.control !== q) {
        const gate: GateOp = { type: 'CNOT', qubit: pendingCnot.control, target: q, step: stepIndex }
        setCircuit(prev => ({ ...prev, gates: [...prev.gates, gate] }))
        setPendingCnot(null)
        playPopDown()
        return
      }
      setPendingCnot({ step: stepIndex, control: q })
      playPopUp()
      return
    }
    const gate: GateOp = { type, qubit: q, step: stepIndex }
    setCircuit(prev => ({
      ...prev,
      gates: [...prev.gates.filter(g => !(g.qubit === q && g.step === stepIndex)), gate],
    }))
    playPopDown()
  }

  const placeOnCell = (q: number, stepIndex: number, dragged?: GateType) => {
    const type = dragged || selectedGate
    if (!type) return
    addGate(type, q, stepIndex)
  }

  const run = async () => {
    setRunning(true)
    setError('')
    try {
      const res = await simulate(circuit)
      setResult(res)
      playSuccess()

      if (step.type === 'experiment' && 'expectedGates' in step) {
        const expected = step.expectedGates as unknown as GateOp[]
        const match = expected.every(eg =>
          circuit.gates.some(g => g.type === eg.type && g.qubit === eg.qubit && g.step === eg.step &&
            (eg.type !== 'CNOT' || g.target === (eg as GateOp).target))
        )
        if (match) setCompleted(true)
      }
    } catch {
      setError('Backend unreachable — start the Python server on port 8000')
      playError()
    } finally {
      setRunning(false)
    }
  }

  const nextStep = () => {
    if (stepIdx < lesson.steps.length - 1) {
      const next = lesson.steps[stepIdx + 1]
      setStepIdx(stepIdx + 1)
      initExperiment(next)
    } else if (lessonIdx < LESSONS.length - 1) {
      setLessonIdx(lessonIdx + 1)
      setStepIdx(0)
      initExperiment(LESSONS[lessonIdx + 1].steps[0])
    } else {
      onComplete?.()
    }
    playPopDown()
  }

  const prevStep = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1)
      initExperiment(lesson.steps[stepIdx - 1])
    } else if (lessonIdx > 0) {
      const prev = LESSONS[lessonIdx - 1]
      setLessonIdx(lessonIdx - 1)
      setStepIdx(prev.steps.length - 1)
      initExperiment(prev.steps[prev.steps.length - 1])
    }
  }

  const live = useMemo(() => simulateLocal(circuit), [circuit])
  const bloch = useMemo(
    () => blochFromStatevector((result ?? live).finalStatevector, 0, circuit.qubits),
    [result, live, circuit.qubits]
  )
  const entries = Object.entries((result ?? live).probabilities).filter(([, p]) => p > 0.001)

  return (
    <main className="educate-page">
      <div className="educate-layout">
        <aside className="educate-sidebar">
          <p className="muted-label">LEARNING PATH</p>
          {Array.from(new Set(LESSONS.map(l => l.topic))).map(topic => (
            <div key={topic} className="educate-topic-group">
              <p className="educate-topic-label">{topic}</p>
              {LESSONS.map((l, i) => l.topic !== topic ? null : (
                <button
                  key={l.id}
                  className={i === lessonIdx ? 'educate-lesson active' : 'educate-lesson'}
                  onClick={() => { setLessonIdx(i); setStepIdx(0); initExperiment(l.steps[0]); playPopDown() }}
                >
                  <BookOpen size={14} />
                  <div>
                    <strong>{l.title}</strong>
                    <small>{l.level}</small>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="educate-main">
          <div className="educate-progress">
            <span>Step {stepIdx + 1} of {lesson.steps.length}</span>
            <div className="educate-progress-bar">
              <motion.i
                initial={false}
                animate={{ width: `${((stepIdx + 1) / lesson.steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${lesson.id}-${stepIdx}`}
              className="educate-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <span className="tag orange">{step.type === 'read' ? 'READ'
                : step.type === 'experiment' ? 'EXPERIMENT'
                  : step.type === 'sandbox' ? 'SANDBOX'
                    : step.type === 'quiz' ? 'QUIZ'
                      : step.type === 'video' ? 'VIDEO'
                        : 'EXPLORE'
              }</span>
              <h2>{step.title}</h2>
              {'body' in step && step.body && (
                <p className="educate-body" style={{ whiteSpace: 'pre-line' }}>{step.body}</p>
              )}
              {'terminology' in step && Array.isArray(step.terminology) && (
                <div className="educate-glossary">
                  <p className="muted-label" style={{ marginBottom: 10 }}>KEY TERMINOLOGY</p>
                  <div className="educate-glossary-grid">
                    {(step.terminology as { term: string; def: string }[]).map(t => (
                      <motion.div
                        key={t.term}
                        className="glossary-card"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <strong>{t.term}</strong>
                        <span>{t.def}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {'code' in step && step.code && (
                <pre className="educate-code"><code>{step.code}</code></pre>
              )}
              {'sources' in step && Array.isArray(step.sources) && (
                <ul className="educate-sources">
                  {(step.sources as { label: string; url: string }[]).map(s => (
                    <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>
                  ))}
                </ul>
              )}
              {step.type === 'video' && 'videoId' in step && (
                <div className="educate-video">
                  <div className="educate-video-header">
                    <YtIcon size={16} />
                    <span>Watch</span>
                  </div>
                  <div className="educate-video-frame">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${step.videoId}?rel=0&modestbranding=1&color=white`}
                      title={step.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              {step.type === 'visual' && 'visual' in step && (
                <HardwareViz mode={step.visual} />
              )}
              {step.type === 'sandbox' && 'dialect' in step && (
                <CodeSandbox dialect={step.dialect} />
              )}
              {step.type === 'entanglement-viz' && (
                <div className="educate-entangle-viz">
                  <EntanglementViz />
                </div>
              )}
              {step.type === 'quiz' && 'question' in step && (
                <LessonQuiz
                  key={`${lesson.id}-${stepIdx}`}
                  quiz={{
                    question: step.question,
                    options: [...step.options],
                    correct: step.correct,
                    explanation: step.explanation,
                  }}
                />
              )}

              {step.type === 'experiment' && 'task' in step && (
                <div className="educate-task">
                  <Sparkles size={14} />
                  <span>{step.task}</span>
                  {completed && <Check size={16} className="task-done" />}
                </div>
              )}

              {step.type === 'experiment' && (
                <div className="educate-workspace">
                  <div className="educate-gates">
                    <p className="muted-label">DRAG GATES</p>
                    {GATES.map(g => (
                      <GateChip
                        key={g.type}
                        type={g.type}
                        label={g.label}
                        selected={selectedGate === g.type}
                        onSelect={() => setSelectedGate(g.type)}
                      />
                    ))}
                    <p className="palette-tip" style={{ marginTop: 12, paddingTop: 12 }}>
                      <span>
                        {pendingCnot
                          ? `Click the CNOT target on q1 at step ${pendingCnot.step + 1}`
                          : `Selected ${selectedGate === 'MEASURE' ? 'M' : selectedGate} — drag onto a dashed cell, or click the cell.`}
                      </span>
                    </p>
                  </div>

                  <div className="educate-circuit">
                    <div className="grid-circuit">
                      {Array.from({ length: circuit.qubits }, (_, q) => (
                        <div className="grid-row" key={q}>
                          <span className="qubit-label">q{q}</span>
                          {Array.from({ length: STEPS }, (_, s) => (
                            <DropCell
                              key={s}
                              q={q}
                              step={s}
                              gate={gateAt(q, s)}
                              onPlace={dragged => placeOnCell(q, s, dragged)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <button className="pill-btn small" onClick={run} disabled={running} style={{ marginTop: 16 }}>
                      <Play size={14} /> {running ? 'Running…' : 'Run & observe'}
                    </button>
                  </div>

                  <div className="educate-viz">
                    <p className="muted-label">LIVE STATE</p>
                    <div className="educate-bloch-frame">
                      <BlochSphere coords={bloch} animate size="fill" />
                    </div>
                    <div className="educate-state-meta">
                      <span>x {bloch.x.toFixed(2)}</span>
                      <span>y {bloch.y.toFixed(2)}</span>
                      <span>z {bloch.z.toFixed(2)}</span>
                    </div>
                    <div className="educate-probs">
                      {(entries.length > 0 ? entries : [['0', 1]] as [string, number][]).map(([state, p]) => (
                        <motion.div
                          key={state}
                          className="educate-prob-row"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <span>|{state}⟩</span>
                          <div className="educate-prob-bar"><motion.i animate={{ width: `${p * 100}%` }} transition={{ duration: 0.5 }} /></div>
                          <strong>{(p * 100).toFixed(0)}%</strong>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <ErrorBox message={error} />}
            </motion.div>
          </AnimatePresence>

          <div className="educate-nav">
            <button className="outline-btn small" onClick={prevStep} disabled={lessonIdx === 0 && stepIdx === 0}>
              <ChevronLeft size={14} /> Previous
            </button>
            <button className="pill-btn small" onClick={nextStep}>
              {lessonIdx === LESSONS.length - 1 && stepIdx === lesson.steps.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
