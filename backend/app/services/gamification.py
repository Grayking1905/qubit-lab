"""XP, level and streak bookkeeping applied when a submission is graded."""

import math
from datetime import datetime, timedelta

# XP awarded for a user's *first* correct solve of a given problem.
XP_BY_DIFFICULTY = {
    "BEGINNER": 10,
    "INTERMEDIATE": 25,
    "ADVANCED": 50,
}


def xp_for_difficulty(difficulty: str) -> int:
    return XP_BY_DIFFICULTY.get(difficulty, 10)


# Level curve: level = floor(sqrt(xp / 50)) + 1.
#
# This is a standard "sqrt" RPG curve: each additional level costs more XP
# than the last, so early levels come quickly while later ones take
# meaningfully more grinding. With XP_BY_DIFFICULTY above, the thresholds
# work out to (xp needed -> level):
#   0    -> 1   (start)
#   50   -> 2   (~2 BEGINNER solves, or 1 ADVANCED)
#   200  -> 3
#   450  -> 4
#   800  -> 5
#   1250 -> 6
# i.e. level N requires xp >= 50 * (N - 1) ** 2.
def level_for_xp(xp: int) -> int:
    return math.floor(math.sqrt(max(xp, 0) / 50)) + 1


def next_streak(last_active: datetime | None, now: datetime, current_streak: int) -> int:
    """Streak transition on a correct submission.

    - No prior activity: start a new streak at 1.
    - Same calendar day as last activity: no change (returns current streak).
    - Exactly the next calendar day: increment by 1.
    - Any bigger gap: streak broken, reset to 1.
    """
    if last_active is None:
        return 1
    last_day = last_active.date()
    today = now.date()
    if last_day == today:
        return current_streak or 1
    if today - last_day == timedelta(days=1):
        return current_streak + 1
    return 1
