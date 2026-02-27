"""
Credit Service
Core business logic for the credit system: balance checks, deductions, daily limits, allocation.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.models.credit import CreditAllocation, CreditTransaction, ActionType, ACTION_CREDIT_COSTS
from app.models.organization import Organization

logger = logging.getLogger(__name__)


class CreditService:
    """Service for managing organization credits."""

    @staticmethod
    def get_active_allocation(db: Session, org_id: int) -> Optional[CreditAllocation]:
        """Get the current active (non-expired) credit allocation for an org."""
        now = datetime.utcnow()
        return db.query(CreditAllocation).filter(
            CreditAllocation.organization_id == org_id,
            CreditAllocation.is_active == True,
            CreditAllocation.period_end > now,
            CreditAllocation.credits_remaining > 0
        ).order_by(CreditAllocation.period_start.desc()).first()

    @staticmethod
    def get_org_balance(db: Session, org_id: int) -> Dict[str, Any]:
        """Get the credit balance for an organization."""
        now = datetime.utcnow()

        # Get active allocation
        allocation = CreditService.get_active_allocation(db, org_id)

        if not allocation:
            return {
                "credits_remaining": 0,
                "credits_granted": 0,
                "period_start": None,
                "period_end": None,
                "is_active": False,
                "allocation_id": None
            }

        return {
            "credits_remaining": allocation.credits_remaining,
            "credits_granted": allocation.credits_granted,
            "period_start": allocation.period_start.isoformat(),
            "period_end": allocation.period_end.isoformat(),
            "is_active": True,
            "allocation_id": allocation.id
        }

    @staticmethod
    def get_user_daily_usage(db: Session, user_id: int) -> int:
        """Get total credits used by a user today."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = db.query(func.coalesce(func.sum(CreditTransaction.credits_used), 0)).filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.created_at >= today_start
        ).scalar()
        return result or 0

    @staticmethod
    def get_org_daily_usage(db: Session, org_id: int) -> int:
        """Get total credits used by all users in an org today."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = db.query(func.coalesce(func.sum(CreditTransaction.credits_used), 0)).join(
            CreditAllocation
        ).filter(
            CreditAllocation.organization_id == org_id,
            CreditTransaction.created_at >= today_start
        ).scalar()
        return result or 0

    @staticmethod
    def check_can_use(db: Session, user_id: int, org_id: int, action_type: ActionType) -> Dict[str, Any]:
        """
        Check if a user can perform an action.
        Returns {"allowed": True} or {"allowed": False, "reason": "..."}.
        """
        cost = ACTION_CREDIT_COSTS.get(action_type, 0)
        if cost == 0:
            return {"allowed": True, "cost": 0}

        # 1. Check org has active allocation with enough credits
        allocation = CreditService.get_active_allocation(db, org_id)
        if not allocation:
            return {"allowed": False, "reason": "У вашей организации нет активных кредитов. Обратитесь к администратору.", "cost": cost}

        if allocation.credits_remaining < cost:
            return {
                "allowed": False,
                "reason": f"Недостаточно кредитов. Необходимо {cost}, доступно {allocation.credits_remaining}.",
                "cost": cost
            }

        # 2. Check user daily limit
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org and org.daily_credit_limit_per_user:
            user_daily = CreditService.get_user_daily_usage(db, user_id)
            if user_daily + cost > org.daily_credit_limit_per_user:
                remaining = max(0, org.daily_credit_limit_per_user - user_daily)
                return {
                    "allowed": False,
                    "reason": f"Превышен дневной лимит. Использовано {user_daily}/{org.daily_credit_limit_per_user}. Доступно ещё {remaining} кредитов.",
                    "cost": cost
                }

        # 3. Check org-wide daily limit
        if org and org.daily_credit_limit_total:
            org_daily = CreditService.get_org_daily_usage(db, org_id)
            if org_daily + cost > org.daily_credit_limit_total:
                remaining = max(0, org.daily_credit_limit_total - org_daily)
                return {
                    "allowed": False,
                    "reason": f"Превышен общий дневной лимит организации. Использовано {org_daily}/{org.daily_credit_limit_total}. Доступно ещё {remaining}.",
                    "cost": cost
                }

        return {"allowed": True, "cost": cost}

    @staticmethod
    def deduct_credits(
        db: Session,
        user_id: int,
        org_id: int,
        action_type: ActionType,
        description: str = None
    ) -> Optional[CreditTransaction]:
        """
        Deduct credits for an action. Call this AFTER successful AI completion.
        Returns the CreditTransaction or None if deduction failed.
        """
        cost = ACTION_CREDIT_COSTS.get(action_type, 0)
        if cost == 0:
            return None

        allocation = CreditService.get_active_allocation(db, org_id)
        if not allocation or allocation.credits_remaining < cost:
            logger.warning(f"Credit deduction failed: org={org_id}, action={action_type}, cost={cost}")
            return None

        # Deduct from allocation
        allocation.credits_remaining -= cost

        # Create transaction record
        transaction = CreditTransaction(
            allocation_id=allocation.id,
            user_id=user_id,
            action_type=action_type,
            credits_used=cost,
            description=description or f"{action_type.value}"
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        logger.info(f"Credits deducted: user={user_id}, org={org_id}, action={action_type.value}, cost={cost}, remaining={allocation.credits_remaining}")
        return transaction

    @staticmethod
    def allocate_credits(
        db: Session,
        org_id: int,
        amount: int,
        period_days: int = 30
    ) -> CreditAllocation:
        """Admin: allocate (gift) credits to an organization."""
        now = datetime.utcnow()
        period_end = now + timedelta(days=period_days)

        allocation = CreditAllocation(
            organization_id=org_id,
            credits_granted=amount,
            credits_remaining=amount,
            period_start=now,
            period_end=period_end,
            is_active=True
        )
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        logger.info(f"Credits allocated: org={org_id}, amount={amount}, period={period_days}d, expires={period_end}")
        return allocation

    @staticmethod
    def get_credit_costs() -> list:
        """Return the action → credits cost mapping for display."""
        return [
            {"action": "AI юрист (чат)", "action_type": ActionType.CHAT.value, "credits": 250},
            {"action": "Генерация договора (стандарт)", "action_type": ActionType.CONTRACT_GEN_STD.value, "credits": 300},
            {"action": "Генерация договора (ультра)", "action_type": ActionType.CONTRACT_GEN_ULTRA.value, "credits": 500},
            {"action": "Проверка договора", "action_type": ActionType.CONTRACT_VALIDATOR.value, "credits": 400},
            {"action": "Исправление договора AI", "action_type": ActionType.FIX_CONTRACT.value, "credits": 350},
            {"action": "Проверка документа", "action_type": ActionType.DOCUMENT_VALIDATOR.value, "credits": 400},
        ]

    @staticmethod
    def get_transactions(db: Session, org_id: int, user_id: Optional[int] = None, limit: int = 50) -> list:
        """Get recent credit transactions."""
        query = db.query(CreditTransaction).join(CreditAllocation).filter(
            CreditAllocation.organization_id == org_id
        )
        if user_id:
            query = query.filter(CreditTransaction.user_id == user_id)

        transactions = query.order_by(CreditTransaction.created_at.desc()).limit(limit).all()

        return [
            {
                "id": t.id,
                "user_id": t.user_id,
                "action_type": t.action_type.value,
                "credits_used": t.credits_used,
                "description": t.description,
                "created_at": t.created_at.isoformat()
            }
            for t in transactions
        ]

    @staticmethod
    def expire_old_allocations(db: Session):
        """Mark all expired allocations as inactive. Can be called periodically."""
        now = datetime.utcnow()
        expired = db.query(CreditAllocation).filter(
            CreditAllocation.is_active == True,
            CreditAllocation.period_end <= now
        ).all()

        for alloc in expired:
            alloc.is_active = False
            logger.info(f"Expired credit allocation: id={alloc.id}, org={alloc.organization_id}")

        if expired:
            db.commit()
