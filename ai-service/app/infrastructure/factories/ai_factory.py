from ...core.config import settings
from ..clients.ai.groq_client import GroqClient
from ...domain.ports.ai_client import AIClient

class AIFactory:
    @staticmethod
    def create_client() -> AIClient:
        if settings.AI_TYPE == "groq":
            return GroqClient(api_key=settings.GROQ_API_KEY.get_secret_value())
        raise ValueError(f"Unknown AI type: {settings.AI_TYPE}")
    