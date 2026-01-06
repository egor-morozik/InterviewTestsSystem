from abc import ABC, abstractmethod
from entities.question import Question
from entities.evaluation import Evaluation

class AIClient(ABC):
    @abstractmethod
    async def ask_question(self, question: Question) -> str:
        pass

    @abstractmethod
    async def evaluate_answer(self, answer: str) -> Evaluation:
        pass
