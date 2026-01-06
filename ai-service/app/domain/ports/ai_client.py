from abc import ABC, abstractmethod

from entities.evaluation import Evaluation
from entities.question import Question


class AIClient(ABC):
    @abstractmethod
    async def create_question(self, description: str) -> Question:
        pass

    @abstractmethod
    async def evaluate_answer(self, question: Question, answer: str) -> Evaluation:
        pass
