"""
TaskAttachment Model
SQLAlchemy model for file attachments on tasks.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class TaskAttachment(Base):
    """File attachment on a task."""
    __tablename__ = 'task_attachments'

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    uploaded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    content_type = Column(String(200), nullable=True)
    comment_id = Column(Integer, ForeignKey('task_comments.id', ondelete='CASCADE'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    task = relationship('Task', back_populates='attachments')
    uploader = relationship('User', backref='uploaded_attachments')
    comment = relationship('TaskComment', back_populates='attachments')


    def __repr__(self):
        return f'<TaskAttachment {self.filename}>'
