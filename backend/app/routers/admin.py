"""
Admin Router
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
from pydantic import BaseModel

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
    documents: List[IndexedDocument]


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
async def get_admin_stats(admin: bool = Depends(verify_admin)):
    """Get indexing statistics."""
    vector_store = get_vector_store()
    
    documents = await vector_store.aget_indexed_documents()
    total_chunks = sum(doc["chunk_count"] for doc in documents)
    
    return AdminStats(
        total_documents=len(documents),
        total_chunks=total_chunks,
        documents=[IndexedDocument(**doc) for doc in documents],
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
    source_name = file.filename
    if await vector_store.ais_document_indexed(source_name):
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
    
    return DeleteResult(
        success=True,
        source_name=source_name,
        chunks_removed=chunks_removed,
        message=f"Successfully removed {chunks_removed} chunks",
    )
