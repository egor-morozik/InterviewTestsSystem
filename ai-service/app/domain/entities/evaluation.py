from pydantic import BaseModel, Field

class Evaluation(BaseModel):
    score: float = Field(ge=0, le=1.0, description="Оценка от 0 до 1")
    feedback: str
    model_name: str
