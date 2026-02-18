"""
Contract Pydantic Schemas
Request/response models for validator and generator endpoints.
"""

from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Any


# Validator schemas
class ValidateContractRequest(BaseModel):
    """Request model for contract validation."""
    contract: str = Field(..., min_length=50)


class FixContractRequest(BaseModel):
    """Request model for automatic contract fixing."""
    analysis_id: int


class ContractAudit(BaseModel):
    """Contract audit result."""
    model_config = {"extra": "ignore"}

    validity_score: int = 0
    score_explanation: str = ""
    critical_errors: list[dict] = []
    warnings: list[dict] = []
    missing_clauses: list[dict] = []
    summary: str = ""
    # Strict Mode Fields
    strictness_level: str = "standard"
    hidden_risks: list[dict] = []
    ambiguities: list[dict] = []
    negotiation_strategy: str = ""

    @model_validator(mode="before")
    @classmethod
    def coerce_nulls(cls, data: Any) -> Any:
        """Coerce null values from AI responses to proper defaults."""
        if not isinstance(data, dict):
            return data
        for key in ["score_explanation", "summary", "strictness_level", "negotiation_strategy"]:
            if data.get(key) is None:
                data[key] = ""
        for key in ["critical_errors", "warnings", "missing_clauses", "hidden_risks", "ambiguities"]:
            if not isinstance(data.get(key), list):
                data[key] = []
        if not isinstance(data.get("validity_score"), (int, float)):
            data["validity_score"] = 0
        return data


class ValidateContractResponse(BaseModel):
    """Response model for contract validation."""
    success: bool = True
    analysis_id: int
    session_id: int | None = None
    audit: ContractAudit
    sources: list[dict] = []


class ContractAnalysisResponse(BaseModel):
    """Response model for contract analysis history item."""
    model_config = {"extra": "ignore", "from_attributes": True}

    id: int
    user_id: int | None = None
    contract_preview: str = ""
    validity_score: int = 0
    score_explanation: str | None = None
    critical_errors: list[dict] = []
    warnings: list[dict] = []
    missing_clauses: list[dict] = []
    summary: str | None = None
    strictness_level: str = "standard"
    hidden_risks: list[dict] = []
    ambiguities: list[dict] = []
    negotiation_strategy: str = ""
    sources: list[dict] = []
    created_at: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def coerce_nulls(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        if data.get("validity_score") is None:
            data["validity_score"] = 0
        for key in ["critical_errors", "warnings", "missing_clauses", "hidden_risks", "ambiguities", "sources"]:
            if not isinstance(data.get(key), list):
                data[key] = []
        return data


# Generator schemas
class GenerateContractRequest(BaseModel):
    """Request model for contract generation."""
    category: str = Field(..., min_length=1)
    requirements: str = Field(..., min_length=20)
    ultra_mode: bool = False


class ContractCategory(BaseModel):
    """Contract category info."""
    name: str
    count: int
    description: str = ""


class ContractTemplate(BaseModel):
    """Contract template info."""
    name: str
    path: str


class ValidationData(BaseModel):
    """Validation data from ultra mode."""
    validity_score: int = 0
    score_explanation: str = ""
    strictness_level: str = "standard"
    critical_errors: list[dict] = []
    hidden_risks: list[dict] = []
    ambiguities: list[dict] = []
    warnings: list[dict] = []
    missing_clauses: list[dict] = []
    summary: str = ""
    negotiation_strategy: str = ""


class GeneratedContractResponse(BaseModel):
    """Response model for generated contract."""
    id: int
    user_id: int | None = None
    category: str
    requirements: str
    generated_text: str
    template_names: list[str] = []
    sources: list[dict] = []
    validation: ValidationData | None = None  # Ultra mode validation details
    created_at: datetime | None = None

    class Config:
        from_attributes = True
