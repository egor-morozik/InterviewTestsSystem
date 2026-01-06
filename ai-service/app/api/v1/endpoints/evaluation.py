from typing import List, Optional

from app.api.deps import get_evaluation_service
from app.domain.services.evaluation_service import EvaluationService
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class AnswerEvaluationRequest(BaseModel):
    question_text: str = Field(..., description="Текст вопроса")
    answer_text: str = Field(..., description="Ответ кандидата")
    question_type: str = Field(..., description="Тип вопроса")
    correct_answer: Optional[str] = Field(
        None, description="Правильный ответ (если есть)"
    )
    criteria: List[str] = Field(
        default=["accuracy", "completeness", "clarity"], description="Критерии оценки"
    )


class AIEvaluation(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0, description="Оценка в процентах")
    feedback: str = Field(..., description="Развернутый фидбэк")
    strengths: List[str] = Field(..., description="Сильные стороны ответа")
    weaknesses: List[str] = Field(..., description="Слабые стороны ответа")
    suggestions: List[str] = Field(..., description="Предложения по улучшению")
    criteria_scores: dict = Field(..., description="Оценки по каждому критерию")


@router.post("/evaluate-answer", response_model=AIEvaluation)
async def evaluate_answer(
    request: AnswerEvaluationRequest,
    evaluation_service: EvaluationService = Depends(get_evaluation_service),
):
    evaluation = await evaluation_service.evaluate_answer(
        question_text=request.question_text,
        answer_text=request.answer_text,
        question_type=request.question_type,
        correct_answer=request.correct_answer,
        criteria=request.criteria,
    )

    return evaluation


@router.post("/evaluate-code")
async def evaluate_code_answer(
    code: str,
    question_description: str,
    language: str,
    evaluation_service: EvaluationService = Depends(get_evaluation_service),
):
    evaluation = await evaluation_service.evaluate_code(
        code=code, question_description=question_description, language=language
    )

    return evaluation
