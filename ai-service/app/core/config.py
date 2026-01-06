from enum import Enum

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class AIProvider(str, Enum):
    GROQ = "groq"
    OPENAI = "openai"


class DBProvider(str, Enum):
    QDRANT = "qdrant"
    CHROMA = "chroma"


class Settings(BaseSettings):
    AI_TYPE: AIProvider = AIProvider.GROQ
    DB_TYPE: DBProvider = DBProvider.QDRANT

    GROQ_API_KEY: SecretStr | None = None

    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: SecretStr | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
