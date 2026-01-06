from abc import ABC, abstractmethod
from typing import List


class VectorDB(ABC):
    @abstractmethod
    async def save_embedding(self, text: str, metadata: dict) -> None:
        pass

    @abstractmethod
    async def search_similar(self, query: str, limit: int = 3) -> List[str]:
        pass
