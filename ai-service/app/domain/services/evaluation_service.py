from ..entities.evaluation import Evaluation
from ..entities.question import Question
from ..ports.ai_client import AIClient
from ..ports.vector_db import VectorDB


class EvaluationService:
    def __init__(self, ai_client: AIClient):
        self.ai = ai_client

    async def get_mark(self, question: Question, answer: str) -> Evaluation:
        return self.ai.evaluate_answer(question, answer)
