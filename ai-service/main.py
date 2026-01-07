import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI
from groq import Groq
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from sentence_transformers import SentenceTransformer

load_dotenv()

app = FastAPI()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = "questions"

groq_client = Groq(api_key=GROQ_API_KEY)
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
embedder = SentenceTransformer("all-MiniLM-L6-v2")


class GenerateRequest(BaseModel):
    description: str


class SimilarRequest(BaseModel):
    question: str


class EvaluateRequest(BaseModel):
    question: str
    answer: str


class SimilarResponse(BaseModel):
    similar_questions: list[dict]


class EvaluateResponse(BaseModel):
    score: int
    explanation: str


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/generate_question")
async def generate_question(req: GenerateRequest):
    prompt = f"Сгенерирую вопрос для интервью по текстовому описанию: {req.description}"
    completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=GROQ_MODEL,
    )
    question = completion.choices[0].message.content.strip()
    return {"question": question}


@app.post("/evaluate_answer")
async def evaluate_answer(req: EvaluateRequest):
    prompt = f"Evaluate the following answer to the question on a scale of 1-10, where 1 is poor and 10 is excellent. Provide a score and a brief explanation.\nQuestion: {req.question}\nAnswer: {req.answer}"
    completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=GROQ_MODEL,
    )
    response = completion.choices[0].message.content.strip()
    lines = response.split("\n")
    score_line = next((l for l in lines if l.startswith("Score:")), "Score: 5")
    expl_line = "\n".join(lines[1:]) if len(lines) > 1 else "No explanation"
    score = int(score_line.split(":")[1].strip())
    explanation = expl_line.replace("Explanation:", "").strip()
    return EvaluateResponse(score=score, explanation=explanation)


@app.post("/check_similar")
async def check_similar(req: SimilarRequest):
    embedding = embedder.encode(req.question).tolist()
    search_result = qdrant_client.search(
        collection_name=QDRANT_COLLECTION, query_vector=embedding, limit=3
    )
    similar = [
        {"question": point.payload["question"], "score": point.score}
        for point in search_result
    ]
    return SimilarResponse(similar_questions=similar)


@app.post("/add_question")
async def add_question(req: SimilarRequest):
    embedding = embedder.encode(req.question).tolist()

    point_id = str(uuid.uuid4())

    qdrant_client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=[
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "question": req.question,
                },
            )
        ],
    )

    return {"status": "success", "id": point_id}
