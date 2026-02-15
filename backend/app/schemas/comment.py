"""
Comment Schemas
Pydantic models for TaskComment operations.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    user_name: str = ""
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
