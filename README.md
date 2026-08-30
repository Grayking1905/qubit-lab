# QubitLab

An AI-powered interactive quantum learning platform — inspired by [Q-CTRL Black Opal](https://q-ctrl.com/black-opal/educators). Learn quantum computing through interactive lessons, drag-and-drop circuit building, Three.js visualizations, and real Qiskit simulation.

## Features

- **Educate** — Interactive learning modules with embedded experiments (superposition, entanglement, measurement)
- **3D Lab** — Immersive Three.js quantum environment with orbiting qubits and gate visualizations
- **Quantum Playground** — Drag-and-drop circuit builder with pop sound effects and Bloch sphere visualization
- **Algorithms** — Pre-built Deutsch-Jozsa, Grover, Bell state, and teleportation circuits
- **AI Tutor** — Groq-powered quantum assistant that understands your circuit
- **Backend** — FastAPI + Qiskit Aer simulation, PostgreSQL + Prisma, gamification (XP, badges, streaks)

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # configure DATABASE_URL, JWT_SECRET, GROQ_API_KEY
prisma generate
prisma db push
uvicorn app.main:app --reload --port 8000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in the root `.env`.

## Project Structure

```
app/              Next.js pages & layout
components/       UI — Builder, BlochSphere, InteractiveLearn, QuantumLab3D, Algorithms
lib/              API client, quantum math, sound effects
backend/          FastAPI + Qiskit quantum engine
docs/             Project specification
```

## Tech Stack

**Frontend:** Next.js 16, TypeScript, Tailwind CSS, Three.js (@react-three/fiber), Framer Motion, @dnd-kit

**Backend:** FastAPI, Qiskit Aer, Prisma, PostgreSQL, Groq AI
