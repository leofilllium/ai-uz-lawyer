"""
Task Schemas
Pydantic models for Task operations.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.task import TaskStatus, TaskPriority, TaskComplexity


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
    created_at: datetime
    updated_at: datetime
    
    # Nested minimal user info could be added if needed, 
    # but for now we'll stick to IDs to avoid circular deps or heavy queries
    
    class Config:
        from_attributes = True
