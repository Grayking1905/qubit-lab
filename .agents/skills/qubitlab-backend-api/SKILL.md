---
name: qubitlab-backend-api
description: Guide and patterns for FastAPI backend development, Prisma schema migrations, JWT auth, and Groq LLM integration in QubitLab.
---

# QubitLab Backend API Skill

Use this skill when developing, testing, or debugging FastAPI endpoints, Prisma models, Groq LLM services, or sandboxed execution in QubitLab.

## 1. Environment & Setup
- **Virtual Environment**: Located at `backend/venv`. Always execute python commands using `.\venv\Scripts\python.exe` or by activating the environment.
- **Database**: PostgreSQL on Neon. Configured via `DATABASE_URL` (pooler connection) and `DIRECT_URL` (direct connection for migrations) in `.env`.
- **Groq API**: `GROQ_API_KEY` in `.env` powers `/ai/chat` and `/ai/quiz/generate` using model `openai/gpt-oss-120b`.

## 2. Running & Migration Commands

```powershell
# From /backend directory
# 1. Activate venv
.\venv\Scripts\Activate.ps1

# 2. Run API server
uvicorn app.main:app --reload --port 8000

# 3. Regenerate Prisma Python Client (Must have venv/Scripts in PATH on Windows)
$env:PATH = "$pwd\venv\Scripts;$env:PATH"
.\venv\Scripts\python.exe -m prisma generate --schema=prisma\schema.prisma

# 4. Push schema changes to Neon DB
.\venv\Scripts\prisma db push --schema=prisma\schema.prisma
```

## 3. Router Conventions
- **Routing**: Define endpoints in `backend/app/routers/<name>.py` using `APIRouter(prefix="/<name>", tags=["<name>"])`.
- **Schemas**: Request/Response models in `backend/app/schemas/<name>.py`.
- **Auth**: Protect endpoints with `Depends(get_current_user)` or `Depends(require_admin)` from `app.deps`.
- **AI Calls**: Use `chat_completion_json(system_prompt, messages)` from `app.services.groq_client`.
