from typing import List

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from .base import BaseVectorDB


class QdrantClient(BaseVectorDB):
    def __init__(self, url: str, api_key: str):
        self.client = AsyncQdrantClient(url=url, api_key=api_key)
        self.collection_name = "questions"

    async def _ensure_collection(self, vector_size: int):
        collections = await self.client.get_collections()
        exists = any(c.name == self.collection_name for c in collections.collections)

        if not exists:
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )

    async def save_embedding(self, text: str, metadata: dict) -> None:
        await self.client.set_model("sentence-transformers/all-MiniLM-L6-v2")
        embeddings = list(self.client.embed(text))
        vector = embeddings[0]

        await self._ensure_collection(len(vector))

        await self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=metadata.get("id"),
                    vector=vector,
                    payload={"text": text, **metadata},
                )
            ],
        )

    async def search_similar(self, query: str, limit: int = 3) -> List[str]:
        await self.client.set_model("sentence-transformers/all-MiniLM-L6-v2")
        query_vector = list(self.client.embed(query))[0]

        search_result = await self.client.search(
            collection_name=self.collection_name, query_vector=query_vector, limit=limit
        )
        return [hit.payload["text"] for hit in search_result]
