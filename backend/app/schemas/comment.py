"""
Comment Schemas
Pydantic models for TaskComment operations.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from app.schemas.attachment import AttachmentResponse


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=100000)


class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    user_name: str = ""
    content: str
    created_at: datetime
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True
