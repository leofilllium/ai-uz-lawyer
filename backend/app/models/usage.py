"""
Usage Tracking Models
SQLAlchemy models for tracking AI model usage and costs.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.database import Base

class ModelUsage(Base):
    """Tracks usage and cost for AI model invocations."""
    __tablename__ = 'model_usage'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    
    # Model details
    model_name = Column(String(100), nullable=False, index=True)
    request_type = Column(String(50), nullable=True)  # e.g., 'chat', 'document_validation', 'contract_generation'
    
    # Usage metrics
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Cost calculation (in USD usually, but store as float)
    cost = Column(Float, default=0.0)
    currency = Column(String(3), default='USD')
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship('User', back_populates='usages')
    
    def __repr__(self):
        return f'<ModelUsage {self.id} ({self.model_name}): ${self.cost:.4f}>'
