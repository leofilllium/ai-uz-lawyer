from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.usage import ModelUsage
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_usage_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregated usage statistics.
    Restricted to admins or specific roles if needed.
    """
    # TODO: Add role check if needed. For now allow authenticated users to see system stats 
    # or obscure it? The plan said restricted to HEAD/SENIOR.
    
    if current_user.role not in ['HEAD', 'SENIOR', 'ADMIN']:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Total cost
    total_cost = db.query(func.sum(ModelUsage.cost)).filter(ModelUsage.created_at >= since_date).scalar() or 0.0
    
    # Total tokens
    total_tokens = db.query(func.sum(ModelUsage.total_tokens)).filter(ModelUsage.created_at >= since_date).scalar() or 0
    
    # By Model
    by_model = db.query(
        ModelUsage.model_name,
        func.sum(ModelUsage.cost).label('cost'),
        func.sum(ModelUsage.total_tokens).label('tokens'),
        func.count(ModelUsage.id).label('requests')
    ).filter(
        ModelUsage.created_at >= since_date
    ).group_by(ModelUsage.model_name).all()
    
    return {
        "period_days": days,
        "total_cost": round(total_cost, 4),
        "total_tokens": total_tokens,
        "by_model": [
            {
                "model": r.model_name,
                "cost": round(r.cost, 4),
                "tokens": r.tokens,
                "requests": r.requests
            }
            for r in by_model
        ]
    }

@router.get("/history")
async def get_usage_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent usage logs."""
    if current_user.role not in ['HEAD', 'SENIOR', 'ADMIN']:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
        
    logs = db.query(ModelUsage).order_by(ModelUsage.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "endpoint": log.endpoint,
            "model": log.model_name,
            "tokens": log.total_tokens,
            "cost": round(log.cost, 6),
            "created_at": log.created_at
        }
        for log in logs
    ]
