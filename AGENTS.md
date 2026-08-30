<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# QubitLab — AI-Powered Interactive Quantum Learning & Experimentation OS

## 1. Executive Summary & Vision
**QubitLab** is an interactive, gamified quantum computing workspace and learning operating system. Rather than static tutorials, every lesson in QubitLab is an interactive experiment. Circuits can be constructed visually via drag-and-drop or written in code (Qiskit, Cirq, PennyLane), simulated in real time (via backend Qiskit Aer or local in-browser matrix simulator), visualized in 3D (Bloch Spheres and 3D Quantum Lab), and guided by a context-aware AI tutor (**Qubit AI** powered by Groq LLM).

---

## 2. System Architecture

```text
                                  ┌────────────────────────┐
                                  │      Next.js 16        │
                                  │    Frontend (React)    │
                                  └───────────┬────────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │ HTTP REST          │ Local Client-Side  │ WebGL / Three.js
                         ▼                    ▼                    ▼
               ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
               │ FastAPI Backend  │  │ Local Simulator │  │   Bloch Sphere   │
               │   (Python 3.12)  │  │ (lib/simulator) │  │  & 3D Lab (R3F)  │
               └─────────┬────────┘  └─────────────────┘  └──────────────────┘
                         │
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
┌───────────────┐┌───────────────┐┌───────────────┐┌───────────────┐
│ PostgreSQL /  ││  Qiskit Aer   ││ Python Code   ││   Groq LLM    │
│  Neon DB      ││  Simulation   ││   Sandbox     ││ (GPT-OSS-120B)│
│ (Prisma ORM)  ││ (Statevector) ││ (Time-boxed)  ││ (AI Tutor/MCQ)│
└───────────────┘└───────────────┘└───────────────┘└───────────────┘
```

---

## 3. Directory & File Blueprint

