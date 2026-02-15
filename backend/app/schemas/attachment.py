"""
Attachment Schemas
Pydantic models for TaskAttachment operations.
"""

from pydantic import BaseModel
from datetime import datetime


class AttachmentResponse(BaseModel):
    id: int
    task_id: int
    filename: str
    file_size: int
    content_type: str | None = None
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True
