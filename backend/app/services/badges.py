"""Badge unlock evaluation, run after every correct submission.

Badge.condition is a small JSON DSL, one of:
  {"type": "streak", "value": N}                          -> user.streak >= N
  {"type": "xp", "value": N}                               -> user.xp >= N
  {"type": "total_solved", "value": N}                     -> distinct problems solved (any difficulty/topic) >= N
  {"type": "difficulty_solved", "difficulty": "ADVANCED", "value": N}  -> distinct problems solved at that difficulty >= N
  {"type": "topic_solved", "topic": "Entanglement", "value": N}        -> distinct problems solved with that topic >= N

"First ADVANCED solve" is just {"type": "difficulty_solved", "difficulty": "ADVANCED", "value": 1}.
"""

from collections import Counter
from typing import Any

from app.database import db


async def solved_problem_stats(user_id: str) -> tuple[int, Counter, Counter]:
    """Returns (total distinct solved, solved-by-difficulty, solved-by-topic)."""
    solved = await db.submission.find_many(
        where={"userId": user_id, "isCorrect": True},
        include={"problem": True},
        distinct=["problemId"],
    )
    by_difficulty: Counter = Counter()
    by_topic: Counter = Counter()
    for s in solved:
        if s.problem is not None:
            by_difficulty[s.problem.difficulty] += 1
            by_topic[s.problem.topic] += 1
    return len(solved), by_difficulty, by_topic


def _condition_met(condition: dict[str, Any], user, total_solved: int, by_difficulty: Counter, by_topic: Counter) -> bool:
    ctype = condition.get("type")
    value = condition.get("value", 0)
    if ctype == "streak":
        return user.streak >= value
    if ctype == "xp":
        return user.xp >= value
    if ctype == "total_solved":
        return total_solved >= value
    if ctype == "difficulty_solved":
        return by_difficulty.get(condition.get("difficulty"), 0) >= value
    if ctype == "topic_solved":
        return by_topic.get(condition.get("topic"), 0) >= value
    return False


async def award_new_badges(user) -> list:
    """Checks all badges the user hasn't unlocked yet and creates UserBadge
    rows for any whose condition is now satisfied. Returns the newly
    unlocked Badge records (empty list if none)."""
    already_unlocked = await db.userbadge.find_many(where={"userId": user.id})
    unlocked_ids = {ub.badgeId for ub in already_unlocked}

    all_badges = await db.badge.find_many()
    candidates = [b for b in all_badges if b.id not in unlocked_ids]
    if not candidates:
        return []

    total_solved, by_difficulty, by_topic = await solved_problem_stats(user.id)

    newly_unlocked = []
    for badge in candidates:
        if _condition_met(badge.condition or {}, user, total_solved, by_difficulty, by_topic):
            await db.userbadge.create(data={"userId": user.id, "badgeId": badge.id})
            newly_unlocked.append(badge)

    return newly_unlocked
