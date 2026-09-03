import asyncio
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import connect_db, disconnect_db
from app.routers import admin, admin_auth, ai, auth, badges, courses, gates, leaderboard, problems, questions, sandbox, simulate, users

_start_time = time.time()


async def _keep_alive_worker(target_url: str, interval: int = 5):
    """Periodically triggers the health endpoint every N seconds to keep Render free tier servers alive 24/7."""
    health_url = f"{target_url.rstrip('/')}/health"
    print(f"[KeepAlive] Initiated Render heartbeat worker for {health_url} (interval: {interval}s)")
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                await asyncio.sleep(interval)
                resp = await client.get(health_url)
                if resp.status_code == 200:
                    pass  # Heartbeat successful
            except asyncio.CancelledError:
                print("[KeepAlive] Keep-alive worker stopped.")
                break
            except Exception as exc:
                # Silently catch transient networking errors during cold-starts or deploys
                pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
    except Exception as exc:
        print(f"Warning: Database connection failed during startup: {exc}")

    # Start self-keepalive worker if deployed on Render or if KEEP_ALIVE_URL is configured
    keep_alive_task = None
    target_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("KEEP_ALIVE_URL")
    if target_url:
        keep_alive_task = asyncio.create_task(_keep_alive_worker(target_url, interval=5))

    yield

    if keep_alive_task is not None:
        keep_alive_task.cancel()
        try:
            await keep_alive_task
        except asyncio.CancelledError:
            pass

    try:
        await disconnect_db()
    except Exception:
        pass


app = FastAPI(title="QubitLab API", version="1.0.0", lifespan=lifespan)

cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if "*" in settings.cors_origin_list or settings.cors_origins.strip() == "*":
    cors_kwargs["allow_origin_regex"] = r"^https?:\/\/.*"
else:
    cors_kwargs["allow_origins"] = settings.cors_origin_list

app.add_middleware(CORSMiddleware, **cors_kwargs)


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


@app.get("/")
async def root():
    return {
        "name": "QubitLab API",
        "status": "ok",
        "version": "1.0.0",
        "uptime_seconds": round(time.time() - _start_time, 2),
    }


@app.get("/health")
async def health():
    """Health check endpoint. Responds immediately to prevent idle timeouts."""
    return {
        "status": "ok",
        "service": "qubitlab-backend",
        "uptime_seconds": round(time.time() - _start_time, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/keepalive")
async def keepalive():
    """Dedicated keep-alive pulse endpoint for 5-second interval heartbeat pings."""
    return {
        "status": "alive",
        "uptime_seconds": round(time.time() - _start_time, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "Render server keepalive pulse received.",
    }
