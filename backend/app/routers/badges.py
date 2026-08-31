"""Public badges endpoint — returns all Badge records so the frontend can
show locked (unearned) and unlocked (earned) badges on the user dashboard."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.database import db

router = APIRouter(prefix="/badges", tags=["badges"])


class BadgePublicOut(BaseModel):
    id: str
    name: str
    description: str
    icon: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[BadgePublicOut])
async def list_badges():
    """Returns all badge definitions (no auth required)."""
    return await db.badge.find_many(order={"name": "asc"})
