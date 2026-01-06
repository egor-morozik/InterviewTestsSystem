from typing import List, Optional

from app.api.deps import get_question_service, get_similarity_service
from app.domain.services.question_service import QuestionService
from app.domain.services.similarity_service import SimilarityService
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

router = APIRouter()


class QuestionGenerationRequest(BaseModel):
    description: str = Field(
        ..., min_length=20, description="Описание того, какой вопрос нужен"
    )
    difficulty: str = Field("medium", description="Сложность: easy/medium/hard")
    question_type: str = Field(
        "multiple_choice", description="Тип: multiple_choice/code/text"
    )
    language: Optional[str] = Field(
        "python", description="Язык программирования для кодовых вопросов"
    )
    context: Optional[str] = Field(None, description="Дополнительный контекст")


class GeneratedQuestion(BaseModel):
    question_text: str = Field(..., description="Текст вопроса")
    options: Optional[List[str]] = Field(
        None, description="Варианты ответов (для multiple choice)"
    )
    correct_answer: Optional[str] = Field(None, description="Правильный ответ")
    explanation: Optional[str] = Field(None, description="Объяснение ответа")
    difficulty: str = Field(..., description="Сложность")
    question_type: str = Field(..., description="Тип вопроса")


@router.post("/generate", response_model=GeneratedQuestion)
async def generate_question(
    request: QuestionGenerationRequest,
    generation_service: QuestionService = Depends(get_question_service),
):
    generated = await generation_service.generate_question(
        description=request.description,
        difficulty=request.difficulty,
        question_type=request.question_type,
        language=request.language,
        context=request.context,
    )

    return generated


@router.post("/sync")
async def sync_question_with_vector_db(
    django_id: int,
    question_text: str,
    difficulty: str,
    question_type: str,
    similarity_service: SimilarityService = Depends(get_similarity_service),
):

    vector_id = await similarity_service.add_question_to_vector_db(
        django_id=django_id,
        question_text=question_text,
        difficulty=difficulty,
        question_type=question_type,
    )

    return {"vector_id": vector_id, "status": "synced"}
