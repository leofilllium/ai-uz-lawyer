"""
Document Analysis Model
SQLAlchemy model for storing document validation results.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.database import Base


class DocumentAnalysis(Base):
    """Stores document analysis/validation results."""
    __tablename__ = 'document_analyses'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    document_text = Column(Text, nullable=False)
    document_type = Column(String(100), nullable=True)  # power_of_attorney, resolution, claim, etc.
    
    # Overall assessment
    overall_score = Column(Integer, default=0)
    
    # Validation sections (stored as JSON)
    formal_validity = Column(JSON, default=dict)  # structure, format, requirements
    legal_validity = Column(JSON, default=dict)   # substantive law compliance
    up_to_dateness = Column(JSON, default=dict)   # outdated references, deprecated laws
    compliance_check = Column(JSON, default=dict) # regulatory compliance
    risk_analysis = Column(JSON, default=dict)    # identified risks
    
    # NEW: Additional validation sections
    consistency_check = Column(JSON, default=dict)        # comparison & internal consistency
    jurisdiction_intelligence = Column(JSON, default=dict) # jurisdiction-specific insights  
    litigation_readiness = Column(JSON, default=dict)      # evidence & litigation preparedness
    ethical_guardrails = Column(JSON, default=dict)        # ethical & legal guardrails
    
    improvements = Column(JSON, default=list)     # suggested improvements/fixes
    
    # Summary and sources
    summary = Column(Text)
    explainability = Column(Text)  # Clear explanation of all findings
    sources = Column(JSON, default=list)
    raw_response = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='document_analyses')
    
    def __repr__(self):
        return f'<DocumentAnalysis {self.id} (Score: {self.overall_score})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'document_preview': self.document_text[:200] + '...' if len(self.document_text) > 200 else self.document_text,
            'document_type': self.document_type,
            'overall_score': self.overall_score,
            'formal_validity': self.formal_validity or {},
            'legal_validity': self.legal_validity or {},
            'up_to_dateness': self.up_to_dateness or {},
            'compliance_check': self.compliance_check or {},
            'risk_analysis': self.risk_analysis or {},
            'consistency_check': self.consistency_check or {},
            'jurisdiction_intelligence': self.jurisdiction_intelligence or {},
            'litigation_readiness': self.litigation_readiness or {},
            'ethical_guardrails': self.ethical_guardrails or {},
            'improvements': self.improvements or [],
            'summary': self.summary,
            'explainability': self.explainability,
            'sources': self.sources or [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
