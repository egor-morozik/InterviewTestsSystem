from typing import List

from .base import BaseVectorDB


class QdrantClient(BaseVectorDB):
    def __init__(self, url: str, api_key: str):
        self.url = url
        self.api_key = api_key

    async def save_embedding(self, text: str, metadata: dict) -> None:
        print(f"Сохранение в Qdrant по адресу {self.url}")

    async def search_similar(self, query: str, limit: int = 5) -> List[str]:
        return ["Результат 1", "Результат 2"]
