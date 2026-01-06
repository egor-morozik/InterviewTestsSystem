from domain.entities.question import Question
from infrastructure.factories.client_factory import ClientFactory


async def run_app():
    factory = ClientFactory()

    ai_client = factory.ai
    db_client = factory.db

    question = Question(text="Как работает Docker?")
    answer = await ai_client.ask_question(question)
    await db_client.save_embedding(answer, {"type": "ai_response"})
