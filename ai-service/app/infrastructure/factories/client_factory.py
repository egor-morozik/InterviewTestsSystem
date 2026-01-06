from .ai_factory import AIFactory
from .vector_db_factory import VectorDBFactory


class ClientFactory:
    def __init__(self):
        self.ai = AIFactory.create_client()
        self.db = VectorDBFactory.create_client()
