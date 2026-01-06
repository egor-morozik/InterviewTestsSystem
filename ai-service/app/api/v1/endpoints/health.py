from app.api.deps import get_client_factory
from app.core.config import Settings, get_settings
from app.infrastructure.factories.client_factory import ClientFactory
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/")
async def health_check(factory: ClientFactory = Depends(get_client_factory)):
    checks = {"api": "healthy", "ai_provider": "unknown", "vector_db": "unknown"}

    ai_client = factory.get_ai_client()
    ai_status = await ai_client.health_check()
    checks["ai_provider"] = ai_status

    vector_db = factory.get_vector_db_client()
    vector_status = await vector_db.health_check()
    checks["vector_db"] = vector_status

    return checks
