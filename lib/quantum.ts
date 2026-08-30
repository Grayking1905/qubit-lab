import type { ComplexNum } from '@/lib/api'

export interface BlochCoords {
  x: number
  y: number
  z: number
}

export function blochFromSingleQubit(alpha: ComplexNum, beta: ComplexNum): BlochCoords {
  const a = complex(alpha)
  const b = complex(beta)
  const norm = Math.sqrt(a.re * a.re + a.im * a.im + b.re * b.re + b.im * b.im) || 1
  const ar = a.re / norm
  const ai = a.im / norm
  const br = b.re / norm
  const bi = b.im / norm

  return {
    x: 2 * (ar * br + ai * bi),
    y: 2 * (ai * br - ar * bi),
    z: ar * ar + ai * ai - (br * br + bi * bi),
  }
}

export function blochFromStatevector(sv: ComplexNum[], qubit: number, totalQubits: number): BlochCoords {
  if (totalQubits === 1) {
    return blochFromSingleQubit(sv[0] ?? { re: 1, im: 0 }, sv[1] ?? { re: 0, im: 0 })
  }

  let p0 = 0
  let p1 = 0
  let re01 = 0
  let im01 = 0

  for (let i = 0; i < sv.length; i++) {
    const amp = complex(sv[i])
    const prob = amp.re * amp.re + amp.im * amp.im
    const bit = (i >> qubit) & 1
    if (bit === 0) p0 += prob
    else p1 += prob
  }

  for (let i = 0; i < sv.length; i++) {
    const j = i ^ (1 << qubit)
    if (j <= i) continue
    const a = complex(sv[i])
    const b = complex(sv[j])
    re01 += a.re * b.re + a.im * b.im
    im01 += a.im * b.re - a.re * b.im
  }

  const norm = Math.sqrt(p0 + p1) || 1
  const alpha: ComplexNum = { re: Math.sqrt(p0) / norm, im: 0 }
  const beta: ComplexNum = { re: re01 / norm, im: im01 / norm }
  return blochFromSingleQubit(alpha, beta)
}

function complex(c: ComplexNum | undefined): { re: number; im: number } {
  return { re: c?.re ?? 0, im: c?.im ?? 0 }
}

