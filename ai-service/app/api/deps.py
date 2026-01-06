from app.core.config import Settings, get_settings
from app.domain.services.evaluation_service import EvaluationService
from app.domain.services.question_service import QuestionService
from app.domain.services.similarity_service import SimilarityService
from app.infrastructure.factories.client_factory import ClientFactory
from fastapi import Depends


def get_client_factory(settings: Settings = Depends(get_settings)) -> ClientFactory:
    return ClientFactory(settings)


def get_similarity_service(
    factory: ClientFactory = Depends(get_client_factory),
) -> SimilarityService:
    ai_client = factory.get_ai_client()
    vector_db = factory.get_vector_db_client()
    return SimilarityService(ai_client, vector_db)


def get_question_service(
    factory: ClientFactory = Depends(get_client_factory),
) -> QuestionService:
    ai_client = factory.get_ai_client()
    return QuestionService(ai_client)


def get_evaluation_service(
    factory: ClientFactory = Depends(get_client_factory),
) -> EvaluationService:
    ai_client = factory.get_ai_client()
    return EvaluationService(ai_client)
