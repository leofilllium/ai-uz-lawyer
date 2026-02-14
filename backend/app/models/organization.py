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

    # Relationships
    users = relationship('User', back_populates='organization')
    tasks = relationship('Task', back_populates='organization') # Tasks belong to an org

    def __repr__(self):
        return f'<Organization {self.name}>'
