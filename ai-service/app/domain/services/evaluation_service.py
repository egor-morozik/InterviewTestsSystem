from ..ports.ai_client import AIClient
from ..ports.vector_db import VectorDB
from ..entities.question import Question
from ..entities.evaluation import Evaluation

class EvaluationService:
    def __init__(self, ai_client: AIClient, db_client: VectorDB):
        self.ai = ai_client
        self.db = db_client

    async def get_mark(self, qustion: Question, answer: str) -> Evaluation:
        pass
    