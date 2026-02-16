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
        pattern='^(auto-detect|risk-manager|smalltalk|consultant|practitioner|litigator|legal-audit|compliance|tax|corporate|commercial|negotiator|startup|procedural|deadlines|hr|worker-protection|analyst|skeptic|judge-questions|odds|strategist|what-if|interview-practice|family|real-estate|notary|ip|criminal-defense|criminal-prosecution|admin-defense|admin-procedure|customs|procurement|enforcement|arbitration|constitutional|consumer-protection|housing|land-disputes|digital-law|environmental|antitrust|insurance|banking|securities|investor-protection|mediation|doc-review|legal-letter|compliance-hr|debt-collection|bankruptcy|merger-acquisition|licensing|regulatory|cross-border|forensic-legal|quick-answer|memorandum)$'
    )
    # Optional task context fields for contextual chat
    task_context_name: str | None = None
    task_context_description: str | None = None
    task_context_text: str | None = None


class ChatMessageResponse(BaseModel):
    """Response model for a chat message."""
    id: int
    session_id: int
    role: str
    content: str
    sources: list[dict] | None = None
    quality_metrics: dict | None = None
    search_rounds: list[dict] | None = None
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
    quality_metrics: dict | None = None
    search_rounds: list[dict] | None = None
    error: str | None = None


class DraftResultRequest(BaseModel):
    """Request to draft a task result."""
    task_id: int
    user_instructions: str | None = None
