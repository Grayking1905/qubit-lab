from pydantic import BaseModel

from app.schemas.badge import UserBadgeOut


class UserStats(BaseModel):
    userId: str
    name: str
    xp: int
    level: int
    streak: int
    badges: list[UserBadgeOut]
    solvedByDifficulty: dict[str, int]
    activityMap: dict[str, int]  # "YYYY-MM-DD" -> submission count, last 365 days
