from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.gate import GateOut
from app.schemas.question import QuestionOut
from prisma.enums import Difficulty, Role


# ---- Problems ----

class ProblemCreate(BaseModel):
    title: str
    description: str
    difficulty: Difficulty
    topic: str
    solutionCircuit: dict[str, Any]
    hints: list[str] = []
    isDaily: bool = False


class ProblemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty: Difficulty | None = None
    topic: str | None = None
    solutionCircuit: dict[str, Any] | None = None
    hints: list[str] | None = None
    isDaily: bool | None = None


class ProblemAdminOut(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    topic: str
    solutionCircuit: Any
    hints: list[str]
    isDaily: bool
    scheduledDate: datetime | None
    createdAt: datetime

    model_config = {"from_attributes": True}


class ScheduleRequest(BaseModel):
    date: date


# ---- Gates ----

class GateCreate(BaseModel):
    name: str
    symbol: str
    matrixDefinition: Any
    description: str


class GateUpdate(BaseModel):
    name: str | None = None
    symbol: str | None = None
    matrixDefinition: Any | None = None
    description: str | None = None


# ---- Courses ----

class CourseCreate(BaseModel):
    title: str
    description: str
    difficulty: Difficulty
    order: int


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty: Difficulty | None = None
    order: int | None = None


class CourseOut(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    order: int
    createdAt: datetime

    model_config = {"from_attributes": True}


class AddCourseProblemRequest(BaseModel):
    problemId: str
    orderIndex: int | None = None


class ReorderCourseRequest(BaseModel):
    problemIds: list[str]


# ---- Users ----

class UserAdminOut(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    xp: int
    level: int
    streak: int
    createdAt: datetime

    model_config = {"from_attributes": True}


class PaginatedUsers(BaseModel):
    items: list[UserAdminOut]
    total: int
    page: int
    pageSize: int
    totalPages: int


# ---- Questions ----

class PaginatedQuestions(BaseModel):
    items: list[QuestionOut]
    total: int
    page: int
    pageSize: int
    totalPages: int


# ---- Analytics ----

class ActiveUsers(BaseModel):
    last7Days: int
    last30Days: int


class DailyCount(BaseModel):
    date: str
    count: int


class ProblemAttempts(BaseModel):
    problemId: str
    title: str
    attempts: int


class HardestQuestion(BaseModel):
    questionId: str
    questionText: str
    attempts: int
    incorrectRate: float


class AnalyticsResponse(BaseModel):
    activeUsers: ActiveUsers
    dailySubmissions: list[DailyCount]
    mostAttemptedProblems: list[ProblemAttempts]
    completionRateByDifficulty: dict[str, float]
    hardestQuestions: list[HardestQuestion]
