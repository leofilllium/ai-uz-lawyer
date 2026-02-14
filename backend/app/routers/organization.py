"""
Organization Router
API endpoints for managing organizations and their members.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.organization import (
    OrganizationCreate, 
    OrganizationResponse, 
    RoleUpdateRequest
)
from app.schemas.auth import UserResponse
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db)):
    """List all available organizations."""
    return db.query(Organization).all()


@router.post("/", response_model=OrganizationResponse)
def create_organization(
    org: OrganizationCreate, 
    db: Session = Depends(get_db)
):
    """Create a new organization."""
    # Check execution
    existing = db.query(Organization).filter(Organization.name == org.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization already exists")
    
    new_org = Organization(name=org.name)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org


@router.get("/my/users", response_model=List[UserResponse]) # Need to import UserResponse or similar
def list_my_org_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List users in the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not in an organization")
        
    return db.query(User).filter(User.organization_id == current_user.organization_id).all()


@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a user to join the organization (HEAD only)."""
    if current_user.role != UserRole.HEAD:
        raise HTTPException(status_code=403, detail="Only Organization Head can approve users")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="User belongs to a different organization")
    
    target_user.is_approved = True
    db.commit()
    return {"message": "User approved successfully"}


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a user's role (HEAD only)."""
    if current_user.role != UserRole.HEAD:
        raise HTTPException(status_code=403, detail="Only Organization Head can manage roles")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="User belongs to a different organization")
        
    target_user.role = role_data.role
    db.commit()
    return {"message": "User role updated successfully"}
