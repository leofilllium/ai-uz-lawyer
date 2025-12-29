"""
Authentication Pydantic Schemas
Request/response models for auth endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserRegisterRequest(BaseModel):
    """Request model for user registration."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLoginRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response model for user data."""
    id: int
    name: str
    email: str
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response model for authentication token."""
    success: bool = True
    token: str
    user: UserResponse


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
