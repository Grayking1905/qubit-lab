<div align="center">

# ⚛️ QubitLab

### Next-Generation AI-Powered Interactive Quantum Learning & Simulation Operating System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Qiskit Aer](https://img.shields.io/badge/Qiskit-Aer-6929C4?style=for-the-badge&logo=ibm)](https://qiskit.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Groq AI](https://img.shields.io/badge/Groq-AI%20Tutor-F55036?style=for-the-badge)](https://groq.com/)

<p align="center">
  <b>QubitLab</b> transforms abstract quantum mechanics into intuitive, gamified, and tactile experiments. Build circuits with visual drag-and-drop or code (Qiskit, Cirq, PennyLane), simulate statevectors in real time, inspect multi-qubit states on 3D Bloch Spheres, conquer interactive games, and learn with an AI-native copilot.
</p>

</div>

---

## 🌟 Key Features

### 🕹️ Quantum Games Arena
- **Gamified Quantum Mechanics**: Learn fundamental concepts through 10+ progressive challenge levels.
- **Hands-on Experimentation**: Add ancilla qubits, apply single and multi-qubit gates, and adjust time steps on an interactive wire grid.
- **Live 3D Feedback**: Watch target and current quantum state vectors converge in real time with audio-tactile rewards, XP gains, and unlockable achievements.

### ⚡ Circuit Studio (Drag-and-Drop Playground)
- **Fluid Wire Grid**: Drag, reorder, and configure gates with `@dnd-kit` across multi-qubit registers and time steps.
- **Comprehensive Gate Palette**: Single-qubit unitaries (`H`, `X`, `Y`, `Z`), entangling gates (`CNOT`, `TOFFOLI`), and projective `MEASURE`.
- **Hybrid Simulation Engine**:
  - **Zero-Latency In-Browser Simulator**: Instantaneous matrix statevector calculations at 60 FPS for immediate visual feedback.
  - **Cloud Qiskit Aer Backend**: Physical statevector and shot simulation with measurement probability distributions.

### 🌐 3D Quantum Lab & Dynamic Bloch Spheres
- **Immersive 3D Space**: Built on WebGL via `@react-three/fiber` and `@react-three/drei`.
- **Per-Qubit Bloch Inspection**: Full 3D spherical visualization with dynamic statevector trails, latitude/longitude rings, and rotation arcs.
- **Interactive Lighting & Particles**: Real-time ambient occlusion, particle fields, and responsive orbital rings.

### 🔬 Quantum Algorithms Laboratory
- **10+ Curated Algorithms**: Deep-dive interactive visualizers for Bell States, Superdense Coding, Quantum Teleportation, Deutsch-Jozsa, Bernstein-Vazirani, Grover's Search, Quantum Fourier Transform (QFT), Quantum Phase Estimation, and Quantum Key Distribution (BB84).
- **Pedagogical Step Scrubber**: Scrub backwards and forwards through circuit execution to inspect mathematical state transitions at every gate boundary.
- **3D Quantum Stage**: Spatial algorithm representation connecting mathematical circuit steps to physical qubit states.

### 📚 Interactive Curriculum ("Educate")
- **Modular Learning Paths**: Structured modules covering Fundamentals, Single-Qubit Gates, Superposition, Entanglement, Quantum Hardware, and Multi-Dialect Code.
- **Live In-Lesson Experiments**: Embedded circuit playgrounds and quizzes directly inside each lesson step.
- **Hardware Architecture Visualizer**: Explore dilution refrigerator thermal stages (from 300 K down to 15 mK) and transmon qubit coupling graphs.

### 🤖 Qubit AI Copilot
- **Context-Aware Quantum Tutor**: Powered by high-speed Groq LLMs (`openai/gpt-oss-120b`).
- **Circuit IR Inspection**: Reads and understands your active circuit JSON intermediate representation.
- **Direct Circuit Actions**: Ask Qubit AI to modify your circuit (e.g., *"create an entangled Bell state"* or *"add a Hadamard on qubit 0"*) and watch the gates appear on the canvas.

### 🏆 Gamification & Daily Challenges
- **XP & Level Progression**: Earn experience points for every solved problem, quiz completed, and game conquered.
- **Daily Quantum Challenges**: Fresh daily problem scheduled directly from the cloud database.
- **Unlockable Badges & Leaderboards**: Track streaks, earn achievements, and compete on global/weekly rankings.

---

## 🏛️ System Architecture

