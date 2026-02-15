"""
CalendarEvent Schemas
Pydantic models for calendar event operations.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    event_datetime: datetime


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    event_datetime: Optional[datetime] = None


class CalendarEventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_datetime: datetime
    organization_id: int
    created_by: int
    created_at: datetime
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True
