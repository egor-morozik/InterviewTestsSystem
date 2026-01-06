from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    TEXT = "text"
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    CODE = "code"


class QuestionComplexity(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Tag(BaseModel):
    name: str


class Question(BaseModel):
    complexity: QuestionComplexity = Field(
        default=QuestionComplexity.MEDIUM, description="Сложность вопроса"
    )

    id: int = Field(
        ge=1,
        description="Индефикатор вопроса",
    )

    text: str = Field(
        ...,
        min_length=1,
        description="Текст вопроса",
    )

    question_type: QuestionType = Field(
        default=QuestionType.TEXT,
        description="Тип вопроса",
    )

    correct_answer: str = Field(
        ...,
        description="Правильный ответ для автооценки",
    )

    stdin: Optional[str] = Field(
        default="",
        description="Входные данные для кода",
    )

    tags: List[Tag] = Field(
        default_factory=list,
        description="Теги вопроса",
    )