```text
                                  ┌────────────────────────┐
                                  │      Next.js 16        │
                                  │   Frontend (React 19)  │
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
│  PostgreSQL   ││  Qiskit Aer   ││ Python Code   ││   Groq LLM    │
│   (Neon DB    ││  Simulation   ││   Sandbox     ││ (GPT-OSS-120B)│
│  Prisma ORM)  ││ (Statevector) ││ (Time-boxed)  ││ (AI Tutor/MCQ)│
└───────────────┘└───────────────┘└───────────────┘└───────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Python**: `3.12+`
- **PostgreSQL**: Local instance or free [Neon DB](https://neon.tech/)

---

### 1. Frontend Setup

```bash
# Clone repository
git clone https://github.com/Grayking1905/qubit-lab.git
cd qubit-lab

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 2. Backend Setup

```bash
# Move to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Generate Prisma Client & push database schema
python -m prisma generate --schema=prisma/schema.prisma
python -m prisma db push --schema=prisma/schema.prisma

# Seed initial problems, courses, and badges
python seed_db.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Backend API documentation is available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Database Connections (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:<password>@<host>-pooler.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require"

# Authentication & Security
JWT_SECRET="your-secure-random-32-character-secret"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MINUTES="10080"
CORS_ORIGINS="http://localhost:3000,https://qubit-lab.vercel.app"

# Frontend API Target
NEXT_PUBLIC_API_URL="http://localhost:8000"

# AI Tutor (Groq Cloud API)
GROQ_API_KEY="gsk_..."
GROQ_MODEL="openai/gpt-oss-120b"

# Admin Panel Credentials
ADMIN_EMAIL="admin@qubitlab.dev"
ADMIN_PASSWORD="your-admin-password"
```

---

## 📦 Deployment

### Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com).
2. Set `NEXT_PUBLIC_API_URL` to your live backend URL (e.g. `https://qubit-lab-l24k.onrender.com`).
3. Deploy! Next.js 16 webpack configuration and Three.js bundle optimization build out of the box.

### Backend (Render / Docker)
- **Render**: Blueprint ready via `render.yaml` or containerized with `backend/Dockerfile`.
- **Built-in 24/7 Keep-Alive**: Includes automated 5-second health heartbeat pulses (`/health/keepalive`) to prevent idle spin-downs on free tiers.

---

## 📁 Project Structure

```text
qubit-lab/
├── app/                      # Next.js App Router pages, layouts, and API proxies
│   ├── api/keepalive/        # Server-side 24/7 keep-alive pulse proxy
│   ├── api/health/           # Dual frontend/backend health check
│   ├── globals.css           # Design tokens, themes, and quantum animations
│   ├── layout.tsx            # Root layout with WebGL canvas providers
│   └── page.tsx              # Main state router and view orchestrator
├── components/               # UI components
│   ├── Builder.tsx           # Dual-mode Quantum Circuit Studio & Playground
│   ├── QuantumGamesArena.tsx # 10-level interactive 3D quantum games
│   ├── BlochSphere.tsx       # Three.js 3D animated Bloch Sphere
│   ├── QuantumLab3D.tsx      # Immersive 3D quantum laboratory environment
│   ├── Algorithms.tsx        # Algorithm explorer with 3D stage and step scrubber
│   ├── InteractiveLearn.tsx  # Structured quantum curriculum & live quizzes
│   ├── CodeSandbox.tsx       # Qiskit, Cirq, and PennyLane multi-SDK editor
│   ├── Assistant.tsx         # Embedded Qubit AI copilot
│   ├── BackendKeepAlive.tsx  # 5-second background health heartbeat
│   └── Dashboard.tsx         # User profile, streaks, badges, and leaderboard
├── lib/                      # Core logic & mathematical libraries
│   ├── api.ts                # Typed client API interfacing all FastAPI endpoints
│   ├── quantum.ts            # Quantum math utilities, lesson data, and algorithm IRs
│   ├── simulator.ts          # Zero-dependency local quantum statevector simulator
│   └── sounds.ts             # Web Audio API procedural sound synthesis
├── backend/                  # FastAPI backend
│   ├── app/                  # Application code
│   │   ├── main.py           # FastAPI entrypoint, lifespan, CORS, and keep-alive
│   │   ├── routers/          # Endpoints (auth, problems, simulate, ai, admin, etc.)
│   │   ├── services/         # Qiskit Aer simulation, code sandbox, and gamification
│   │   └── schemas/          # Pydantic request and response models
│   ├── prisma/schema.prisma  # PostgreSQL Prisma schema definition
│   ├── Dockerfile            # Container deployment definition
│   ├── Procfile              # PaaS process configuration
│   └── seed_db.py            # Idempotent database initialization script
└── render.yaml               # Render Cloud Blueprint specification
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
