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
        title: 'The Classical Computing Paradigm',
        body: 'Every device you use today — laptops, smartphones, cloud servers — is built from billions of transistors. A transistor acts like a light switch: either ON (1) or OFF (0). These binary digits are called bits. Modern CPUs pack over 100 billion transistors onto a chip smaller than your fingernail. For decades, we relied on Moore\'s Law — transistors would keep shrinking, doubling performance every two years. But we\'re hitting a physical wall: transistors are now just a few atoms wide, and quantum effects like electron tunneling cause errors. Classical computing is extraordinary, yet some problems remain fundamentally intractable — factoring huge numbers, simulating molecules, optimizing complex systems. This is where quantum computing enters.',
        terminology: [
          { term: 'Bit', def: 'The smallest unit of classical information — exactly 0 or 1.' },
          { term: 'Transistor', def: 'A semiconductor switch. Billions make up a CPU.' },
          { term: "Moore's Law", def: 'Observation that transistor density doubles ~every 2 years — now slowing.' },
          { term: 'Computational complexity', def: 'How processing time scales with problem size. Some problems grow exponentially.' },
        ],
      },
      {
        type: 'video' as const,
        title: 'IBM Research: What Is Quantum Computing?',
        body: 'IBM scientists explain how quantum computers exploit quantum mechanical phenomena to tackle problems no classical computer can solve efficiently.',
        videoId: 'EK8Z0mOoSSE',
      },
      {
        type: 'read' as const,
        title: 'Enter the Qubit',
        body: 'A qubit (quantum bit) is the fundamental unit of quantum information. Unlike a classical bit, a qubit can exist in a superposition of |0⟩ and |1⟩ simultaneously. We write a general qubit state as:\n\n|ψ⟩ = α|0⟩ + β|1⟩\n\nwhere α and β are complex numbers called amplitudes. The vertical bars and angle bracket (|⟩) are Dirac notation — the standard language of quantum mechanics. When you measure this qubit, you get outcome |0⟩ with probability |α|² and outcome |1⟩ with probability |β|². The constraint is |α|² + |β|² = 1 — probabilities must sum to 1.\n\nThe state lives on a 2D complex Hilbert space, which we can visualise as the surface of a sphere — the Bloch sphere.',
        terminology: [
          { term: 'Qubit', def: 'Quantum bit — the fundamental unit of quantum information, existing as a superposition of |0⟩ and |1⟩.' },
          { term: 'State vector |ψ⟩', def: 'Mathematical representation of a quantum system in Dirac notation.' },
          { term: 'Amplitude (α, β)', def: 'Complex numbers whose squared magnitudes give measurement probabilities.' },
          { term: 'Born rule', def: 'The probability of measuring a state is the squared magnitude of its amplitude.' },
          { term: 'Hilbert space', def: 'The abstract mathematical space in which quantum state vectors live.' },
          { term: 'Bloch sphere', def: 'A 3D geometric representation of a single-qubit state on the surface of a unit sphere.' },
          { term: 'Decoherence', def: 'When a qubit loses its quantum properties due to interaction with the environment.' },
          { term: 'Superposition', def: 'A quantum state that is a linear combination of basis states.' },
        ],
      },
      {
        type: 'experiment' as const,
        title: 'Meet the Qubit — Your First Gate',
        body: 'A fresh qubit starts in the ground state |0⟩, which points to the north pole of the Bloch sphere (z = +1). Apply the Hadamard gate (H) to create an equal superposition — the state vector rotates to the equator. Watch the Bloch sphere update live as you place the gate.',
        circuit: { qubits: 1, gates: [] as { type: string; qubit: number; step: number }[] },
        task: 'Add an H gate on q0 and press Run — observe the Bloch sphere vector move to the equator.',
        expectedGates: [{ type: 'H', qubit: 0, step: 0 }],
      },
      {
        type: 'read' as const,
        title: 'Quantum Advantage — What Can Quantum Computers Solve?',
        body: 'Quantum computers are not universally faster — they excel at specific problem classes:\n\n• Cryptography: Shor\'s algorithm factors large integers exponentially faster than any known classical method, threatening RSA encryption.\n• Search: Grover\'s algorithm searches an unsorted database in O(√N) time vs classical O(N).\n• Quantum simulation: Richard Feynman\'s original insight — simulate quantum systems (molecules, materials) using a quantum computer. This unlocks drug discovery, battery design, and materials science.\n• Optimisation: Quantum annealing and QAOA tackle combinatorial problems in logistics, finance, and AI training.\n\nModern machines (NISQ — Noisy Intermediate-Scale Quantum) have 50–1000+ qubits but still face noise challenges. Fault-tolerant quantum computers with millions of logical qubits remain the long-term goal.',
        terminology: [
          { term: "Shor's algorithm", def: 'Quantum algorithm that factors integers in polynomial time — exponentially faster than classical.' },
          { term: "Grover's algorithm", def: 'Quantum search algorithm with O(√N) complexity vs classical O(N).' },
          { term: 'NISQ', def: 'Noisy Intermediate-Scale Quantum — current era of 50–1000 qubit devices with significant noise.' },
          { term: 'Quantum advantage', def: 'When a quantum computer solves a problem faster than any classical computer.' },
          { term: 'QAOA', def: 'Quantum Approximate Optimisation Algorithm — hybrid classical-quantum optimisation method.' },
        ],
      },
      {
        type: 'video' as const,
        title: 'Microsoft: How Does a Quantum Computer Work?',
        body: 'A clear visual explanation of qubits, superposition, and entanglement with beautiful 3D animations — perfect for building intuition before diving into the math.',
        videoId: 'g_IaVepNDT4',
      },
      {
        type: 'quiz' as const,
        title: 'Check Yourself: The Qubit',
        body: 'Test your understanding of quantum computing fundamentals.',
        question: 'A qubit is in state |ψ⟩ = (3/5)|0⟩ + (4/5)|1⟩. What is the probability of measuring |1⟩?',
        options: ['16%', '64%', '80%', '50%'],
        correct: 1,
        explanation: 'By the Born rule, P(|1⟩) = |4/5|² = 16/25 = 64%. The amplitude β = 4/5, and you square it to get probability.',
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
        title: 'Waves, Not Just Particles — The Physics of Superposition',
        body: 'Quantum mechanics was born from a crisis: light behaved like a wave in some experiments and like a particle in others. The double-slit experiment showed that even electrons — particles with mass — create interference patterns when not observed, as if they travel through both slits at once.\n\nThis wave-particle duality is the root of superposition. A quantum system exists as a wave — described by a wavefunction ψ(x,t) — until measurement forces it to be particle-like, collapsing to a definite state.\n\nSuperposition is not ambiguity or ignorance. It is a genuine physical reality: the quantum system is in multiple states at once, each with a definite amplitude. When those amplitudes interfere constructively (add up) or destructively (cancel), we get quantum effects with no classical analogue.',
        terminology: [
          { term: 'Wavefunction ψ', def: 'Mathematical description of a quantum state as a function of position and time.' },
          { term: 'Wave-particle duality', def: 'Quantum objects exhibit both wave and particle properties depending on how they are observed.' },
          { term: 'Double-slit experiment', def: 'Demonstrates interference of quantum particles — showing superposition in action.' },
          { term: 'Interference', def: 'Wave amplitudes add (constructive) or cancel (destructive) — the engine of quantum algorithms.' },
          { term: 'Superposition', def: 'A quantum state that is a simultaneous linear combination of basis states, each with a complex amplitude.' },
        ],
      },
      {
        type: 'video' as const,
        title: 'MinutePhysics: Schrödinger\'s Cat',
        body: "Schrödinger's famous thought experiment illustrates the paradox of superposition at the macroscopic scale — and why measuring quantum systems is so strange.",
        videoId: 'IOYyCHGWJq4',
      },
      {
        type: 'read' as const,
        title: 'The Mathematics of Superposition',
        body: 'A single qubit state is written:\n\n|ψ⟩ = α|0⟩ + β|1⟩\n\nwhere α, β ∈ ℂ (complex numbers) and |α|² + |β|² = 1 (normalisation).\n\nOn the Bloch sphere, we parameterise with two angles:\n\n|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩\n\n• θ (theta) — polar angle from the north pole. θ = 0 → |0⟩, θ = π → |1⟩, θ = π/2 → equatorial superposition.\n• φ (phi) — azimuthal angle around the Z-axis, the relative phase.\n\nEqual superposition (|+⟩ state): α = β = 1/√2, θ = π/2, φ = 0. Probability of |0⟩ = |1/√2|² = 50%, same for |1⟩.',
        terminology: [
          { term: 'Normalisation', def: '|α|² + |β|² = 1 — ensures probabilities sum to 100%.' },
          { term: 'Polar angle θ', def: 'Bloch sphere latitude. θ = π/2 is the equator (equal superposition).' },
          { term: 'Azimuthal angle φ', def: 'Bloch sphere longitude — encodes the relative phase between |0⟩ and |1⟩.' },
          { term: 'Relative phase', def: 'The phase difference e^(iφ) between amplitude components. Not visible in measurement probabilities alone, but critical for interference.' },
          { term: '|+⟩ state', def: '(|0⟩ + |1⟩)/√2 — the equal superposition state produced by applying H to |0⟩.' },
          { term: '|−⟩ state', def: '(|0⟩ − |1⟩)/√2 — equal superposition with opposite phase, produced by H|1⟩.' },
        ],
      },
      {
        type: 'read' as const,
        title: 'The Hadamard Gate — Manufacturing Superposition',
        body: 'The Hadamard gate H is the primary superposition-creating gate in quantum computing. Its unitary matrix is:\n\nH = (1/√2) [[1, 1], [1, −1]]\n\nAction:\n  H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩   (north pole → equator, φ=0)\n  H|1⟩ = (|0⟩ − |1⟩)/√2 = |−⟩   (south pole → equator, φ=π)\n\nH is its own inverse: H·H = I. Applying it twice returns to the original state — a key property exploited in Grover\'s search and Deutsch-Jozsa algorithms.\n\nOn the Bloch sphere, H is a 180° rotation around the diagonal X+Z axis.',
        terminology: [
          { term: 'Hadamard gate (H)', def: 'Single-qubit gate that creates equal superposition from a basis state.' },
          { term: 'Unitary matrix', def: 'A matrix U where U†U = I — preserves normalisation, ensures reversibility.' },
          { term: 'Self-inverse', def: 'H² = I: applying H twice returns to the original state.' },
          { term: 'Pauli-X gate', def: 'Quantum NOT gate: flips |0⟩↔|1⟩. A π rotation around the X-axis of the Bloch sphere.' },
          { term: 'Pauli-Z gate', def: 'Phase flip gate: maps |0⟩→|0⟩, |1⟩→−|1⟩. A π rotation around the Z-axis.' },
        ],
      },
      {
        type: 'experiment' as const,
        title: 'Build Superposition',
        body: 'Place H on q0 and run the circuit. Watch the Bloch vector rotate from the north pole (|0⟩) to the equator (|+⟩). The probability bars should show exactly 50% |0⟩ / 50% |1⟩ — Born rule in action.',
        circuit: { qubits: 1, gates: [] },
        task: 'Apply H gate on q0 and run. Confirm 50/50 probabilities.',
        expectedGates: [{ type: 'H', qubit: 0, step: 0 }],
      },
      {
        type: 'read' as const,
        title: 'Quantum Parallelism — Why Superposition Is Powerful',
        body: 'With n qubits in superposition, you can represent 2ⁿ states simultaneously:\n\nH⊗n|0...0⟩ = (1/√2ⁿ) Σ |x⟩   for all x ∈ {0,1}ⁿ\n\nFor n = 10 qubits: 1024 states at once. For n = 300 qubits: more states than atoms in the observable universe.\n\nBut this does not mean you can read out all 2ⁿ values — measurement collapses you to one. The art of quantum algorithm design is engineering interference so that wrong answers cancel out (destructive interference) and right answers amplify (constructive interference). This is the engine of Grover\'s search and Shor\'s algorithm.',
        terminology: [
          { term: 'Quantum parallelism', def: 'Evaluating a function on all 2ⁿ inputs simultaneously using superposition — but only one output is readable per measurement.' },
          { term: 'Tensor product ⊗', def: 'The mathematical operation for combining quantum systems: |a⟩⊗|b⟩ = |ab⟩.' },
          { term: 'Constructive interference', def: 'Amplitudes add together — correct answers become more probable.' },
          { term: 'Destructive interference', def: 'Amplitudes cancel — wrong answers become less probable. Used to discard incorrect solutions.' },
          { term: 'Oracle', def: 'A black-box quantum gate encoding a function f(x). Used in search and optimisation algorithms.' },
        ],
      },
      {
        type: 'quiz' as const,
        title: 'Check Yourself: Superposition & Born Rule',
        body: 'Test your understanding of superposition mathematics.',
        question: 'After applying the Hadamard gate to |0⟩, what state do we obtain?',
        options: ['|0⟩', '|1⟩', '(|0⟩ + |1⟩)/√2', '(|0⟩ − |1⟩)/√2'],
        correct: 2,
        explanation: 'H|0⟩ = (|0⟩ + |1⟩)/√2, the |+⟩ state. Each amplitude is 1/√2, giving P(|0⟩) = |1/√2|² = 1/2 = 50% and P(|1⟩) = 50%.',
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
        title: 'The Act of Observation Changes Everything',
        body: 'In classical physics, observing a system does not disturb it. You can read a thermometer without changing the temperature. In quantum mechanics, this is fundamentally impossible.\n\nThe Copenhagen interpretation — the most widely taught view — states that a quantum system exists as a superposition of all possible states described by the wavefunction ψ. The act of measurement causes the wavefunction to collapse instantaneously to a single definite outcome. Before measurement: the system has no definite value. After measurement: it does.\n\nThis is not a technological limitation — it is a fundamental feature of quantum mechanics, confirmed by thousands of experiments. The Born rule gives us the probability: if the state is |ψ⟩ = α|0⟩ + β|1⟩, then measuring in the Z-basis (computational basis) yields:\n  • |0⟩ with probability |α|²\n  • |1⟩ with probability |β|²',
        terminology: [
          { term: 'Copenhagen interpretation', def: 'The standard view: quantum systems exist as superpositions until measured, at which point the wavefunction collapses.' },
          { term: 'Wavefunction collapse', def: 'The sudden reduction of a quantum superposition to a single definite eigenstate upon measurement.' },
          { term: 'Measurement problem', def: 'The unresolved question of why and how quantum superpositions collapse during observation.' },
          { term: 'Observable', def: 'A physical quantity that can be measured, represented by a Hermitian operator.' },
          { term: 'Eigenstate', def: 'A state that returns a definite value (eigenvalue) when measured for a given observable.' },
          { term: 'Eigenvalue', def: 'The definite numerical result obtained when measuring an eigenstate.' },
        ],
      },
      {
        type: 'video' as const,
        title: 'Veritasium: Quantum Wavefunction Explained',
        body: 'Derek Muller\'s clear deep-dive into what a quantum wavefunction actually represents — and how the Born rule connects mathematics to experimental outcomes.',
        videoId: 'p7bzE1E5PMY',
      },
      {
        type: 'read' as const,
        title: 'Wave Function Collapse — Before and After',
        body: 'Before measurement, a qubit in state |ψ⟩ = α|0⟩ + β|1⟩ is genuinely in both states. The Bloch sphere vector can point anywhere on the sphere surface.\n\nAfter a Z-basis measurement:\n  • The qubit collapses to |0⟩ (north pole) or |1⟩ (south pole) — never in between.\n  • The outcome is random — but the probability is determined by the amplitudes.\n  • The superposition is irreversibly destroyed.\n\nMeasurement basis matters: measuring in the X-basis (using an H gate before measuring) collapses to |+⟩ or |−⟩ instead. Different measurement operators extract different information from the same state.\n\nKey insight: you cannot measure all the information in a qubit in one shot. A full state tomography requires measuring many identical copies of the same state in multiple bases.',
        terminology: [
          { term: 'Z-basis (computational basis)', def: 'Standard measurement basis: outcomes are |0⟩ and |1⟩. Corresponds to the Z-axis of the Bloch sphere.' },
          { term: 'X-basis', def: 'Alternative measurement basis: outcomes are |+⟩ and |−⟩. Apply H before measuring to convert.' },
          { term: 'Basis', def: 'A set of orthogonal states that span the qubit Hilbert space. Choice of basis determines what you measure.' },
          { term: 'Projection', def: 'Measurement projects the state onto one of the basis eigenstates and discards the rest.' },
          { term: 'State tomography', def: 'Reconstructing a quantum state by measuring many identical copies in multiple bases.' },
          { term: 'Irreversibility', def: 'Unlike quantum gates, measurement is not unitary — it is a one-way process that destroys information.' },
        ],
      },
      {
        type: 'experiment' as const,
        title: 'Measure Superposition',
        body: 'The circuit already has H on q0 creating |+⟩. Add a MEASURE gate at step 1. When you run it, the simulator will show ~50% probability for both |0⟩ and |1⟩ — the Born rule predicting equal collapse chances. The Bloch sphere will return to the north or south pole after measurement.',
        circuit: { qubits: 1, gates: [{ type: 'H', qubit: 0, step: 0 }] },
        task: 'Add MEASURE on q0 at step 1 and run — verify the probability distribution.',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'MEASURE', qubit: 0, step: 1 },
        ],
      },
      {
        type: 'read' as const,
        title: 'The No-Cloning Theorem',
        body: 'One of the most profound consequences of quantum measurement: you cannot perfectly copy an unknown quantum state.\n\nThe no-cloning theorem (Wootters & Zurek, 1982) proves that no unitary operation can copy an arbitrary unknown qubit:\n  ∄ U such that U(|ψ⟩|0⟩) = |ψ⟩|ψ⟩ for all |ψ⟩\n\nWhy? Because cloning would require knowing the state (measuring it), but measuring destroys the superposition.\n\nConsequences:\n  • Quantum error correction cannot simply copy qubits like classical error correction copies bits — it must use entanglement-based codes instead.\n  • Eavesdropping on quantum key distribution (BB84 protocol) is detectable — any intercept disturbs the state.\n  • Quantum communication requires quantum teleportation, not copying.\n\nThe no-cloning theorem is a feature, not a bug — it is the physical foundation of quantum cryptography\'s security guarantees.',
        terminology: [
          { term: 'No-cloning theorem', def: 'Proves it is impossible to create an identical copy of an arbitrary unknown quantum state.' },
          { term: 'Quantum error correction', def: 'Protecting quantum information from noise using entanglement rather than copying.' },
          { term: 'BB84 protocol', def: 'First quantum key distribution protocol — secure because eavesdropping disturbs the qubits.' },
          { term: 'Quantum teleportation', def: 'Transferring a quantum state using entanglement + classical communication. Does not violate no-cloning.' },
          { term: 'Quantum cryptography', def: 'Using quantum mechanics to guarantee provably secure communication.' },
        ],
      },
      {
        type: 'quiz' as const,
        title: 'Check Yourself: Measurement & Collapse',
        body: 'Test your understanding of quantum measurement.',
        question: 'A qubit in state |ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩ is measured in the Z-basis. What happens to the superposition?',
        options: [
          'It remains in superposition, just with updated amplitudes',
          'It collapses to |0⟩ or |1⟩ with 50% probability each, and the superposition is destroyed',
          'It splits into two separate qubits',
          'Nothing happens — measurement is non-destructive in quantum mechanics'
        ],
        correct: 1,
        explanation: 'Measurement in the Z-basis collapses the wavefunction irreversibly to |0⟩ or |1⟩. Each outcome has probability |1/√2|² = 50%. The original superposition is destroyed — this is the fundamental measurement postulate of quantum mechanics.',
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
