'use client'

import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { type Circuit, type SimulateResult } from '@/lib/api'
import { parseQuantumPython, STARTER, RECIPES, type SandboxDialect } from '@/lib/pythonSandbox'
import { simulateLocal } from '@/lib/simulator'
import { playSuccess, playError, playPopDown } from '@/lib/sounds'
import BlochSphere from '@/components/BlochSphereClient'
import { blochFromStatevector } from '@/lib/quantum'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function MiniCircuit({ circuit }: { circuit: Circuit }) {
  const maxStep = Math.max(3, ...circuit.gates.map(g => g.step), 0) + 1
  return (
    <div className="sandbox-mini">
      {Array.from({ length: circuit.qubits }, (_, q) => (
        <div className="hw-wire q" key={q}>
          <em>q{q}</em>
          {Array.from({ length: maxStep }, (_, s) => {
            const g = circuit.gates.find(x => x.step === s && (x.qubit === q || x.target === q || x.controls?.includes(q)))
            let sym = ''
            if (g?.type === 'CNOT' && g.qubit === q) sym = '•'
            else if (g?.type === 'CNOT' && g.target === q) sym = '⊕'
            else if (g && g.qubit === q) sym = g.type === 'MEASURE' ? 'M' : g.type
            return <b key={s} className={sym ? 'lit' : ''} style={{ opacity: sym ? 1 : 0.25 }}>{sym || '·'}</b>
          })}
        </div>
      ))}
    </div>
  )
}

export default function CodeSandbox({ dialect = 'qiskit', starter }: { dialect?: SandboxDialect; starter?: string }) {
  const [lang, setLang] = useState<SandboxDialect>(dialect)
  const [code, setCode] = useState(starter ?? STARTER[dialect])
  const [log, setLog] = useState('Press Run. Parsing happens in the browser; tick FastAPI to execute real Qiskit on the backend.')
  const [result, setResult] = useState<SimulateResult | null>(null)
  const [circuit, setCircuit] = useState<Circuit>({ qubits: 2, gates: [] })
  const [running, setRunning] = useState(false)
  const [engine, setEngine] = useState<'local' | 'qiskit'>('local')

  const bloch = useMemo(
    () => result ? blochFromStatevector(result.finalStatevector, 0, circuit.qubits) : { x: 0, y: 0, z: 1 },
    [result, circuit.qubits]
  )
  const probs = result ? Object.entries(result.probabilities).filter(([, p]) => p > 0.001) : []

  const switchLang = (d: SandboxDialect) => {
    setLang(d)
    setCode(STARTER[d])
    setResult(null)
    setCircuit({ qubits: 2, gates: [] })
    playPopDown()
  }

  const run = async () => {
    setRunning(true)
    try {
      const parsed = parseQuantumPython(code, lang)
      setCircuit(parsed.circuit)

      if (engine === 'qiskit') {
        try {
          const res = await fetch(`${API}/sandbox/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, dialect: lang }),
          })
          const data = await res.json().catch(() => null)
          if (res.ok && data) {
            const local = simulateLocal(parsed.circuit)
            setResult(local)
            setLog(
              [
                data.ok ? 'Backend executed the snippet.' : 'Backend rejected the snippet.',
                data.stdout || '',
                data.stderr || '',
                '',
                ...parsed.notes,
              ].filter(Boolean).join('\n')
            )
            playSuccess()
            return
          }
        } catch {
          setLog('Backend unreachable — falling back to the in-browser simulator.')
        }
      }

      const local = simulateLocal(parsed.circuit)
      setResult(local)
      setLog([
        `Engine: in-browser statevector (${lang})`,
        ...parsed.notes,
        '',
        'Probabilities:',
        ...Object.entries(local.probabilities).filter(([, p]) => p > 0.001).map(([s, p]) => `  |${s}⟩  ${(p * 100).toFixed(1)}%`),
      ].join('\n'))
      playSuccess()
    } catch (e) {
      setLog(e instanceof Error ? e.message : 'Could not run this snippet.')
      playError()
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="sandbox">
      <div className="sandbox-toolbar">
        <div className="hw-tabs" style={{ marginBottom: 0 }}>
          {(['qiskit', 'cirq', 'pennylane'] as SandboxDialect[]).map(d => (
            <button key={d} className={lang === d ? 'active' : ''} onClick={() => switchLang(d)}>{d}</button>
          ))}
        </div>
        <label className="sandbox-engine">
          <input type="checkbox" checked={engine === 'qiskit'} onChange={e => setEngine(e.target.checked ? 'qiskit' : 'local')} />
          FastAPI / Qiskit
        </label>
        <button className="pill-btn small" onClick={run} disabled={running}>
          <Play size={13} /> {running ? 'Running…' : 'Run'}
        </button>
      </div>
      <div className="sandbox-recipes">
        <p className="muted-label">FUNCTIONS · LOAD SAFE SNIPPET</p>
        <div className="sandbox-recipe-row">
          {RECIPES[lang].map(r => (
            <button
              key={r.id}
              type="button"
              className="sandbox-recipe"
              title={r.hint}
              onClick={() => { setCode(r.code); setResult(null); playPopDown() }}
            >
              <code>{r.fn}</code>
              <small>{r.hint}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="sandbox-grid">
        <textarea
          className="sandbox-editor"
          spellCheck={false}
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <div className="sandbox-out">
          <p className="muted-label">PARSED CIRCUIT</p>
          <MiniCircuit circuit={circuit} />
          <p className="muted-label" style={{ marginTop: 14 }}>OUTPUT</p>
          <pre>{log}</pre>
          {result && (
            <>
              <p className="muted-label" style={{ marginTop: 14 }}>LIVE STATE</p>
              <BlochSphere coords={bloch} animate size={200} />
              <div className="educate-probs">
                {probs.map(([s, p]) => (
                  <div key={s} className="educate-prob-row">
                    <span>|{s}⟩</span>
                    <div className="educate-prob-bar"><i style={{ width: `${p * 100}%` }} /></div>
                    <strong>{(p * 100).toFixed(0)}%</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="sandbox-foot">
        Teaching subset: H, X, Y, Z, CX/CNOT, measure. Sources:{' '}
        <a href="https://quantum.cloud.ibm.com/docs/guides/simulate-with-qiskit-aer" target="_blank" rel="noreferrer">IBM Aer</a>
        {' · '}
        <a href="https://quantumai.google/cirq/start/basics" target="_blank" rel="noreferrer">Cirq basics</a>
        {' · '}
        <a href="https://pennylane.ai" target="_blank" rel="noreferrer">PennyLane</a>
      </p>
    </div>
  )
}
