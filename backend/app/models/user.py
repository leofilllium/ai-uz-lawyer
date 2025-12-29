"""
User Model
SQLAlchemy model for user accounts with password hashing.
"""

from datetime import datetime
import bcrypt
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """User account for authentication."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chat_sessions = relationship('ChatSession', back_populates='user', lazy='dynamic')
    contract_analyses = relationship('ContractAnalysis', back_populates='user', lazy='dynamic')
    generated_contracts = relationship('GeneratedContract', back_populates='user', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password: str):
        """Hash and set the user's password."""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Verify password against stored hash."""
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
