from ..entities.question import Question
from ..ports.ai_client import AIClient
from ..ports.vector_db import VectorDB


class SimilarityService:
    def __init__(self, ai_client: AIClient, db_client: VectorDB):
        self.ai = ai_client
        self.db = db_client

    async def check_similarity(self, question: Question) -> bool:
        pass
