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
      // ── STEP 1: Theory — What is Entanglement ──
      {
        type: 'read' as const,
        title: 'What Is Quantum Entanglement?',
        body: 'Quantum entanglement is one of the most counterintuitive and experimentally verified phenomena in all of science. Two qubits are said to be entangled when their quantum states cannot be described independently of each other — no matter how far apart they are.\n\nClassically, two coins tossed separately are independent: knowing the result of coin A tells you nothing about coin B. But with entangled qubits, measuring qubit A instantly determines the state of qubit B — even if B is on the other side of the galaxy.\n\nEinstein famously called this "spooky action at a distance" and spent years trying to prove it was an illusion caused by hidden variables. John Bell designed a test in 1964 — Bell\'s inequality — that experiments have now conclusively violated, confirming entanglement is real, not a computational artifact.\n\nMathematically, a two-qubit state |ψ⟩ is entangled if it cannot be written as a tensor product:\n  |ψ⟩ ≠ |a⟩ ⊗ |b⟩\nfor any single-qubit states |a⟩ and |b⟩.\n\nThe simplest entangled state — the Bell state Φ⁺ — looks like:\n  |Φ⁺⟩ = (|00⟩ + |11⟩) / √2\nMeasuring qubit 0 as |0⟩ instantly collapses qubit 1 to |0⟩. Measuring as |1⟩ collapses qubit 1 to |1⟩. Always.',
        terminology: [
          { term: 'Entanglement', def: 'A quantum correlation between two or more qubits such that their states cannot be described independently.' },
          { term: 'Tensor product ⊗', def: 'Mathematical operation combining two quantum systems. Entangled states cannot be factored into a tensor product.' },
          { term: 'Separable state', def: 'A multi-qubit state that CAN be written as |a⟩⊗|b⟩ — not entangled, classically correlated at most.' },
          { term: 'Non-locality', def: 'The property that entangled qubits exhibit correlations that cannot be explained by local hidden variables.' },
          { term: 'EPR pair', def: 'A pair of maximally entangled qubits, named after Einstein-Podolsky-Rosen. Same as a Bell pair.' },
          { term: 'Bell pair', def: 'Any of the four maximally entangled two-qubit states (the Bell basis). Foundation of quantum communication.' },
        ],
      },
      // ── STEP 2: Video — Veritasium Entanglement ──
      {
        type: 'video' as const,
        title: 'Veritasium: Quantum Entanglement & Spooky Action at a Distance',
        body: 'Derek Muller\'s landmark explanation of quantum entanglement — covering the EPR paradox, Bell\'s theorem, and the experimental proof that "spooky action" is real. One of the best science communication videos ever made.',
        videoId: 'ZuvK-od647c',
      },
      // ── STEP 3: Theory — The 4 Bell States ──
      {
        type: 'read' as const,
        title: 'The Four Bell States — The Complete Basis',
        body: 'There are exactly four maximally entangled two-qubit states. Together they form the Bell basis — an orthonormal basis for the four-dimensional Hilbert space of two qubits. Every two-qubit state can be expressed as a superposition of Bell states.\n\n┌─────────────────────────────────────────────────────────────────────┐\n│  |Φ⁺⟩ = (|00⟩ + |11⟩) / √2   ← Correlated, no phase flip        │\n│  |Φ⁻⟩ = (|00⟩ − |11⟩) / √2   ← Correlated, relative phase π     │\n│  |Ψ⁺⟩ = (|01⟩ + |10⟩) / √2   ← Anti-correlated, no phase flip   │\n│  |Ψ⁻⟩ = (|01⟩ − |10⟩) / √2   ← Anti-correlated, phase π        │\n└─────────────────────────────────────────────────────────────────────┘\n\nCircuit recipes to create each Bell state from |00⟩:\n  Φ⁺:  H(q0) → CNOT(q0→q1)\n  Φ⁻:  H(q0) → CNOT(q0→q1) → Z(q0)\n  Ψ⁺:  H(q0) → CNOT(q0→q1) → X(q1)\n  Ψ⁻:  H(q0) → CNOT(q0→q1) → X(q1) → Z(q0)\n\nKey property: each Bell state is maximally entangled — reduced density matrix of either qubit alone is ρ = I/2 (maximally mixed). You cannot distinguish them by measuring only one qubit. You must measure in the Bell basis (using a reverse H → CNOT circuit) to tell them apart.',
        terminology: [
          { term: '|Φ⁺⟩ (Phi-plus)', def: '(|00⟩+|11⟩)/√2. Canonical Bell state. Both qubits always agree when measured in the same basis.' },
          { term: '|Φ⁻⟩ (Phi-minus)', def: '(|00⟩−|11⟩)/√2. Correlated but with a relative phase of π between |00⟩ and |11⟩.' },
          { term: '|Ψ⁺⟩ (Psi-plus)', def: '(|01⟩+|10⟩)/√2. Anti-correlated — measuring one as |0⟩ forces the other to |1⟩.' },
          { term: '|Ψ⁻⟩ (Psi-minus)', def: '(|01⟩−|10⟩)/√2. The singlet state. Unique: anti-symmetric under particle exchange. Used in quantum cryptography (E91).' },
          { term: 'Bell basis', def: 'The set {|Φ⁺⟩, |Φ⁻⟩, |Ψ⁺⟩, |Ψ⁻⟩} forms a complete orthonormal basis for 2-qubit Hilbert space.' },
          { term: 'Reduced density matrix', def: 'The state of one qubit when you ignore the other. For Bell states: ρ = I/2 (maximally mixed — completely unknown).' },
          { term: 'Bell measurement', def: 'Projecting onto the Bell basis. Implemented as reverse CNOT → H → measure. Used in teleportation.' },
        ],
      },
      // ── STEP 4: Quiz 1 ──
      {
        type: 'quiz' as const,
        title: 'Quiz 1: Bell State Identification',
        body: 'Test your knowledge of the four Bell states.',
        question: 'Which Bell state is produced by the circuit: H(q0) → CNOT(q0, q1)?',
        options: [
          '|Φ⁻⟩ = (|00⟩ − |11⟩)/√2',
          '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
          '|Ψ⁺⟩ = (|01⟩ + |10⟩)/√2',
          '|Ψ⁻⟩ = (|01⟩ − |10⟩)/√2',
        ],
        correct: 1,
        explanation: 'Starting from |00⟩: H on q0 creates (|0⟩+|1⟩)/√2 ⊗ |0⟩ = (|00⟩+|10⟩)/√2. Then CNOT flips q1 when q0=|1⟩: (|00⟩+|11⟩)/√2 = |Φ⁺⟩. This is the canonical Bell state — the first and most commonly used.',
      },
      // ── STEP 5: Experiment — Build Bell state ──
      {
        type: 'experiment' as const,
        title: 'Build the Φ⁺ Bell State',
        body: 'Create the canonical Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.\n\nStep-by-step:\n  1. Drag H onto q0 at step 0 — this puts q0 into superposition (|0⟩+|1⟩)/√2\n  2. Drag CNOT onto q0-q1 at step 1 — control is q0, target is q1\n\nAfter running, you should see 50% probability for |00⟩ and 50% for |11⟩. Note: |01⟩ and |10⟩ have 0% probability — this is the signature of entanglement.',
        circuit: { qubits: 2, gates: [] },
        task: 'Build H(q0) → CNOT(q0→q1) to create the Bell state Φ⁺',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'CNOT', qubit: 0, target: 1, step: 1 },
        ],
      },
      // ── STEP 6: 3D Entanglement Visualization ──
      {
        type: 'entanglement-viz' as const,
        title: 'Interactive Bell State Visualizer',
        body: 'Explore all four Bell states interactively. The two Bloch spheres represent Alice\'s qubit (q₀, orange) and Bob\'s qubit (q₁, blue). The glowing beam shows their quantum correlation.\n\nSelect different Bell states to see how the correlation beam changes (orange = correlated, pink = anti-correlated). Click "Measure q₀" to simulate wavefunction collapse — watch both qubits snap to definite states simultaneously!',
      },
      // ── STEP 7: Theory — EPR & Bell's Theorem ──
      {
        type: 'read' as const,
        title: "EPR Paradox & Bell's Inequality — Settling the Debate",
        body: 'In 1935, Einstein, Podolsky, and Rosen published a paper arguing that quantum mechanics was incomplete. Their argument: if measuring qubit A instantly determines qubit B (no matter the distance), then either:\n  (a) Quantum mechanics is non-local — violating special relativity, OR\n  (b) The qubits had predetermined values all along ("hidden variables")\n\nEinstein preferred (b) — "God does not play dice."\n\nJohn Bell\'s 1964 insight: we can test this mathematically. He derived an inequality that any "local hidden variable" theory must satisfy:\n  |E(a,b) − E(a,c)| + E(b,c) ≤ 1   (Bell\'s inequality)\n  or in CHSH form:  |S| = |E(a,b) − E(a,b\') + E(a\',b) + E(a\',b\')| ≤ 2\n\nQuantum mechanics predicts |S| ≤ 2√2 ≈ 2.828, exceeding the classical bound of 2.\n\nExperiments by Aspect (1982), then Hensen et al. (2015) in a loophole-free test, all found |S| ≈ 2.7 — definitively ruling out local hidden variables.\n\nConclusion: Nature is genuinely non-local. But this non-locality cannot be used to send signals faster than light — measuring qubit A gives a random result, and you need a classical channel to compare notes with the person holding qubit B.',
        terminology: [
          { term: 'EPR paradox', def: 'Einstein-Podolsky-Rosen 1935 thought experiment arguing quantum mechanics must be incomplete.' },
          { term: 'Local hidden variables', def: 'Hypothetical predetermined values carried by particles that would explain quantum correlations classically.' },
          { term: "Bell's inequality", def: 'A mathematical constraint that any local realistic theory must satisfy. Violated by quantum mechanics.' },
          { term: 'CHSH inequality', def: 'Clauser-Horne-Shimony-Holt form: |S| ≤ 2 classically, |S| ≤ 2√2 quantum mechanically.' },
          { term: 'Bell test experiment', def: 'Experimental measurement of correlations between entangled particles to test local realism.' },
          { term: 'Loophole-free Bell test', def: 'Bell test with all possible experimental loopholes (detection, locality) closed simultaneously. First performed in 2015.' },
          { term: 'No-signaling theorem', def: 'Quantum non-locality cannot transmit information faster than light — outcomes are still random.' },
        ],
      },
      // ── STEP 8: Video — PBS Space Time Bell's Theorem ──
      {
        type: 'video' as const,
        title: "PBS Space Time: Bell's Theorem — The Quantum Venn Diagram Paradox",
        body: 'A masterful visual explanation of how Bell\'s theorem works, why classical probability fails for entangled particles, and what the experimental violations actually mean for our understanding of reality.',
        videoId: 'zcqZHYo7ONs',
      },
      // ── STEP 9: Quiz 2 ──
      {
        type: 'quiz' as const,
        title: "Quiz 2: Bell's Inequality",
        body: "Test your understanding of the EPR paradox and Bell's theorem.",
        question: "The CHSH inequality violation (|S| > 2) in Bell test experiments proves that:",
        options: [
          'Quantum mechanics allows faster-than-light communication',
          'Local hidden variable theories cannot explain quantum correlations',
          'Entangled particles must have been in contact recently',
          'The measurement apparatus is always biased',
        ],
        correct: 1,
        explanation: "Bell tests show |S| ≈ 2.7, exceeding the classical limit of 2. This rules out any local realistic (hidden variable) explanation of quantum correlations. However, the no-signaling theorem guarantees this cannot be used for FTL communication — Bob's outcomes remain random until compared with Alice's via a classical channel.",
      },
      // ── STEP 10: Theory — Superdense Coding ──
      {
        type: 'read' as const,
        title: 'Superdense Coding — 2 Classical Bits Through 1 Qubit',
        body: 'Superdense coding (Bennett & Wiesner, 1992) is a quantum communication protocol that exploits entanglement to send 2 classical bits of information by transmitting only 1 qubit.\n\nPrerequisite: Alice and Bob share a Bell pair |Φ⁺⟩ in advance.\n\nProtocol:\n  Alice wants to send one of four 2-bit messages: 00, 01, 10, 11.\n  She applies a single-qubit gate to her qubit:\n    00 → do nothing   (state stays |Φ⁺⟩)\n    01 → X gate        (state becomes |Ψ⁺⟩)\n    10 → Z gate        (state becomes |Φ⁻⟩)\n    11 → iY gate       (state becomes |Ψ⁻⟩)\n  Alice sends her 1 qubit to Bob.\n  Bob performs a Bell measurement (CNOT → H → measure both qubits).\n  Bob reads 2 classical bits — perfectly recovering Alice\'s message.\n\nWhy it works: Alice\'s single-qubit gate changes which Bell state the pair is in. Bob\'s Bell measurement can distinguish all 4 Bell states, so he reads 2 bits of information.\n\nCapacity: 1 qubit + 1 pre-shared ebit (entangled bit) = 2 classical bits. This is the Holevo bound saturated — the maximum information transmissible per qubit.',
        terminology: [
          { term: 'Superdense coding', def: 'Protocol: send 2 classical bits by transmitting 1 qubit, using pre-shared entanglement.' },
          { term: 'Ebit', def: 'One unit of entanglement — one shared Bell pair. Resource consumed in superdense coding and teleportation.' },
          { term: 'Holevo bound', def: 'Maximum classical information extractable from a quantum system. Superdense coding saturates this bound with entanglement.' },
          { term: 'Quantum channel capacity', def: 'Maximum rate of reliable information transmission through a quantum channel.' },
        ],
      },
      // ── STEP 11: Quiz 3 ──
      {
        type: 'quiz' as const,
        title: 'Quiz 3: Superdense Coding',
        body: 'Test your understanding of the superdense coding protocol.',
        question: 'In superdense coding, Alice wants to send the message "10". Which gate does she apply to her qubit?',
        options: [
          'Hadamard (H)',
          'Pauli-X',
          'Pauli-Z',
          'No gate (identity)',
        ],
        correct: 2,
        explanation: 'In superdense coding: 00→I (nothing), 01→X, 10→Z, 11→iY. Applying Z to her qubit in state |Φ⁺⟩ creates |Φ⁻⟩ = (|00⟩−|11⟩)/√2. Bob then performs a Bell measurement that identifies |Φ⁻⟩ and recovers the message "10".',
      },
      // ── STEP 12: Theory — Quantum Teleportation ──
      {
        type: 'read' as const,
        title: 'Quantum Teleportation — Moving Quantum States',
        body: 'Quantum teleportation (Bennett et al., 1993) is a protocol to transfer an unknown quantum state from one location to another, using entanglement and classical communication — without physically moving the qubit.\n\nImportant: it does NOT transfer matter, it does NOT violate no-cloning, and it does NOT allow FTL communication.\n\nSetup: Alice holds qubit A (unknown state |ψ⟩ = α|0⟩+β|1⟩) and qubit 1 (her half of a Bell pair). Bob holds qubit 2 (his half of the Bell pair).\n\nProtocol:\n  1. Alice applies CNOT(A → qubit1), then H(A).\n  2. Alice measures both A and qubit1 (in computational basis). She gets 2 classical bits: mm.\n  3. Alice sends mm to Bob over a classical channel.\n  4. Bob applies corrections based on mm:\n     00 → nothing\n     01 → X on qubit2\n     10 → Z on qubit2\n     11 → XZ on qubit2\n  5. Bob\'s qubit2 is now in state α|0⟩+β|1⟩ — Alice\'s original state!\n\nAfter step 2, Alice\'s qubit A is destroyed (collapsed). The state is NOT copied — it\'s moved. This is consistent with no-cloning.\n\nApplications: Quantum networks, distributed quantum computing, quantum repeaters for long-distance quantum communication.',
        terminology: [
          { term: 'Quantum teleportation', def: 'Protocol to transfer an unknown qubit state using a Bell pair + 2 classical bits. State is destroyed at sender.' },
          { term: 'Classical correction', def: 'The 2-bit message Alice sends Bob. Without it, Bob cannot complete the teleportation — no FTL possible.' },
          { term: 'No-cloning consistency', def: 'Teleportation does not clone — Alice\'s original state is destroyed during Bell measurement.' },
          { term: 'Quantum network', def: 'A network of quantum nodes connected by quantum channels and entanglement distribution.' },
          { term: 'Quantum repeater', def: 'Device using entanglement swapping to extend quantum entanglement over long distances.' },
          { term: 'Entanglement swapping', def: 'Teleporting entanglement itself: makes two qubits entangled without them ever interacting directly.' },
        ],
      },
      // ── STEP 13: Video — Quantum Teleportation ──
      {
        type: 'video' as const,
        title: 'Looking Glass Universe: Quantum Teleportation Explained',
        body: 'Mithuna Yoganathan\'s crystal-clear explanation of quantum teleportation — what it actually is, how the protocol works step-by-step, and why it doesn\'t violate special relativity.',
        videoId: 'DxQK1WDYI_k',
      },
      // ── STEP 14: Experiment — Build Φ⁻ Bell state ──
      {
        type: 'experiment' as const,
        title: 'Build the Φ⁻ Bell State with Phase',
        body: 'Now build |Φ⁻⟩ = (|00⟩ − |11⟩)/√2 — the correlated Bell state with a relative phase.\n\nRecipe:\n  1. H on q0 at step 0\n  2. CNOT (q0→q1) at step 1\n  3. Z on q0 at step 2  ← this adds the relative phase π\n\nThe measurement probabilities look identical to Φ⁺ (50/50 between |00⟩ and |11⟩). The difference is in the phase — invisible to Z-basis measurement but detectable in the X-basis.',
        circuit: { qubits: 2, gates: [{ type: 'H', qubit: 0, step: 0 }] },
        task: 'Add CNOT(q0→q1) at step 1 and Z(q0) at step 2 to create |Φ⁻⟩',
        expectedGates: [
          { type: 'H', qubit: 0, step: 0 },
          { type: 'CNOT', qubit: 0, target: 1, step: 1 },
          { type: 'Z', qubit: 0, step: 2 },
        ],
      },
      // ── STEP 15: Quiz 4 ──
      {
        type: 'quiz' as const,
        title: 'Quiz 4: Quantum Teleportation Protocol',
        body: 'Test your understanding of the quantum teleportation protocol.',
        question: 'After Alice performs her Bell measurement in quantum teleportation, why must she send 2 classical bits to Bob?',
        options: [
          "To tell Bob the teleported qubit's value so he can recreate it",
          "To allow Bob to apply the correct unitary correction to his qubit",
          "To synchronize their clocks for the FTL signal",
          "So that the no-cloning theorem is satisfied before transmission",
        ],
        correct: 1,
        explanation: "Alice's Bell measurement collapses the joint system into one of four possible states, each requiring a different correction (I, X, Z, or XZ) on Bob's qubit. Without knowing which correction to apply, Bob's qubit is in a random mixed state — useless. The 2 classical bits tell him which of the four Pauli corrections to apply, completing the state transfer. This classical channel is why teleportation cannot exceed the speed of light.",
      },
      // ── STEP 16: Theory — Applications ──
      {
        type: 'read' as const,
        title: 'Real-World Applications of Entanglement',
        body: 'Quantum entanglement is not just a philosophical curiosity — it is the engine of an entirely new class of quantum technologies.\n\nQuantum Key Distribution (QKD):\n  The E91 protocol (Ekert, 1991) distributes Bell pairs between Alice and Bob. They measure in random bases and keep results where bases match. Any eavesdropper (Eve) disrupts the entanglement — detectable via Bell inequality violations on the shared data. Provably secure by the laws of physics, not computational hardness.\n\nQuantum Computing:\n  Entanglement is a key resource for quantum speedup. Shor\'s algorithm, Grover\'s search, and variational quantum eigensolvers all exploit multi-qubit entanglement. Without entanglement, quantum computers reduce to classical computers in polynomial time (Gottesman-Knill theorem).\n\nQuantum Networks & Repeaters:\n  The quantum internet will distribute entanglement over continental distances using quantum repeaters — chains of Bell measurements and entanglement swapping that extend coherence beyond the decoherence length of optical fibers.\n\nQuantum Sensing:\n  Entangled photons enable quantum-enhanced precision measurement — LIGO gravitational wave detectors use squeezed (entangled) light states to beat the standard quantum limit of shot noise.\n\nQuantum Error Correction:\n  Stabilizer codes (surface codes, color codes) encode logical qubits across many physical qubits using entanglement. Measuring stabilizer operators detects errors without measuring the logical qubit itself.',
        terminology: [
          { term: 'E91 protocol', def: 'Ekert\'s QKD protocol using Bell pairs. Security guaranteed by violation of Bell inequalities — any eavesdropping is detectable.' },
          { term: 'Quantum internet', def: 'A future network of quantum nodes connected by long-distance entanglement for secure communication and distributed quantum computing.' },
          { term: 'Gottesman-Knill theorem', def: 'Without entanglement, quantum circuits using only Clifford gates can be simulated classically in polynomial time.' },
          { term: 'Stabilizer code', def: 'Quantum error-correcting code using multi-qubit entanglement to encode logical qubits robustly.' },
          { term: 'Standard quantum limit', def: 'Measurement precision limit from shot noise in unentangled states. Entangled squeezed states can surpass it.' },
          { term: 'Quantum advantage', def: 'Tasks where quantum systems outperform all known classical algorithms — entanglement is the key resource.' },
        ],
      },
      // ── STEP 17: Quiz 5 ──
      {
        type: 'quiz' as const,
        title: 'Quiz 5: Entanglement Applications & Properties',
        body: 'Final check on entanglement theory and applications.',
        question: 'What does the Gottesman-Knill theorem tell us about entanglement?',
        options: [
          'Entanglement is sufficient for exponential quantum speedup in all cases',
          'Quantum circuits without entanglement (Clifford-only) can be simulated efficiently classically',
          'Entanglement allows FTL communication when properly configured',
          'Bell states cannot be prepared using only the H and CNOT gates',
        ],
        correct: 1,
        explanation: 'The Gottesman-Knill theorem states that any quantum circuit using only Clifford gates (H, CNOT, S, Pauli) — even with many qubits — can be simulated efficiently on a classical computer. This means entanglement from Clifford operations alone is not sufficient for exponential quantum speedup. Non-Clifford gates (like T gate) combined with entanglement are necessary to achieve computational advantage beyond classical simulation.',
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

export type AlgorithmCategory = 'All' | 'Entanglement' | 'Search & Oracles' | 'Communication' | 'Error Correction' | 'Arithmetic'

export interface StepExplanation {
  title: string
  description: string
  activeGates: string[]
  formula?: string
}

export interface AlgorithmItem {
  id: string
  name: string
  category: 'Entanglement' | 'Search & Oracles' | 'Communication' | 'Error Correction' | 'Arithmetic'
  description: string
  overview: string
  advantage: string
  outputExplanation: string
  qubits: number
  gates: Array<{
    type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'TOFFOLI' | 'MEASURE'
    qubit: number
    target?: number
    controls?: number[]
    step: number
  }>
  expected?: Record<string, number> | null
  stepDescriptions: Record<number, StepExplanation>
}

export const ALGORITHMS: AlgorithmItem[] = [
  {
    id: 'bell',
    name: 'Bell State (|Φ⁺⟩)',
    category: 'Entanglement',
    description: 'Create maximal entanglement between two qubits',
    overview: 'The Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 represents the purest form of quantum entanglement. Two separate qubits become inextricably linked: measuring either qubit instantly collapses the other to the exact same value, regardless of the physical distance separating them. This non-local correlation forms the cornerstone of quantum teleportation, superdense coding, and quantum key distribution (E91).',
    advantage: 'Demonstrates quantum non-locality and violations of Bell\'s inequality (CHSH > 2). Impossible in classical physics without hidden local communication.',
    outputExplanation: 'Measuring both qubits yields either |00⟩ with 50% probability or |11⟩ with 50% probability. The outcomes |01⟩ and |10⟩ are strictly forbidden (0% probability). The qubits exhibit perfect correlation.',
    qubits: 2,
    gates: [
      { type: 'H', qubit: 0, step: 0 },
      { type: 'CNOT', qubit: 0, target: 1, step: 1 },
    ],
    expected: { '00': 0.5, '11': 0.5 },
    stepDescriptions: {
      0: {
        title: 'Superposition Creation',
        description: 'A Hadamard gate on q0 transforms the ground state |0⟩ into equal superposition (|0⟩ + |1⟩)/√2. Qubit q1 remains in ground state |0⟩.',
        activeGates: ['H on q0'],
        formula: '(|00⟩ + |10⟩)/√2',
      },
      1: {
        title: 'Entanglement via CNOT',
        description: 'A CNOT gate with control q0 and target q1 flips q1 whenever q0 is |1⟩. This entangles the two qubits into the Bell state |Φ⁺⟩.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '(|00⟩ + |11⟩)/√2',
      },
    },
  },
  {
    id: 'superdense',
    name: 'Superdense Coding',
    category: 'Communication',
    description: 'Transmit 2 classical bits by sending only 1 physical qubit',
    overview: 'Superdense coding demonstrates the power of prior quantum entanglement. Alice and Bob share an entangled Bell pair. By applying local Pauli operations (I, X, Z, or XZ) to only HER single qubit, Alice can encode 2 classical bits (00, 01, 10, or 11). She then sends her 1 qubit to Bob, who measures the joint Bell state and recovers both classical bits with 100% fidelity!',
    advantage: 'Doubles the classical information capacity of a quantum communication channel (Holevo bound saturation). 1 transmitted qubit conveys 2 classical bits.',
    outputExplanation: 'In this demonstration, Alice encodes the classical message "11" using Z and X gates. Bob measures the qubits and recovers state |11⟩ with 100% deterministic certainty.',
    qubits: 2,
    gates: [
      { type: 'H', qubit: 0, step: 0 },
      { type: 'CNOT', qubit: 0, target: 1, step: 1 },
      { type: 'Z', qubit: 0, step: 2 },
      { type: 'X', qubit: 0, step: 3 },
      { type: 'CNOT', qubit: 0, target: 1, step: 4 },
      { type: 'H', qubit: 0, step: 5 },
    ],
    expected: { '11': 1.0 },
    stepDescriptions: {
      0: {
        title: 'Bell Pair: Hadamard',
        description: 'Prepare qubit q0 in equal superposition.',
        activeGates: ['H on q0'],
        formula: '(|00⟩ + |10⟩)/√2',
      },
      1: {
        title: 'Bell Pair: Entanglement',
        description: 'CNOT creates shared Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Qubit q0 stays with Alice; q1 is sent to Bob.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '(|00⟩ + |11⟩)/√2',
      },
      2: {
        title: 'Alice Encodes Bit 1 (Phase Flip)',
        description: 'Alice applies a Z gate to q0, mapping |Φ⁺⟩ to |Φ⁻⟩ = (|00⟩ − |11⟩)/√2.',
        activeGates: ['Z on q0'],
        formula: '(|00⟩ − |11⟩)/√2',
      },
      3: {
        title: 'Alice Encodes Bit 2 (Bit Flip)',
        description: 'Alice applies an X gate to q0, mapping |Φ⁻⟩ to |Ψ⁻⟩ = (|10⟩ − |01⟩)/√2. Alice transmits q0 to Bob.',
        activeGates: ['X on q0'],
        formula: '(|10⟩ − |01⟩)/√2',
      },
      4: {
        title: 'Bob Decodes: CNOT',
        description: 'Bob receives q0 and performs a CNOT between q0 and q1 to disentangle the Bell state.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '(|11⟩ − |01⟩)/√2',
      },
      5: {
        title: 'Bob Decodes: Hadamard',
        description: 'Bob applies Hadamard on q0 to rotate out of superposition into the computational basis.',
        activeGates: ['H on q0'],
        formula: '−|11⟩ (Deterministic outcome 11)',
      },
    },
  },
  {
    id: 'bernstein',
    name: 'Bernstein-Vazirani',
    category: 'Search & Oracles',
    description: 'Find a hidden secret bitstring s=11 in a single oracle query',
    overview: 'The Bernstein-Vazirani algorithm is an oracle problem where an unknown function computes the inner product f(x) = s · x (mod 2) for a hidden secret string s. While any classical deterministic or randomized algorithm requires n separate queries to learn an n-bit string, the quantum algorithm recovers the entire string s in exactly ONE query using quantum phase kickback!',
    advantage: 'Solves the hidden bitstring problem in O(1) quantum oracle queries versus classical O(n) queries, demonstrating deterministic quantum speedup.',
    outputExplanation: 'The input register qubits (q0 and q1) collapse to the secret string s = "11" with 100% probability. The ancilla qubit q2 remains in superposition |−⟩, so both |110⟩ and |111⟩ indicate secret s = 11.',
    qubits: 3,
    gates: [
      { type: 'X', qubit: 2, step: 0 },
      { type: 'H', qubit: 0, step: 1 },
      { type: 'H', qubit: 1, step: 1 },
      { type: 'H', qubit: 2, step: 1 },
      { type: 'CNOT', qubit: 0, target: 2, step: 2 },
      { type: 'CNOT', qubit: 1, target: 2, step: 3 },
      { type: 'H', qubit: 0, step: 4 },
      { type: 'H', qubit: 1, step: 4 },
    ],
    expected: { '110': 0.5, '111': 0.5 },
    stepDescriptions: {
      0: {
        title: 'Ancilla Initialization',
        description: 'Flip ancilla qubit q2 to |1⟩ using an X gate to prepare for phase kickback.',
        activeGates: ['X on q2'],
        formula: '|001⟩',
      },
      1: {
        title: 'Parallel Superposition',
        description: 'Apply Hadamard to all three qubits. Inputs enter |+⟩|+⟩; ancilla enters |−⟩ = (|0⟩ − |1⟩)/√2.',
        activeGates: ['H on q0', 'H on q1', 'H on q2'],
        formula: '|+⟩ ⊗ |+⟩ ⊗ |−⟩',
      },
      2: {
        title: 'Oracle Query: Bit s₀ = 1',
        description: 'CNOT from q0 into ancilla q2 kicks a relative phase (−1) back onto |1⟩ of q0.',
        activeGates: ['CNOT(q0 → q2)'],
        formula: '|−⟩ ⊗ |+⟩ ⊗ |−⟩',
      },
      3: {
        title: 'Oracle Query: Bit s₁ = 1',
        description: 'CNOT from q1 into ancilla q2 kicks a relative phase (−1) back onto |1⟩ of q1.',
        activeGates: ['CNOT(q1 → q2)'],
        formula: '|−⟩ ⊗ |−⟩ ⊗ |−⟩',
      },
      4: {
        title: 'Interference & Recovery',
        description: 'Hadamard gates on q0 and q1 transform the phase-encoded state |−⟩|−⟩ directly into basis state |11⟩.',
        activeGates: ['H on q0', 'H on q1'],
        formula: '|1⟩ ⊗ |1⟩ ⊗ |−⟩ = (|110⟩ − |111⟩)/√2',
      },
    },
  },
  {
    id: 'ghz',
    name: 'GHZ State (3-Qubit Entanglement)',
    category: 'Entanglement',
    description: 'Create tripartite macroscopic entanglement: (|000⟩ + |111⟩)/√2',
    overview: 'The Greenberger-Horne-Zeilinger (GHZ) state is an extreme quantum superposition of 3 or more qubits where all qubits simultaneously exist in |000⟩ and |111⟩. Unlike 2-qubit Bell states, GHZ states refute Einstein-Podolsky-Rosen (EPR) local hidden variable theories in a single non-statistical measurement, and form the backbone of quantum secret sharing and fault-tolerant stabilizer codes.',
    advantage: 'Enables non-statistical tests of quantum mechanics without Bell inequalities. Essential for multi-party quantum cryptography.',
    outputExplanation: 'Measurement reveals either |000⟩ with 50% probability or |111⟩ with 50% probability. The intermediate states |001⟩, |010⟩, |011⟩, |100⟩, |101⟩, |110⟩ have 0% probability.',
    qubits: 3,
    gates: [
      { type: 'H', qubit: 0, step: 0 },
      { type: 'CNOT', qubit: 0, target: 1, step: 1 },
      { type: 'CNOT', qubit: 1, target: 2, step: 2 },
    ],
    expected: { '000': 0.5, '111': 0.5 },
    stepDescriptions: {
      0: {
        title: 'Superposition Injection',
        description: 'Hadamard on q0 creates an equal superposition (|0⟩ + |1⟩)/√2 on the first qubit.',
        activeGates: ['H on q0'],
        formula: '(|000⟩ + |100⟩)/√2',
      },
      1: {
        title: 'First Stage Entanglement',
        description: 'CNOT from q0 to q1 entangles q0 and q1 into a Bell pair.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '(|000⟩ + |110⟩)/√2',
      },
      2: {
        title: 'Tripartite Cascade',
        description: 'CNOT from q1 to q2 chains entanglement across all three qubits, completing the GHZ state.',
        activeGates: ['CNOT(q1 → q2)'],
        formula: '(|000⟩ + |111⟩)/√2',
      },
    },
  },
  {
    id: 'grover-2',
    name: "Grover's Search (2-Qubit)",
    category: 'Search & Oracles',
    description: 'Find marked state |11⟩ with quadratic amplitude amplification',
    overview: 'Grover\'s algorithm searches an unsorted database of N = 2ⁿ items in O(√N) queries instead of classical O(N) linear search. It operates via two alternating steps: (1) an Oracle that flips the phase of the target state, and (2) a Diffusion Operator (inversion about the average) that constructively amplifies the target state\'s probability amplitude while suppressing all non-target states.',
    advantage: 'Quadratic speedup: O(√N) vs classical O(N). For 2 qubits (N=4), Grover finds the target in exactly 1 iteration with 100% probability.',
    outputExplanation: 'Constructive interference boosts the marked state |11⟩ amplitude to 1.0 (100% probability), while destructive interference drives the amplitudes of |00⟩, |01⟩, and |10⟩ to 0%.',
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
    stepDescriptions: {
      0: {
        title: 'Uniform Superposition',
        description: 'Hadamard gates place both qubits into an equal superposition across all 4 basis states (|00⟩, |01⟩, |10⟩, |11⟩).',
        activeGates: ['H on q0', 'H on q1'],
        formula: '1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩)',
      },
      1: {
        title: 'Oracle: Phase Inversion',
        description: 'The oracle marks target |11⟩ by inverting its sign to negative via controlled-Z decomposition.',
        activeGates: ['Z on q1', 'CNOT(q0 → q1)', 'Z on q1'],
        formula: '1/2 (|00⟩ + |01⟩ + |10⟩ − |11⟩)',
      },
      2: {
        title: 'Diffusion: Basis Change',
        description: 'Apply Hadamard gates to both qubits to prepare for inversion about the mean.',
        activeGates: ['H on q0', 'H on q1'],
        formula: 'Hadamard transform of marked state',
      },
      3: {
        title: 'Diffusion: Inversion About Mean',
        description: 'Phase reflection around the |00⟩ state inverts amplitudes about their average.',
        activeGates: ['Z on q0', 'Z on q1', 'CNOT', 'Z on q0', 'Z on q1'],
        formula: 'Reflection around average amplitude',
      },
      4: {
        title: 'Final Interference',
        description: 'Final Hadamard transform rotates the amplified state directly onto computational basis state |11⟩.',
        activeGates: ['H on q0', 'H on q1'],
        formula: '|11⟩ (100% Probability)',
      },
    },
  },
  {
    id: 'teleport',
    name: 'Quantum Teleportation',
    category: 'Communication',
    description: 'Transfer an unknown quantum state using entanglement and classical feedforward',
    overview: 'Quantum teleportation transmits an unknown qubit state |ψ⟩ from Alice to Bob without physically transporting the particle itself or violating the No-Cloning Theorem. Alice and Bob share a Bell pair. Alice performs a joint Bell-state measurement on |ψ⟩ and her half of the Bell pair, then transmits two classical bits to Bob, who performs unitary corrections (X and Z) to reconstitute |ψ⟩ exactly.',
    advantage: 'Enables quantum state transfer across arbitrary distances without measuring the state itself. Fundamental to the quantum internet and distributed quantum computing.',
    outputExplanation: 'Alice\'s qubits (q0, q1) are measured to extract 2 classical bits. Bob\'s qubit (q2) reconstructs the original quantum state with 100% fidelity.',
    qubits: 3,
    gates: [
      { type: 'H', qubit: 1, step: 0 },
      { type: 'CNOT', qubit: 1, target: 2, step: 1 },
      { type: 'CNOT', qubit: 0, target: 1, step: 2 },
      { type: 'H', qubit: 0, step: 3 },
      { type: 'CNOT', qubit: 1, target: 2, step: 4 },
      { type: 'CNOT', qubit: 0, target: 2, step: 5 },
    ],
    expected: null,
    stepDescriptions: {
      0: {
        title: 'Bell Resource Creation',
        description: 'Hadamard on q1 begins Bell pair preparation between Alice (q1) and Bob (q2).',
        activeGates: ['H on q1'],
        formula: '|0⟩ ⊗ (|+⟩) ⊗ |0⟩',
      },
      1: {
        title: 'Entanglement Distribution',
        description: 'CNOT between q1 and q2 creates a shared EPR Bell pair (|00⟩ + |11⟩)/√2.',
        activeGates: ['CNOT(q1 → q2)'],
        formula: '|ψ⟩_q0 ⊗ (|00⟩ + |11⟩)/√2',
      },
      2: {
        title: 'Alice Bell Measurement: CNOT',
        description: 'Alice interacts the unknown state q0 with her half of the Bell pair q1 using a CNOT.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: 'Bell interaction on Alice\'s qubits',
      },
      3: {
        title: 'Alice Bell Measurement: Hadamard',
        description: 'Alice rotates q0 into the X basis to complete the joint Bell-basis projection.',
        activeGates: ['H on q0'],
        formula: 'State mapped into 4 Bell projections',
      },
      4: {
        title: 'Bob Feedforward Correction (Bit)',
        description: 'Bob uses measurement of q1 to conditionally apply an X gate correction.',
        activeGates: ['CNOT(q1 → q2)'],
        formula: 'Conditional Pauli-X correction on q2',
      },
      5: {
        title: 'Bob Feedforward Correction (Phase)',
        description: 'Bob uses measurement of q0 to conditionally apply phase correction, restoring the exact state |ψ⟩ on q2.',
        activeGates: ['CNOT(q0 → q2)'],
        formula: 'Final state reconstructed on q2',
      },
    },
  },
  {
    id: 'deutsch',
    name: 'Deutsch-Jozsa Algorithm',
    category: 'Search & Oracles',
    description: 'Determine if a boolean function is constant or balanced in 1 evaluation',
    overview: 'The Deutsch-Jozsa algorithm solves whether an oracle function f(x) is constant (outputs the same bit for all inputs) or balanced (outputs 0 for half and 1 for the other half). While a classical algorithm requires 2ⁿ⁻¹ + 1 queries in the worst case to be certain, Deutsch-Jozsa answers with 100% deterministic certainty in a single quantum query.',
    advantage: 'Exponential separation in query complexity: O(1) quantum vs O(2ⁿ⁻¹) classical deterministic queries.',
    outputExplanation: 'Since the oracle used here is balanced f(x)=x, constructive interference concentrates the input qubit q0 into state |1⟩. A constant function would measure |0⟩. Thus q0=1 proves the function is balanced with 100% certainty.',
    qubits: 2,
    gates: [
      { type: 'X', qubit: 1, step: 0 },
      { type: 'H', qubit: 0, step: 1 },
      { type: 'H', qubit: 1, step: 1 },
      { type: 'CNOT', qubit: 0, target: 1, step: 2 },
      { type: 'H', qubit: 0, step: 3 },
    ],
    expected: { '10': 0.5, '11': 0.5 },
    stepDescriptions: {
      0: {
        title: 'Ancilla Setup',
        description: 'Flip ancilla qubit q1 to |1⟩ with an X gate so that Hadamard puts it into |−⟩.',
        activeGates: ['X on q1'],
        formula: '|01⟩',
      },
      1: {
        title: 'Superposition Creation',
        description: 'Apply Hadamard to both qubits. Input enters |+⟩; ancilla enters |−⟩ for phase kickback.',
        activeGates: ['H on q0', 'H on q1'],
        formula: '|+⟩ ⊗ |−⟩',
      },
      2: {
        title: 'Balanced Oracle Query',
        description: 'CNOT from input q0 into ancilla q1 evaluates f(x)=x, flipping ancilla sign when q0 is |1⟩.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '|−⟩ ⊗ |−⟩',
      },
      3: {
        title: 'Interference Measurement',
        description: 'Final Hadamard on q0 maps |−⟩ to |1⟩. Destructive interference eliminates |0⟩, proving the function is balanced.',
        activeGates: ['H on q0'],
        formula: '|1⟩ ⊗ |−⟩ = (|10⟩ − |11⟩)/√2',
      },
    },
  },
  {
    id: 'half-adder',
    name: 'Quantum Half-Adder',
    category: 'Arithmetic',
    description: 'Reversible quantum addition computing Sum (XOR) and Carry (AND)',
    overview: 'All quantum computation must be unitary and reversible (no information loss). Classical logic gates like AND and XOR are irreversible. The Quantum Half-Adder computes the addition of two binary bits A and B reversibly: the Toffoli (CCX) gate computes the Carry bit (A · B), and the CNOT gate computes the Sum bit (A ⊕ B). This forms the core building block of modular exponentiation in Shor\'s factoring algorithm.',
    advantage: 'Enables coherent, reversible arithmetic on superpositions of numbers with zero Landauer thermodynamic heat dissipation.',
    outputExplanation: 'With inputs A=1 (q0) and B=1 (q1), the quantum half-adder calculates 1 + 1 = 10₂: Carry = 1 (q2) and Sum = 0 (q1). Output state |101⟩ occurs with 100% deterministic probability.',
    qubits: 3,
    gates: [
      { type: 'X', qubit: 0, step: 0 },
      { type: 'X', qubit: 1, step: 0 },
      { type: 'TOFFOLI', qubit: 0, controls: [0, 1], target: 2, step: 1 },
      { type: 'CNOT', qubit: 0, target: 1, step: 2 },
    ],
    expected: { '101': 1.0 },
    stepDescriptions: {
      0: {
        title: 'Input Initialization (1 + 1)',
        description: 'Apply X gates to q0 and q1 to set both input operands to 1 (A=1, B=1). Carry qubit q2 starts at 0.',
        activeGates: ['X on q0', 'X on q1'],
        formula: '|110⟩',
      },
      1: {
        title: 'Carry Calculation: Toffoli Gate',
        description: 'Toffoli gate (controlled-controlled-NOT) fires only if both q0=1 and q1=1, setting Carry q2 = A · B = 1.',
        activeGates: ['TOFFOLI(q0, q1 → q2)'],
        formula: '|111⟩ (Carry computed on q2)',
      },
      2: {
        title: 'Sum Calculation: CNOT Gate',
        description: 'CNOT gate from q0 to q1 computes the Sum bit A ⊕ B onto q1: 1 ⊕ 1 = 0.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '|101⟩ (A=1, Sum=0, Carry=1)',
      },
    },
  },
  {
    id: 'bit-flip-code',
    name: '3-Qubit Quantum Error Correction',
    category: 'Error Correction',
    description: 'Encode, detect, and correct an arbitrary bit-flip error (X noise)',
    overview: 'Quantum systems are extremely delicate and susceptible to environmental decoherence. The 3-qubit bit-flip code protects a logical qubit against unwanted X bit-flip errors. It encodes the logical state into 3 physical qubits (|0⟩_L = |000⟩, |1⟩_L = |111⟩). If noise flips one physical qubit mid-circuit, syndrome parity detection followed by a Toffoli majority vote detects and corrects the damaged qubit without measuring or destroying the quantum superposition!',
    advantage: 'Overcomes the No-Cloning Theorem by entangling rather than copying qubits. Foundational proof that fault-tolerant quantum computing is mathematically possible.',
    outputExplanation: 'Despite an artificial bit-flip noise error injected on physical qubit q1 (step 3), the syndrome and majority-rule recovery completely reverses the error, returning the system to the correct uncorrupted Bell superposition.',
    qubits: 3,
    gates: [
      { type: 'H', qubit: 0, step: 0 },
      { type: 'CNOT', qubit: 0, target: 1, step: 1 },
      { type: 'CNOT', qubit: 0, target: 2, step: 2 },
      { type: 'X', qubit: 1, step: 3 },
      { type: 'CNOT', qubit: 0, target: 1, step: 4 },
      { type: 'CNOT', qubit: 0, target: 2, step: 5 },
      { type: 'TOFFOLI', qubit: 1, controls: [1, 2], target: 0, step: 6 },
    ],
    expected: null,
    stepDescriptions: {
      0: {
        title: 'Logical State Preparation',
        description: 'Hadamard on q0 creates logical test state (|0⟩ + |1⟩)/√2.',
        activeGates: ['H on q0'],
        formula: '(|000⟩ + |100⟩)/√2',
      },
      1: {
        title: 'Encoding Physical Qubit 1',
        description: 'CNOT entangles logical data q0 into first physical copy q1.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: '(|000⟩ + |110⟩)/√2',
      },
      2: {
        title: 'Encoding Physical Qubit 2',
        description: 'CNOT entangles logical data q0 into second physical copy q2, forming the repetition code (|000⟩ + |111⟩)/√2.',
        activeGates: ['CNOT(q0 → q2)'],
        formula: '(|000⟩ + |111⟩)/√2',
      },
      3: {
        title: 'Simulated Bit-Flip Noise Error',
        description: 'Environmental noise causes an unwanted bit-flip (Pauli-X) on physical qubit q1. The state is corrupted into (|010⟩ + |101⟩)/√2.',
        activeGates: ['X on q1 (Error injection)'],
        formula: '(|010⟩ + |101⟩)/√2 (Corrupted)',
      },
      4: {
        title: 'Syndrome Parity Check 1',
        description: 'CNOT from q0 to q1 compares parities between physical qubits 0 and 1.',
        activeGates: ['CNOT(q0 → q1)'],
        formula: 'Parity syndrome extracted into q1',
      },
      5: {
        title: 'Syndrome Parity Check 2',
        description: 'CNOT from q0 to q2 compares parities between physical qubits 0 and 2.',
        activeGates: ['CNOT(q0 → q2)'],
        formula: 'Parity syndrome extracted into q2',
      },
      6: {
        title: 'Majority Voting Correction',
        description: 'Toffoli gate detects the syndrome discrepancy and applies an exact correction to recover the uncorrupted state.',
        activeGates: ['TOFFOLI(q1, q2 → q0)'],
        formula: 'Error corrected; original state restored!',
      },
    },
  },
]
