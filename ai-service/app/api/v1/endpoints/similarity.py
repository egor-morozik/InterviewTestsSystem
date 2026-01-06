from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel, Field
from app.api.deps import get_similarity_service
from app.domain.services.similarity_service import SimilarityService

router = APIRouter()

class SimilarityRequest(BaseModel):
    question_text: str = Field(..., min_length=10, description="Текст вопроса для сравнения")
    threshold: float = Field(0.8, ge=0.0, le=1.0, description="Порог схожести (0-1)")
    limit: int = Field(3, ge=1, le=10, description="Максимальное количество результатов")

class SimilarQuestion(BaseModel):
    django_id: int = Field(..., description="ID вопроса в Django БД")
    question_text: str = Field(..., description="Текст вопроса")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Мера схожести")
    difficulty: str = Field(..., description="Сложность вопроса")
    question_type: str = Field(..., description="Тип вопроса")

class SimilarityResponse(BaseModel):
    similar_questions: List[SimilarQuestion] = Field(..., description="Список похожих вопросов")
    found_count: int = Field(..., description="Количество найденных вопросов")
    average_similarity: float = Field(..., description="Средняя схожесть")

@router.post("/find", response_model=SimilarityResponse)
async def find_similar_questions(
    request: SimilarityRequest,
    similarity_service: SimilarityService = Depends(get_similarity_service)
):
    similar_questions = await similarity_service.find_similar(
        question_text=request.question_text,
        threshold=request.threshold,
        limit=request.limit
    )
    
    return SimilarityResponse(
        similar_questions=similar_questions,
        found_count=len(similar_questions),
        average_similarity=(
            sum(q.similarity_score for q in similar_questions) / len(similar_questions)
            if similar_questions else 0
        )
    )
        