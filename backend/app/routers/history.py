"""
History Router
Unified history endpoint for all user activities.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession
from app.models.contract import ContractAnalysis
from app.models.generated_contract import GeneratedContract
from app.routers.auth import get_current_user


router = APIRouter()


@router.get("")
async def get_unified_history(
    type: str | None = Query(None, description="Filter by type: chat, validation, generation"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """
    Get unified history of all user activities.
    
    Returns combined history of:
    - Chat sessions (lawyer)
    - Contract validations
    - Contract generations
    
    All filtered by current user for privacy.
    """
    user_id = current_user.id if current_user else None
    results = []
    
    # Chat sessions (lawyer mode)
    if not type or type == 'chat':
        query = db.query(ChatSession).filter(ChatSession.session_type == 'lawyer')
        if user_id:
            query = query.filter(ChatSession.user_id == user_id)
        else:
            query = query.filter(ChatSession.user_id.is_(None))
        
        sessions = query.order_by(ChatSession.updated_at.desc()).limit(limit).all()
        
        for session in sessions:
            results.append({
                'id': session.id,
                'type': 'chat',
                'title': session.title,
                'preview': session.title,
                'created_at': session.created_at.isoformat() if session.created_at else None,
                'updated_at': session.updated_at.isoformat() if session.updated_at else None,
                'icon': '💬',
                'metadata': {
                    'session_type': session.session_type,
                    'message_count': session.messages.count() if session.messages else 0
                }
            })
    
    # Contract validations
    if not type or type == 'validation':
        query = db.query(ContractAnalysis)
        if user_id:
            query = query.filter(ContractAnalysis.user_id == user_id)
        else:
            query = query.filter(ContractAnalysis.user_id.is_(None))
        
        analyses = query.order_by(ContractAnalysis.created_at.desc()).limit(limit).all()
        
        for analysis in analyses:
            score = analysis.validity_score
            if score >= 80:
                icon = "🟢"
            elif score >= 50:
                icon = "🟡"
            else:
                icon = "🔴"
            
            results.append({
                'id': analysis.id,
                'type': 'validation',
                'title': f'Проверка договора ({score}/100)',
                'preview': analysis.contract_text[:100] + '...' if len(analysis.contract_text) > 100 else analysis.contract_text,
                'created_at': analysis.created_at.isoformat() if analysis.created_at else None,
                'updated_at': analysis.created_at.isoformat() if analysis.created_at else None,
                'icon': icon,
                'metadata': {
                    'validity_score': score,
                    'critical_errors_count': len(analysis.critical_errors or []),
                    'warnings_count': len(analysis.warnings or [])
                }
            })
    
    # Contract generations
    if not type or type == 'generation':
        query = db.query(GeneratedContract)
        if user_id:
            query = query.filter(GeneratedContract.user_id == user_id)
        else:
            query = query.filter(GeneratedContract.user_id.is_(None))
        
        contracts = query.order_by(GeneratedContract.created_at.desc()).limit(limit).all()
        
        for contract in contracts:
            results.append({
                'id': contract.id,
                'type': 'generation',
                'title': f'Договор: {contract.category}',
                'preview': contract.requirements[:100] + '...' if len(contract.requirements) > 100 else contract.requirements,
                'created_at': contract.created_at.isoformat() if contract.created_at else None,
                'updated_at': contract.created_at.isoformat() if contract.created_at else None,
                'icon': '📝',
                'metadata': {
                    'category': contract.category,
                    'template_count': len(contract.template_names or [])
                }
            })
    
    # Sort by created_at descending
    results.sort(
        key=lambda x: x.get('created_at') or '',
        reverse=True
    )
    
    return results[:limit]
