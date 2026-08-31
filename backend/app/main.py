from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import connect_db, disconnect_db
from app.routers import admin, admin_auth, ai, auth, badges, courses, gates, leaderboard, problems, questions, sandbox, simulate, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
    except Exception as exc:
        print(f"Warning: Database connection failed during startup: {exc}")
    yield
    try:
        await disconnect_db()
    except Exception:
        pass


app = FastAPI(title="QubitLab API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(auth.router)
app.include_router(admin_auth.router)  # must come before admin.router
app.include_router(problems.router)
app.include_router(courses.router)
app.include_router(simulate.router)
app.include_router(sandbox.router)
app.include_router(leaderboard.router)
app.include_router(users.router)
app.include_router(questions.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(gates.router)
app.include_router(badges.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
