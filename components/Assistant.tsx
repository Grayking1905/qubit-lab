'use client'

import { useState } from 'react'
import { ArrowRight, Check, Sparkles, X } from 'lucide-react'
import { ApiError, aiChat, generateQuiz, type ChatMessage, type Circuit, type GateOp, type QuestionOut } from '@/lib/api'

function gateFootprint(g: GateOp): number {
  return Math.max(g.qubit, g.target ?? -1, ...(g.controls ?? [-1])) + 1
}

function applyAction(circuit: Circuit, action: { action: 'add_gate' | 'remove_gate'; gate: GateOp }): Circuit {
  if (action.action === 'add_gate') {
    const qubits = Math.max(circuit.qubits, gateFootprint(action.gate))
    return { qubits, gates: [...circuit.gates, action.gate] }
  }
  const idx = circuit.gates.findIndex(g => g.type === action.gate.type && g.qubit === action.gate.qubit && g.step === action.gate.step)
  if (idx === -1) return circuit
  return { ...circuit, gates: circuit.gates.filter((_, i) => i !== idx) }
}

export default function Assistant({ circuit, setCircuit, close }: { circuit: Circuit; setCircuit: (c: Circuit) => void; close: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [quiz, setQuiz] = useState<QuestionOut | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [quizSelected, setQuizSelected] = useState<number | null>(null)

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')
    setError('')
    const history = messages
    setMessages(m => [...m, { role: 'user', content }])
    setLoading(true)
    try {
      const res = await aiChat(circuit, content, history)
      if (res.type === 'explanation') {
        setMessages(m => [...m, { role: 'assistant', content: res.text }])
      } else {
        setCircuit(applyAction(circuit, res))
        const desc = res.action === 'add_gate'
          ? `Added a ${res.gate.type} gate on qubit ${res.gate.qubit}${res.gate.target !== undefined && res.gate.target !== null ? ` → ${res.gate.target}` : ''} at step ${res.gate.step + 1}.`
          : `Removed the ${res.gate.type} gate at step ${res.gate.step + 1}.`
        setMessages(m => [...m, { role: 'assistant', content: desc }])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the AI service.')
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = async () => {
    setQuizLoading(true)
    setQuizError('')
    setQuiz(null)
    setQuizSelected(null)
    try {
      setQuiz(await generateQuiz({ circuitJson: circuit }))
    } catch (err) {
      setQuizError(err instanceof ApiError ? err.message : 'Could not generate a quiz question.')
    } finally {
      setQuizLoading(false)
    }
  }

  return <aside className="assistant">
    <div className="assistant-head">
      <div><span className="ai-orb"><Sparkles size={15} /></span><strong>Qubit AI</strong><small>Your study copilot</small></div>
      <button className="icon-btn" onClick={close}><X size={16} /></button>
    </div>

    {quiz ? (
      <div className="quiz">
        <span className="tag orange">CUSTOM QUIZ · pending review</span>
        <h3>{quiz.questionText}</h3>
        {quiz.options.map((opt, i) => (
          <button key={i} onClick={() => setQuizSelected(i)} style={quizSelected !== null && i === quiz.correctOptionIndex ? { borderColor: 'var(--green)', color: 'var(--green)' } : quizSelected === i ? { borderColor: 'var(--orange)', color: 'var(--orange)' } : undefined}>
            {opt}{quizSelected !== null && i === quiz.correctOptionIndex && <Check size={14} />}
          </button>
        ))}
        {quizSelected !== null && <small>{quiz.explanation}</small>}
        <button className="link-btn" style={{ marginTop: 14 }} onClick={() => setQuiz(null)}>Back to chat</button>
      </div>
    ) : (
      <>
        <div style={{ maxHeight: 260, overflowY: 'auto', padding: '4px 15px' }}>
          {messages.length === 0 && (
            <div className="assistant-msg"><span className="ai-orb"><Sparkles size={13} /></span><p>Hey! Ask me about your circuit, or tell me what to add — e.g. &quot;add a CNOT between qubit 0 and 1&quot;.</p></div>
          )}
          {messages.map((m, i) => m.role === 'assistant'
            ? <div className="assistant-msg" key={i}><span className="ai-orb"><Sparkles size={13} /></span><p>{m.content}</p></div>
            : <div key={i} style={{ textAlign: 'right', margin: '10px 0' }}><p style={{ display: 'inline-block', background: 'var(--panel2)', borderRadius: 10, padding: '8px 12px', fontSize: 13, margin: 0 }}>{m.content}</p></div>
          )}
          {loading && <p className="muted" style={{ padding: '0 0 10px' }}>Thinking…</p>}
          {error && <p className="auth-error">{error}</p>}
          {quizError && <p className="auth-error">{quizError}</p>}
        </div>
        <div className="suggestions">
          <button onClick={startQuiz} disabled={quizLoading}>{quizLoading ? 'Generating…' : 'Quiz me on this circuit'}</button>
          <button onClick={() => send('What does this circuit do?')}>Explain this circuit</button>
          <button onClick={() => send('Give me a hint for what to try next.')}>Give me a hint</button>
        </div>
        <div className="assistant-input">
          <input placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
          <button className="pill-btn small" onClick={() => send()} disabled={loading}><ArrowRight size={15} /></button>
        </div>
      </>
    )}
  </aside>
}
