"""
Pydantic Schemas
Request/response models for API validation.
"""

from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    ErrorResponse
)
from app.schemas.chat import (
    ChatRequest,
    ChatMessageResponse,
    ChatSessionResponse,
    ChatSessionDetailResponse,
    StreamChunk
)
from app.schemas.contract import (
    ValidateContractRequest,
    ContractAudit,
    ValidateContractResponse,
    ContractAnalysisResponse,
    GenerateContractRequest,
    ContractCategory,
    ContractTemplate,
    GeneratedContractResponse
)
from app.schemas.document import (
    ValidateDocumentRequest,
    DocumentAudit,
    ValidateDocumentResponse,
    DocumentAnalysisResponse
)

__all__ = [
    # Auth
    'UserRegisterRequest',
    'UserLoginRequest', 
    'UserResponse',
    'TokenResponse',
    'ErrorResponse',
    # Chat
    'ChatRequest',
    'ChatMessageResponse',
    'ChatSessionResponse',
    'ChatSessionDetailResponse',
    'StreamChunk',
    # Contract
    'ValidateContractRequest',
    'ContractAudit',
    'ValidateContractResponse',
    'ContractAnalysisResponse',
    'GenerateContractRequest',
    'ContractCategory',
    'ContractTemplate',
    'GeneratedContractResponse',
    # Document
    'ValidateDocumentRequest',
    'DocumentAudit',
    'ValidateDocumentResponse',
    'DocumentAnalysisResponse'
]

