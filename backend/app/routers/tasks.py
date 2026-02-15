"""
Tasks Router
API endpoints for managing project tasks (Kanban), comments, and attachments.
"""

import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.task import Task
from app.models.comment import TaskComment
from app.models.attachment import TaskAttachment
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, TaskDetailResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.attachment import AttachmentResponse
from app.routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "tasks")


def _enrich_task_response(task: Task) -> dict:
    """Add reporter_name and assignee_name to task data."""
    data = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "complexity": task.complexity,
        "deadline": task.deadline,
        "organization_id": task.organization_id,
        "reporter_id": task.reporter_id,
        "assignee_id": task.assignee_id,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "reporter_name": task.reporter.name if task.reporter else None,
        "assignee_name": task.assignee.name if task.assignee else None,
    }
    return data


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all tasks for the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not in an organization")
    
    tasks = (
        db.query(Task)
        .options(joinedload(Task.reporter), joinedload(Task.assignee))
        .filter(Task.organization_id == current_user.organization_id)
        .all()
    )
    return [_enrich_task_response(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskDetailResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single task with comments and attachments."""
    task = (
        db.query(Task)
        .options(
            joinedload(Task.reporter),
            joinedload(Task.assignee),
            joinedload(Task.comments).joinedload(TaskComment.user),
            joinedload(Task.attachments),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Task belongs to another organization")

    data = _enrich_task_response(task)
    data["comments"] = [
        {
            "id": c.id,
            "task_id": c.task_id,
            "user_id": c.user_id,
            "user_name": c.user.name if c.user else "",
            "content": c.content,
            "created_at": c.created_at,
        }
        for c in task.comments
    ]
    data["attachments"] = [
        {
            "id": a.id,
            "task_id": a.task_id,
            "filename": a.filename,
            "file_size": a.file_size,
            "content_type": a.content_type,
            "uploaded_by": a.uploaded_by,
            "created_at": a.created_at,
        }
        for a in task.attachments
    ]
    return data


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
    
    # Reload with relationships
    db_task = (
        db.query(Task)
        .options(joinedload(Task.reporter), joinedload(Task.assignee))
        .filter(Task.id == new_task.id)
        .first()
    )
    return _enrich_task_response(db_task)


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
        
    db_task = (
        db.query(Task)
        .options(joinedload(Task.reporter), joinedload(Task.assignee))
        .filter(Task.id == task_id)
        .first()
    )
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
    return _enrich_task_response(db_task)


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


# ═══════════════════════════════════════════════════
# COMMENTS
# ═══════════════════════════════════════════════════

@router.get("/{task_id}/comments", response_model=List[CommentResponse])
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List comments on a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    comments = (
        db.query(TaskComment)
        .options(joinedload(TaskComment.user))
        .filter(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at)
        .all()
    )
    return [
        {
            "id": c.id,
            "task_id": c.task_id,
            "user_id": c.user_id,
            "user_name": c.user.name if c.user else "",
            "content": c.content,
            "created_at": c.created_at,
        }
        for c in comments
    ]


@router.post("/{task_id}/comments", response_model=CommentResponse)
def add_comment(
    task_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a task."""
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User is not approved")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    new_comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "task_id": new_comment.task_id,
        "user_id": new_comment.user_id,
        "user_name": current_user.name,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
    }


@router.delete("/{task_id}/comments/{comment_id}")
def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (own comment or HEAD)."""
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.task_id == task_id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and current_user.role != UserRole.HEAD:
        raise HTTPException(status_code=403, detail="Cannot delete another user's comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}


# ═══════════════════════════════════════════════════
# ATTACHMENTS
# ═══════════════════════════════════════════════════

@router.get("/{task_id}/attachments", response_model=List[AttachmentResponse])
def list_attachments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List attachments on a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(TaskAttachment).filter(TaskAttachment.task_id == task_id).all()


@router.post("/{task_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file attachment to a task."""
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="User is not approved")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Max 10 MB
    MAX_SIZE = 10 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Save file
    task_dir = os.path.join(UPLOAD_DIR, str(task_id))
    os.makedirs(task_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(task_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    attachment = TaskAttachment(
        task_id=task_id,
        uploaded_by=current_user.id,
        filename=file.filename or "unnamed",
        file_path=file_path,
        file_size=len(contents),
        content_type=file.content_type,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.delete("/{task_id}/attachments/{attachment_id}")
def delete_attachment(
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an attachment (uploader or HEAD)."""
    att = db.query(TaskAttachment).filter(
        TaskAttachment.id == attachment_id,
        TaskAttachment.task_id == task_id,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if att.uploaded_by != current_user.id and current_user.role != UserRole.HEAD:
        raise HTTPException(status_code=403, detail="Cannot delete another user's attachment")

    # Remove file
    if os.path.exists(att.file_path):
        os.remove(att.file_path)

    db.delete(att)
    db.commit()
    return {"message": "Attachment deleted"}
