"""
Organization Schemas
Pydantic models for Organization operations.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalRequest(BaseModel):
    user_id: int
    approve: bool


class RoleUpdateRequest(BaseModel):
    user_id: int
    role: str = Field(..., pattern="^(HEAD|SENIOR|EMPLOYEE)$")
