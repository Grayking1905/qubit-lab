'use client'

import type { GateType, Circuit } from './api'
import type { BlochCoords } from './quantum'

export interface LevelGoal {
  type: 'bloch_target' | 'statevector' | 'probability' | 'syndrome'
  targetBloch?: BlochCoords
  targetProbability?: Record<string, number>
  targetKet?: string
  tolerance?: number
  obstacles?: Array<{ center: BlochCoords; radius: number; label: string }>
}

export interface GameLevel {
  levelNumber: number
  title: string
  subtitle: string
  concept: string
  realLifeApplication: string
  instructions: string
  qubits: number
  allowedGates: GateType[]
  maxGates: number
  threeStarMaxGates: number
  twoStarMaxGates: number
  xpReward: number
  initialCircuit?: Circuit
  goal: LevelGoal
  hint: string
}

export interface GameDef {
  id: string
  title: string
  badge: string
  category: string
  description: string
  conceptExplanation: string
  hardwareImplementation: string
  icon: string
  levels: GameLevel[]
}

export interface LevelProgress {
  completed: boolean
  stars: number // 1, 2, or 3
  bestGateCount: number
  xpEarned: number
}

export interface GamesProgressState {
  totalXp: number
  gameProgress: Record<string, Record<number, LevelProgress>> // gameId -> levelNumber -> progress
}

// ─────────────────────────────────────────────────────────────────────────────
// Game 1: Bloch Sphere Target Navigator
// ─────────────────────────────────────────────────────────────────────────────

