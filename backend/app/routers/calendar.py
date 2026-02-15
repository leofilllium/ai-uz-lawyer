"""
Calendar Router
API endpoints for managing calendar events.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse
from app.routers.auth import get_current_user

router = APIRouter()


def _event_to_response(event: CalendarEvent) -> dict:
    """Convert CalendarEvent to response dict with creator_name."""
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_datetime": event.event_datetime,
        "organization_id": event.organization_id,
        "created_by": event.created_by,
        "created_at": event.created_at,
        "creator_name": event.creator.name if event.creator else None,
    }


@router.get("/", response_model=List[CalendarEventResponse])
def list_events(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List calendar events for the user's organization, optionally filtered by month."""
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User is not approved")

    query = db.query(CalendarEvent).filter(
        CalendarEvent.organization_id == current_user.organization_id
    )

    if year and month:
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        start = datetime(year, month, 1)
        end = datetime(year, month, last_day, 23, 59, 59)
        query = query.filter(
            CalendarEvent.event_datetime >= start,
            CalendarEvent.event_datetime <= end,
        )

    events = query.order_by(CalendarEvent.event_datetime).all()
    return [_event_to_response(e) for e in events]


@router.post("/", response_model=CalendarEventResponse, status_code=201)
def create_event(
    event_data: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new calendar event."""
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User is not approved")

    event = CalendarEvent(
        title=event_data.title,
        description=event_data.description,
        event_datetime=event_data.event_datetime,
        organization_id=current_user.organization_id,
        created_by=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_to_response(event)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a calendar event (creator, SENIOR, or HEAD only)."""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if (
        current_user.role not in (UserRole.HEAD, UserRole.SENIOR)
        and event.created_by != current_user.id
    ):
        raise HTTPException(status_code=403, detail="You do not have permission to delete this event")

    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}
