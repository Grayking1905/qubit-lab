import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from prisma import Json

from app.database import db
from app.deps import get_current_user, get_optional_user
from app.schemas.problem import DailyProblem, PaginatedProblems, ProblemDetail, ProblemListItem
from app.schemas.simulate import GateOp, SubmitRequest, SubmitResponse
from app.services import quantum
from app.services.badges import award_new_badges
from app.services.gamification import level_for_xp, next_streak, xp_for_difficulty
from prisma.enums import Difficulty

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=PaginatedProblems)
async def list_problems(
    difficulty: Difficulty | None = None,
    topic: str | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
):
    where: dict = {}
    if difficulty is not None:
        where["difficulty"] = difficulty
    if topic is not None:
        where["topic"] = topic
    if search:
        where["OR"] = [
            {"title": {"contains": search, "mode": "insensitive"}},
            {"description": {"contains": search, "mode": "insensitive"}},
        ]

    total = await db.problem.count(where=where)
    items = await db.problem.find_many(
        where=where,
        skip=(page - 1) * pageSize,
        take=pageSize,
        order={"createdAt": "desc"},
    )

    return PaginatedProblems(
        items=items,
        total=total,
        page=page,
        pageSize=pageSize,
        totalPages=max(1, math.ceil(total / pageSize)),
    )


@router.get("/daily", response_model=DailyProblem)
async def get_daily_problem():
    today = datetime.now(timezone.utc).date()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    end = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)

    problem = await db.problem.find_first(
        where={"isDaily": True, "scheduledDate": {"gte": start, "lte": end}}
    )
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No problem of the day is scheduled")

    return DailyProblem(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        topic=problem.topic,
        hints=problem.hints,
        scheduledDate=problem.scheduledDate,
    )


@router.get("/{problem_id}", response_model=ProblemDetail)
async def get_problem(problem_id: str, user=Depends(get_optional_user)):
    problem = await db.problem.find_unique(where={"id": problem_id})
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    solved = False
    if user is not None:
        solved_submission = await db.submission.find_first(
            where={"userId": user.id, "problemId": problem_id, "isCorrect": True}
        )
        solved = solved_submission is not None

    return ProblemDetail(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        topic=problem.topic,
        hints=problem.hints,
        isDaily=problem.isDaily,
        scheduledDate=problem.scheduledDate,
        createdAt=problem.createdAt,
        solved=solved,
        solutionCircuit=problem.solutionCircuit if solved else None,
    )


@router.post("/{problem_id}/submit", response_model=SubmitResponse)
async def submit_problem(problem_id: str, payload: SubmitRequest, user=Depends(get_current_user)):
    problem = await db.problem.find_unique(where={"id": problem_id})
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    try:
        your_result = quantum.run_simulation(payload.qubits, payload.gates)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    solution = problem.solutionCircuit or {}
    solution_gates = [GateOp(**g) for g in solution.get("gates", [])]
    solution_qubits = solution.get("qubits", payload.qubits)
    try:
        expected_result = quantum.run_simulation(solution_qubits, solution_gates)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Problem solution circuit is invalid: {exc}",
        )

    correct = payload.qubits == solution_qubits and quantum.probabilities_match(
        your_result.probabilities, expected_result.probabilities
    )

    xp_earned = 0
    if correct:
        already_solved = await db.submission.find_first(
            where={"userId": user.id, "problemId": problem_id, "isCorrect": True}
        )
        if already_solved is None:
            xp_earned = xp_for_difficulty(problem.difficulty)

    await db.submission.create(
        data={
            "userId": user.id,
            "problemId": problem_id,
            "circuitJson": Json({"qubits": payload.qubits, "gates": [g.model_dump() for g in payload.gates]}),
            "isCorrect": correct,
            "xpEarned": xp_earned,
        }
    )

    new_badges = []
    if correct:
        now = datetime.now(timezone.utc)
        new_streak = next_streak(user.lastActiveDate, now, user.streak)
        new_xp = user.xp + xp_earned
        user = await db.user.update(
            where={"id": user.id},
            data={
                "xp": new_xp,
                "level": level_for_xp(new_xp),
                "streak": new_streak,
                "lastActiveDate": now,
            },
        )
        new_badges = await award_new_badges(user)

    return SubmitResponse(
        correct=correct,
        yourResult=your_result,
        expectedResult=None if correct else expected_result,
        xpEarned=xp_earned,
        newBadges=new_badges,
    )
