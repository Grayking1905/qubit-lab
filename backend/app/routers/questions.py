from fastapi import APIRouter, Depends, HTTPException, status

from app.database import db
from app.deps import get_current_user
from app.schemas.question import AttemptRequest, AttemptResponse

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/{question_id}/attempt", response_model=AttemptResponse)
async def attempt_question(question_id: str, payload: AttemptRequest, user=Depends(get_current_user)):
    question = await db.question.find_unique(where={"id": question_id})
    if question is None or not question.approved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    correct = payload.selectedOptionIndex == question.correctOptionIndex

    await db.questionattempt.create(
        data={
            "userId": user.id,
            "questionId": question_id,
            "selectedOptionIndex": payload.selectedOptionIndex,
            "isCorrect": correct,
        }
    )

    return AttemptResponse(
        correct=correct,
        correctOptionIndex=question.correctOptionIndex,
        explanation=question.explanation,
    )
