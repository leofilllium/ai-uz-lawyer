"""
Stats Router
API endpoints for retrieving usage statistics and costs.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.usage import ModelUsage
from app.routers.auth import get_current_user
from app.routers.admin import verify_admin, security as admin_security
from app.routers.admin import ADMIN_USERNAME, ADMIN_PASSWORD
from fastapi.security import HTTPBasicCredentials
import secrets
from pydantic import BaseModel

router = APIRouter()

# Helper for Optional Basic Auth
def get_admin_user_optional(credentials: HTTPBasicCredentials = Depends(admin_security)):
    try:
        correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
        correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
        if correct_username and correct_password:
            return True
    except:
        pass
    return False

# Response Models
class UsageStats(BaseModel):
    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    total_cost: float
    currency: str = "USD"
    
class UsageRecord(BaseModel):
    id: int
    user_id: Optional[int]
    model_name: str
    request_type: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: float
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/summary", response_model=UsageStats)
async def get_usage_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    is_admin: bool = Depends(get_admin_user_optional)
):
    """
    Get aggregated usage statistics.
    Admin (Basic Auth) sees all usage.
    Users see their own usage.
    """
    if not current_user and not is_admin:
        raise HTTPException(status_code=401, detail="Not authenticated")

    query = db.query(
        func.count(ModelUsage.id).label("total_requests"),
        func.sum(ModelUsage.input_tokens).label("total_input_tokens"),
        func.sum(ModelUsage.output_tokens).label("total_output_tokens"),
        func.sum(ModelUsage.cost).label("total_cost")
    )
    
    # Filter Logic
    if is_admin:
        # Admin sees everything, no filter needed
        pass
    elif current_user:
        # Check roles
        if getattr(current_user, 'role', '') == 'HEAD': # Use HEAD role check if available
             # Head sees their organization's usage
             # Get all user IDs in org
             subquery = db.query(User.id).filter(User.organization_id == current_user.organization_id)
             query = query.filter(ModelUsage.user_id.in_(subquery))
        else:
             # Regular user sees only their own
             query = query.filter(ModelUsage.user_id == current_user.id)
        
    if start_date:
        query = query.filter(ModelUsage.created_at >= start_date)
    if end_date:
        query = query.filter(ModelUsage.created_at <= end_date)
        
    result = query.first()
    
    return UsageStats(
        total_requests=result.total_requests or 0,
        total_input_tokens=result.total_input_tokens or 0,
        total_output_tokens=result.total_output_tokens or 0,
        total_cost=result.total_cost or 0.0
    )

@router.get("/history", response_model=List[UsageRecord])
async def get_usage_history(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    is_admin: bool = Depends(get_admin_user_optional)
):
    """
    Get detailed usage history.
    Admin can filter by user_id. Users only see their own.
    """
    if not current_user and not is_admin:
        raise HTTPException(status_code=401, detail="Not authenticated")

    query = db.query(ModelUsage).order_by(ModelUsage.created_at.desc())
    
    if is_admin:
         if user_id:
             query = query.filter(ModelUsage.user_id == user_id)
    elif current_user:
        if getattr(current_user, 'role', '') == 'HEAD':
             # Head sees org usage
             subquery = db.query(User.id).filter(User.organization_id == current_user.organization_id)
             query = query.filter(ModelUsage.user_id.in_(subquery))
             # If Head wants to filter by specific user in org
             if user_id:
                 # Verify target user is in same org
                 target_user = db.query(User).filter(User.id == user_id, User.organization_id == current_user.organization_id).first()
                 if target_user:
                     query = query.filter(ModelUsage.user_id == user_id)
                 else:
                     # Access denied to user outside org
                     return []
        else:
            query = query.filter(ModelUsage.user_id == current_user.id)
        
    records = query.offset(skip).limit(limit).all()
    return records
