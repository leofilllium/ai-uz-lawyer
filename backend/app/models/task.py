"""
Task Model
SQLAlchemy model for project management tasks.
"""

from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

from app.database import Base


class TaskStatus(str, enum.Enum):
    BACKLOG = "BACKLOG"
    TO_DO = "TO_DO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"
    RE_DO = "RE_DO"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskComplexity(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class Task(Base):
    """Task model for project management."""
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(Enum(TaskStatus), default=TaskStatus.BACKLOG)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    complexity = Column(Enum(TaskComplexity), default=TaskComplexity.MEDIUM)
    
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign Keys
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False)
    assignee_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    reporter_id = Column(Integer, ForeignKey('users.id'), nullable=False) # Creator (Senior/Head)

    # Relationships
    organization = relationship('Organization', back_populates='tasks')
    assignee = relationship('User', foreign_keys=[assignee_id], backref='assigned_tasks')
    reporter = relationship('User', foreign_keys=[reporter_id], backref='reported_tasks')
    comments = relationship('TaskComment', back_populates='task', cascade='all, delete-orphan', order_by='TaskComment.created_at')
    attachments = relationship('TaskAttachment', back_populates='task', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Task {self.title}>'
