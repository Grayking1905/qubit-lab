import math
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Query

from app.database import db
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def leaderboard(
    period: Literal["all", "weekly"] = "all",
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
):
    if period == "all":
        total = await db.user.count()
        users = await db.user.find_many(
            order={"xp": "desc"},
            skip=(page - 1) * pageSize,
            take=pageSize,
        )
        offset = (page - 1) * pageSize
        items = [
            LeaderboardEntry(rank=offset + i + 1, userId=u.id, name=u.name, level=u.level, xp=u.xp, periodXp=u.xp)
            for i, u in enumerate(users)
        ]
        return LeaderboardResponse(
            period=period, items=items, page=page, pageSize=pageSize, total=total,
            totalPages=max(1, math.ceil(total / pageSize)),
        )

    # Weekly: rank by XP earned from submissions in the last 7 days.
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    grouped = await db.submission.group_by(
        by=["userId"],
        where={"timestamp": {"gte": cutoff}, "xpEarned": {"gt": 0}},
        sum={"xpEarned": True},
    )
    ranked = sorted(grouped, key=lambda row: row["_sum"]["xpEarned"] or 0, reverse=True)

    total = len(ranked)
    offset = (page - 1) * pageSize
    page_rows = ranked[offset: offset + pageSize]

    user_ids = [row["userId"] for row in page_rows]
    users_by_id = {}
    if user_ids:
        users = await db.user.find_many(where={"id": {"in": user_ids}})
        users_by_id = {u.id: u for u in users}

    items = []
    for i, row in enumerate(page_rows):
        u = users_by_id.get(row["userId"])
        if u is None:
            continue
        items.append(
            LeaderboardEntry(
                rank=offset + i + 1,
                userId=u.id,
                name=u.name,
                level=u.level,
                xp=u.xp,
                periodXp=row["_sum"]["xpEarned"] or 0,
            )
        )

    return LeaderboardResponse(
        period=period, items=items, page=page, pageSize=pageSize, total=total,
        totalPages=max(1, math.ceil(total / pageSize)) if total else 1,
    )
