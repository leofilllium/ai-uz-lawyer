"""
Contract Analysis Model
SQLAlchemy model for storing contract validation results.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class ContractAnalysis(Base):
    """Stores contract analysis results and history."""
    __tablename__ = 'contract_analyses'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    contract_text = Column(Text, nullable=False)
    validity_score = Column(Integer, default=0)
    score_explanation = Column(Text)
    critical_errors = Column(JSON, default=list)
    warnings = Column(JSON, default=list)
    missing_clauses = Column(JSON, default=list)
    summary = Column(Text)
    sources = Column(JSON, default=list)
    raw_response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='contract_analyses')
    
    def __repr__(self):
        return f'<ContractAnalysis {self.id} (Score: {self.validity_score})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'contract_preview': self.contract_text[:200] + '...' if len(self.contract_text) > 200 else self.contract_text,
            'validity_score': self.validity_score,
            'score_explanation': self.score_explanation,
            'critical_errors': self.critical_errors or [],
            'warnings': self.warnings or [],
            'missing_clauses': self.missing_clauses or [],
            'summary': self.summary,
            'sources': self.sources or [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
