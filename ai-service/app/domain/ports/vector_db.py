from abc import ABC, abstractmethod
from typing import List

from entities.question import Question


class VectorDB(ABC):
    @abstractmethod
    async def save_embedding(self, text: str, metadata: dict) -> None:
        pass

    @abstractmethod
    async def search_similar(self, query: str, limit: int = 5) -> List[str]:
        pass
