import math
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from prisma import Json

from app.database import db
from app.deps import require_admin
from app.schemas.admin import (
    ActiveUsers,
    AddCourseProblemRequest,
    AnalyticsResponse,
    CourseCreate,
    CourseOut,
    CourseUpdate,
    DailyCount,
    GateCreate,
    GateOut,
    GateUpdate,
    HardestQuestion,
    PaginatedQuestions,
    PaginatedUsers,
    ProblemAdminOut,
    ProblemAttempts,
    ProblemCreate,
    ProblemUpdate,
    ReorderCourseRequest,
    ScheduleRequest,
    UserAdminOut,
)
from app.schemas.course import CourseProblemItem
from app.schemas.question import QuestionOut, QuestionUpdate
from prisma.enums import Role

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ============================== Problems ==============================

@router.post("/problems", response_model=ProblemAdminOut, status_code=status.HTTP_201_CREATED)
async def create_problem(payload: ProblemCreate):
    problem = await db.problem.create(
        data={
            "title": payload.title,
            "description": payload.description,
            "difficulty": payload.difficulty,
            "topic": payload.topic,
            "solutionCircuit": Json(payload.solutionCircuit),
            "hints": Json(payload.hints),
            "isDaily": payload.isDaily,
        }
    )
    return problem


@router.get("/problems/{problem_id}", response_model=ProblemAdminOut)
async def get_problem_admin(problem_id: str):
    problem = await db.problem.find_unique(where={"id": problem_id})
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    return problem


