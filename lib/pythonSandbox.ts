import type { Circuit, GateOp, GateType } from '@/lib/api'

export type SandboxDialect = 'qiskit' | 'cirq' | 'pennylane'

export interface ParseResult {
  circuit: Circuit
  notes: string[]
  dialect: SandboxDialect
}

const GATE_MAP: Record<string, GateType> = {
  h: 'H', hadamard: 'H',
  x: 'X', paulix: 'X',
  y: 'Y', pauliy: 'Y',
  z: 'Z', pauliz: 'Z',
  cx: 'CNOT', cnot: 'CNOT',
  measure: 'MEASURE', measure_all: 'MEASURE',
}

function num(s: string) {
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

function addGate(gates: GateOp[], type: GateType, qubit: number, extra?: Partial<GateOp>) {
  const used = new Set(gates.filter(g => g.qubit === qubit || g.target === qubit).map(g => g.step))
  let step = 0
  while (used.has(step)) step++
  gates.push({ type, qubit, step, ...extra })
}

export function detectDialect(code: string): SandboxDialect {
  const c = code.toLowerCase()
  if (c.includes('pennylane') || c.includes('qml.')) return 'pennylane'
  if (c.includes('cirq')) return 'cirq'
  return 'qiskit'
}

export function parseQuantumPython(code: string, dialect?: SandboxDialect): ParseResult {
  const notes: string[] = []
  const detected = dialect ?? detectDialect(code)
  const gates: GateOp[] = []
  let qubits = 1

  const bumpQubits = (i: number) => { qubits = Math.max(qubits, i + 1) }

  if (detected === 'qiskit') {
    const qc = code.match(/QuantumCircuit\s*\(\s*(\d+)/)
    if (qc) qubits = Math.max(qubits, num(qc[1]))

    for (const m of code.matchAll(/\.h\s*\(\s*(\d+)\s*\)/g)) { bumpQubits(num(m[1])); addGate(gates, 'H', num(m[1])) }
    for (const m of code.matchAll(/\.x\s*\(\s*(\d+)\s*\)/g)) { bumpQubits(num(m[1])); addGate(gates, 'X', num(m[1])) }
    for (const m of code.matchAll(/\.y\s*\(\s*(\d+)\s*\)/g)) { bumpQubits(num(m[1])); addGate(gates, 'Y', num(m[1])) }
    for (const m of code.matchAll(/\.z\s*\(\s*(\d+)\s*\)/g)) { bumpQubits(num(m[1])); addGate(gates, 'Z', num(m[1])) }
    for (const m of code.matchAll(/\.c(?:x|not)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi)) {
      bumpQubits(Math.max(num(m[1]), num(m[2])))
      addGate(gates, 'CNOT', num(m[1]), { target: num(m[2]) })
    }
    if (/\.measure(?:_all)?\s*\(/.test(code)) {
      notes.push('Measurement recorded on the timeline (statevector sim stays unitary).')
      for (let q = 0; q < qubits; q++) addGate(gates, 'MEASURE', q)
    }
  }

  if (detected === 'cirq') {
    const range = code.match(/LineQubit\.range\s*\(\s*(\d+)\s*\)/)
    if (range) qubits = Math.max(qubits, num(range[1]))
    for (const m of code.matchAll(/cirq\.H\s*\(\s*(?:q|q0|qubits?\[)?(\d+)/gi)) { bumpQubits(num(m[1])); addGate(gates, 'H', num(m[1])) }
    for (const m of code.matchAll(/cirq\.X\s*\(\s*(?:q|q0|qubits?\[)?(\d+)/gi)) { bumpQubits(num(m[1])); addGate(gates, 'X', num(m[1])) }
    for (const m of code.matchAll(/cirq\.Y\s*\(\s*(?:q|q0|qubits?\[)?(\d+)/gi)) { bumpQubits(num(m[1])); addGate(gates, 'Y', num(m[1])) }
    for (const m of code.matchAll(/cirq\.Z\s*\(\s*(?:q|q0|qubits?\[)?(\d+)/gi)) { bumpQubits(num(m[1])); addGate(gates, 'Z', num(m[1])) }
    for (const m of code.matchAll(/cirq\.CNOT\s*\(\s*(?:q)?(\d+)\s*,\s*(?:q)?(\d+)/gi)) {
      bumpQubits(Math.max(num(m[1]), num(m[2])))
      addGate(gates, 'CNOT', num(m[1]), { target: num(m[2]) })
    }
    // q0 / q1 variable style: cirq.H(q0)
    if (/cirq\.H\s*\(\s*q0\s*\)/i.test(code)) { bumpQubits(0); addGate(gates, 'H', 0) }
    if (/cirq\.X\s*\(\s*q0\s*\)/i.test(code)) { bumpQubits(0); addGate(gates, 'X', 0) }
    if (/cirq\.CNOT\s*\(\s*q0\s*,\s*q1\s*\)/i.test(code)) { bumpQubits(1); addGate(gates, 'CNOT', 0, { target: 1 }) }
    if (/cirq\.measure/.test(code)) notes.push('Cirq measure keys are ignored; probabilities come from the statevector.')
  }

  if (detected === 'pennylane') {
    const wiresDev = code.match(/wires\s*=\s*(\d+)/)
    if (wiresDev) qubits = Math.max(qubits, num(wiresDev[1]))
    for (const m of code.matchAll(/qml\.(?:Hadamard|H)\s*\(\s*(?:wires\s*=\s*)?(\d+)/g)) { bumpQubits(num(m[1])); addGate(gates, 'H', num(m[1])) }
    for (const m of code.matchAll(/qml\.(?:PauliX|X)\s*\(\s*(?:wires\s*=\s*)?(\d+)/g)) { bumpQubits(num(m[1])); addGate(gates, 'X', num(m[1])) }
    for (const m of code.matchAll(/qml\.(?:PauliY|Y)\s*\(\s*(?:wires\s*=\s*)?(\d+)/g)) { bumpQubits(num(m[1])); addGate(gates, 'Y', num(m[1])) }
    for (const m of code.matchAll(/qml\.(?:PauliZ|Z)\s*\(\s*(?:wires\s*=\s*)?(\d+)/g)) { bumpQubits(num(m[1])); addGate(gates, 'Z', num(m[1])) }
    for (const m of code.matchAll(/qml\.CNOT\s*\(\s*wires\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/g)) {
      bumpQubits(Math.max(num(m[1]), num(m[2])))
      addGate(gates, 'CNOT', num(m[1]), { target: num(m[2]) })
    }
  }

  // Generic fallbacks
  for (const m of code.matchAll(/\b(H|X|Y|Z|CNOT|MEASURE)\b.*?qubit\s*(\d+)/gi)) {
    const t = GATE_MAP[m[1].toLowerCase()]
    if (t) { bumpQubits(num(m[2])); addGate(gates, t, num(m[2])) }
  }

  if (gates.length === 0) {
    notes.push('No supported gates found. Try qc.h(0), cirq.H(q0), or qml.Hadamard(wires=0).')
  } else {
    notes.push(`Parsed ${gates.length} gate(s) as ${detected}.`)
  }

  return { circuit: { qubits: Math.min(6, Math.max(1, qubits)), gates }, notes, dialect: detected }
}

export const STARTER: Record<SandboxDialect, string> = {
  qiskit: `from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

# Run in the QubitLab sandbox (Aer when the backend is up)
print(qc)
`,
  cirq: `import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(
    cirq.H(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key='b'),
)
print(circuit)
`,
  pennylane: `import pennylane as qml

dev = qml.device('default.qubit', wires=2)

@qml.qnode(dev)
def bell():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.probs(wires=[0, 1])

print(bell())
`,
}

export const RECIPES: Record<SandboxDialect, { id: string; fn: string; hint: string; code: string }[]> = {
  qiskit: [
    {
      id: 'h',
      fn: 'qc.h(0)',
      hint: 'Hadamard — equal superposition',
      code: `from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.h(0)
qc.measure_all()
print(qc)
`,
    },
    {
      id: 'x',
      fn: 'qc.x(0)',
      hint: 'Pauli-X — bit flip |0⟩→|1⟩',
      code: `from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.x(0)
qc.measure_all()
print(qc)
`,
    },
    {
      id: 'cx',
      fn: 'qc.cx(0, 1)',
      hint: 'CNOT — Bell pair with H first',
      code: `from qiskit import QuantumCircuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()
print(qc)
`,
    },
    {
      id: 'z',
      fn: 'qc.z(0)',
      hint: 'Phase flip — visible after H',
      code: `from qiskit import QuantumCircuit
qc = QuantumCircuit(1)
qc.h(0)
qc.z(0)
qc.measure_all()
print(qc)
`,
    },
  ],
  cirq: [
    {
      id: 'h',
      fn: 'cirq.H(q0)',
      hint: 'Hadamard on LineQubit 0',
      code: `import cirq
q0 = cirq.LineQubit(0)
circuit = cirq.Circuit(cirq.H(q0), cirq.measure(q0, key='m'))
print(circuit)
`,
    },
    {
      id: 'cnot',
      fn: 'cirq.CNOT(q0, q1)',
      hint: 'Entangle two line qubits',
      code: `import cirq
q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key='b'))
print(circuit)
`,
    },
    {
      id: 'x',
      fn: 'cirq.X(q0)',
      hint: 'Bit flip',
      code: `import cirq
q0 = cirq.LineQubit(0)
circuit = cirq.Circuit(cirq.X(q0), cirq.measure(q0, key='m'))
print(circuit)
`,
    },
  ],
  pennylane: [
    {
      id: 'h',
      fn: 'qml.Hadamard(0)',
      hint: 'QNode returns probs',
      code: `import pennylane as qml
dev = qml.device('default.qubit', wires=1)
@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    return qml.probs(wires=0)
print(circuit())
`,
    },
    {
      id: 'cnot',
      fn: 'qml.CNOT([0,1])',
      hint: 'Bell state probabilities',
      code: `import pennylane as qml
dev = qml.device('default.qubit', wires=2)
@qml.qnode(dev)
def bell():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.probs(wires=[0, 1])
print(bell())
`,
    },
    {
      id: 'x',
      fn: 'qml.PauliX(0)',
      hint: 'Flip the computational basis',
      code: `import pennylane as qml
dev = qml.device('default.qubit', wires=1)
@qml.qnode(dev)
def circuit():
    qml.PauliX(wires=0)
    return qml.probs(wires=0)
print(circuit())
`,
    },
  ],
}

