"""
Stats Router
API endpoints for retrieving usage statistics and costs.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

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

# Map raw request_type to feature category
# Exact matches checked first, then prefix matching via _classify_feature()
FEATURE_MAP_EXACT = {
    'contract_validation': 'validator',
    'contract_type_detection': 'validator',
    'contract_generation_legacy': 'generator',
    'contract_ultra_phase1_draft': 'generator_ultra',
    'contract_ultra_phase2_audit': 'generator_ultra',
    'contract_ultra_phase2_redteam': 'generator_ultra',
    'contract_ultra_phase2_risktest': 'generator_ultra',
    'contract_ultra_phase3_final': 'generator_ultra',
    'document_analysis': 'doc_validator',
}

# Prefix-based mapping for dynamic chat modes (consultant, practitioner, commercial, etc.)
FEATURE_PREFIX_MAP = {
    'agentic_step_': 'lawyer',
    'agentic_final_': 'lawyer',
    'chat_simple_': 'lawyer',
}


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


def _apply_access_filter(query, is_admin, current_user, db, user_id=None):
    """Apply access control filters to a query."""
    if is_admin:
        if user_id:
            query = query.filter(ModelUsage.user_id == user_id)
    elif current_user:
        if getattr(current_user, 'role', '') == 'HEAD':
            subquery = db.query(User.id).filter(User.organization_id == current_user.organization_id)
            query = query.filter(ModelUsage.user_id.in_(subquery))
            if user_id:
                target_user = db.query(User).filter(
                    User.id == user_id,
                    User.organization_id == current_user.organization_id
                ).first()
                if target_user:
                    query = query.filter(ModelUsage.user_id == user_id)
                else:
                    return None  # Access denied
        else:
            query = query.filter(ModelUsage.user_id == current_user.id)
    return query


# Response Models
class FeatureStats(BaseModel):
    feature: str
    requests: int
    input_tokens: int
    output_tokens: int
    cost: float


class UsageStats(BaseModel):
    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    total_cost: float
    currency: str = "USD"
    by_feature: list[FeatureStats] = []


class UsageRecord(BaseModel):
    id: int
    user_id: Optional[int]
    model_name: str
    request_type: str
    feature: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: float
    created_at: datetime

    class Config:
        from_attributes = True


def _classify_feature(request_type: str) -> str:
    """Map request_type to feature category. Checks exact match, then prefix match."""
    if request_type in FEATURE_MAP_EXACT:
        return FEATURE_MAP_EXACT[request_type]
    for prefix, feature in FEATURE_PREFIX_MAP.items():
        if request_type.startswith(prefix):
            return feature
    return 'other'


@router.get("/summary", response_model=UsageStats)
async def get_usage_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    is_admin: bool = Depends(get_admin_user_optional)
):
    """Get aggregated usage statistics with per-feature breakdown."""
    if not current_user and not is_admin:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Base query for totals
    base_query = db.query(
        func.count(ModelUsage.id).label("total_requests"),
        func.coalesce(func.sum(ModelUsage.input_tokens), 0).label("total_input_tokens"),
        func.coalesce(func.sum(ModelUsage.output_tokens), 0).label("total_output_tokens"),
        func.coalesce(func.sum(ModelUsage.cost), 0).label("total_cost")
    )

    base_query = _apply_access_filter(base_query, is_admin, current_user, db)
    if base_query is None:
        return UsageStats(total_requests=0, total_input_tokens=0, total_output_tokens=0, total_cost=0.0)

    if start_date:
        base_query = base_query.filter(ModelUsage.created_at >= start_date)
    if end_date:
        base_query = base_query.filter(ModelUsage.created_at <= end_date)

    result = base_query.first()

    # Per-feature breakdown
    feature_query = db.query(
        ModelUsage.request_type,
        func.count(ModelUsage.id).label("requests"),
        func.coalesce(func.sum(ModelUsage.input_tokens), 0).label("input_tokens"),
        func.coalesce(func.sum(ModelUsage.output_tokens), 0).label("output_tokens"),
        func.coalesce(func.sum(ModelUsage.cost), 0).label("cost")
    ).group_by(ModelUsage.request_type)

    feature_query = _apply_access_filter(feature_query, is_admin, current_user, db)
    if feature_query is None:
        return UsageStats(total_requests=0, total_input_tokens=0, total_output_tokens=0, total_cost=0.0)

    if start_date:
        feature_query = feature_query.filter(ModelUsage.created_at >= start_date)
    if end_date:
        feature_query = feature_query.filter(ModelUsage.created_at <= end_date)

    feature_rows = feature_query.all()

    # Aggregate by feature category
    feature_agg = {}
    for row in feature_rows:
        feature = _classify_feature(row.request_type or 'unknown')
        if feature not in feature_agg:
            feature_agg[feature] = {'requests': 0, 'input_tokens': 0, 'output_tokens': 0, 'cost': 0.0}
        feature_agg[feature]['requests'] += row.requests or 0
        feature_agg[feature]['input_tokens'] += row.input_tokens or 0
        feature_agg[feature]['output_tokens'] += row.output_tokens or 0
        feature_agg[feature]['cost'] += float(row.cost or 0)

    by_feature = [
        FeatureStats(feature=k, **v)
        for k, v in sorted(feature_agg.items(), key=lambda x: x[1]['cost'], reverse=True)
    ]

    return UsageStats(
        total_requests=result.total_requests or 0,
        total_input_tokens=result.total_input_tokens or 0,
        total_output_tokens=result.total_output_tokens or 0,
        total_cost=result.total_cost or 0.0,
        by_feature=by_feature
    )


@router.get("/history", response_model=List[UsageRecord])
async def get_usage_history(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    feature: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    is_admin: bool = Depends(get_admin_user_optional)
):
    """Get detailed usage history with feature filtering."""
    if not current_user and not is_admin:
        raise HTTPException(status_code=401, detail="Not authenticated")

    query = db.query(ModelUsage).order_by(ModelUsage.created_at.desc())

    query = _apply_access_filter(query, is_admin, current_user, db, user_id)
    if query is None:
        return []

    # Filter by feature category
    if feature:
        matching_types = [k for k, v in FEATURE_MAP_EXACT.items() if v == feature]
        matching_prefixes = [p for p, v in FEATURE_PREFIX_MAP.items() if v == feature]
        conditions = []
        if matching_types:
            conditions.append(ModelUsage.request_type.in_(matching_types))
        for prefix in matching_prefixes:
            conditions.append(ModelUsage.request_type.like(f"{prefix}%"))
        if conditions:
            from sqlalchemy import or_
            query = query.filter(or_(*conditions))

    records = query.offset(skip).limit(limit).all()

    # Add feature field to each record
    result = []
    for r in records:
        result.append(UsageRecord(
            id=r.id,
            user_id=r.user_id,
            model_name=r.model_name,
            request_type=r.request_type or 'unknown',
            feature=_classify_feature(r.request_type or 'unknown'),
            input_tokens=r.input_tokens or 0,
            output_tokens=r.output_tokens or 0,
            total_tokens=r.total_tokens or 0,
            cost=r.cost or 0.0,
            created_at=r.created_at
        ))
    return result
