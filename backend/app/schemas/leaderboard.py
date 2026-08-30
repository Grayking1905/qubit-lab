from typing import Literal

from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    rank: int
    userId: str
    name: str
    level: int
    xp: int  # lifetime total XP, always shown for context
    periodXp: int  # XP earned within the selected period; equals `xp` when period=all


class LeaderboardResponse(BaseModel):
    period: Literal["all", "weekly"]
    items: list[LeaderboardEntry]
    page: int
    pageSize: int
    total: int
    totalPages: int
