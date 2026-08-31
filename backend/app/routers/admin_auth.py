"""Hardcoded-admin authentication and setup utilities.

This module is completely separate from the user auth system (app/routers/auth.py).
It authenticates against ADMIN_EMAIL / ADMIN_PASSWORD env-var credentials — no
database user lookup — and returns a JWT with admin_session=True so the admin
panel backend routes accept it via the require_any_admin dependency.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Json
from pydantic import BaseModel

from app.config import settings
from app.database import db
from app.deps import require_any_admin
from app.security import create_admin_session_token

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# POST /admin/auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest):
    """Authenticate against hardcoded env-var credentials.
    Returns a short-lived JWT that grants access to all /admin/* routes.
    Does NOT touch the user database.
    """
    if payload.email != settings.admin_email or payload.password != settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )
    token = create_admin_session_token()
    return AdminLoginResponse(access_token=token)


# ---------------------------------------------------------------------------
# POST /admin/auth/seed-badges  (requires admin auth)
# Creates the four default gamification badges if they don't already exist.
# ---------------------------------------------------------------------------

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


@router.post("/seed-badges", dependencies=[Depends(require_any_admin)])
async def seed_badges():
    """Idempotent: creates default badges only if they don't already exist (matched by name)."""
    existing = await db.badge.find_many()
    existing_names = {b.name for b in existing}

    created = []
    for badge in DEFAULT_BADGES:
        if badge["name"] not in existing_names:
            await db.badge.create(
                data={
                    "name": badge["name"],
                    "description": badge["description"],
                    "icon": badge["icon"],
                    "condition": Json(badge["condition"]),
                }
            )
            created.append(badge["name"])

    return {"created": created, "already_existed": list(existing_names)}
