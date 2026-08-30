from datetime import datetime
from typing import Any

from pydantic import BaseModel

from prisma.enums import Difficulty


class ProblemListItem(BaseModel):
    id: str
    title: str
    difficulty: Difficulty
    topic: str
    isDaily: bool
    scheduledDate: datetime | None
    createdAt: datetime

    model_config = {"from_attributes": True}


class PaginatedProblems(BaseModel):
    items: list[ProblemListItem]
    total: int
    page: int
    pageSize: int
    totalPages: int


class ProblemDetail(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    topic: str
    hints: list[str]
    isDaily: bool
    scheduledDate: datetime | None
    createdAt: datetime
    solved: bool
    solutionCircuit: Any | None = None


class DailyProblem(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    topic: str
    hints: list[str]
    scheduledDate: datetime | None
