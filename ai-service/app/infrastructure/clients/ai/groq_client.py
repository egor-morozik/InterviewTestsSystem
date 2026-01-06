import json

from groq import AsyncGroq

from ....domain.entities.evaluation import Evaluation
from ....domain.entities.question import Question
from .base import BaseAIClient


class GroqClient(BaseAIClient):
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    async def create_question(self, description: str) -> Question:
        prompt = f"""
        На основе описания создай учебный вопрос. 
        Описание: {description}
        
        Верни ответ СТРОГО в формате JSON со следующими полями:
        - text: текст вопроса
        - question_type: одно из (text, single_choice, multiple_choice, code)
        - complexity: одно из (easy, medium, hard)
        - correct_answer: правильный ответ
        - stdin: входные данные (если применимо, иначе пустая строка)
        """

        response = await self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        return Question(**data)

    async def evaluate_answer(self, question: Question, answer: str) -> Evaluation:
        prompt = f"""
        Вопрос: {question.text}
        Правильный ответ(может не быть): {question.correct_answer}
        Ответ пользователя: {answer}
        
        Оцени ответ пользователя. Верни JSON:
        - score: число от 0.0 до 1.0
        - feedback: краткий комментарий почему такая оценка
        """

        response = await self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        return Evaluation(
            score=data["score"], feedback=data["feedback"], model_name=self.model
        )
