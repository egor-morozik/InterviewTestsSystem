from ...core.config import settings
from ...domain.ports.vector_db import VectorDB
from ..clients.vector_db.qdrant_client import QdrantClient


class VectorDBFactory:
    @staticmethod
    def create_client() -> VectorDB:
        if settings.DB_TYPE == "qdrant":
            return QdrantClient(
                api_key=settings.QDRANT_API_KEY.get_secret_value(),
                url=settings.QDRANT_URL.get_secret_value(),
            )
        raise ValueError(f"Unknown DB type: {settings.DB_TYPE}")
