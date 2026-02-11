
"""
Legal Document Model
SQLAlchemy model for storing metadata of indexed legal documents.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base


class LegalDocument(Base):
    """Metadata for an indexed legal document."""
    __tablename__ = 'legal_documents'
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    doc_type = Column(String, nullable=True)  # law, code, order, etc.
    language = Column(String(10), default="uz")
    
    # Statistics
    chunk_count = Column(Integer, default=0)
    
    # Status
    is_indexed = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<LegalDocument {self.source_name} ({self.chunk_count} chunks)>"

    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "source_name": self.source_name,
            "title": self.title or self.source_name,
            "doc_type": self.doc_type,
            "chunk_count": self.chunk_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
