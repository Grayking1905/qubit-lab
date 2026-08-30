from fastapi import APIRouter, HTTPException, status

from app.database import db
from app.schemas.course import CourseDetail, CourseListItem, CourseProblemItem

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[CourseListItem])
async def list_courses():
    courses = await db.course.find_many(
        order={"order": "asc"},
        include={"courseProblems": True},
    )
    return [
        CourseListItem(
            id=c.id,
            title=c.title,
            description=c.description,
            difficulty=c.difficulty,
            order=c.order,
            problemCount=len(c.courseProblems or []),
            createdAt=c.createdAt,
        )
        for c in courses
    ]


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(course_id: str):
    course = await db.course.find_unique(
        where={"id": course_id},
        include={"courseProblems": {"include": {"problem": True}, "order_by": {"orderIndex": "asc"}}},
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    problems = sorted(course.courseProblems or [], key=lambda cp: cp.orderIndex)
    return CourseDetail(
        id=course.id,
        title=course.title,
        description=course.description,
        difficulty=course.difficulty,
        order=course.order,
        problems=[
            CourseProblemItem(
                orderIndex=cp.orderIndex,
                problemId=cp.problem.id,
                title=cp.problem.title,
                difficulty=cp.problem.difficulty,
                topic=cp.problem.topic,
            )
            for cp in problems
        ],
    )
