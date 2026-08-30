from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.database import db
from app.deps import get_current_user
from app.schemas.badge import BadgeOut, UserBadgeOut
from app.schemas.stats import UserStats
from app.services.badges import solved_problem_stats

router = APIRouter(prefix="/users", tags=["users"])

ACTIVITY_WINDOW_DAYS = 365
ALL_DIFFICULTIES = ("BEGINNER", "INTERMEDIATE", "ADVANCED")


@router.get("/me/stats", response_model=UserStats)
async def my_stats(user=Depends(get_current_user)):
    _total_solved, by_difficulty, _by_topic = await solved_problem_stats(user.id)
    solved_by_difficulty = {d: by_difficulty.get(d, 0) for d in ALL_DIFFICULTIES}

    user_badges = await db.userbadge.find_many(
        where={"userId": user.id},
        include={"badge": True},
        order={"unlockedAt": "desc"},
    )
    badges = [
        UserBadgeOut(badge=BadgeOut.model_validate(ub.badge), unlockedAt=ub.unlockedAt)
        for ub in user_badges
        if ub.badge is not None
    ]

    cutoff = datetime.now(timezone.utc) - timedelta(days=ACTIVITY_WINDOW_DAYS)
    submissions = await db.submission.find_many(where={"userId": user.id, "timestamp": {"gte": cutoff}})
    activity_counter: Counter = Counter(s.timestamp.date().isoformat() for s in submissions)

    return UserStats(
        userId=user.id,
        name=user.name,
        xp=user.xp,
        level=user.level,
        streak=user.streak,
        badges=badges,
        solvedByDifficulty=solved_by_difficulty,
        activityMap=dict(activity_counter),
    )
