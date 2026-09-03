# QubitLab Project Memory & Progress Log

## Active Architecture & Technology Stack
- **Frontend**: Next.js 16 (Webpack, App router), React 19, TypeScript, Tailwind CSS, Framer Motion, `@dnd-kit/core`, `@react-three/fiber`, `@react-three/drei`, Three.js.
- **Backend**: FastAPI 0.115, Python 3.12, Prisma Client Python 0.15.0, PostgreSQL (Neon DB), Qiskit 1.3.1, Qiskit Aer 0.15.1, Groq LLM API (`openai/gpt-oss-120b`).
- **Simulators**:
  - Client: Matrix-free statevector engine in `lib/simulator.ts` for instant 60fps UI feedback.
  - Server: `Qiskit Aer` statevector simulation in `backend/app/services/quantum.py`.
  - Sandbox: Time-boxed Python executor in `backend/app/services/sandbox.py` and mock executor in `lib/pythonSandbox.ts`.

---

## Key Technical Decisions & Design Patterns
1. **Circuit IR Isolation**: The frontend and backend communicate strictly using the canonical JSON format `{ qubits: number, gates: GateOp[] }`.
2. **Hydration Protection**: Added `suppressHydrationWarning` on `<html>` and `<body>` in `app/layout.tsx` to handle browser extension attribute injection (`bis_skin_checked`, `bis_register`).
3. **Windows Prisma Generation**: On Windows, generating the Prisma client requires `backend/venv/Scripts` in the environment `PATH` (`$env:PATH = "$pwd\venv\Scripts;$env:PATH"`) so Node/Prisma can find `prisma-client-py.exe`.
4. **Defensive Groq Client**: Strip markdown fences (````json ... ````) automatically and retry once with stricter reminder if response is not valid JSON.

---

## Milestone & Feature Status

### ✅ Completed
- [x] Initial full project scaffold and Git repository push to branch `project-setup`.
- [x] Comprehensive root and backend `.gitignore` rules (preventing secrets, venvs, and build outputs from being tracked).
- [x] Interactive Circuit Builder (`components/Builder.tsx`) with `@dnd-kit` and step grid.
- [x] 3D Bloch Sphere (`components/BlochSphere.tsx`) and 3D Quantum Lab (`components/QuantumLab3D.tsx`) using Three.js / R3F.
- [x] Multi-SDK Code Sandbox (`components/CodeSandbox.tsx`) supporting Qiskit, Cirq, and PennyLane.
# QubitLab Project Memory & Progress Log

## Active Architecture & Technology Stack
- **Frontend**: Next.js 16 (Webpack, App router), React 19, TypeScript, Tailwind CSS, Framer Motion, `@dnd-kit/core`, `@react-three/fiber`, `@react-three/drei`, Three.js.
- **Backend**: FastAPI 0.115, Python 3.12, Prisma Client Python 0.15.0, PostgreSQL (Neon DB `ep-sweet-pond-b3dor0tx`), Qiskit 1.3.1, Qiskit Aer 0.15.1, Groq LLM API (`openai/gpt-oss-120b`).
- **Simulators**:
  - Client: Matrix-free statevector engine in `lib/simulator.ts` for instant 60fps UI feedback.
  - Server: `Qiskit Aer` statevector simulation in `backend/app/services/quantum.py`.
  - Sandbox: Time-boxed Python executor in `backend/app/services/sandbox.py` and mock executor in `lib/pythonSandbox.ts`.

---

## Key Technical Decisions & Design Patterns
1. **Circuit IR Isolation**: The frontend and backend communicate strictly using the canonical JSON format `{ qubits: number, gates: GateOp[] }`.
2. **Hydration Protection**: Added `suppressHydrationWarning` on `<html>` and `<body>` in `app/layout.tsx` to handle browser extension attribute injection (`bis_skin_checked`, `bis_register`).
3. **Windows Prisma Generation**: On Windows, generating the Prisma client requires `backend/venv/Scripts` in the environment `PATH` (`$env:PATH = "$pwd\venv\Scripts;$env:PATH"`) so Node/Prisma can find `prisma-client-py.exe`.
4. **Defensive Groq Client**: Strip markdown fences (````json ... ````) automatically and retry once with stricter reminder if response is not valid JSON.

---

## Milestone & Feature Status

### ✅ Completed
- [x] Initial full project scaffold and Git repository push to branch `project-setup`.
- [x] Comprehensive root and backend `.gitignore` rules (preventing secrets, venvs, and build outputs from being tracked).
- [x] Interactive Circuit Builder (`components/Builder.tsx`) with `@dnd-kit` and step grid.
- [x] 3D Bloch Sphere (`components/BlochSphere.tsx`) and 3D Quantum Lab (`components/QuantumLab3D.tsx`) using Three.js / R3F.
- [x] Multi-SDK Code Sandbox (`components/CodeSandbox.tsx`) supporting Qiskit, Cirq, and PennyLane.
- [x] Interactive Curriculum & Hardware Explorer (`components/InteractiveLearn.tsx`, `components/HardwareViz.tsx`).
- [x] Embedded Qubit AI Copilot (`components/Assistant.tsx`, `backend/app/routers/ai.py`).
- [x] Gamification, XP progression, streak tracking, and achievement badges (`backend/app/services/gamification.py`, `backend/app/services/badges.py`).
- [x] Admin dashboard for user metrics and AI question review (`components/Admin.tsx`, `backend/app/routers/admin.py`).
- [x] Complete documentation & instant-context files: `AGENTS.md`, `AGENT.md`, `CLAUDE.md`, `.agents/memory.md`.
- [x] Custom project agent skills in `.agents/skills/`.
### Current State
- ✅ Next.js 16 + Webpack frontend configured with 3D Bloch Sphere, Circuit Builder, Code Sandbox, Algorithms Library, Interactive Curriculum, and AI Copilot.
- ✅ Quantum Algorithms Laboratory with 10+ algorithms, dynamic step scrubber, pedagogical step cards, and 3D Quantum Stage (`Algorithm3DVisualizerClient`).
- ✅ Dedicated Quantum Games Arena in Playground: Circuit Studio toggle removed, dynamic multi-qubit controls (`+ Add Qubit`, `- Remove Qubit`), active target qubit selector, multi-wire interactive timeline, and upgraded 3D visual models with particle dust and flowing laser packets.
- ✅ FastAPI backend configured with Qiskit Aer simulation, Groq LLM integration, Prisma PostgreSQL models, and Sandbox runner.

### ⏳ Upcoming Roadmap & Enhancements
- [ ] IBM Quantum hardware cloud execution connector.
- [ ] Quantum noise models & decoherence channel simulation.
- [ ] Real-time collaborative multiplayer quantum circuits via WebSockets.