### Frontend (`/` root, Next.js 16 + React 19)
- **`app/`**:
  - [`layout.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/app/layout.tsx): Root layout with metadata, viewport, dark theme fonts, and `suppressHydrationWarning` on `<html>` and `<body>`.
  - [`page.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/app/page.tsx): Main application state router managing active view (`home`, `educate`, `lab3d`, `builder`, `algorithms`, `learn`, `courses`, `dashboard`, `admin`, `login`, `signup`), auth session, current circuit, and Qubit AI copilot overlay.
  - [`globals.css`](file:///c:/Users/shriv/Desktop/qubit-lab/app/globals.css): Core design tokens, dark/light themes, typography, custom scrollbars, animations, and responsive layout classes.
- **`components/`**:
  - [`Builder.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Builder.tsx): Drag-and-drop circuit playground using `@dnd-kit/core`, step grid (up to 8 time steps, variable qubits), gate palette (`H`, `X`, `Y`, `Z`, `CNOT`, `TOFFOLI`, `MEASURE`), problem solver mode, and integrated state visualizer.
  - [`BlochSphere.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/BlochSphere.tsx) & [`BlochSphereClient.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/BlochSphereClient.tsx): 3D animated Bloch sphere rendered via `@react-three/fiber` and `@react-three/drei`, showing spherical rotation arcs, trail paths, equator/meridian rings, and dynamic state vectors.
  - [`QuantumLab3D.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/QuantumLab3D.tsx) & [`QuantumLab3DClient.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/QuantumLab3DClient.tsx): Immersive 3D quantum lab with rotating qubit core, orbital rings, floating gate orbs, particles, and interactive lighting.
  - [`StateVisualizer.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/StateVisualizer.tsx): Quantum state inspection panel displaying bitstring measurement probabilities, state amplitudes (real/imaginary), and per-qubit Bloch sphere views with step-by-step playback slider.
  - [`InteractiveLearn.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/InteractiveLearn.tsx): Guided step-by-step quantum curriculum (`LESSONS` from `lib/quantum.ts`) combining reading, interactive experiments, live quizzes, hardware architecture walkthroughs, and multi-dialect sandboxes.
  - [`Algorithms.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Algorithms.tsx): Interactive algorithm explorer for Bell States, Superdense Coding, Quantum Teleportation, Deutsch-Jozsa, Bernstein-Vazirani, Grover's Search, QFT, and Quantum Phase Estimation.
  - [`Assistant.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Assistant.tsx): Floating Qubit AI chat assistant capable of explaining quantum concepts, analyzing current circuit JSON, executing circuit modifications (`add_gate`, `remove_gate`), and generating dynamic MCQs.
  - [`CodeSandbox.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/CodeSandbox.tsx): Multi-SDK code editor supporting Qiskit, Cirq, and PennyLane dialects with client-side or backend execution.
  - [`HardwareViz.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/HardwareViz.tsx): Interactive hardware visualizer showing dilution refrigerator temperature tiers, transmon qubit coupling graphs, and classical vs quantum circuit comparisons.
  - [`Dashboard.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Dashboard.tsx): User profile, daily streaks, XP progress, level progression, unlocked badges, recent submissions, and global/weekly leaderboards.
  - [`Courses.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Courses.tsx) & [`Learn.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Learn.tsx): Categorized problem browser, daily challenge launcher, and course curricula.
  - [`Admin.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/Admin.tsx): Admin dashboard for user analytics, submission metrics, problem management, and AI quiz moderation/approval.
  - [`shared.tsx`](file:///c:/Users/shriv/Desktop/qubit-lab/components/shared.tsx): Reusable UI atoms (ErrorBox, Loading, badges, difficulty pills).
- **`lib/`**:
  - [`api.ts`](file:///c:/Users/shriv/Desktop/qubit-lab/lib/api.ts): Typed client API layer interfacing all FastAPI endpoints, JWT auth management, and session persistence in `localStorage`.
  - [`quantum.ts`](file:///c:/Users/shriv/Desktop/qubit-lab/lib/quantum.ts): Quantum math utilities (Bloch sphere coordinate reduction from statevectors, partial trace approximations), lesson definitions (`LESSONS`), and curated algorithm templates.
  - [`simulator.ts`](file:///c:/Users/shriv/Desktop/qubit-lab/lib/simulator.ts): Zero-dependency local quantum statevector simulator for instantaneous client-side evaluation without network roundtrips.
  - [`pythonSandbox.ts`](file:///c:/Users/shriv/Desktop/qubit-lab/lib/pythonSandbox.ts): In-browser mock executor for Qiskit/Cirq/PennyLane snippets when offline or before backend submission.
  - [`sounds.ts`](file:///c:/Users/shriv/Desktop/qubit-lab/lib/sounds.ts): Web Audio API synthesis for UI micro-interactions (pops, success chords, error tones).

---

### Backend (`/backend`, FastAPI + Prisma + Python 3.12)
- **`app/main.py`**: FastAPI app declaration, lifespan connection management (`connect_db`/`disconnect_db`), CORS configuration, validation handlers, and router registration.
- **`app/config.py`**: `pydantic-settings` environment configuration (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `CORS_ORIGINS`, etc.).
- **`app/database.py`**: Async Prisma client singleton lifecycle.
- **`app/security.py`**: Password hashing (bcrypt) and JWT token encoding/decoding.
- **`app/deps.py`**: FastAPI dependency injection for current authenticated user (`get_current_user`, `require_admin`).
- **`app/services/`**:
  - `quantum.py`: Qiskit Aer statevector simulation engine (`run_simulation`), probability distributions, intermediate step statevectors, and tolerance matching.
  - `sandbox.py`: Isolated, time-boxed Python execution engine with thread pool and restricted builtins.
  - `groq_client.py`: Groq OpenAI-compatible client wrapper with automated JSON fence stripping, retry logic, and typed error handling.
  - `gamification.py`: XP award calculation, leveling formulas, and streak update logic.
  - `badges.py`: Rule-based badge evaluation system evaluating user achievements on submission.
- **`app/routers/`**:
  - `auth.py`: `/auth/register`, `/auth/login`, `/auth/me`
  - `problems.py`: `/problems`, `/problems/daily`, `/problems/{id}`, `/problems/{id}/submit`
  - `courses.py`: `/courses`, `/courses/{id}`
  - `simulate.py`: `/simulate` (runs Qiskit Aer simulation on IR circuit)
  - `sandbox.py`: `/sandbox/run` (runs python snippet)
  - `leaderboard.py`: `/leaderboard` (all-time and weekly XP rankings)
  - `users.py`: `/users/me/stats`, `/users/me/badges`, `/users/me/submissions`
  - `questions.py`: `/questions`, `/questions/{id}/attempt`
  - `ai.py`: `/ai/chat` (circuit-aware tutor), `/ai/quiz/generate` (dynamic MCQ generator)
  - `admin.py`: `/admin/analytics`, `/admin/problems`, `/admin/courses`, `/admin/questions/unapproved`
  - `gates.py`: `/gates` (custom matrix gate definitions)
- **`prisma/schema.prisma`**: PostgreSQL database schema.

---

## 4. Canonical Data Models & Circuit IR

### Circuit Intermediate Representation (IR)
All circuit states between Frontend, Backend, Qiskit, and AI adhere to this structure:
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
- **Gate Types**: `H`, `X`, `Y`, `Z` (1-qubit), `CNOT` (`qubit`=control, `target`=target), `TOFFOLI` (`controls`=[c1, c2], `target`=target), `MEASURE` (`qubit`=index).
- **Time Steps**: `step` is 0-indexed column in the visual wire grid. Multiple independent single-qubit gates can share the same `step`.

### Database Schema Summary (Prisma)
- **`User`**: ID, email, passwordHash, name, role (`STUDENT` | `ADMIN`), xp, level, streak, lastActiveDate, createdAt.
- **`Problem`**: ID, title, description, difficulty (`BEGINNER` | `INTERMEDIATE` | `ADVANCED`), topic, solutionCircuit (Json), isDaily, scheduledDate, hints (Json).
- **`Course`** & **`CourseProblem`**: Structured multi-module curricula with ordered problems.
- **`Submission`**: User ID, problem ID, circuitJson, isCorrect, xpEarned, timestamp.
- **`Badge`** & **`UserBadge`**: Achievements with condition triggers.
- **`Question`** & **`QuestionAttempt`**: MCQs (AI-generated or curated) with attempt history for analytics.
- **`Gate`**: Custom user-defined unitary matrix gates.

---

## 5. Coding Conventions & Best Practices

### TypeScript & React (Frontend)
1. **App Router & Client Boundary**: Use `'use client'` on interactive views and 3D visualizers. Keep `app/layout.tsx` as server component with `suppressHydrationWarning` on `<html>` and `<body>`.
2. **State & Audio**: Maintain pure state transitions. Call sound triggers (`playPopUp`, `playSuccess`) inside event handlers, not in render bodies.
3. **Responsive & Theme-safe**: Rely on CSS variables defined in `app/globals.css` (`var(--bg)`, `var(--panel)`, `var(--orange)`, `var(--blue)`, `var(--green)`).
4. **Three.js / Canvas**: Always wrap Three.js canvases in `<Suspense fallback={...}>` and isolate in client components (`*Client.tsx`) to prevent SSR canvas initialization failures.

### Python & FastAPI (Backend)
1. **Pydantic Schemas**: Keep request/response schemas in `app/schemas/` mirroring Prisma models.
2. **Database Transactions**: Use async Prisma operations `await db.user.find_unique(...)`.
3. **Safe Execution**: All sandbox execution must pass through `app.services.sandbox` with timeouts and forbidden token checks (`os`, `subprocess`, `open`).
4. **AI Robustness**: LLM calls through `groq_client.py` must enforce JSON output format and parse defensive markdown code fences.

---

## 6. How to Run Locally

### Frontend
```bash
npm run dev
# Running on http://localhost:3000
```

### Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# Running on http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Prisma Client Regeneration
```powershell
cd backend
$env:PATH = "$pwd\venv\Scripts;$env:PATH"
.\venv\Scripts\python.exe -m prisma generate --schema=prisma\schema.prisma
```

---

## 7. Project Memory & Progress Log

### Current State
- ✅ Next.js 16 + Webpack frontend configured with 3D Bloch Sphere, Circuit Builder, Code Sandbox, Algorithms Library, Interactive Curriculum, and AI Copilot.
- ✅ FastAPI backend configured with Qiskit Aer simulation, Groq LLM integration, Prisma PostgreSQL models, and Sandbox runner.
- ✅ Environment templates created (`.env.example` at root and `backend/`).
- ✅ Resolved Windows Prisma generation and browser extension attribute hydration warnings.

### Active Decisions & Guidelines
- **Zero-Network Simulation**: Small visual adjustments in builder run against `lib/simulator.ts` for 60fps fluidity; official challenge submissions and complex circuits execute against backend `Qiskit Aer` for full physical accuracy.
- **AI Tool Calling**: AI responses adhere strictly to `{ type: "explanation", text: "..." }` or `{ type: "action", action: "add_gate"|"remove_gate", gate: {...} }`.

### Future Roadmap
- 🔲 Real hardware provider connector (IBM Quantum cloud API key integration).
- 🔲 Quantum Error Correction & Noise Models (Depolarizing, Amplitude Damping channels).
- 🔲 Advanced multi-qubit entanglement density matrix 3D visualization.
