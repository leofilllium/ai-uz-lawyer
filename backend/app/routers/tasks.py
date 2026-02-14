"""
Tasks Router
API endpoints for managing project tasks (Kanban).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all tasks for the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not in an organization")
    
    return db.query(Task).filter(Task.organization_id == current_user.organization_id).all()


@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task (Senior or Head only)."""
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User is not approved")
        
    if current_user.role not in [UserRole.SENIOR, UserRole.HEAD]:
        raise HTTPException(status_code=403, detail="Only Senior Lawyers or Heads can create tasks")
    
    new_task = Task(
        **task.model_dump(),
        organization_id=current_user.organization_id,
        reporter_id=current_user.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task (move columns, assign, etc.)."""
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User is not approved")
        
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if db_task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Task belongs to another organization")
    
    # Update fields
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task (Reporter or Head only)."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if db_task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Task belongs to another organization")
        
    if current_user.role != UserRole.HEAD and db_task.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this task")
        
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}
