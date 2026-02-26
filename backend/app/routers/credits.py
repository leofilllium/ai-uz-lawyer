"""
Credits Router
User-facing endpoints for credit balance, costs, and transaction history.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.credit_service import CreditService

router = APIRouter()


@router.get("/balance")
async def get_credit_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get credit balance for the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Пользователь не привязан к организации")

    org_balance = CreditService.get_org_balance(db, current_user.organization_id)
    user_daily_usage = CreditService.get_user_daily_usage(db, current_user.id)
    org_daily_usage = CreditService.get_org_daily_usage(db, current_user.organization_id)

    # Get org limits
    from app.models.organization import Organization
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()

    return {
        "organization": {
            "credits_remaining": org_balance["credits_remaining"],
            "credits_granted": org_balance["credits_granted"],
            "period_start": org_balance["period_start"],
            "period_end": org_balance["period_end"],
            "is_active": org_balance["is_active"],
            "daily_usage": org_daily_usage,
            "daily_limit_total": org.daily_credit_limit_total if org else None,
        },
        "user": {
            "daily_usage": user_daily_usage,
            "daily_limit": org.daily_credit_limit_per_user if org else None,
            "daily_remaining": max(0, (org.daily_credit_limit_per_user or 999999) - user_daily_usage) if org else 0,
        }
    }


@router.get("/costs")
async def get_credit_costs():
    """Get credit costs per action."""
    return CreditService.get_credit_costs()


@router.get("/transactions")
async def get_credit_transactions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent credit transactions for the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Пользователь не привязан к организации")

    transactions = CreditService.get_transactions(
        db, current_user.organization_id, user_id=current_user.id, limit=limit
    )
    return transactions