const BLOCH_NAVIGATOR_LEVELS: GameLevel[] = [
  {
    levelNumber: 1,
    title: 'Ground to Excited',
    subtitle: 'Bit Flip Operation',
    concept: 'Pauli-X Gate & Classical Bit Inversion',
    realLifeApplication: 'Calibrated 180° microwave π-pulse on a superconducting transmon qubit to excite an artificial atom from energy state |0⟩ to |1⟩.',
    instructions: 'Apply a Pauli-X gate to rotate the qubit from the North Pole (|0⟩) to the South Pole (|1⟩).',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 50,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: 0, z: -1 },
      targetKet: '|1⟩',
      tolerance: 0.15,
    },
    hint: 'A single Pauli-X gate performs a 180° rotation around the X-axis.',
  },
  {
    levelNumber: 2,
    title: 'The Equator Horizon',
    subtitle: 'Superposition Creation',
    concept: 'Hadamard Gate & Wave-Particle Duality',
    realLifeApplication: 'Creating an equal quantum superposition in microwave cavities, putting the superconducting circuit into a state of flowing clockwise and counter-clockwise simultaneously.',
    instructions: 'Apply a Hadamard gate to bring the qubit from the pole to the equator state |+⟩.',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 50,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 1, y: 0, z: 0 },
      targetKet: '|+⟩',
      tolerance: 0.15,
    },
    hint: 'The Hadamard (H) gate maps |0⟩ directly to the positive X-axis (|0⟩+|1⟩)/√2.',
  },
  {
    levelNumber: 3,
    title: 'Negative Superposition',
    subtitle: 'Phase Inversion',
    concept: 'Pauli-Z Phase Flip & Destructive Interference',
    realLifeApplication: 'Phase-encoded quantum key distribution pulses where the 180° relative phase represents cryptographic secret keys.',
    instructions: 'Navigate the statevector from |0⟩ to the negative superposition state |−⟩ on the -X axis.',
    qubits: 1,
    allowedGates: ['X', 'Z', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 60,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: -1, y: 0, z: 0 },
      targetKet: '|−⟩',
      tolerance: 0.15,
    },
    hint: 'First put the qubit on the equator with H, then flip its phase with Z (or apply X then H).',
  },
  {
    levelNumber: 4,
    title: 'The Complex Imaginary Plane',
    subtitle: 'Y-Axis Orbit',
    concept: 'Pauli-Y Gate & Imaginary Phase Amplitude',
    realLifeApplication: 'Quadrature phase microwave modulation (I/Q channels) used in transmon qubit readout resonators.',
    instructions: 'Steer the vector to the positive imaginary Y-axis (|0⟩ + i|1⟩)/√2.',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 70,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: 1, z: 0 },
      targetKet: '|+i⟩',
      tolerance: 0.15,
    },
    hint: 'Start with H to reach X-axis, then apply an appropriate gate to rotate to Y.',
  },
  {
    levelNumber: 5,
    title: 'Negative Imaginary Axis',
    subtitle: 'Clockwise Equatorial Steering',
    concept: 'Phase Rotation & Negative Imaginary Basis',
    realLifeApplication: 'Phase-sensitive microwave amplification in traveling wave parametric amplifiers (TWPAs).',
    instructions: 'Steer the statevector to point to the -Y axis (state |−i⟩ = (|0⟩ - i|1⟩)/√2).',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 70,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: -1, z: 0 },
      targetKet: '|−i⟩',
      tolerance: 0.15,
    },
    hint: 'Try combining H with multiple Pauli rotations to hit -Y.',
  },
  {
    levelNumber: 6,
    title: 'Equatorial Phase Orbit',
    subtitle: 'Four-Point Navigation',
    concept: 'Continuous Equatorial State Traversal',
    realLifeApplication: 'Ramsey interferometry to measure qubit coherence time T2* by observing equatorial precession.',
    instructions: 'Starting at |0⟩, execute a sequence that ends at the negative X-axis (|−⟩) without using the Z gate directly.',
    qubits: 1,
    allowedGates: ['X', 'Y', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 80,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: -1, y: 0, z: 0 },
      targetKet: '|−⟩',
      tolerance: 0.15,
    },
    hint: 'Can you reach |1⟩ first with X, then use Hadamard?',
  },
  {
    levelNumber: 7,
    title: 'Decoherence Trench Avoidance',
    subtitle: 'Hazardous Meridian Navigation',
    concept: 'Quantum Error Avoidance & Protected Subspaces',
    realLifeApplication: 'Fluxonium qubits avoiding parasitic two-level system (TLS) defect resonances in substrate dielectric loss channels.',
    instructions: 'Reach the South Pole (|1⟩) without landing in the hazardous equatorial zone (Z=0).',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 90,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: 0, z: -1 },
      targetKet: '|1⟩',
      tolerance: 0.15,
      obstacles: [{ center: { x: 1, y: 0, z: 0 }, radius: 0.35, label: 'TLS Noise' }],
    },
    hint: 'Avoid using Hadamard! Use direct longitudinal rotations like X or Y.',
  },
  {
    levelNumber: 8,
    title: 'Reverse Pulse Unwinding',
    subtitle: 'Inverse Unitary Transformation',
    concept: 'Reversibility & Hermitian Adjoints',
    realLifeApplication: 'Dynamical decoupling sequences (Hahn echo) that undo environmental dephasing by applying periodic π-pulses.',
    instructions: 'The qubit starts in an off-axis state. Apply the exact inverse sequence to restore it to the pure ground state |0⟩.',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 100,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: 0, z: 1 },
      targetKet: '|0⟩',
      tolerance: 0.15,
    },
    hint: 'Because quantum operations are unitary, reversing the order of gates (or self-inverse gates) unwinds the state.',
  },
  {
    levelNumber: 9,
    title: 'The T-Gate Fine Meridian',
    subtitle: 'Non-Clifford Rotation',
    concept: 'Universal Quantum Computing via Non-Clifford Resources',
    realLifeApplication: 'Magic state distillation in fault-tolerant surface codes, injecting T-gates for universal quantum advantage.',
    instructions: 'Reach the target coordinate at (x = 0.707, y = 0.707, z = 0) on the equator.',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 5,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 110,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0.707, y: 0.707, z: 0 },
      targetKet: '(|+⟩ + |+i⟩)/√2',
      tolerance: 0.2,
    },
    hint: 'A Hadamard places the vector on X; combining orthogonal axes rotates into the diagonal octant.',
  },
  {
    levelNumber: 10,
    title: 'Clifford Decomposition',
    subtitle: 'Discrete Gate Synthesis',
    concept: 'Solovay-Kitaev Theorem & Discrete Gate Sets',
    realLifeApplication: 'Compiling continuous quantum algorithms into native hardware-supported microwave gates.',
    instructions: 'Synthesize the state |−i⟩ on the -Y axis using ONLY the gates H and Z.',
    qubits: 1,
    allowedGates: ['H', 'Z'],
    maxGates: 6,
    threeStarMaxGates: 4,
    twoStarMaxGates: 5,
    xpReward: 120,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: -1, y: 0, z: 0 },
      targetKet: '|−⟩',
      tolerance: 0.15,
    },
    hint: 'Alternating H and Z creates orthogonal axis rotations.',
  },
  {
    levelNumber: 11,
    title: 'Cryogenic Drift Compensation',
    subtitle: 'Thermal Jitter Re-alignment',
    concept: 'Pulse Calibration & Hamiltonian Parameter Tracking',
    realLifeApplication: 'Daily calibration routines on dilution refrigerator line attenuation to correct for pulse amplitude drift.',
    instructions: 'Compensate for simulated dephasing and return the state to the clean equator target (+X).',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 130,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 1, y: 0, z: 0 },
      targetKet: '|+⟩',
      tolerance: 0.15,
    },
    hint: 'Use Hadamard from ground or inverse Pauli flips.',
  },
  {
    levelNumber: 12,
    title: 'Master Microwave Controller',
    subtitle: 'Precision State Targeting',
    concept: 'Optimal Control Theory & GRAPE Pulses',
    realLifeApplication: 'Gradient Ascent Pulse Engineering (GRAPE) generating minimum-time microwave waveforms for 99.9% gate fidelity.',
    instructions: 'Navigate to the South Pole (|1⟩) using a strictly limited pulse budget with zero tolerance for error.',
    qubits: 1,
    allowedGates: ['X', 'Y', 'Z', 'H'],
    maxGates: 2,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 150,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: 0, z: -1 },
      targetKet: '|1⟩',
      tolerance: 0.08,
    },
    hint: 'Single Pauli-X or Pauli-Y brings you straight to the south pole in 1 pulse!',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Game 2: Entanglement Repeater Network
// ─────────────────────────────────────────────────────────────────────────────

