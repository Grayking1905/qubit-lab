from datetime import datetime

from pydantic import BaseModel

from prisma.enums import Difficulty


class CourseListItem(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    order: int
    problemCount: int
    createdAt: datetime


class CourseProblemItem(BaseModel):
    orderIndex: int
    problemId: str
    title: str
    difficulty: Difficulty
    topic: str


class CourseDetail(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    order: int
    problems: list[CourseProblemItem]
