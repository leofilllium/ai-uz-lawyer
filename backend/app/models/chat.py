"""
Chat Models
SQLAlchemy models for storing chat sessions and messages.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class ChatSession(Base):
    """Represents a chat session with one of the AI modes."""
    __tablename__ = 'chat_sessions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    session_type = Column(String(20), nullable=False)  # 'smalltalk', 'lawyer', 'validator', 'generator'
    title = Column(String(200), default='Новая беседа')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='chat_sessions')
    messages = relationship('ChatMessage', back_populates='session', lazy='dynamic',
                           cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChatSession {self.id} ({self.session_type})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_type': self.session_type,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'message_count': self.messages.count() if self.messages else 0
        }


class ChatMessage(Base):
    """Represents a single message in a chat session."""
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('chat_sessions.id'), nullable=False)
    role = Column(String(20), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # For lawyer mode: legal sources
    thinking = Column(Text, nullable=True)  # For extended thinking mode
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship('ChatSession', back_populates='messages')
    
    def __repr__(self):
        return f'<ChatMessage {self.id} ({self.role})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'role': self.role,
            'content': self.content,
            'sources': self.sources,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
