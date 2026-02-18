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
    hidden_risks = Column(JSON, default=list)
    ambiguities = Column(JSON, default=list)
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
        base_dict = {
            'id': self.id,
            'user_id': self.user_id,
            'contract_preview': self.contract_text[:200] + '...' if len(self.contract_text) > 200 else self.contract_text,
            'validity_score': self.validity_score or 0,
            'score_explanation': self.score_explanation or '',
            'critical_errors': self.critical_errors or [],
            'warnings': self.warnings or [],
            'missing_clauses': self.missing_clauses or [],
            'hidden_risks': self.hidden_risks or [],
            'ambiguities': self.ambiguities or [],
            'summary': self.summary or '',
            'sources': self.sources or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'negotiation_strategy': '',
            'strictness_level': 'standard',
        }

        # Extract extra fields from raw_response (stored as JSON of the audit dict)
        if self.raw_response:
            try:
                import json
                audit_data = json.loads(self.raw_response)
                # Handle both formats: raw audit dict or wrapped in 'audit' key
                if 'audit' in audit_data and isinstance(audit_data['audit'], dict):
                    audit_data = audit_data['audit']

                # Fill in fields that may be missing from DB columns
                if not base_dict['hidden_risks']:
                    base_dict['hidden_risks'] = audit_data.get('hidden_risks', []) or []
                if not base_dict['ambiguities']:
                    base_dict['ambiguities'] = audit_data.get('ambiguities', []) or []
                if not base_dict['score_explanation']:
                    base_dict['score_explanation'] = audit_data.get('score_explanation', '') or ''
                if not base_dict['summary']:
                    base_dict['summary'] = audit_data.get('summary', '') or ''

                # Fields only in raw_response (no DB column)
                ns = audit_data.get('negotiation_strategy', '')
                if isinstance(ns, list):
                    ns = "\n".join(str(s) for s in ns)
                base_dict['negotiation_strategy'] = str(ns) if ns else ''
                base_dict['strictness_level'] = audit_data.get('strictness_level', 'standard') or 'standard'
            except Exception:
                pass

        return base_dict
