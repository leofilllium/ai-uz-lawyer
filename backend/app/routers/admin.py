"""# Admin Router
Document management endpoints with static admin authentication.
"""

import os
import secrets
import tempfile
from pathlib import Path
from typing import List
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.legal_document import LegalDocument
from app.core.vector_store import VectorStore
from app.core.flexible_processor import FlexibleDocumentProcessor


router = APIRouter()
security = HTTPBasic()

# Static admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "S2h0E0r4????"


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)) -> bool:
    """Verify admin credentials using HTTP Basic Auth."""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return True


# Response models
class IndexedDocument(BaseModel):
    source_name: str
    chunk_count: int
    doc_type: str = "unknown"


class UploadResult(BaseModel):
    success: bool
    source_name: str
    chunk_count: int
    doc_type: str
    message: str


class AdminStats(BaseModel):
    total_documents: int
    total_chunks: int
    total_pages: int
    current_page: int
    page_size: int
    documents: List[IndexedDocument]

    class Config:
        from_attributes = True


class DeleteResult(BaseModel):
    success: bool
    source_name: str
    chunks_removed: int
    message: str


# Initialize services lazily
_vector_store = None
_processor = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store


def get_processor() -> FlexibleDocumentProcessor:
    global _processor
    if _processor is None:
        _processor = FlexibleDocumentProcessor()
    return _processor


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    page: int = 1, 
    page_size: int = 50,
    search_query: str = None,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get indexing statistics with pagination using SQL Metadata."""
    
    # Base query
    query = db.query(LegalDocument)
    
    # Apply search filter if provided
    if search_query:
        search = f"%{search_query}%"
        query = query.filter(
            (LegalDocument.source_name.ilike(search)) | 
            (LegalDocument.title.ilike(search))
        )
    
    # query total count
    total_documents = query.count()
    
    # calculate total chunks (approximate if filtered, exact if not)
    if search_query:
        total_chunks = db.query(func.sum(LegalDocument.chunk_count)).filter(
            (LegalDocument.source_name.ilike(search)) | 
            (LegalDocument.title.ilike(search))
        ).scalar() or 0
    else:
        total_chunks = db.query(func.sum(LegalDocument.chunk_count)).scalar() or 0
    
    # Calculate pagination
    total_pages = (total_documents + page_size - 1) // page_size
    if total_pages == 0: total_pages = 1
    offset = (page - 1) * page_size
    
    # Fetch paginated documents
    docs = query.order_by(LegalDocument.source_name).offset(offset).limit(page_size).all()
    
    return AdminStats(
        total_documents=total_documents,
        total_chunks=total_chunks,
        total_pages=total_pages,
        current_page=page,
        page_size=page_size,
        documents=[
            IndexedDocument(
                source_name=doc.source_name,
                chunk_count=doc.chunk_count,
                doc_type=doc.doc_type or "unknown"
            ) for doc in docs
        ],
    )


@router.get("/documents", response_model=List[IndexedDocument])
async def list_documents(admin: bool = Depends(verify_admin)):
    """List all indexed documents."""
    vector_store = get_vector_store()
    documents = await vector_store.aget_indexed_documents()
    return [IndexedDocument(**doc) for doc in documents]


@router.post("/documents/upload", response_model=UploadResult)
async def upload_document(
    file: UploadFile = File(...),
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Upload and index a new document."""
    # Validate file type
    if not file.filename or not file.filename.endswith('.docx'):
        raise HTTPException(
            status_code=400,
            detail="Only .docx files are supported"
        )
    
    vector_store = get_vector_store()
    processor = get_processor()
    
    # Check if already indexed
    # Check if already indexed (Check SQL first is faster)
    source_name = file.filename
    existing_doc = db.query(LegalDocument).filter(LegalDocument.source_name == source_name).first()
    if existing_doc:
         raise HTTPException(
            status_code=409,
            detail=f"Document '{source_name}' is already indexed. Delete it first to re-upload."
        )
    
    # Save to temp file and process
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = Path(tmp.name)
        
        # Process the document
        chunks, doc_info = processor.process_single_document(tmp_path, source_name)
        
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="Could not extract any content from the document"
            )
        
        # Add to vector store
        await vector_store.aadd_documents(chunks)
        
        return UploadResult(
            success=True,
            source_name=source_name,
            chunk_count=doc_info["chunk_count"],
            doc_type=doc_info["doc_type"],
            message=f"Successfully indexed {doc_info['chunk_count']} chunks from {source_name}",
        )
        
        # Add to SQL Metadata
        new_doc = LegalDocument(
            source_name=source_name,
            title=source_name.replace(".docx", "").replace("_", " "),
            doc_type=doc_info["doc_type"],
            chunk_count=doc_info["chunk_count"],
            is_indexed=True
        )
        db.add(new_doc)
        db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )
    finally:
        # Cleanup temp file
        if 'tmp_path' in locals() and tmp_path.exists():
            os.unlink(tmp_path)


@router.delete("/documents/{source_name}", response_model=DeleteResult)
async def delete_document(
    source_name: str,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Delete a document from the index."""
    vector_store = get_vector_store()
    
    # Check if document exists
    if not await vector_store.ais_document_indexed(source_name):
        raise HTTPException(
            status_code=404,
            detail=f"Document '{source_name}' not found in index"
        )
    
    # Remove from vector store
    chunks_removed = await vector_store.aremove_document(source_name)
    
    # Remove from SQL Metadata
    db.query(LegalDocument).filter(LegalDocument.source_name == source_name).delete()
    db.commit()
    
    return DeleteResult(
        success=True,
        source_name=source_name,
        chunks_removed=chunks_removed,
        message=f"Successfully removed {chunks_removed} chunks",
    )


# --- Organization Management ---

class CreateOrganizationRequest(BaseModel):
    name: str
    head_name: str
    head_email: str
    head_password: str

@router.post("/organizations", status_code=201)
async def admin_create_organization(
    request: CreateOrganizationRequest,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Create a new organization and its Head user (Admin only)."""
    from app.models.organization import Organization
    from app.models.user import User, UserRole
    from app.services.auth_service import AuthService
    
    # Check if org exists
    existing_org = db.query(Organization).filter(Organization.name == request.name).first()
    if existing_org:
        raise HTTPException(
            status_code=400,
            detail="Organization already exists"
        )
    
    # Check if user email exists
    existing_user = db.query(User).filter(User.email == request.head_email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Create Organization
    org = Organization(name=request.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Create Head User
    head_user = User(
        name=request.head_name,
        email=request.head_email.lower(),
        organization_id=org.id,
        role=UserRole.HEAD,
        is_approved=True
    )
    head_user.set_password(request.head_password)
    
    db.add(head_user)
    db.commit()
    db.refresh(head_user)
    
    return {
        "organization": {"id": org.id, "name": org.name},
        "head_user": {"id": head_user.id, "email": head_user.email}
    }