export const LESSONS = [
  {
    id: 'intro',
    title: 'What is quantum computing?',
    topic: 'Fundamentals',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'Beyond classical bits',
        body: 'Classical bits are either 0 or 1. Qubits can exist in a superposition — a blend of both states until measured.',
      },
      {
        type: 'experiment' as const,
        title: 'Meet the qubit',
        body: 'A fresh qubit starts in |0⟩. Apply Hadamard (H) to create equal superposition.',
        circuit: { qubits: 1, gates: [] as { type: string; qubit: number; step: number }[] },
        task: 'Add an H gate on q0',
        expectedGates: [{ type: 'H', qubit: 0, step: 0 }],
      },
      {
        type: 'read' as const,
        title: 'Superposition in numbers',
        body: 'After H on |0⟩, measurement gives ~50% |0⟩ and ~50% |1⟩. The Bloch sphere shows the state pointing along the X axis.',
      },
    ],
  },
  {
    id: 'superposition',
    title: 'Superposition',
    topic: 'Fundamentals',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'The H gate',
        body: 'The Hadamard gate creates superposition: H|0⟩ = (|0⟩ + |1⟩)/√2',
      },
      {
        type: 'experiment' as const,
        title: 'Build superposition',
        body: 'Place H on q0 and run the circuit. Watch the Bloch vector rotate to the equator.',
        circuit: { qubits: 1, gates: [] },
        task: 'Apply H gate',
        expectedGates: [{ type: 'H', qubit: 0, step: 0 }],
      },
    ],
  },
  {
    id: 'entanglement',
    title: 'Entanglement & Bell states',
    topic: 'Entanglement',
    level: 'INTERMEDIATE',
    steps: [
      {
        type: 'read' as const,
        title: 'Spooky correlations',
        body: 'Entangled qubits share a quantum state. Measuring one instantly affects the other — the famous Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2.',
      },
      {
        type: 'experiment' as const,
        title: 'Create a Bell state',
        body: 'Apply H on q0, then CNOT with q0 as control and q1 as target.',
        circuit: { qubits: 2, gates: [] },
        task: 'Build H → CNOT Bell circuit',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'CNOT', qubit: 0, target: 1, step: 1 },
        ],
      },
    ],
  },
  {
    id: 'measurement',
    title: 'Measurement',
    topic: 'Fundamentals',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'Collapse',
        body: 'Measurement destroys superposition. The qubit collapses to |0⟩ or |1⟩ with probabilities given by the state amplitudes.',
      },
      {
        type: 'experiment' as const,
        title: 'Measure superposition',
        body: 'Create superposition with H, then add a measurement gate.',
        circuit: { qubits: 1, gates: [{ type: 'H', qubit: 0, step: 0 }] },
        task: 'Add MEASURE on q0',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'MEASURE', qubit: 0, step: 1 },
        ],
      },
    ],
  },
  {
    id: 'hardware',
    title: 'How quantum computers work',
    topic: 'Hardware',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'A computer made of quantum physics',
        body: 'A quantum computer stores information in physical qubits — superconducting circuits (IBM, Google, Rigetti), trapped ions (IonQ, Quantinuum), photons (Xanadu), or spins. Gates are microwave, laser, or electric-field pulses. A laptop CPU is a room-temperature forest of transistors that snap bits to 0 or 1. A QPU is a fragile analog device, often at ~10 millikelvin, measured only at the end of a circuit.',
        sources: [
          { label: 'IBM Quantum — simulators and noise', url: 'https://quantum.cloud.ibm.com/docs/guides/simulate-with-qiskit-aer' },
        ],
      },
      {
        type: 'visual' as const,
        title: 'Inside a superconducting quantum computer',
        body: 'Click each temperature plate on the dilution fridge. Room-temperature racks look like any HPC node; the quantum chip lives at the bottom, colder than outer space. This is the real hardware model behind IBM and Google superconducting machines.',
        visual: 'machine' as const,
      },
      {
        type: 'visual' as const,
        title: 'The chip is a graph, not RAM',
        body: 'Click Q0–Q3 on the coupling map. Two-qubit gates only exist on edges. Compilers insert SWAP when your circuit asks for a pair that is not connected — that is a real hardware constraint Cirq GridQubit and Qiskit coupling maps encode.',
        visual: 'chip' as const,
      },
      {
        type: 'visual' as const,
        title: 'Classical PC vs quantum computer',
        body: 'Bits copy freely; qubits cannot (no-cloning). Logic on a PC is AND/OR/NOT. Logic on a QPU is reversible unitaries. Error on a PC is rare; on NISQ hardware decoherence is the default. Use the two cards to compare.',
        visual: 'compare' as const,
      },
      {
        type: 'visual' as const,
        title: 'Classical circuits vs quantum circuits',
        body: 'Toggle the two wiring diagrams. A classical AND gate throws information away (1 AND 0 = 0). A quantum circuit must stay reversible until measurement. H then CNOT is not “two bits XOR’d” — it creates a Bell pair you cannot peek at without collapse.',
        visual: 'circuits' as const,
      },
      {
        type: 'read' as const,
        title: 'The stack: chip → pulses → compiler',
        body: 'QPU at the bottom. Control electronics send calibrated pulses that implement H, X, CNOT. Compilers map your circuit onto the chip’s coupling map (which qubits can actually interact). Simulators such as Qiskit Aer skip the fridge and compute the linear algebra — that is what QubitLab uses when you press Run.',
      },
      {
        type: 'experiment' as const,
        title: 'A gate is a physical rotation',
        body: 'On hardware, X is a π microwave pulse around the X axis of a transmon. Place X on q0 and watch |0⟩ flip to |1⟩.',
        circuit: { qubits: 1, gates: [] },
        task: 'Apply an X gate on q0',
        expectedGates: [{ type: 'X', qubit: 0, step: 0 }],
      },
    ],
  },
  {
    id: 'programming',
    title: 'Quantum programming',
    topic: 'Programming',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'Circuits are the programs',
        body: 'Quantum software is usually a circuit: a list of gates on named qubits, then measurement. You write that circuit in Python (or a visual builder like this one), simulate it, then optionally send the same circuit to real hardware via a cloud API.',
      },
      {
        type: 'read' as const,
        title: 'The three Python ecosystems',
        body: 'Qiskit (IBM) is the usual first SDK: QuantumCircuit, Aer simulators, IBM Quantum hardware, and the largest tutorial corpus. Cirq (Google) is more explicit — Moments, LineQubit/GridQubit, hardware-aware scheduling for Sycamore-style chips. PennyLane (Xanadu) is the hybrid/ML library: QNodes, automatic differentiation, PyTorch/JAX, and 30+ backends via plugins. Sources: IBM Qiskit docs, Google Cirq, Xanadu PennyLane, Quantum Insider 2026 SDK survey.',
      },
      {
        type: 'read' as const,
        title: 'Same Bell state, three dialects',
        body: 'H on qubit 0 then CNOT 0→1 is a Bell pair in every library. Only the API names change. Build that circuit here, then compare it to the Python snippets in the next modules.',
        code: 'qc.h(0)        # Qiskit\nqc.cx(0, 1)\n\n# Cirq: cirq.H(q0), cirq.CNOT(q0, q1)\n# PennyLane: qml.Hadamard(0); qml.CNOT([0, 1])',
      },
      {
        type: 'experiment' as const,
        title: 'Program a Bell pair visually',
        body: 'This is the circuit every SDK tutorial starts with. H on q0, CNOT from q0 to q1. You should see ~50% |00⟩ and ~50% |11⟩.',
        circuit: { qubits: 2, gates: [] },
        task: 'Place H on q0, then CNOT (q0 → q1)',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'CNOT', qubit: 0, target: 1, step: 1 },
        ],
      },
      {
        type: 'sandbox' as const,
        title: 'Multi-library sandbox',
        body: 'Switch Qiskit, Cirq, and PennyLane tabs. The same Bell pair is three dialects — Run each one.',
        dialect: 'qiskit' as const,
      },
    ],
  },
  {
    id: 'qiskit',
    title: 'Qiskit (IBM)',
    topic: 'Python libraries',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'The default teaching library',
        body: 'Qiskit is IBM’s open-source stack: QuantumCircuit, transpile, then Aer or IBM Quantum hardware. Aer primitives (SamplerV2 / EstimatorV2, qiskit-aer ≥ 0.14) replace the old QuantumInstance path and can attach a noise_model for NISQ-realistic shots. QubitLab’s backend uses AerSimulator(method="statevector"). Docs: IBM Quantum Platform.',
        code: 'pip install qiskit qiskit-aer',
        sources: [
          { label: 'Exact and noisy simulation with Qiskit Aer', url: 'https://quantum.cloud.ibm.com/docs/guides/simulate-with-qiskit-aer' },
          { label: 'IBM Quantum documentation', url: 'https://docs.quantum.ibm.com' },
        ],
      },
      {
        type: 'read' as const,
        title: 'Hello, superposition',
        body: 'Create one qubit, apply Hadamard, measure. shots=1024 samples the probability distribution — about half 0 and half 1.',
        code: 'from qiskit import QuantumCircuit\nfrom qiskit_aer import AerSimulator\n\nqc = QuantumCircuit(1, 1)\nqc.h(0)\nqc.measure(0, 0)\n\nsim = AerSimulator()\nresult = sim.run(qc, shots=1024).result()\nprint(result.get_counts())  # ~ {\'0\': 512, \'1\': 512}',
      },
      {
        type: 'read' as const,
        title: 'Bell state in Qiskit',
        body: 'Two qubits, H then CX. measure_all() adds classical bits. This is the snippet you will see in almost every Qiskit course.',
        code: 'from qiskit import QuantumCircuit\nfrom qiskit_aer import AerSimulator\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()\n\nprint(AerSimulator().run(qc, shots=1024).result().get_counts())',
      },
      {
        type: 'experiment' as const,
        title: 'Match the Qiskit circuit',
        body: 'Reproduce qc.h(0) in the builder. Then run and compare to the 50/50 counts Qiskit would print.',
        circuit: { qubits: 1, gates: [] },
        task: 'Apply H on q0 (Qiskit: qc.h(0))',
        expectedGates: [{ type: 'H', qubit: 0, step: 0 }],
      },
      {
        type: 'sandbox' as const,
        title: 'Qiskit sandbox',
        body: 'Edit the Python and press Run. Click a function chip (qc.h, qc.cx, …) to load a safe pre-written snippet. The in-browser engine never calls os/subprocess. Tick FastAPI only if the local backend is up.',
        dialect: 'qiskit' as const,
      },
      {
        type: 'quiz' as const,
        title: 'Qiskit functions',
        body: 'qc.h, qc.cx, and AerSimulator are the three names you will type most often.',
        question: 'Which Qiskit call creates a Bell pair together with qc.h(0)?',
        options: ['qc.x(1)', 'qc.cx(0, 1)', 'qc.z(0)', 'qc.measure(0, 0) only'],
        correct: 1,
        explanation: 'qc.cx(0, 1) is CNOT with control 0 and target 1. After H on qubit 0 that is |Φ+⟩. IBM Quantum / Aer docs use this as the canonical two-qubit example.',
      },
    ],
  },
  {
    id: 'cirq',
    title: 'Cirq (Google)',
    topic: 'Python libraries',
    level: 'INTERMEDIATE',
    steps: [
      {
        type: 'read' as const,
        title: 'Circuits as moments',
        body: 'Cirq (Google Quantum AI) builds circuits from Moments — gates that fire together. Qubits are objects: NamedQubit, LineQubit, GridQubit. cirq.Simulator() is a NumPy statevector engine (~20 qubits). simulate() exposes the wavefunction for learning; run() only returns bitstrings, like hardware. Optional: qsimcirq for larger circuits, cirq_google.Sycamore as a Device that enforces adjacency.',
        code: 'pip install cirq',
        sources: [
          { label: 'Cirq basics — Google Quantum AI', url: 'https://quantumai.google/cirq/start/basics' },
          { label: 'Cirq simulation guide', url: 'https://quantumai.google/cirq/simulate/simulation' },
        ],
      },
      {
        type: 'read' as const,
        title: 'Superposition in Cirq',
        body: 'Create a LineQubit, append H, then measure. Cirq’s Simulator returns a Result with histogram counts, similar to Qiskit.',
        code: 'import cirq\n\nq0 = cirq.LineQubit(0)\ncircuit = cirq.Circuit(cirq.H(q0), cirq.measure(q0, key=\'m\'))\nresult = cirq.Simulator().run(circuit, repetitions=1024)\nprint(result.histogram(key=\'m\'))',
      },
      {
        type: 'read' as const,
        title: 'CNOT in Cirq',
        body: 'cirq.CNOT(control, target) is the two-qubit entangler. GridQubit(row, col) matches 2D chip layouts used in hardware papers.',
        code: 'import cirq\n\nq0, q1 = cirq.LineQubit.range(2)\ncircuit = cirq.Circuit(\n    cirq.H(q0),\n    cirq.CNOT(q0, q1),\n    cirq.measure(q0, q1, key=\'b\'),\n)\nprint(cirq.Simulator().run(circuit, repetitions=512))',
      },
      {
        type: 'experiment' as const,
        title: 'Build the Cirq Bell circuit',
        body: 'Same physics as cirq.H(q0) + cirq.CNOT(q0, q1). Place those gates here.',
        circuit: { qubits: 2, gates: [] },
        task: 'H on q0, then CNOT q0 → q1',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'CNOT', qubit: 0, target: 1, step: 1 },
        ],
      },
      {
        type: 'sandbox' as const,
        title: 'Cirq sandbox',
        body: 'cirq.H(q0) and cirq.CNOT(q0, q1) are parsed live. Change the circuit and Run.',
        dialect: 'cirq' as const,
      },
      {
        type: 'quiz' as const,
        title: 'Cirq functions',
        body: 'LineQubit, Circuit, Simulator.run vs simulate — pick the right tool.',
        question: 'In Cirq, which method returns the full statevector (useful for learning) instead of only bitstrings?',
        options: ['simulator.run(circuit)', 'simulator.simulate(circuit)', 'circuit.append(...)', 'cirq.measure(...)'],
        correct: 1,
        explanation: 'simulate() exposes the wavefunction. run() mimics hardware and only returns sampled bitstrings. Source: Google Quantum AI Cirq basics.',
      },
    ],
  },
  {
    id: 'pennylane',
    title: 'PennyLane (Xanadu)',
    topic: 'Python libraries',
    level: 'INTERMEDIATE',
    steps: [
      {
        type: 'read' as const,
        title: 'Quantum + machine learning',
        body: 'PennyLane (Xanadu) is hardware-agnostic and ML-first. Bind a circuit to a device with @qml.qnode. default.qubit is the Python statevector simulator for small circuits and backpropagation (JAX / PyTorch). lightning.qubit is the high-performance path. Plugins reach Qiskit, Cirq, Braket, and photonic hardware. PennyLane 0.44 (Jan 2026) added QRAM primitives and shorter gate aliases such as qml.H(0).',
        code: 'pip install pennylane',
        sources: [
          { label: 'PennyLane', url: 'https://pennylane.ai' },
          { label: 'default.qubit device', url: 'https://pennylane.ai/devices/default-qubit' },
          { label: 'PennyLane v0.44 release', url: 'https://pennylane.ai/blog/2026/01/pennylane-release-0.44/' },
        ],
      },
      {
        type: 'read' as const,
        title: 'A QNode is a circuit function',
        body: 'Decorate a Python function with @qml.qnode(dev). Inside, you write gates; the function returns expectation values or samples. Differentiable parameters let an optimizer tune the circuit.',
        code: 'import pennylane as qml\n\ndev = qml.device(\'default.qubit\', wires=1)\n\n@qml.qnode(dev)\ndef circuit():\n    qml.Hadamard(wires=0)\n    return qml.probs(wires=0)\n\nprint(circuit())  # [0.5, 0.5]',
      },
      {
        type: 'read' as const,
        title: 'Entanglement in PennyLane',
        body: 'qml.CNOT(wires=[0, 1]) plus Hadamard on wire 0 is again a Bell state. PennyLane can also target photonic devices (default.gaussian) — Xanadu’s hardware specialty.',
        code: 'import pennylane as qml\n\ndev = qml.device(\'default.qubit\', wires=2)\n\n@qml.qnode(dev)\ndef bell():\n    qml.Hadamard(wires=0)\n    qml.CNOT(wires=[0, 1])\n    return qml.probs(wires=[0, 1])\n\nprint(bell())  # ~ [0.5, 0, 0, 0.5]',
      },
      {
        type: 'experiment' as const,
        title: 'Hadamard as a QNode',
        body: 'qml.Hadamard(wires=0) is one H gate. Place it and watch probs become 50/50 — the same vector PennyLane returns.',
        circuit: { qubits: 1, gates: [] },
        task: 'Apply H on q0 (PennyLane: qml.Hadamard(0))',
        expectedGates: [{ type: 'H', qubit: 0, step: 0 }],
      },
      {
        type: 'sandbox' as const,
        title: 'PennyLane sandbox',
        body: 'Run a QNode-style snippet. qml.Hadamard and qml.CNOT(wires=[0,1]) drive the Bloch sphere and probability bars.',
        dialect: 'pennylane' as const,
      },
      {
        type: 'quiz' as const,
        title: 'PennyLane functions',
        body: 'QNodes, devices, and return types.',
        question: 'What does @qml.qnode(dev) do?',
        options: [
          'Compiles C++ for the fridge control stack',
          'Binds a Python function of gates to a device so you can call it like circuit()',
          'Creates a GridQubit lattice',
          'Replaces measurement with a classical AND gate',
        ],
        correct: 1,
        explanation: 'A QNode is a circuit-as-function. Call it to get probs, expval, or samples from default.qubit (or another plugin device). Source: pennylane.ai',
      },
    ],
  },
  {
    id: 'gates-code',
    title: 'Gates as Python',
    topic: 'Programming',
    level: 'BEGINNER',
    steps: [
      {
        type: 'read' as const,
        title: 'Pauli gates',
        body: 'X, Y, and Z are 180° rotations. X is a bit flip (|0⟩↔|1⟩). Z is a phase flip (invisible if you only measure in the Z basis). Y combines both. In code they are one-liners in every SDK.',
        code: 'qc.x(0); qc.y(0); qc.z(0)          # Qiskit\ncircuit.append(cirq.X(q0))          # Cirq\nqml.PauliX(wires=0)                 # PennyLane',
      },
      {
        type: 'experiment' as const,
        title: 'Bit flip',
        body: 'Start in |0⟩. An X gate is qc.x(0). The Bloch vector should point to |1⟩.',
        circuit: { qubits: 1, gates: [] },
        task: 'Place X on q0',
        expectedGates: [{ type: 'X', qubit: 0, step: 0 }],
      },
      {
        type: 'read' as const,
        title: 'Phase only shows up after H',
        body: 'Z on |0⟩ does nothing visible. H, then Z, then H is how you see a phase as a bit flip (the classic interferometer). That pattern appears in Deutsch–Jozsa and many oracles.',
        code: 'qc.h(0)\nqc.z(0)\nqc.h(0)\n# equivalent to qc.x(0) when you start in |0⟩',
      },
      {
        type: 'experiment' as const,
        title: 'See a Z phase',
        body: 'Build H → Z on q0. After H the vector sits on the equator; Z rotates it around the vertical axis.',
        circuit: { qubits: 1, gates: [] },
        task: 'Place H then Z on q0',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'Z', qubit: 0, step: 1 },
        ],
      },
    ],
  },
] as const

