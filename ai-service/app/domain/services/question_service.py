from ..ports.ai_client import AIClient
from ..ports.vector_db import VectorDB
from ..entities.question import Question

class QuestionService:
    def __init__(self, ai_client: AIClient, db_client: VectorDB):
        self.ai = ai_client
        self.db = db_client

    async def generate_and_save(self, description: str) -> Question:
        pass
    