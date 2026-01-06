from fastapi import APIRouter
from app.api.v1.endpoints import health, similarity, questions, evaluation

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(similarity.router, prefix="/similarity", tags=["similarity"])
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])
