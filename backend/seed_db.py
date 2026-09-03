import asyncio
import os
import sys
import dotenv
from prisma import Prisma, Json

sys.stdout.reconfigure(encoding='utf-8')
dotenv.load_dotenv(".env")

DEFAULT_BADGES = [
    {
        "name": "First Solve",
        "description": "Solved your very first quantum circuit problem.",
        "icon": "🏆",
        "condition": {"type": "total_solved", "value": 1},
    },
    {
        "name": "3-Day Streak",
        "description": "Solved a problem three days in a row.",
        "icon": "🔥",
        "condition": {"type": "streak", "value": 3},
    },
    {
        "name": "5 Questions Solved",
        "description": "Conquered five distinct quantum problems.",
        "icon": "⚡",
        "condition": {"type": "total_solved", "value": 5},
    },
    {
        "name": "First Advanced Solve",
        "description": "Cracked your first ADVANCED difficulty problem.",
        "icon": "🌌",
        "condition": {"type": "difficulty_solved", "difficulty": "ADVANCED", "value": 1},
    },
]

DEFAULT_PROBLEMS = [
    {
        "title": "Create Superposition with Hadamard",
        "description": "Apply a Hadamard gate (H) to a qubit initialized in state |0⟩ to produce the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2.",
        "difficulty": "BEGINNER",
        "topic": "Superposition",
        "hints": ["The Hadamard gate maps basis states |0⟩ to (|0⟩+|1⟩)/√2 and |1⟩ to (|0⟩-|1⟩)/√2."],
        "isDaily": False,
        "solutionCircuit": {
            "qubits": 1,
            "gates": [{"type": "H", "qubit": 0, "step": 0}],
        },
    },
    {
        "title": "Generate Bell State |Φ+⟩",
        "description": "Construct the canonical maximally entangled 2-qubit Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2 using a Hadamard and a CNOT gate.",
        "difficulty": "BEGINNER",
        "topic": "Entanglement",
        "hints": [
            "First put qubit 0 into superposition with an H gate.",
            "Next apply a CNOT gate with control on qubit 0 and target on qubit 1.",
        ],
        "isDaily": True,
        "solutionCircuit": {
            "qubits": 2,
            "gates": [
                {"type": "H", "qubit": 0, "step": 0},
                {"type": "CNOT", "qubit": 0, "target": 1, "step": 1},
            ],
        },
    },
    {
        "title": "Quantum Bit Flip (X Gate)",
        "description": "Flip the state of qubit 0 from ground state |0⟩ to excited state |1⟩ using a Pauli-X gate.",
        "difficulty": "BEGINNER",
        "topic": "Single Qubit Gates",
        "hints": ["The Pauli-X gate acts as a quantum NOT gate."],
        "isDaily": False,
        "solutionCircuit": {
            "qubits": 1,
            "gates": [{"type": "X", "qubit": 0, "step": 0}],
        },
    },
    {
        "title": "Quantum Phase Flip (|−⟩ State)",
        "description": "Prepare the qubit in state |0⟩, create superposition |+⟩ with an H gate, and then apply a Pauli-Z gate to flip the relative phase, producing state |−⟩ = (|0⟩ - |1⟩)/√2.",
        "difficulty": "INTERMEDIATE",
        "topic": "Phase Gates",
        "hints": ["Z|0⟩ = |0⟩, but Z|1⟩ = -|1⟩, turning |+⟩ into |−⟩."],
        "isDaily": False,
        "solutionCircuit": {
            "qubits": 1,
            "gates": [
                {"type": "H", "qubit": 0, "step": 0},
                {"type": "Z", "qubit": 0, "step": 1},
            ],
        },
    },
    {
        "title": "GHZ 3-Qubit Entanglement",
        "description": "Construct the Greenberger-Horne-Zeilinger (GHZ) state (|000⟩ + |111⟩)/√2 across 3 qubits.",
        "difficulty": "ADVANCED",
        "topic": "Entanglement",
        "hints": [
            "Start with H on qubit 0.",
            "Cascade entanglement using CNOT(0 -> 1) followed by CNOT(1 -> 2).",
        ],
        "isDaily": False,
        "solutionCircuit": {
            "qubits": 3,
            "gates": [
                {"type": "H", "qubit": 0, "step": 0},
                {"type": "CNOT", "qubit": 0, "target": 1, "step": 1},
                {"type": "CNOT", "qubit": 1, "target": 2, "step": 2},
            ],
        },
    },
]

async def seed():
    db = Prisma()
    await db.connect()
    print("Connected to Neon DB. Seeding default data...")

    # 1. Seed Badges
    existing_badges = {b.name for b in await db.badge.find_many()}
    for b in DEFAULT_BADGES:
        if b["name"] not in existing_badges:
            await db.badge.create(
                data={
                    "name": b["name"],
                    "description": b["description"],
                    "icon": b["icon"],
                    "condition": Json(b["condition"]),
                }
            )
            print(f"Created badge: {b['name']}")

    # 2. Seed Problems
    created_problem_ids = []
    existing_problems = {p.title for p in await db.problem.find_many()}
    for p in DEFAULT_PROBLEMS:
        if p["title"] not in existing_problems:
            record = await db.problem.create(
                data={
                    "title": p["title"],
                    "description": p["description"],
                    "difficulty": p["difficulty"],
                    "topic": p["topic"],
                    "hints": Json(p["hints"]),
                    "isDaily": p["isDaily"],
                    "solutionCircuit": Json(p["solutionCircuit"]),
                }
            )
            created_problem_ids.append(record.id)
            print(f"Created problem: {p['title']}")
        else:
            rec = await db.problem.find_first(where={"title": p["title"]})
            if rec:
                created_problem_ids.append(rec.id)

    # 3. Seed Course
    existing_courses = await db.course.find_many()
    if not existing_courses and created_problem_ids:
        course = await db.course.create(
            data={
                "title": "Quantum Computing Foundations",
                "description": "Master single-qubit superpositions, relative phase shifts, Bell state entanglement, and 3-qubit GHZ states.",
                "difficulty": "BEGINNER",
                "order": 1,
            }
        )
        for order, pid in enumerate(created_problem_ids):
            await db.courseproblem.create(
                data={
                    "courseId": course.id,
                    "problemId": pid,
                    "orderIndex": order,
                }
            )
        print(f"Created course '{course.title}' with {len(created_problem_ids)} problems.")

    print("Seeding completed successfully!")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(seed())