export const ALGORITHMS = [
  {
    id: 'bell',
    name: 'Bell State',
    description: 'Create maximal entanglement between two qubits',
    qubits: 2,
    gates: [
      { type: 'H', qubit: 0, step: 0 },
      { type: 'CNOT', qubit: 0, target: 1, step: 1 },
    ],
    expected: { '00': 0.5, '11': 0.5 },
  },
  {
    id: 'grover-2',
    name: "Grover's Search (2-qubit)",
    description: 'Find |11⟩ with quadratic speedup',
    qubits: 2,
    gates: [
      { type: 'H', qubit: 0, step: 0 },
      { type: 'H', qubit: 1, step: 0 },
      { type: 'Z', qubit: 1, step: 1 },
      { type: 'CNOT', qubit: 0, target: 1, step: 2 },
      { type: 'Z', qubit: 1, step: 3 },
      { type: 'H', qubit: 0, step: 4 },
      { type: 'H', qubit: 1, step: 4 },
      { type: 'Z', qubit: 0, step: 5 },
      { type: 'Z', qubit: 1, step: 5 },
      { type: 'CNOT', qubit: 0, target: 1, step: 6 },
      { type: 'Z', qubit: 0, step: 7 },
      { type: 'Z', qubit: 1, step: 7 },
      { type: 'H', qubit: 0, step: 8 },
      { type: 'H', qubit: 1, step: 8 },
    ],
    expected: { '11': 1.0 },
  },
  {
    id: 'teleport',
    name: 'Quantum Teleportation',
    description: 'Transfer a qubit state using entanglement',
    qubits: 3,
    gates: [
      { type: 'H', qubit: 1, step: 0 },
      { type: 'CNOT', qubit: 1, target: 2, step: 1 },
      { type: 'CNOT', qubit: 0, target: 1, step: 2 },
      { type: 'H', qubit: 0, step: 3 },
    ],
    expected: null,
  },
  {
    id: 'deutsch',
    name: 'Deutsch-Jozsa',
    description: 'Determine if a function is constant or balanced',
    qubits: 2,
    gates: [
      { type: 'X', qubit: 1, step: 0 },
      { type: 'H', qubit: 0, step: 1 },
      { type: 'H', qubit: 1, step: 1 },
      { type: 'CNOT', qubit: 0, target: 1, step: 2 },
      { type: 'H', qubit: 0, step: 3 },
    ],
    expected: { '00': 1.0 },
  },
] as const
