from ..entities.question import Question
from ..ports.vector_db import VectorDB


class SimilarityService:
    def __init__(self, db_client: VectorDB):
        self.db = db_client

    async def check_similarity(self, question: Question) -> list[str]:
        return self.db.search_similar(question.text)
