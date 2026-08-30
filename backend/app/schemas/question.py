from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class QuestionOut(BaseModel):
    id: str
    problemId: str | None
    circuitContext: Any | None
    questionText: str
    options: list[str]
    correctOptionIndex: int
    explanation: str
    aiGenerated: bool
    approved: bool
    createdAt: datetime

    model_config = {"from_attributes": True}


class QuestionUpdate(BaseModel):
    questionText: str | None = None
    options: list[str] | None = Field(default=None, min_length=4, max_length=4)
    correctOptionIndex: int | None = Field(default=None, ge=0, le=3)
    explanation: str | None = None


class AttemptRequest(BaseModel):
    selectedOptionIndex: int = Field(ge=0, le=3)


class AttemptResponse(BaseModel):
    correct: bool
    correctOptionIndex: int
    explanation: str
