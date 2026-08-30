# CLAUDE.md — QubitLab Project Blueprint & Architecture Guide

## 1. Project Overview
**QubitLab** is an interactive, gamified quantum computing workspace and learning operating system.
- **Frontend**: Next.js 16 (App Router, Webpack), TypeScript, React 19, Tailwind CSS, Framer Motion, `@dnd-kit/core`, Three.js (`@react-three/fiber`, `@react-three/drei`), Web Audio API.
- **Backend**: FastAPI 0.115, Python 3.12, Prisma ORM (`prisma-client-py`), PostgreSQL (Neon DB), Qiskit 1.3.1 & Qiskit Aer 0.15.1, Groq LLM API (`openai/gpt-oss-120b`).

---

## 2. Quick Command Reference

```bash
# Frontend (Root)
npm run dev                  # Start Next.js dev server on http://localhost:3000
npm run build                # Production build validation
npm run lint                 # Run linter

# Backend (PowerShell in /backend)
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000  # Start FastAPI on http://localhost:8000
# OpenAPI Docs: http://localhost:8000/docs

# Prisma Commands (in /backend)
$env:PATH = "$pwd\venv\Scripts;$env:PATH"
.\venv\Scripts\python.exe -m prisma generate --schema=prisma\schema.prisma # Regenerate client
.\venv\Scripts\prisma db push --schema=prisma\schema.prisma               # Sync schema with DB
```

---

## 3. Directory Map & File Responsibilities

```
qubit-lab/
├── app/
│   ├── layout.tsx           # Root HTML layout with suppressHydrationWarning & font imports
│   ├── page.tsx             # Main client orchestrator managing views (home, builder, lab3d, etc.)
│   └── globals.css          # Design system, CSS variables, dark/light theme, typography
├── components/
│   ├── Builder.tsx          # Drag-and-drop circuit builder (@dnd-kit) with 8 time steps
│   ├── BlochSphere.tsx      # 3D Bloch sphere vector visualizer (Three.js/R3F)
│   ├── BlochSphereClient.tsx# Dynamic client wrapper for BlochSphere
│   ├── QuantumLab3D.tsx     # 3D interactive quantum lab scene
│   ├── StateVisualizer.tsx  # Bitstring measurement probabilities, amplitudes & per-qubit Bloch
│   ├── InteractiveLearn.tsx # Multi-step interactive curriculum with embedded experiments & quizzes
│   ├── Algorithms.tsx       # Pre-configured algorithms (Bell, Teleportation, Grover, QFT, etc.)
│   ├── Assistant.tsx        # Qubit AI copilot sidebar (circuit-aware chat & dynamic quizzes)
│   ├── CodeSandbox.tsx      # Multi-SDK code lab (Qiskit, Cirq, PennyLane)
│   ├── HardwareViz.tsx      # Dilution fridge & transmon coupling topology visualizations
│   ├── Dashboard.tsx        # User profile, streak counters, XP level progress, achievements
│   ├── Courses.tsx          # Course progression tracks
│   ├── Learn.tsx            # Problem catalog and daily challenges
│   ├── Admin.tsx            # Admin analytics, problem editor, AI question approval
│   └── shared.tsx           # ErrorBox, Loading spinners, difficulty pills
├── lib/
│   ├── api.ts               # Typed client API interfacing FastAPI endpoints & JWT session management
│   ├── quantum.ts           # Quantum math (statevector to Bloch reduction), LESSONS dataset
│   ├── simulator.ts         # Fast matrix-free client-side quantum statevector simulator
│   ├── pythonSandbox.ts     # Client-side mock python execution for instant feedback
│   └── sounds.ts            # Web Audio API sound synthesis (pops, success, error)
├── backend/
│   ├── prisma/schema.prisma # Database schema (User, Problem, Course, Submission, Badge, Question)
│   ├── requirements.txt     # Backend python dependencies
│   └── app/
│       ├── main.py          # FastAPI app entry point, CORS, lifespan, exception handlers
│       ├── config.py        # pydantic-settings config (DB URL, JWT Secret, Groq API key)
│       ├── database.py      # Async Prisma client lifecycle
│       ├── security.py      # Password hashing (bcrypt) & JWT token handling
│       ├── deps.py          # Auth dependencies (get_current_user, require_admin)
│       ├── routers/         # REST API endpoints (auth, problems, courses, simulate, ai, etc.)
│       ├── schemas/         # Pydantic v2 request/response models
│       └── services/
│           ├── quantum.py   # Qiskit Aer statevector simulation & validation
│           ├── sandbox.py   # Sandboxed Python code executor
│           ├── groq_client.py # Defensive Groq LLM client wrapper
│           ├── gamification.py # XP, leveling, and streak progression
│           └── badges.py    # Achievement unlock evaluation
```

---

## 4. Key Data Formats & Protocols

### Circuit Intermediate Representation (IR)
```typescript
interface GateOp {
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'TOFFOLI' | 'MEASURE'
  qubit: number            // Primary qubit or control qubit for CNOT
  target?: number | null   // Target qubit for CNOT / TOFFOLI
  controls?: number[] | null // Control qubits for TOFFOLI [c1, c2]
  step: number             // 0-based time step in circuit grid
}

interface Circuit {
  qubits: number           // Number of qubits (1 to 12)
  gates: GateOp[]          // Ordered list of gate operations
}
```

### AI Response Protocol
The Qubit AI copilot returns strict JSON conforming to:
1. **Explanation**:
   ```json
   { "type": "explanation", "text": "The Hadamard gate places |0> into an equal superposition..." }
   ```
2. **Circuit Modification Action**:
   ```json
   { "type": "action", "action": "add_gate", "gate": { "type": "H", "qubit": 0, "step": 0 } }
   ```

---

## 5. Coding Conventions

- **Next.js & React**:
  - Always mark client components with `'use client'`.
  - Add `suppressHydrationWarning` to top-level container tags affected by browser extensions.
  - Wrap Three.js / Canvas components in Suspense boundaries.
- **Backend / Python**:
  - Type-annotate all function signatures.
  - Keep business logic in `app/services/` and routing in `app/routers/`.
  - All DB queries must be async and use Prisma client.
  - LLM calls must use `chat_completion_json` with retry handling.

---

## 6. Memory & Project Tracker

| Feature / Area | Status | Notes |
| :--- | :--- | :--- |
| **Interactive Circuit Builder** | ✅ Complete | Drag & drop, 8 steps, sound effects, gate palette |
| **3D Bloch Sphere & 3D Lab** | ✅ Complete | R3F, smooth slerp vector rotation, orbital animations |
| **Local + Backend Simulation** | ✅ Complete | Instant client simulator (`lib/simulator.ts`) + Qiskit Aer backend |
| **Multi-SDK Code Lab** | ✅ Complete | Qiskit, Cirq, PennyLane dialects supported |
| **Qubit AI Assistant** | ✅ Complete | Groq integration, circuit inspection, dynamic MCQ generation |
| **Auth & Gamification** | ✅ Complete | JWT auth, XP, level scaling, streaks, badge engine |
| **Course & Problem Engine** | ✅ Complete | Interactive curricula, problem submissions, daily challenges |
| **Admin Dashboard** | ✅ Complete | User stats, problem CRUD, AI question moderation |
| **Hardware Noise Simulation** | ⏳ Roadmap | Planned NISQ decoherence & noise channel modeling |
