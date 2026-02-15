"""
TaskComment Model
SQLAlchemy model for task comments (issue discussion).
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class TaskComment(Base):
    """Comment on a task, similar to GitHub issue comments."""
    __tablename__ = 'task_comments'

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    task = relationship('Task', back_populates='comments')
    user = relationship('User', backref='task_comments')
    attachments = relationship('TaskAttachment', back_populates='comment', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TaskComment {self.id} on Task {self.task_id}>'
