"""
Organization Model
SQLAlchemy model for law firms/organizations.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class Organization(Base):
    """Organization (Law Firm) model."""
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Credit system limits
    daily_credit_limit_per_user = Column(Integer, default=5000, nullable=True)
    daily_credit_limit_total = Column(Integer, nullable=True)  # Org-wide daily cap

    # Relationships
    users = relationship('User', back_populates='organization')
    tasks = relationship('Task', back_populates='organization')
    credit_allocations = relationship('CreditAllocation', back_populates='organization', lazy='dynamic')

    def __repr__(self):
        return f'<Organization {self.name}>'