@router.put("/problems/{problem_id}", response_model=ProblemAdminOut)
async def update_problem(problem_id: str, payload: ProblemUpdate):
    existing = await db.problem.find_unique(where={"id": problem_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    data: dict = {}
    if payload.title is not None:
        data["title"] = payload.title
    if payload.description is not None:
        data["description"] = payload.description
    if payload.difficulty is not None:
        data["difficulty"] = payload.difficulty
    if payload.topic is not None:
        data["topic"] = payload.topic
    if payload.solutionCircuit is not None:
        data["solutionCircuit"] = Json(payload.solutionCircuit)
    if payload.hints is not None:
        data["hints"] = Json(payload.hints)
    if payload.isDaily is not None:
        data["isDaily"] = payload.isDaily
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    return await db.problem.update(where={"id": problem_id}, data=data)


@router.delete("/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_problem(problem_id: str):
    existing = await db.problem.find_unique(where={"id": problem_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    await db.problem.delete(where={"id": problem_id})


@router.post("/problems/{problem_id}/schedule", response_model=ProblemAdminOut)
async def schedule_problem(problem_id: str, payload: ScheduleRequest):
    problem = await db.problem.find_unique(where={"id": problem_id})
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    start = datetime(payload.date.year, payload.date.month, payload.date.day, tzinfo=timezone.utc)
    end = datetime.combine(payload.date, datetime.max.time(), tzinfo=timezone.utc)

    conflict = await db.problem.find_first(
        where={"scheduledDate": {"gte": start, "lte": end}, "NOT": {"id": problem_id}}
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Problem '{conflict.title}' is already scheduled for {payload.date.isoformat()}",
        )

    return await db.problem.update(where={"id": problem_id}, data={"scheduledDate": start, "isDaily": True})


@router.get("/problems/scheduled/upcoming", response_model=list[ProblemAdminOut])
async def list_scheduled_problems():
    return await db.problem.find_many(
        where={"scheduledDate": {"not": None}},
        order={"scheduledDate": "asc"},
    )


# ================================ Gates ================================

@router.post("/gates", response_model=GateOut, status_code=status.HTTP_201_CREATED)
async def create_gate(payload: GateCreate, admin=Depends(require_admin)):
    gate = await db.gate.create(
        data={
            "name": payload.name,
            "symbol": payload.symbol,
            "matrixDefinition": Json(payload.matrixDefinition),
            "description": payload.description,
            "createdBy": admin.id,
        }
    )
    return gate


@router.put("/gates/{gate_id}", response_model=GateOut)
async def update_gate(gate_id: str, payload: GateUpdate):
    existing = await db.gate.find_unique(where={"id": gate_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gate not found")

    data: dict = {}
    if payload.name is not None:
        data["name"] = payload.name
    if payload.symbol is not None:
        data["symbol"] = payload.symbol
    if payload.matrixDefinition is not None:
        data["matrixDefinition"] = Json(payload.matrixDefinition)
    if payload.description is not None:
        data["description"] = payload.description
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    return await db.gate.update(where={"id": gate_id}, data=data)


@router.delete("/gates/{gate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gate(gate_id: str):
    existing = await db.gate.find_unique(where={"id": gate_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gate not found")
    await db.gate.delete(where={"id": gate_id})


# =============================== Courses ================================

async def _course_problem_items(course_id: str) -> list[CourseProblemItem]:
    rows = await db.courseproblem.find_many(
        where={"courseId": course_id},
        include={"problem": True},
        order={"orderIndex": "asc"},
    )
    return [
        CourseProblemItem(
            orderIndex=cp.orderIndex,
            problemId=cp.problem.id,
            title=cp.problem.title,
            difficulty=cp.problem.difficulty,
            topic=cp.problem.topic,
        )
        for cp in rows
        if cp.problem is not None
    ]


@router.post("/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
async def create_course(payload: CourseCreate):
    course = await db.course.create(
        data={
            "title": payload.title,
            "description": payload.description,
            "difficulty": payload.difficulty,
            "order": payload.order,
        }
    )
    return course


@router.put("/courses/{course_id}", response_model=CourseOut)
async def update_course(course_id: str, payload: CourseUpdate):
    existing = await db.course.find_unique(where={"id": course_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    data: dict = {}
    if payload.title is not None:
        data["title"] = payload.title
    if payload.description is not None:
        data["description"] = payload.description
    if payload.difficulty is not None:
        data["difficulty"] = payload.difficulty
    if payload.order is not None:
        data["order"] = payload.order
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    return await db.course.update(where={"id": course_id}, data=data)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: str):
    existing = await db.course.find_unique(where={"id": course_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await db.course.delete(where={"id": course_id})


@router.post("/courses/{course_id}/problems", response_model=list[CourseProblemItem])
async def add_course_problem(course_id: str, payload: AddCourseProblemRequest):
    course = await db.course.find_unique(where={"id": course_id})
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    problem = await db.problem.find_unique(where={"id": payload.problemId})
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    existing = await db.courseproblem.find_first(where={"courseId": course_id, "problemId": payload.problemId})
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Problem already in this course")

    order_index = payload.orderIndex
    if order_index is None:
        order_index = await db.courseproblem.count(where={"courseId": course_id})

    await db.courseproblem.create(
        data={"courseId": course_id, "problemId": payload.problemId, "orderIndex": order_index}
    )
    return await _course_problem_items(course_id)


@router.delete("/courses/{course_id}/problems/{problem_id}", response_model=list[CourseProblemItem])
async def remove_course_problem(course_id: str, problem_id: str):
    existing = await db.courseproblem.find_first(where={"courseId": course_id, "problemId": problem_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem is not in this course")
    await db.courseproblem.delete(where={"id": existing.id})
    return await _course_problem_items(course_id)


@router.put("/courses/{course_id}/reorder", response_model=list[CourseProblemItem])
async def reorder_course(course_id: str, payload: ReorderCourseRequest):
    existing = await db.courseproblem.find_many(where={"courseId": course_id})
    existing_by_problem = {cp.problemId: cp for cp in existing}

    if set(payload.problemIds) != set(existing_by_problem.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="problemIds must be exactly the set of problems currently in this course",
        )

    for index, problem_id in enumerate(payload.problemIds):
        await db.courseproblem.update(where={"id": existing_by_problem[problem_id].id}, data={"orderIndex": index})

    return await _course_problem_items(course_id)


# ================================ Users =================================

@router.get("/users", response_model=PaginatedUsers)
async def list_users(
    search: str | None = None,
    role: Role | None = None,
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
):
    where: dict = {}
    if role is not None:
        where["role"] = role
    if search:
        where["OR"] = [
            {"name": {"contains": search, "mode": "insensitive"}},
            {"email": {"contains": search, "mode": "insensitive"}},
        ]

    total = await db.user.count(where=where)
    users = await db.user.find_many(
        where=where, skip=(page - 1) * pageSize, take=pageSize, order={"createdAt": "desc"}
    )
    return PaginatedUsers(
        items=users, total=total, page=page, pageSize=pageSize,
        totalPages=max(1, math.ceil(total / pageSize)),
    )


# =============================== Questions ===============================

@router.get("/questions", response_model=PaginatedQuestions)
async def list_pending_questions(page: int = Query(default=1, ge=1), pageSize: int = Query(default=20, ge=1, le=100)):
    where = {"approved": False}
    total = await db.question.count(where=where)
    questions = await db.question.find_many(
        where=where, skip=(page - 1) * pageSize, take=pageSize, order={"createdAt": "desc"}
    )
    return PaginatedQuestions(
        items=questions, total=total, page=page, pageSize=pageSize,
        totalPages=max(1, math.ceil(total / pageSize)),
    )


@router.put("/questions/{question_id}/approve", response_model=QuestionOut)
async def approve_question(question_id: str):
    existing = await db.question.find_unique(where={"id": question_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return await db.question.update(where={"id": question_id}, data={"approved": True})


@router.put("/questions/{question_id}/edit", response_model=QuestionOut)
async def edit_question(question_id: str, payload: QuestionUpdate):
    existing = await db.question.find_unique(where={"id": question_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    data: dict = {}
    if payload.questionText is not None:
        data["questionText"] = payload.questionText
    if payload.options is not None:
        data["options"] = Json(payload.options)
    if payload.correctOptionIndex is not None:
        data["correctOptionIndex"] = payload.correctOptionIndex
    if payload.explanation is not None:
        data["explanation"] = payload.explanation
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    return await db.question.update(where={"id": question_id}, data=data)


# =============================== Analytics ===============================

ALL_DIFFICULTIES = ("BEGINNER", "INTERMEDIATE", "ADVANCED")


@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics():
    now = datetime.now(timezone.utc)
    cutoff_7 = now - timedelta(days=7)
    cutoff_30 = now - timedelta(days=30)

    # Active users + daily submission graph, both derived from the same
    # last-30-days submission fetch.
    recent_subs = await db.submission.find_many(where={"timestamp": {"gte": cutoff_30}})
    active_30 = {s.userId for s in recent_subs}
    active_7 = {s.userId for s in recent_subs if s.timestamp >= cutoff_7}
    daily_counter: Counter = Counter(s.timestamp.date().isoformat() for s in recent_subs)
    daily_submissions = [DailyCount(date=d, count=c) for d, c in sorted(daily_counter.items())]

    # Most-attempted problems.
    grouped_by_problem = await db.submission.group_by(by=["problemId"], count=True)
    ranked_problems = sorted(grouped_by_problem, key=lambda r: r["_count"]["_all"], reverse=True)[:10]
    problem_ids = [r["problemId"] for r in ranked_problems]
    problems_by_id = {}
    if problem_ids:
        found = await db.problem.find_many(where={"id": {"in": problem_ids}})
        problems_by_id = {p.id: p for p in found}
    most_attempted = [
        ProblemAttempts(
            problemId=r["problemId"],
            title=problems_by_id[r["problemId"]].title if r["problemId"] in problems_by_id else "Unknown",
            attempts=r["_count"]["_all"],
        )
        for r in ranked_problems
    ]

    # Completion (accuracy) rate per difficulty: correct submissions / total
    # submissions for problems at that difficulty, across all time.
    all_subs = await db.submission.find_many(include={"problem": True})
    total_by_diff: Counter = Counter()
    correct_by_diff: Counter = Counter()
    for s in all_subs:
        if s.problem is None:
            continue
        total_by_diff[s.problem.difficulty] += 1
        if s.isCorrect:
            correct_by_diff[s.problem.difficulty] += 1
    completion_rate = {
        d: (correct_by_diff.get(d, 0) / total_by_diff[d] if total_by_diff.get(d) else 0.0)
        for d in ALL_DIFFICULTIES
    }

    # Quiz questions with the highest incorrect-answer rate.
    attempts = await db.questionattempt.find_many(include={"question": True})
    total_by_q: Counter = Counter()
    incorrect_by_q: Counter = Counter()
    text_by_q: dict[str, str] = {}
    for a in attempts:
        total_by_q[a.questionId] += 1
        if not a.isCorrect:
            incorrect_by_q[a.questionId] += 1
        if a.question is not None:
            text_by_q[a.questionId] = a.question.questionText
    ranked_questions = sorted(total_by_q.keys(), key=lambda qid: incorrect_by_q[qid] / total_by_q[qid], reverse=True)
    hardest_questions = [
        HardestQuestion(
            questionId=qid,
            questionText=text_by_q.get(qid, ""),
            attempts=total_by_q[qid],
            incorrectRate=incorrect_by_q[qid] / total_by_q[qid],
        )
        for qid in ranked_questions[:10]
    ]

    return AnalyticsResponse(
        activeUsers=ActiveUsers(last7Days=len(active_7), last30Days=len(active_30)),
        dailySubmissions=daily_submissions,
        mostAttemptedProblems=most_attempted,
        completionRateByDifficulty=completion_rate,
        hardestQuestions=hardest_questions,
    )
