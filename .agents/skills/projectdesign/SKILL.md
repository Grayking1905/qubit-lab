---
name: projectdesign
description: Design system, UI/UX aesthetics, color tokens, 3D visualization guidelines, and frontend/backend coding conventions for QubitLab.
---

# QubitLab Design System & Coding Style Guide

Use this skill whenever creating, styling, or refactoring UI components, pages, visualizers, API endpoints, or backend logic in QubitLab.

---

## 1. Visual Aesthetics & Design Philosophy

QubitLab is designed as an **Interactive Quantum Learning & Experimentation OS** — not a static tutorial blog. The design language combines high-contrast obsidian dark mode with glowing quantum orbital accents, smooth physics-based micro-interactions, and 3D WebGL visualizations.

### Core Color Tokens & CSS Variables

| Token | Dark Theme (Default) | Light Theme | Usage |
| :--- | :--- | :--- | :--- |
| `--bg` | `#11100e` (Obsidian Charcoal) | `#f5f1e8` | Global page background |
| `--panel` | `#191714` (Deep Earth) | `#fffdf7` | Cards, sidebars, modal containers |
| `--panel2` | `#211e1a` (Elevated Panel) | `#eee8dc` | Secondary chips, active row states |
| `--line` | `#35312b` (Subtle Border) | `#d8d0c3` | Dividers, circuit wire tracks |
| `--text` | `#f2ead9` (Cream White) | `#24211d` | Primary headings, body copy |
| `--muted` | `#a29a8c` (Muted Warm Grey)| `#766f66` | Secondary labels, descriptions |
| `--orange` | `#f47c45` (Quantum Blaze) | `#d95f2c` | Brand accent, H-gate, primary CTAs |
| `--orange2` | `#ffb478` (Warm Amber) | `#ffb478` | Statevector glow, Bloch tips |
| `--blue` | `#79a9d9` (Cyan Resonance) | `#79a9d9` | X-gate, measure nodes, phase links |
| `--pink` | `#e38d9b` (Rose Entangle) | `#e38d9b` | CNOT controls, Advanced difficulty |
| `--green` | `#87b89a` (Emerald Coherence)| `#87b89a` | Success states, correct answers, Z-gate |
| `--radius` | `14px` | `14px` | Standard border radius |

---

## 2. Typography & Text Hierarchy

1. **Headings**:
   - Uses tight letter-spacing (`letter-spacing: -2px` to `-3px`) and responsive scaling (`clamp(38px, 5vw, 68px)`).
   - Highlight key words using `<em>...</em>` styled with `color: var(--orange); font-style: normal;`.
2. **Eyebrows & Metadata**:
   - Monospace font (`ui-monospace, SFMono-Regular, monospace`), `letter-spacing: 3px`, `font-size: 10px`, uppercase with `color: var(--orange)`.
3. **Quantum Ket & Math Notation**:
   - Render states using clean unicode: $|0\rangle$, $|1\rangle$, $|+\rangle$, $|-\rangle$, $|\Phi^+\rangle$, $(|00\rangle + |11\rangle)/\sqrt{2}$.

---

## 3. UI Components & Layout Blueprints

### Buttons & Interactive Atoms
- **Primary Pill (`.pill-btn`)**: `background: var(--orange); color: #21150f; font-weight: 700; border-radius: 8px;`
- **Secondary Outline (`.outline-btn`)**: `background: transparent; border: 1px solid var(--line); color: var(--text);`
- **Icon Button (`.icon-btn`)**: Circular `34px x 34px` button with subtle border and centered SVG icon.
- **Difficulty Badges**:
  - `BEGINNER`: Orange accent (`.orange`)
  - `INTERMEDIATE`: Blue accent (`.blue`)
  - `ADVANCED`: Pink accent (`.pink`)

### Circuit Builder Grid
- Grid with variable qubits (rows) and 8 time steps (columns).
- Drop cells (`.grid-cell`) styled with dashed line borders, transitioning to solid `var(--orange)` with glow when filled.
- Controls & Targets: Visual lines connect control qubits to target qubits for CNOT and Toffoli.

### 3D Visualizations (Three.js & R3F)
- Isolate Canvas scenes inside `*Client.tsx` components with `'use client'`.
- Wrap Canvas inside `<Suspense fallback={<Loading />}>`.
- Set background to `#0a0908` with subtle fog (`fog attach="fog" args={['#0a0908', 4, 12]}`).
- Use smooth spherical interpolation (`slerp`) for statevector vector transitions.

### Web Audio Micro-Interactions (`lib/sounds.ts`)
- `playPopUp()`: Triggered on gate drag start or button press.
- `playPopDown()`: Triggered on gate drop or reset.
- `playSuccess()`: Triggered on correct problem / quiz submission.
- `playError()`: Triggered on incorrect submission.

---

## 4. Frontend Coding Conventions (TypeScript / React 19 / Next.js 16)

1. **Client Components**: Always include `'use client'` on interactive views (`Builder.tsx`, `Assistant.tsx`, `BlochSphere.tsx`, etc.).
2. **Hydration Protection**: Never render server/client branching (`typeof window !== 'undefined'`) directly in initial markup. Ensure `<html>` and `<body>` in `app/layout.tsx` have `suppressHydrationWarning`.
3. **Type Safety**: All API requests and circuit data must use strict TypeScript interfaces from `lib/api.ts`.
4. **Dual Simulation Architecture**:
   - Use `simulateLocal(circuit)` from `lib/simulator.ts` for instantaneous client-side UI and Bloch sphere updates.
   - Call backend `/simulate` or `/problems/{id}/submit` for official problem verifications against Qiskit Aer.

---

## 5. Backend Coding Conventions (FastAPI / Python 3.12 / Prisma)

1. **Routers & Dependency Injection**:
   - Endpoints are grouped in `backend/app/routers/<resource>.py`.
   - Protect authenticated endpoints using `user: User = Depends(get_current_user)` or `admin: User = Depends(require_admin)`.
2. **Database Queries**:
   - Always async using singleton `db` from `app.database`.
   - Example: `await db.problem.find_unique(where={"id": problem_id})`.
3. **AI Integration**:
   - Use `chat_completion_json(system_prompt, messages)` from `app.services.groq_client`.
   - Enforce JSON-only responses and handle markdown code fence stripping defensively.
4. **Sandbox Execution**:
   - All arbitrary code evaluation must run through `app.services.sandbox.execute()` with thread pool timeouts and restricted builtins.
