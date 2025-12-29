"""
Contract Pydantic Schemas
Request/response models for validator and generator endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime


# Validator schemas
class ValidateContractRequest(BaseModel):
    """Request model for contract validation."""
    contract: str = Field(..., min_length=50)


class ContractAudit(BaseModel):
    """Contract audit result."""
    validity_score: int = 0
    score_explanation: str = ""
    critical_errors: list[dict] = []
    warnings: list[dict] = []
    missing_clauses: list[dict] = []
    summary: str = ""


class ValidateContractResponse(BaseModel):
    """Response model for contract validation."""
    success: bool = True
    analysis_id: int
    session_id: int | None = None
    audit: ContractAudit
    sources: list[dict] = []


class ContractAnalysisResponse(BaseModel):
    """Response model for contract analysis history item."""
    id: int
    user_id: int | None = None
    contract_preview: str
    validity_score: int
    score_explanation: str | None = None
    critical_errors: list[dict] = []
    warnings: list[dict] = []
    missing_clauses: list[dict] = []
    summary: str | None = None
    sources: list[dict] = []
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True


# Generator schemas
class GenerateContractRequest(BaseModel):
    """Request model for contract generation."""
    category: str = Field(..., min_length=1)
    requirements: str = Field(..., min_length=20)


class ContractCategory(BaseModel):
    """Contract category info."""
    name: str
    count: int
    description: str = ""


class ContractTemplate(BaseModel):
    """Contract template info."""
    name: str
    path: str


class GeneratedContractResponse(BaseModel):
    """Response model for generated contract."""
    id: int
    user_id: int | None = None
    category: str
    requirements: str
    generated_text: str
    template_names: list[str] = []
    sources: list[dict] = []
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True
