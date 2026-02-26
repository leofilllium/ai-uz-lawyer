"""
Credit System Models
SQLAlchemy models for tracking organization credit allocations and per-action transactions.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum, Index
from sqlalchemy.orm import relationship

from app.database import Base


class ActionType(str, enum.Enum):
    """Fixed credit cost per action type."""
    CHAT = "chat"                          # 250 credits
    CONTRACT_GEN_STD = "contract_gen_std"   # 150 credits
    CONTRACT_GEN_ULTRA = "contract_gen_ultra"  # 350 credits
    CONTRACT_VALIDATOR = "contract_validator"  # 400 credits
    FIX_CONTRACT = "fix_contract"           # 350 credits
    DOCUMENT_VALIDATOR = "document_validator"  # 400 credits


# Canonical credit cost mapping
ACTION_CREDIT_COSTS = {
    ActionType.CHAT: 250,
    ActionType.CONTRACT_GEN_STD: 150,
    ActionType.CONTRACT_GEN_ULTRA: 350,
    ActionType.CONTRACT_VALIDATOR: 400,
    ActionType.FIX_CONTRACT: 350,
    ActionType.DOCUMENT_VALIDATOR: 400,
}


class CreditAllocation(Base):
    """Monthly credit allocation for an organization."""
    __tablename__ = 'credit_allocations'

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=False, index=True)
    credits_granted = Column(Integer, nullable=False)
    credits_remaining = Column(Integer, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = relationship('Organization', back_populates='credit_allocations')
    transactions = relationship('CreditTransaction', back_populates='allocation', lazy='dynamic')

    __table_args__ = (
        Index('ix_credit_alloc_org_active', 'organization_id', 'is_active'),
    )

    def __repr__(self):
        return f'<CreditAllocation org={self.organization_id} remaining={self.credits_remaining}/{self.credits_granted}>'


class CreditTransaction(Base):
    """Individual credit usage transaction."""
    __tablename__ = 'credit_transactions'

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey('credit_allocations.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    action_type = Column(Enum(ActionType), nullable=False)
    credits_used = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    allocation = relationship('CreditAllocation', back_populates='transactions')
    user = relationship('User')

    __table_args__ = (
        Index('ix_credit_tx_user_date', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f'<CreditTransaction user={self.user_id} action={self.action_type} credits={self.credits_used}>'
