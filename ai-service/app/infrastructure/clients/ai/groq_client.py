from .base import BaseAIClient
from ....domain.entities.question import Question
from ....domain.entities.evaluation import Evaluation

class GroqClient(BaseAIClient):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def ask_question(self, question: Question) -> str:
        return f"Ответ от Groq на вопрос: {question.text}"

    async def evaluate_answer(self, answer: str) -> Evaluation:
        return Evaluation(score=0.9, feedback="Хороший ответ", model_name="groq")
    