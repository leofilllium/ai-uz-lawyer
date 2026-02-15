"""
Task Schemas
Pydantic models for Task operations.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.task import TaskStatus, TaskPriority, TaskComplexity
from app.schemas.comment import CommentResponse
from app.schemas.attachment import AttachmentResponse


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    complexity: TaskComplexity = TaskComplexity.MEDIUM
    deadline: Optional[datetime] = None
    assignee_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    complexity: Optional[TaskComplexity] = None
    deadline: Optional[datetime] = None
    assignee_id: Optional[int] = None


class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    organization_id: int
    reporter_id: int
    reporter_name: Optional[str] = None
    assignee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskDetailResponse(TaskResponse):
    """Extended response with comments and attachments."""
    comments: List[CommentResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True
