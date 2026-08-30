"""Builds and runs Qiskit circuits from the frontend's step-based gate schema."""

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from app.schemas.simulate import GateOp, SimulateResult

MAX_QUBITS = 12


def _apply_gate(circuit: QuantumCircuit, gate: GateOp) -> None:
    if gate.type == "H":
        circuit.h(gate.qubit)
    elif gate.type == "X":
        circuit.x(gate.qubit)
    elif gate.type == "Y":
        circuit.y(gate.qubit)
    elif gate.type == "Z":
        circuit.z(gate.qubit)
    elif gate.type == "CNOT":
        circuit.cx(gate.qubit, gate.target)
    elif gate.type == "TOFFOLI":
        c1, c2 = gate.controls
        circuit.ccx(c1, c2, gate.target)
    elif gate.type == "MEASURE":
        # Measurement is recorded for the UI timeline only. Statevector
        # simulation stays unitary throughout so intermediate/final states
        # remain well-defined; measurement probabilities are derived from
        # the final statevector instead of collapsing it mid-circuit.
        return
    else:
        raise ValueError(f"Unsupported gate type: {gate.type}")


def _validate_gates(qubits: int, gates: list[GateOp]) -> None:
    for gate in gates:
        indices = [gate.qubit]
        if gate.target is not None:
            indices.append(gate.target)
        if gate.controls:
            indices.extend(gate.controls)
        for idx in indices:
            if idx < 0 or idx >= qubits:
                raise ValueError(f"Qubit index {idx} is out of range for a {qubits}-qubit circuit")
        if gate.type == "CNOT" and gate.qubit == gate.target:
            raise ValueError("CNOT control and target qubits must differ")
        if gate.type == "TOFFOLI":
            c1, c2 = gate.controls
            if len({c1, c2, gate.target}) != 3:
                raise ValueError("TOFFOLI controls and target must all be distinct")


def _statevector_of(qubits: int, gates: list[GateOp]) -> Statevector:
    circuit = QuantumCircuit(qubits)
    for gate in sorted(gates, key=lambda g: (g.step, g.qubit)):
        _apply_gate(circuit, gate)

    simulator = AerSimulator(method="statevector")
    circuit.save_statevector()
    job = simulator.run(circuit)
    result = job.result()
    return result.get_statevector(circuit)


def _to_complex_list(sv: Statevector) -> list[dict]:
    return [{"re": complex(amp).real, "im": complex(amp).imag} for amp in sv.data]


def _probabilities(sv: Statevector) -> dict[str, float]:
    n = sv.num_qubits
    probs = sv.probabilities()
    return {format(i, f"0{n}b"): float(p) for i, p in enumerate(probs)}


def run_simulation(qubits: int, gates: list[GateOp]) -> SimulateResult:
    if qubits > MAX_QUBITS:
        raise ValueError(f"Circuits are limited to {MAX_QUBITS} qubits")
    _validate_gates(qubits, gates)

    ordered_gates = sorted(gates, key=lambda g: (g.step, g.qubit))
    steps = sorted({g.step for g in ordered_gates}) if ordered_gates else []

    intermediate: list[list[dict]] = []
    for step in steps:
        prefix = [g for g in ordered_gates if g.step <= step]
        sv = _statevector_of(qubits, prefix)
        intermediate.append(_to_complex_list(sv))

    final_sv = _statevector_of(qubits, ordered_gates)

    return SimulateResult(
        finalStatevector=_to_complex_list(final_sv),
        probabilities=_probabilities(final_sv),
        intermediateStatevectors=intermediate,
    )


def probabilities_match(a: dict[str, float], b: dict[str, float], tolerance: float = 1e-4) -> bool:
    keys = set(a) | set(b)
    for key in keys:
        if abs(a.get(key, 0.0) - b.get(key, 0.0)) > tolerance:
            return False
    return True
