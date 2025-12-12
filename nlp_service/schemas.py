from pydantic import BaseModel


class CommentRequest(BaseModel):
    text: str


class ClassificationResponse(BaseModel):
    label: int
    label_name: str
    confidence: float
