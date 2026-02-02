"""
Document Pydantic Schemas
Request/response models for document validator endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Document type options
DOCUMENT_TYPES = [
    "power_of_attorney",      # Доверенность
    "corporate_resolution",   # Решение/Протокол
    "claim",                  # Претензия/Иск
    "application",            # Заявление
    "agreement",              # Соглашение
    "act",                    # Акт
    "order",                  # Приказ
    "regulation",             # Положение
    "instruction",            # Инструкция
    "certificate",            # Справка/Сертификат
    "decree",                 # Указ/Постановление
    "other"                   # Другое
]


# Validator schemas
class ValidateDocumentRequest(BaseModel):
    """Request model for document validation."""
    document: str = Field(..., min_length=50)
    document_type: Optional[str] = None  # Optional type hint for better analysis


class FormalValiditySection(BaseModel):
    """Formal validity check results."""
    is_valid: bool = True
    score: int = 0
    issues: list[dict] = []
    explanation: str = ""


class LegalValiditySection(BaseModel):
    """Legal/substantive validity check results."""
    is_valid: bool = True
    score: int = 0
    issues: list[dict] = []
    applicable_laws: list[str] = []
    explanation: str = ""


class UpToDateSection(BaseModel):
    """Up-to-dateness check results."""
    is_current: bool = True
    score: int = 0
    outdated_references: list[dict] = []
    deprecated_laws: list[dict] = []
    explanation: str = ""


class ComplianceSection(BaseModel):
    """Compliance and regulatory check results."""
    is_compliant: bool = True
    score: int = 0
    violations: list[dict] = []
    requirements: list[dict] = []
    explanation: str = ""


class RiskAnalysisSection(BaseModel):
    """Risk analysis results."""
    risk_level: str = "low"  # low, medium, high, critical
    score: int = 0
    risks: list[dict] = []
    mitigation_suggestions: list[str] = []
    explanation: str = ""


# NEW: Additional validation sections

class ConsistencyCheckSection(BaseModel):
    """Comparison & internal consistency check results."""
    is_consistent: bool = True
    score: int = 0
    inconsistencies: list[dict] = []     # internal contradictions
    cross_references: list[dict] = []     # references to other docs
    numbering_issues: list[dict] = []     # numbering/ordering problems
    terminology_issues: list[dict] = []   # inconsistent terminology
    explanation: str = ""


class JurisdictionSection(BaseModel):
    """Jurisdiction intelligence results."""
    primary_jurisdiction: str = "Uzbekistan"
    score: int = 0
    applicable_courts: list[str] = []
    territorial_scope: str = ""
    cross_border_issues: list[dict] = []
    forum_selection: dict = {}
    statute_of_limitations: dict = {}
    explanation: str = ""


class LitigationReadinessSection(BaseModel):
    """Evidence & litigation readiness assessment."""
    readiness_level: str = "medium"  # low, medium, high
    score: int = 0
    evidence_gaps: list[dict] = []
    proof_requirements: list[dict] = []
    witness_needs: list[str] = []
    document_chain: list[dict] = []  # document authentication chain
    admissibility_issues: list[dict] = []
    litigation_strategy: list[str] = []
    explanation: str = ""


class EthicalGuardrailsSection(BaseModel):
    """Ethical and legal guardrails assessment."""
    passes_ethics: bool = True
    score: int = 0
    ethical_concerns: list[dict] = []
    public_policy_issues: list[dict] = []
    good_faith_issues: list[dict] = []
    unfair_terms: list[dict] = []
    consumer_protection: list[dict] = []
    anti_corruption: list[dict] = []
    explanation: str = ""


class ImprovementItem(BaseModel):
    """Single improvement suggestion."""
    issue: str = ""
    location: str = ""
    current_text: str = ""
    suggested_text: str = ""
    priority: str = "medium"  # low, medium, high, critical
    explanation: str = ""


class DocumentAudit(BaseModel):
    """Comprehensive document audit result."""
    overall_score: int = 0
    document_type_detected: str = ""
    
    # Core validations
    formal_validity: FormalValiditySection = FormalValiditySection()
    legal_validity: LegalValiditySection = LegalValiditySection()
    up_to_dateness: UpToDateSection = UpToDateSection()
    compliance_check: ComplianceSection = ComplianceSection()
    risk_analysis: RiskAnalysisSection = RiskAnalysisSection()
    
    # NEW: Extended validations
    consistency_check: ConsistencyCheckSection = ConsistencyCheckSection()
    jurisdiction_intelligence: JurisdictionSection = JurisdictionSection()
    litigation_readiness: LitigationReadinessSection = LitigationReadinessSection()
    ethical_guardrails: EthicalGuardrailsSection = EthicalGuardrailsSection()
    
    improvements: list[ImprovementItem] = []
    summary: str = ""
    explainability: str = ""  # Clear explanation of all findings (NON-NEGOTIABLE)


class ValidateDocumentResponse(BaseModel):
    """Response model for document validation."""
    success: bool = True
    analysis_id: int
    session_id: int | None = None
    audit: DocumentAudit
    sources: list[dict] = []


class DocumentAnalysisResponse(BaseModel):
    """Response model for document analysis history item."""
    id: int
    user_id: int | None = None
    document_preview: str
    document_type: str | None = None
    overall_score: int
    
    # Core validations
    formal_validity: dict = {}
    legal_validity: dict = {}
    up_to_dateness: dict = {}
    compliance_check: dict = {}
    risk_analysis: dict = {}
    
    # Extended validations
    consistency_check: dict = {}
    jurisdiction_intelligence: dict = {}
    litigation_readiness: dict = {}
    ethical_guardrails: dict = {}
    
    improvements: list[dict] = []
    summary: str | None = None
    explainability: str | None = None
    sources: list[dict] = []
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True
