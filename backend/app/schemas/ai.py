from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.simulate import GateOp


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    circuitJson: dict[str, Any]
    message: str
    conversationHistory: list[ChatMessage] = []


class ChatExplanation(BaseModel):
    type: Literal["explanation"]
    text: str


class ChatAction(BaseModel):
    type: Literal["action"]
    action: Literal["add_gate", "remove_gate"]
    gate: GateOp


ChatResponse = Annotated[ChatExplanation | ChatAction, Field(discriminator="type")]


class QuizGenerateRequest(BaseModel):
    circuitJson: dict[str, Any] | None = None
    topic: str | None = None

    @model_validator(mode="after")
    def require_one(self):
        if self.circuitJson is None and not (self.topic and self.topic.strip()):
            raise ValueError("Provide either 'circuitJson' or 'topic'")
        return self


class QuizLLMOutput(BaseModel):
    questionText: str
    options: list[str] = Field(min_length=4, max_length=4)
    correctOptionIndex: int = Field(ge=0, le=3)
    explanation: str
