"""
CalendarEvent Model
SQLAlchemy model for calendar events (deadlines, meetings, etc.).
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class CalendarEvent(Base):
    """Calendar event model for scheduling."""
    __tablename__ = 'calendar_events'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_datetime = Column(DateTime, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign Keys
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Relationships
    organization = relationship('Organization')
    creator = relationship('User', foreign_keys=[created_by])

    def __repr__(self):
        return f'<CalendarEvent {self.title}>'