const ENTANGLEMENT_NETWORK_LEVELS: GameLevel[] = [
  {
    levelNumber: 1,
    title: 'First Entangled Link',
    subtitle: 'Creating |Φ⁺⟩ Bell State',
    concept: 'Maximal 2-Qubit Entanglement & EPR Pairs',
    realLifeApplication: 'Spontaneous parametric down-conversion (SPDC) generating entangled photon pairs sent through fiber optic cables.',
    instructions: 'Entangle q0 and q1 into the standard Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.',
    qubits: 2,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 50,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: '(|00⟩ + |11⟩)/√2',
    },
    hint: 'Apply Hadamard on q0, then CNOT with control q0 and target q1.',
  },
  {
    levelNumber: 2,
    title: 'Anti-Correlated Channel',
    subtitle: 'Creating |Ψ⁺⟩ Bell State',
    concept: 'Orthogonal Bell Basis & Bit Flipping',
    realLifeApplication: 'Quantum key distribution (QKD) where anti-correlated outcomes detect eavesdroppers (Eve) intercepting optical fiber lines.',
    instructions: 'Create the Bell state |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2 where qubits always measure opposite values.',
    qubits: 2,
    allowedGates: ['H', 'X', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 50,
    goal: {
      type: 'probability',
      targetProbability: { '01': 0.5, '10': 0.5 },
      targetKet: '(|01⟩ + |10⟩)/√2',
    },
    hint: 'Flip q1 with an X gate before or after the standard Bell pair circuit.',
  },
  {
    levelNumber: 3,
    title: 'Phase-Inverted Bell Pair',
    subtitle: 'Creating |Φ⁻⟩ Bell State',
    concept: 'Relative Phase Encoding in Entangled States',
    realLifeApplication: 'Superdense coding where Alice applies a phase flip to transmit classical bit 01.',
    instructions: 'Synthesize the state |Φ⁻⟩ = (|00⟩ - |11⟩)/√2.',
    qubits: 2,
    allowedGates: ['H', 'Z', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 60,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: '(|00⟩ − |11⟩)/√2',
    },
    hint: 'Build |Φ⁺⟩, then apply a Z gate to the control qubit.',
  },
  {
    levelNumber: 4,
    title: 'Bell Basis Synthesizer',
    subtitle: 'Creating |Ψ⁻⟩ Bell State',
    concept: 'Singlet State & Rotational Invariance',
    realLifeApplication: 'The Singlet state |Ψ⁻⟩ is invariant under identical rotations on both qubits, making it immune to polarization drift in fiber optics.',
    instructions: 'Synthesize the singlet state |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2.',
    qubits: 2,
    allowedGates: ['H', 'X', 'Z', 'CNOT'],
    maxGates: 5,
    threeStarMaxGates: 4,
    twoStarMaxGates: 5,
    xpReward: 70,
    goal: {
      type: 'probability',
      targetProbability: { '01': 0.5, '10': 0.5 },
      targetKet: '(|01⟩ − |10⟩)/√2',
    },
    hint: 'Apply both X and Z operations alongside the H-CNOT core.',
  },
  {
    levelNumber: 5,
    title: 'Tripartite Entanglement Relay',
    subtitle: '3-Qubit GHZ State Generation',
    concept: 'Greenberger-Horne-Zeilinger Macroscopic Entanglement',
    realLifeApplication: 'Multi-party quantum secret sharing across three satellite ground stations (e.g. Zurich, Munich, Vienna).',
    instructions: 'Create the 3-qubit GHZ state (|000⟩ + |111⟩)/√2 across q0, q1, and q2.',
    qubits: 3,
    allowedGates: ['H', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 80,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: '(|000⟩ + |111⟩)/√2',
    },
    hint: 'H on q0, CNOT(0→1), then CNOT(1→2).',
  },
  {
    levelNumber: 6,
    title: 'Entanglement Swapping',
    subtitle: 'Connecting Distant Ground Stations',
    concept: 'Non-Local Link Creation via Intermediate Bell Measurement',
    realLifeApplication: 'Quantum repeaters linking nodes that never interacted directly by performing Bell state measurements at an intermediate node.',
    instructions: 'Entangle q0 with q1, and q2 with q1, transferring correlation across the chain.',
    qubits: 3,
    allowedGates: ['H', 'X', 'CNOT'],
    maxGates: 5,
    threeStarMaxGates: 4,
    twoStarMaxGates: 5,
    xpReward: 90,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Swapped Correlation',
    },
    hint: 'Chain CNOT operations through the central relay qubit.',
  },
  {
    levelNumber: 7,
    title: 'Atmospheric Loss Compensation',
    subtitle: 'Parity Purification',
    concept: 'Entanglement Purification & Parity Check',
    realLifeApplication: 'Filtering out photons degraded by atmospheric turbulence in satellite-to-ground quantum communications.',
    instructions: 'Cleanse noise by establishing pure correlations on qubits q0 and q1 with equal 50/50 probability on |00⟩ and |11⟩.',
    qubits: 2,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 100,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: '|Φ⁺⟩ Pure',
    },
    hint: 'Standard H and CNOT achieves 100% purity for |Φ⁺⟩.',
  },
  {
    levelNumber: 8,
    title: 'Quantum Teleportation Core',
    subtitle: 'Alice-to-Bob State Transfer',
    concept: 'Quantum Teleportation & No-Cloning Theorem',
    realLifeApplication: 'Transporting fragile quantum states across continent-scale distances using pre-shared entanglement and classical channels.',
    instructions: 'Prepare an entangled link between q1 and q2, then interact state q0 into the channel using CNOT and H.',
    qubits: 3,
    allowedGates: ['H', 'X', 'CNOT'],
    maxGates: 6,
    threeStarMaxGates: 4,
    twoStarMaxGates: 5,
    xpReward: 110,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.25, '010': 0.25, '100': 0.25, '110': 0.25 },
      targetKet: 'Teleportation Projection',
    },
    hint: 'H(q1), CNOT(1→2), CNOT(0→1), H(q0).',
  },
  {
    levelNumber: 9,
    title: 'Phase Noise Cancellation',
    subtitle: 'Feedforward Phase Correction',
    concept: 'Classical Feedforward Unitary Correction',
    realLifeApplication: 'High-speed FPGA controllers applying phase corrections within nanoseconds of detector click in quantum teleportation.',
    instructions: 'Correct an unwanted phase inversion using Pauli-Z gate on the target qubit.',
    qubits: 2,
    allowedGates: ['H', 'Z', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 120,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: 'Corrected Bell Link',
    },
    hint: 'Z reverses the sign of |11⟩ back to positive.',
  },
  {
    levelNumber: 10,
    title: 'Quantum Secret Sharing',
    subtitle: 'Threshold Cryptography',
    concept: 'Multiparty State Distribution & Verification',
    realLifeApplication: 'Distributing cryptographic launch keys where all 3 nodes must collaborate to reconstruct the secret.',
    instructions: 'Synthesize the tripartite GHZ state (|000⟩ + |111⟩)/√2 with optimal gate count.',
    qubits: 3,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 3,
    twoStarMaxGates: 3,
    xpReward: 130,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Tripartite Secret Link',
    },
    hint: 'H on q0, CNOT(0→1), CNOT(1→2).',
  },
  {
    levelNumber: 11,
    title: 'Multi-Hop Repeater Chain',
    subtitle: 'Chained Quantum Relay',
    concept: 'Scalable Entanglement Distribution',
    realLifeApplication: 'Multi-node quantum internet architecture spanning London, Paris, and Amsterdam with atomic quantum memories.',
    instructions: 'Cascade entanglement from q0 through q1 to q2.',
    qubits: 3,
    allowedGates: ['H', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 140,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Multi-Hop Mesh',
    },
    hint: 'A single H on q0 followed by two sequential CNOTs creates a 3-qubit coherent mesh.',
  },
  {
    levelNumber: 12,
    title: 'Global Mesh Synchronization',
    subtitle: 'Cluster State Master',
    concept: 'Measurement-Based Quantum Computing (MBQC) & Graph States',
    realLifeApplication: 'Photonic quantum computing chips (e.g. PsiQuantum) generating massive entangled cluster states for fault-tolerant optical computing.',
    instructions: 'Create a fully entangled tripartite state (|000⟩ + |111⟩)/√2 using the exact minimum gate budget.',
    qubits: 3,
    allowedGates: ['H', 'CNOT', 'X', 'Z'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 150,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Synchronized Cluster',
    },
    hint: 'Only 3 gates required: H(0), CNOT(0, 1), CNOT(1, 2).',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Game 3: Quantum Oracle Hunter (Grover Search & Molecular Docking)
// ─────────────────────────────────────────────────────────────────────────────

const ORACLE_HUNTER_LEVELS: GameLevel[] = [
  {
    levelNumber: 1,
    title: 'Superposition Chamber',
    subtitle: 'Initializing the Search Space',
    concept: 'Quantum Parallelism via Walsh-Hadamard Transform',
    realLifeApplication: 'Preparing all potential 2ⁿ drug molecule conformations simultaneously in a single quantum register.',
    instructions: 'Place all 4 basis states (|00⟩, |01⟩, |10⟩, |11⟩) into an exact equal superposition with 25% probability each.',
    qubits: 2,
    allowedGates: ['H', 'X'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 50,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 },
      targetKet: 'Uniform Superposition',
    },
    hint: 'Apply Hadamard on both q0 and q1.',
  },
  {
    levelNumber: 2,
    title: 'Phase Marking Target |11⟩',
    subtitle: 'The Quantum Oracle Tag',
    concept: 'Phase Inversion Oracle & Controlled Phase Flip',
    realLifeApplication: 'Molecular binding energy evaluation marking active candidate conformations with negative phase.',
    instructions: 'Create uniform superposition, then invert the phase of target |11⟩ using Controlled-Z decomposition (Z-CNOT-Z).',
    qubits: 2,
    allowedGates: ['H', 'Z', 'CNOT'],
    maxGates: 6,
    threeStarMaxGates: 5,
    twoStarMaxGates: 6,
    xpReward: 60,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 },
      targetKet: 'Phase-Marked |11⟩',
    },
    hint: 'Controlled-Z can be made with Z(1), CNOT(0,1), Z(1).',
  },
  {
    levelNumber: 3,
    title: 'Single-Iteration Grover Boost',
    subtitle: 'Inversion About the Average',
    concept: 'Grover Diffusion Operator & Amplitude Amplification',
    realLifeApplication: 'Amplifying target molecular state probability from 25% to 100% in a single iteration.',
    instructions: 'Construct the full 2-qubit Grover search algorithm to amplify target |11⟩ to 100% probability.',
    qubits: 2,
    allowedGates: ['H', 'Z', 'CNOT'],
    maxGates: 15,
    threeStarMaxGates: 14,
    twoStarMaxGates: 15,
    xpReward: 70,
    goal: {
      type: 'probability',
      targetProbability: { '11': 1.0 },
      targetKet: '|11⟩ (100%)',
    },
    hint: 'Uniform superposition -> Phase mark |11⟩ -> Diffusion operator (H, Z, CNOT, Z, H).',
  },
  {
    levelNumber: 4,
    title: 'Targeting State |10⟩',
    subtitle: 'Custom Molecule Conformation',
    concept: 'Oracle Synthesis for Arbitrary Bitstrings',
    realLifeApplication: 'Screening for molecules matching pharmacophore pattern 10 (donor-acceptor configuration).',
    instructions: 'Synthesize a circuit where measurement collapses deterministically onto state |10⟩ with 100% probability.',
    qubits: 2,
    allowedGates: ['X', 'H'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 80,
    goal: {
      type: 'probability',
      targetProbability: { '10': 1.0 },
      targetKet: '|10⟩ (100%)',
    },
    hint: 'Remember qubit 0 is the least significant bit (LSB). To get |10⟩, qubit 1 is 1 and qubit 0 is 0.',
  },
  {
    levelNumber: 5,
    title: 'Targeting State |01⟩',
    subtitle: 'Active Binding Pocket Selection',
    concept: 'Target State Inversion',
    realLifeApplication: 'Selecting antibody binding conformation 01.',
    instructions: 'Synthesize a circuit that produces state |01⟩ with 100% probability.',
    qubits: 2,
    allowedGates: ['X', 'H'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 80,
    goal: {
      type: 'probability',
      targetProbability: { '01': 1.0 },
      targetKet: '|01⟩ (100%)',
    },
    hint: 'Apply Pauli-X to qubit 0 to flip it to 1, leaving qubit 1 at 0.',
  },
  {
    levelNumber: 6,
    title: 'Ground Conformation Isolation',
    subtitle: 'Targeting State |00⟩',
    concept: 'Zero-Energy Ground Conformation',
    realLifeApplication: 'Identifying lowest-energy ground state conformation in protein folding simulation.',
    instructions: 'Ensure the system outputs state |00⟩ with 100% probability.',
    qubits: 2,
    allowedGates: ['X', 'H', 'Z'],
    maxGates: 3,
    threeStarMaxGates: 0,
    twoStarMaxGates: 2,
    xpReward: 90,
    goal: {
      type: 'probability',
      targetProbability: { '00': 1.0 },
      targetKet: '|00⟩ (100%)',
    },
    hint: 'The initial state starts in |00⟩! You can solve this in 0 gates or self-cancelling gates.',
  },
  {
    levelNumber: 7,
    title: 'Multi-Target Search',
    subtitle: 'Dual Molecule Lead Candidates',
    concept: 'Simultaneous Multi-Solution Amplification',
    realLifeApplication: 'Finding multiple drug leads in high-throughput virtual screening that bind to different allosteric sites.',
    instructions: 'Create a state where exactly two states (|00⟩ and |11⟩) have 50% probability each, while |01⟩ and |10⟩ are zero.',
    qubits: 2,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 100,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: 'Dual Targets (|00⟩ & |11⟩)',
    },
    hint: 'Bell state preparation gives equal 50/50 probability on |00⟩ and |11⟩.',
  },
  {
    levelNumber: 8,
    title: 'Over-Rotation Management',
    subtitle: 'Preventing Quantum Overshoot',
    concept: 'Periodic Grover Dynamics & State Demagnification',
    realLifeApplication: 'Preventing over-rotation in NISQ quantum chemistry algorithms that reduces success probability below classical random guess.',
    instructions: 'Construct a state where target |01⟩ is amplified to 100% probability.',
    qubits: 2,
    allowedGates: ['X', 'H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 110,
    goal: {
      type: 'probability',
      targetProbability: { '01': 1.0 },
      targetKet: '|01⟩',
    },
    hint: 'A single X on q0 directly sets |01⟩.',
  },
  {
    levelNumber: 9,
    title: '3-Qubit Search Space (N=8)',
    subtitle: 'Expanding the Chemical Library',
    concept: 'Exponential State Space Exploration (2³ = 8 states)',
    realLifeApplication: 'Screening 8 stereoisomers of a chiral drug compound simultaneously.',
    instructions: 'Place all 3 qubits into an equal superposition across all 8 basis states (12.5% each).',
    qubits: 3,
    allowedGates: ['H', 'X'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 120,
    goal: {
      type: 'probability',
      targetProbability: {
        '000': 0.125, '001': 0.125, '010': 0.125, '011': 0.125,
        '100': 0.125, '101': 0.125, '110': 0.125, '111': 0.125,
      },
      targetKet: '8-State Superposition',
    },
    hint: 'Apply Hadamard on all three qubits.',
  },
  {
    levelNumber: 10,
    title: 'Optimal Stopping Point',
    subtitle: 'Target Amplitude Focus',
    concept: 'Grover Rotation Angle θ = 2 arcsin(1/√N)',
    realLifeApplication: 'Calculating optimal quantum circuit depth to maximize signal-to-noise ratio before decoherence occurs.',
    instructions: 'Isolate target state |110⟩ with 100% deterministic probability.',
    qubits: 3,
    allowedGates: ['X', 'H'],
    maxGates: 4,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 130,
    goal: {
      type: 'probability',
      targetProbability: { '110': 1.0 },
      targetKet: '|110⟩ (100%)',
    },
    hint: 'Bit 0 is 0, bit 1 is 1, bit 2 is 1 -> Apply X to q1 and q2.',
  },
  {
    levelNumber: 11,
    title: 'Phase Kickback Oracle',
    subtitle: 'Ancilla-Assisted Marking',
    concept: 'Phase Kickback with Auxiliary Qubit',
    realLifeApplication: 'Evaluating complex boolean oracle formulas on dedicated ancilla lines without modifying input data registers.',
    instructions: 'Prepare inputs q0, q1 in |11⟩ and flip ancilla q2 to |1⟩.',
    qubits: 3,
    allowedGates: ['X', 'H'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 140,
    goal: {
      type: 'probability',
      targetProbability: { '111': 1.0 },
      targetKet: '|111⟩',
    },
    hint: 'Apply Pauli-X to all three qubits.',
  },
  {
    levelNumber: 12,
    title: 'High-Dimensional Drug Docking Master',
    subtitle: 'Complete Grover Synthesis',
    concept: 'Quantum Search Superiority O(√N)',
    realLifeApplication: 'Complete quantum computational drug design workflow identifying active lead molecules in high-dimensional chemical spaces.',
    instructions: 'Synthesize target state |111⟩ with 100% confidence using minimal gates.',
    qubits: 3,
    allowedGates: ['X', 'H', 'CNOT', 'Z'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 150,
    goal: {
      type: 'probability',
      targetProbability: { '111': 1.0 },
      targetKet: '|111⟩',
    },
    hint: 'X on q0, X on q1, X on q2.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Game 4: Quantum Shield: Error Defuser (Surface Codes & Error Correction)
// ─────────────────────────────────────────────────────────────────────────────

const QUANTUM_SHIELD_LEVELS: GameLevel[] = [
  {
    levelNumber: 1,
    title: 'Bit-Flip Error Detection',
    subtitle: 'Single Physical Error',
    concept: 'Pauli-X Bit Flip Noise',
    realLifeApplication: 'Cosmic ray strikes causing quasiparticle poisoning in superconducting aluminum transmon films, flipping qubit 0 to 1.',
    instructions: 'A bit-flip error (X) has flipped q0. Apply an X gate to defuse the error and restore the clean ground state |0⟩.',
    qubits: 1,
    allowedGates: ['X'],
    maxGates: 2,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 50,
    initialCircuit: { qubits: 1, gates: [{ type: 'X', qubit: 0, step: 0 }] },
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 0, y: 0, z: 1 },
      targetKet: '|0⟩ Restored',
      tolerance: 0.15,
    },
    hint: 'Applying Pauli-X twice (X² = I) cancels the error.',
  },
  {
    levelNumber: 2,
    title: '3-Qubit Repetition Encoding',
    subtitle: 'Logical Qubit Protection',
    concept: 'Repetition Code & Quantum Entanglement Redundancy',
    realLifeApplication: 'Encoding one logical qubit into 3 physical qubits (|0⟩_L = |000⟩, |1⟩_L = |111⟩) in Google Sycamore superconducting processors.',
    instructions: 'Encode logical test state (|0⟩+|1⟩)/√2 on q0 into 3 physical qubits: (|000⟩ + |111⟩)/√2.',
    qubits: 3,
    allowedGates: ['H', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 60,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Logical Repetition State',
    },
    hint: 'H on q0, CNOT(0→1), CNOT(0→2).',
  },
  {
    levelNumber: 3,
    title: 'Syndrome Parity Check',
    subtitle: 'Extracting Parity Without Collapsing Data',
    concept: 'Non-Demolition Parity Measurement',
    realLifeApplication: 'Measuring two-body stabilizer Z_i Z_j to detect errors without measuring single-qubit Z_i.',
    instructions: 'Measure the parity between physical qubits q0 and q1 using a CNOT gate.',
    qubits: 2,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 70,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: 'Parity Checked',
    },
    hint: 'H on q0, then CNOT(0→1).',
  },
  {
    levelNumber: 4,
    title: 'Single Bit-Flip Recovery',
    subtitle: 'Active Error Reversal',
    concept: 'Majority Voting Correction',
    realLifeApplication: 'Automatic hardware FPGA trigger correcting bit-flip noise before it cascades into logical failure.',
    instructions: 'Restore logical state |000⟩ from corrupted state |010⟩ by applying an X gate to the corrupted qubit.',
    qubits: 3,
    allowedGates: ['X'],
    maxGates: 2,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 80,
    initialCircuit: { qubits: 3, gates: [{ type: 'X', qubit: 1, step: 0 }] },
    goal: {
      type: 'probability',
      targetProbability: { '000': 1.0 },
      targetKet: '|000⟩ Recovered',
    },
    hint: 'Qubit 1 was flipped by noise. Apply X to qubit 1 to restore it.',
  },
  {
    levelNumber: 5,
    title: 'Edge Qubit Correction',
    subtitle: 'Boundary Noise Neutralization',
    concept: 'Surface Code Boundary Conditions',
    realLifeApplication: 'Neutralizing noise on edge qubits in planar 2D grid transmon chips (IBM Quantum Eagle / Heron).',
    instructions: 'Correct an unwanted error on physical qubit q2 to restore ground state |000⟩.',
    qubits: 3,
    allowedGates: ['X'],
    maxGates: 2,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 90,
    initialCircuit: { qubits: 3, gates: [{ type: 'X', qubit: 2, step: 0 }] },
    goal: {
      type: 'probability',
      targetProbability: { '000': 1.0 },
      targetKet: '|000⟩ Recovered',
    },
    hint: 'Apply X to qubit 2.',
  },
  {
    levelNumber: 6,
    title: 'Phase-Flip Detection',
    subtitle: 'Z-Error in Hadamard Basis',
    concept: 'Phase-Flip Code & Dual Basis Mapping',
    realLifeApplication: 'Mitigating 1/f flux noise causing pure dephasing (Tφ) in flux-tunable SQUID loops.',
    instructions: 'Map the qubit into the Hadamard basis where phase errors behave like bit flips.',
    qubits: 1,
    allowedGates: ['H', 'Z'],
    maxGates: 3,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 100,
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 1, y: 0, z: 0 },
      targetKet: '|+⟩ Basis',
      tolerance: 0.15,
    },
    hint: 'Apply Hadamard to rotate Z-axis to X-axis.',
  },
  {
    levelNumber: 7,
    title: 'Phase-Flip Recovery',
    subtitle: 'Neutralizing Phase Drift',
    concept: 'Pauli-Z Inversion',
    realLifeApplication: 'Neutralizing dynamic phase accumulation caused by magnetic flux drift in dilution fridge coils.',
    instructions: 'A Z phase flip error has inverted |+⟩ into |−⟩. Apply a Z gate to restore the state back to |+⟩.',
    qubits: 1,
    allowedGates: ['Z'],
    maxGates: 2,
    threeStarMaxGates: 1,
    twoStarMaxGates: 2,
    xpReward: 110,
    initialCircuit: { qubits: 1, gates: [{ type: 'H', qubit: 0, step: 0 }, { type: 'Z', qubit: 0, step: 1 }] },
    goal: {
      type: 'bloch_target',
      targetBloch: { x: 1, y: 0, z: 0 },
      targetKet: '|+⟩ Restored',
      tolerance: 0.15,
    },
    hint: 'Z² = I. Applying Z flips the phase back to +X.',
  },
  {
    levelNumber: 8,
    title: 'Non-Demolition Protection',
    subtitle: 'Preserving Superposition',
    concept: 'Quantum Non-Demolition (QND) Readout',
    realLifeApplication: 'Dispersive readout via microwave resonator without destroying qubit quantum state.',
    instructions: 'Prepare an entangled 2-qubit state (|00⟩ + |11⟩)/√2 and ensure neither qubit collapses to a classical state.',
    qubits: 2,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 120,
    goal: {
      type: 'probability',
      targetProbability: { '00': 0.5, '11': 0.5 },
      targetKet: 'Coherent Superposition',
    },
    hint: 'H on q0, CNOT(0→1).',
  },
  {
    levelNumber: 9,
    title: 'Double-Error Syndrome Resolution',
    subtitle: 'Correlated Noise Disambiguation',
    concept: 'Fault-Tolerant Thresholds & Correlated Errors',
    realLifeApplication: 'Resolving multi-qubit correlated errors caused by cosmic ray substrate acoustic phonon bursts.',
    instructions: 'Restore ground state |000⟩ when both qubits 0 and 1 have experienced error flips.',
    qubits: 3,
    allowedGates: ['X'],
    maxGates: 3,
    threeStarMaxGates: 2,
    twoStarMaxGates: 3,
    xpReward: 130,
    initialCircuit: {
      qubits: 3,
      gates: [
        { type: 'X', qubit: 0, step: 0 },
        { type: 'X', qubit: 1, step: 0 },
      ],
    },
    goal: {
      type: 'probability',
      targetProbability: { '000': 1.0 },
      targetKet: '|000⟩ Repaired',
    },
    hint: 'Apply X to both q0 and q1 to neutralize both errors.',
  },
  {
    levelNumber: 10,
    title: 'Stabilizer Parity Cycle',
    subtitle: 'Complete Parity Check',
    concept: 'Stabilizer Generators in Surface Codes',
    realLifeApplication: 'Executing continuous 1-microsecond stabilizer cycles to keep logical qubits alive indefinitely.',
    instructions: 'Synthesize the logical Bell state (|000⟩ + |111⟩)/√2 across 3 physical qubits.',
    qubits: 3,
    allowedGates: ['H', 'CNOT'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 140,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Protected Stabilizer State',
    },
    hint: 'H(0), CNOT(0, 1), CNOT(0, 2).',
  },
  {
    levelNumber: 11,
    title: 'Cryogenic Thermal Spike',
    subtitle: 'Multi-Qubit Emergency Recovery',
    concept: 'Cryogenic Thermalization & Fast Recovery',
    realLifeApplication: 'Surviving transient dilution refrigerator temperature spikes without losing quantum memory.',
    instructions: 'Restore |000⟩ from an initial state where all 3 qubits have been flipped by noise.',
    qubits: 3,
    allowedGates: ['X'],
    maxGates: 4,
    threeStarMaxGates: 3,
    twoStarMaxGates: 4,
    xpReward: 145,
    initialCircuit: {
      qubits: 3,
      gates: [
        { type: 'X', qubit: 0, step: 0 },
        { type: 'X', qubit: 1, step: 0 },
        { type: 'X', qubit: 2, step: 0 },
      ],
    },
    goal: {
      type: 'probability',
      targetProbability: { '000': 1.0 },
      targetKet: '|000⟩ All Cleared',
    },
    hint: 'Apply X to each of the three qubits to reset them.',
  },
  {
    levelNumber: 12,
    title: 'Fault-Tolerant Master Shield',
    subtitle: 'Complete Code Protection',
    concept: 'Fault-Tolerant Quantum Computing & Below-Threshold Scaling',
    realLifeApplication: 'Achieving exponential suppression of logical errors as code distance increases (Willow milestone).',
    instructions: 'Construct the repetition code state (|000⟩ + |111⟩)/√2 in exactly 3 gates.',
    qubits: 3,
    allowedGates: ['H', 'CNOT'],
    maxGates: 3,
    threeStarMaxGates: 3,
    twoStarMaxGates: 3,
    xpReward: 150,
    goal: {
      type: 'probability',
      targetProbability: { '000': 0.5, '111': 0.5 },
      targetKet: 'Fault-Tolerant Code',
    },
    hint: 'H(q0), CNOT(0→1), CNOT(0→2).',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Master Games Collection
// ─────────────────────────────────────────────────────────────────────────────

export const QUANTUM_GAMES: GameDef[] = [
  {
    id: 'bloch-navigator',
    title: 'Bloch Sphere Target Navigator',
    badge: 'SINGLE-QUBIT CONTROL',
    category: 'Superposition & Unitaries',
    description: 'Master microwave pulse control on superconducting transmon qubits. Steer statevectors across 3D spherical coordinates without falling into decoherence zones.',
    conceptExplanation: 'Quantum operations on single qubits correspond to continuous 3D rotations on the Bloch sphere surface. By tuning microwave frequency, amplitude, and phase, physicists drive precise quantum state transitions.',
    hardwareImplementation: 'Superconducting transmon qubits in dilution refrigerators at 15 millikelvin. Microwave pulses are transmitted via coaxial attenuator lines.',
    icon: '🧭',
    levels: BLOCH_NAVIGATOR_LEVELS,
  },
  {
    id: 'entanglement-network',
    title: 'Entanglement Repeater Network',
    badge: 'QUANTUM INTERNET',
    category: 'Entanglement & Teleportation',
    description: 'Build long-distance quantum communication links. Distribute Bell states across satellite constellations and ground repeaters to teleport quantum states.',
    conceptExplanation: 'Because quantum information cannot be cloned, long-range quantum links rely on entangled Bell pairs and entanglement swapping through repeater nodes.',
    hardwareImplementation: 'Free-space satellite laser communications (Micius satellite) and optical fiber quantum key distribution networks.',
    icon: '🛰️',
    levels: ENTANGLEMENT_NETWORK_LEVELS,
  },
  {
    id: 'oracle-hunter',
    title: 'Quantum Oracle Hunter',
    badge: 'GROVER SEARCH',
    category: 'Algorithms & Amplification',
    description: 'Screen high-dimensional molecular conformations with quadratic speedup. Mark candidate drug configurations with phase kickback and amplify with Grover diffusion.',
    conceptExplanation: 'Grover\'s algorithm achieves O(√N) search speedup by repeatedly reflecting the statevector around the marked state and the average amplitude.',
    hardwareImplementation: 'Quantum molecular docking and virtual drug screening on neutral atom and superconducting quantum processors.',
    icon: '🔬',
    levels: ORACLE_HUNTER_LEVELS,
  },
  {
    id: 'quantum-shield',
    title: 'Quantum Shield: Error Defuser',
    badge: 'SURFACE CODES',
    category: 'Fault-Tolerance & Stabilizers',
    description: 'Protect logical qubits from cosmic rays and thermal noise. Extract syndrome parities onto ancillas and defuse physical errors before decoherence strikes.',
    conceptExplanation: 'Quantum error correction spreads logical information across entangled physical qubits. Measuring stabilizer operators detects bit and phase flips without collapsing the protected state.',
    hardwareImplementation: 'Fault-tolerant superconducting surface code lattices with physical-to-logical threshold scaling (Google Sycamore & Willow).',
    icon: '🛡️',
    levels: QUANTUM_SHIELD_LEVELS,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Persistence & Scoring Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'qubitlab_quantum_games_v1'

export function loadGamesProgress(): GamesProgressState {
  if (typeof window === 'undefined') {
    return { totalXp: 0, gameProgress: {} }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { totalXp: 0, gameProgress: {} }
    return JSON.parse(raw) as GamesProgressState
  } catch {
    return { totalXp: 0, gameProgress: {} }
  }
}

export function saveGamesProgress(state: GamesProgressState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Non-fatal
  }
}

export function calculateGameStats(progress: GamesProgressState, gameId: string) {
  const game = QUANTUM_GAMES.find(g => g.id === gameId)
  if (!game) return { completedLevels: 0, totalLevels: 0, stars: 0, maxStars: 0, xp: 0 }

  const gameProg = progress.gameProgress[gameId] ?? {}
  let completedLevels = 0
  let stars = 0
  let xp = 0

  game.levels.forEach(lvl => {
    const p = gameProg[lvl.levelNumber]
    if (p && p.completed) {
      completedLevels++
      stars += p.stars
      xp += p.xpEarned
    }
  })

  return {
    completedLevels,
    totalLevels: game.levels.length,
    stars,
    maxStars: game.levels.length * 3,
    xp,
  }
}

export function isLevelUnlocked(progress: GamesProgressState, gameId: string, levelNumber: number): boolean {
  if (levelNumber === 1) return true
  const gameProg = progress.gameProgress[gameId] ?? {}
  const prevLevel = gameProg[levelNumber - 1]
  return !!prevLevel?.completed
}
