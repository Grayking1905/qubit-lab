import json

from fastapi import APIRouter, HTTPException, status
from prisma import Json
from pydantic import TypeAdapter, ValidationError

from app.database import db
from app.schemas.ai import ChatRequest, ChatResponse, QuizGenerateRequest, QuizLLMOutput
from app.schemas.question import QuestionOut
from app.services.groq_client import AIConfigError, AIParsingError, AIRequestError, chat_completion_json

router = APIRouter(prefix="/ai", tags=["ai"])

CHAT_SYSTEM_PROMPT = """You are Qubit AI, an assistant embedded in a quantum circuit builder for QubitLab, \
a gamified quantum computing learning platform.

Circuit JSON schema you will be shown and must use when proposing changes:
{
  "qubits": <int, number of qubits>,
  "gates": [
    {
      "type": "H" | "X" | "Y" | "Z" | "CNOT" | "TOFFOLI" | "MEASURE",
      "qubit": <int, the primary/control qubit index, 0-based>,
      "target": <int, target qubit index — required for CNOT and TOFFOLI only>,
      "controls": <[int, int], the two control qubit indices — required for TOFFOLI only>,
      "step": <int, 0-based time step this gate occurs at, for circuit ordering>
    },
    ...
  ]
}

Gate reference: H = Hadamard (creates superposition), X/Y/Z = Pauli gates, \
CNOT = controlled-X (qubit=control, target=target), TOFFOLI = controlled-controlled-X \
(controls=[c1,c2], target=target), MEASURE = measure a qubit (qubit=index).

You MUST respond with exactly one JSON object, and nothing else, matching ONE of these two shapes:

1. To answer a question or explain something about the circuit or a quantum computing concept:
   {"type": "explanation", "text": "<plain-language answer>"}

2. To carry out a circuit-modification command the user gave you (e.g. "add a CNOT between qubit 0 and 1", \
"remove the H gate on qubit 0"):
   {"type": "action", "action": "add_gate" | "remove_gate", "gate": {"type": "...", "qubit": <int>, \
"target": <int or omit>, "controls": <[int,int] or omit>, "step": <int>}}

Only use "action" when the user is clearly asking you to change the circuit. Otherwise use "explanation".
Never respond with markdown, code fences, or any text outside the single JSON object."""

QUIZ_SYSTEM_PROMPT = """You are a quiz-writer for QubitLab, a gamified quantum computing learning platform. \
Given a topic or a circuit description, write exactly one multiple-choice question that tests understanding \
of quantum computing concepts. Respond with exactly one JSON object and nothing else, matching this shape:
{
  "questionText": "<the question>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctOptionIndex": <int, 0-3, index of the correct option in "options">,
  "explanation": "<why the correct answer is correct>"
}
Exactly 4 options are required. Keep the question and options concise and unambiguous."""


def _ai_error_to_http(exc: Exception) -> HTTPException:
    if isinstance(exc, AIConfigError):
        return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    if isinstance(exc, (AIRequestError, AIParsingError)):
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


_chat_response_adapter: TypeAdapter = TypeAdapter(ChatResponse)


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in payload.conversationHistory]
    messages.append(
        {
            "role": "user",
            "content": f"Current circuit:\n{json.dumps(payload.circuitJson)}\n\nUser message: {payload.message}",
        }
    )

    try:
        raw = await chat_completion_json(CHAT_SYSTEM_PROMPT, messages)
    except (AIConfigError, AIRequestError, AIParsingError) as exc:
        raise _ai_error_to_http(exc)

    try:
        return _chat_response_adapter.validate_python(raw)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI response did not match the expected explanation/action schema",
        )


@router.post("/quiz/generate", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
async def generate_quiz(payload: QuizGenerateRequest):
    if payload.circuitJson is not None:
        prompt = f"Write a question grounded in this specific circuit:\n{json.dumps(payload.circuitJson)}"
    else:
        prompt = f"Write a question about this quantum computing topic: {payload.topic}"

    try:
        raw = await chat_completion_json(QUIZ_SYSTEM_PROMPT, [{"role": "user", "content": prompt}])
    except (AIConfigError, AIRequestError, AIParsingError) as exc:
        raise _ai_error_to_http(exc)

    try:
        quiz = QuizLLMOutput.model_validate(raw)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI response did not match the expected question schema",
        )

    question = await db.question.create(
        data={
            "circuitContext": Json(payload.circuitJson) if payload.circuitJson is not None else None,
            "questionText": quiz.questionText,
            "options": Json(quiz.options),
            "correctOptionIndex": quiz.correctOptionIndex,
            "explanation": quiz.explanation,
            "aiGenerated": True,
            "approved": False,
        }
    )
    return question
