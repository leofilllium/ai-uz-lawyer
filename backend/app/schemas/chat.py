"""
Chat Pydantic Schemas
Request/response models for lawyer chat endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class ChatRequest(BaseModel):
    """Request model for chat message."""
    message: str = Field(..., min_length=1)
    session_id: int | None = None
    chat_mode: str = Field(
        default='risk-manager', 
        pattern='^(risk-manager|smalltalk|consultant|practitioner|litigator|legal-audit|compliance|tax|corporate|commercial|negotiator|startup|procedural|deadlines|hr|worker-protection|analyst|skeptic|judge-questions|odds|strategist|what-if|interview-practice)$'
    )


class ChatMessageResponse(BaseModel):
    """Response model for a chat message."""
    id: int
    session_id: int
    role: str
    content: str
    sources: list[dict] | None = None
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    """Response model for a chat session."""
    id: int
    user_id: int | None = None
    session_type: str
    title: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    message_count: int = 0
    
    class Config:
        from_attributes = True


class ChatSessionDetailResponse(ChatSessionResponse):
    """Detailed session response with messages."""
    messages: list[ChatMessageResponse] = []


class StreamChunk(BaseModel):
    """SSE stream chunk for chat responses."""
    chunk: str | None = None
    done: bool = False
    session_id: int | None = None
    sources: list[dict] | None = None
    error: str | None = None
