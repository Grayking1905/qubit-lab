import type { Circuit, ComplexNum, GateOp, SimulateResult } from '@/lib/api'

function mul(a: ComplexNum, b: ComplexNum): ComplexNum {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}

function add(a: ComplexNum, b: ComplexNum): ComplexNum {
  return { re: a.re + b.re, im: a.im + b.im }
}

function apply1(state: ComplexNum[], n: number, qubit: number, m00: ComplexNum, m01: ComplexNum, m10: ComplexNum, m11: ComplexNum) {
  const dim = 1 << n
  const bit = 1 << qubit
  const next = state.map(s => ({ ...s }))
  for (let i = 0; i < dim; i++) {
    if (i & bit) continue
    const j = i | bit
    const a = state[i]
    const b = state[j]
    next[i] = add(mul(m00, a), mul(m01, b))
    next[j] = add(mul(m10, a), mul(m11, b))
  }
  return next
}

function applyCnot(state: ComplexNum[], n: number, control: number, target: number) {
  const dim = 1 << n
  const cbit = 1 << control
  const tbit = 1 << target
  const next = state.map(s => ({ ...s }))
  for (let i = 0; i < dim; i++) {
    if (i & cbit) {
      const j = i ^ tbit
      if (j > i) {
        const tmp = next[i]
        next[i] = next[j]
        next[j] = tmp
      }
    }
  }
  return next
}

function applyToffoli(state: ComplexNum[], n: number, c1: number, c2: number, target: number) {
  const dim = 1 << n
  const b1 = 1 << c1
  const b2 = 1 << c2
  const tbit = 1 << target
  const next = state.map(s => ({ ...s }))
  for (let i = 0; i < dim; i++) {
    if ((i & b1) && (i & b2)) {
      const j = i ^ tbit
      if (j > i) {
        const tmp = next[i]
        next[i] = next[j]
        next[j] = tmp
      }
    }
  }
  return next
}

function applyGate(state: ComplexNum[], n: number, g: GateOp): ComplexNum[] {
  const I = { re: 1, im: 0 }
  const Z = { re: 0, im: 0 }
  const s = { re: 1 / Math.SQRT2, im: 0 }
  switch (g.type) {
    case 'H':
      return apply1(state, n, g.qubit, s, s, s, { re: -1 / Math.SQRT2, im: 0 })
    case 'X':
      return apply1(state, n, g.qubit, Z, I, I, Z)
    case 'Y':
      return apply1(state, n, g.qubit, Z, { re: 0, im: -1 }, { re: 0, im: 1 }, Z)
    case 'Z':
      return apply1(state, n, g.qubit, I, Z, Z, { re: -1, im: 0 })
    case 'CNOT':
      return applyCnot(state, n, g.qubit, g.target ?? 0)
    case 'TOFFOLI': {
      const [c1, c2] = g.controls ?? [g.qubit, 0]
      return applyToffoli(state, n, c1, c2, g.target ?? 0)
    }
    case 'MEASURE':
      return state
    default:
      return state
  }
}

export function simulateLocal(circuit: Circuit): SimulateResult {
  const n = circuit.qubits
  const dim = 1 << n
  let state: ComplexNum[] = Array.from({ length: dim }, (_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }))
  const ordered = [...circuit.gates].sort((a, b) => a.step - b.step || a.qubit - b.qubit)
  const steps = [...new Set(ordered.map(g => g.step))].sort((a, b) => a - b)
  const intermediate: ComplexNum[][] = []

  for (const step of steps) {
    for (const g of ordered.filter(g => g.step === step)) {
      state = applyGate(state, n, g)
    }
    intermediate.push(state.map(s => ({ ...s })))
  }

  const probabilities: Record<string, number> = {}
  for (let i = 0; i < dim; i++) {
    const p = state[i].re * state[i].re + state[i].im * state[i].im
    probabilities[i.toString(2).padStart(n, '0')] = p
  }

  return { finalStatevector: state, probabilities, intermediateStatevectors: intermediate }
}
