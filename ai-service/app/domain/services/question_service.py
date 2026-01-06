from ..entities.question import Question
from ..ports.ai_client import AIClient
from ..ports.vector_db import VectorDB


class QuestionService:
    def __init__(self, ai_client: AIClient, db_client: VectorDB):
        self.ai = ai_client
        self.db = db_client

    async def generate(self, description: str) -> Question:
        return self.ai.create_question(description)

    async def save_question(self, new_question: Question) -> None:
        self.db.save_embedding(new_question.text, dict(Question.id))
