---
name: qubitlab-quantum-circuit
description: Guide and cheat sheet for quantum circuit design, IR transformations, Qiskit/Cirq/PennyLane dialects, statevectors, and Bloch sphere math in QubitLab.
---

# QubitLab Quantum Circuit Skill

Use this skill when designing, inspecting, modifying, or testing quantum circuits, algorithms, or simulations in QubitLab.

## 1. Circuit Intermediate Representation (IR)
All quantum circuits in QubitLab follow this structure:

```json
{
  "qubits": 2,
  "gates": [
    { "type": "H", "qubit": 0, "step": 0 },
    { "type": "CNOT", "qubit": 0, "target": 1, "step": 1 },
    { "type": "MEASURE", "qubit": 0, "step": 2 }
  ]
}
```

### Supported Gate Types
- `H`: Hadamard gate (creates superposition: $|0\rangle \to \frac{|0\rangle + |1\rangle}{\sqrt{2}}$).
- `X`: Pauli-X gate (bit-flip: $|0\rangle \leftrightarrow |1\rangle$).
- `Y`: Pauli-Y gate (bit + phase flip: $|0\rangle \to i|1\rangle, |1\rangle \to -i|0\rangle$).
- `Z`: Pauli-Z gate (phase flip: $|1\rangle \to -|1\rangle$).
- `CNOT`: Controlled-NOT (`qubit` is control, `target` is target).
- `TOFFOLI`: Controlled-Controlled-NOT (`controls` is `[c1, c2]`, `target` is target).
- `MEASURE`: Measurement marker on `qubit`.

## 2. Dialect Mapping

| Gate | Qiskit | Cirq | PennyLane |
| :--- | :--- | :--- | :--- |
| **H** | `qc.h(0)` | `cirq.H(q0)` | `qml.Hadamard(wires=0)` |
| **X** | `qc.x(0)` | `cirq.X(q0)` | `qml.PauliX(wires=0)` |
| **Y** | `qc.y(0)` | `cirq.Y(q0)` | `qml.PauliY(wires=0)` |
| **Z** | `qc.z(0)` | `cirq.Z(q0)` | `qml.PauliZ(wires=0)` |
| **CNOT** | `qc.cx(0, 1)` | `cirq.CNOT(q0, q1)` | `qml.CNOT(wires=[0, 1])` |
| **TOFFOLI** | `qc.ccx(0, 1, 2)` | `cirq.TOFFOLI(q0, q1, q2)` | `qml.Toffoli(wires=[0, 1, 2])` |
| **Measure** | `qc.measure(0, 0)` | `cirq.measure(q0, key='m0')` | `qml.sample()` / `qml.probs()` |

## 3. Simulation & Validation
- **Local Simulation**: Use `lib/simulator.ts` -> `simulateLocal(circuit)` for zero-latency client evaluation.
- **Backend Simulation**: Use `backend/app/services/quantum.py` -> `run_simulation(qubits, gates)` via POST `/simulate`.
- **Bloch Sphere Reduction**: Use `lib/quantum.ts` -> `blochFromStatevector(sv, qubit, totalQubits)`.
