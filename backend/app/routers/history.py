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
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """
    Get unified history of all user activities.
    """
    user_id = current_user.id if current_user else None
    results = []
    
    # Logic:
    # If filtered by type: use SQL limit/offset
    # If unified ('all'): fetch (skip + limit) from each table, merge, sort, then slice [skip : skip + limit]
    
    fetch_limit = limit
    fetch_offset = skip
    
    # If unified view, we must fetch skip+limit to ensure correct sorting across tables
    # (naive but robust approach for < 1000 items)
    if not type:
        fetch_limit = skip + limit
        fetch_offset = 0 # reset offset for DB query, we will slice later
    
    # Results containers
    chat_results = []
    validation_results = []
    generation_results = []
    
    # 1. Chat sessions
    if not type or type == 'chat':
        query = db.query(ChatSession).filter(ChatSession.session_type == 'lawyer')
        if user_id:
            query = query.filter(ChatSession.user_id == user_id)
        else:
            query = query.filter(ChatSession.user_id.is_(None))
        
        sessions = query.order_by(ChatSession.updated_at.desc()).offset(fetch_offset).limit(fetch_limit).all()
        
        for session in sessions:
            chat_results.append({
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
            
    # 2. Contract validations
    if not type or type == 'validation':
        query = db.query(ContractAnalysis)
        if user_id:
            query = query.filter(ContractAnalysis.user_id == user_id)
        else:
            query = query.filter(ContractAnalysis.user_id.is_(None))
        
        analyses = query.order_by(ContractAnalysis.created_at.desc()).offset(fetch_offset).limit(fetch_limit).all()
        
        for analysis in analyses:
            score = analysis.validity_score
            icon = "🟢" if score >= 80 else "🟡" if score >= 50 else "🔴"
            
            validation_results.append({
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
            
    # 3. Contract generations
    if not type or type == 'generation':
        query = db.query(GeneratedContract)
        if user_id:
            query = query.filter(GeneratedContract.user_id == user_id)
        else:
            query = query.filter(GeneratedContract.user_id.is_(None))
        
        contracts = query.order_by(GeneratedContract.created_at.desc()).offset(fetch_offset).limit(fetch_limit).all()
        
        for contract in contracts:
            generation_results.append({
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
            
    # Combine results
    results = chat_results + validation_results + generation_results
    
    # If using unified view, we must sort and slice MANUALLY now
    if not type:
        # Sort by created_at descending
        results.sort(
            key=lambda x: x.get('created_at') or '',
            reverse=True
        )
        # Apply the final slice
        return results[skip : skip + limit]
    
    # If filtered by type, the DB already did the work
    return results


@router.delete("/{item_type}/{item_id}")
async def delete_history_item(
    item_type: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """
    Delete a history item by type and ID.
    
    Types: chat, validation, generation
    """
    from fastapi import HTTPException
    
    user_id = current_user.id if current_user else None
    
    if item_type == 'chat':
        item = db.query(ChatSession).filter(ChatSession.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if user_id and item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        db.delete(item)
        
    elif item_type == 'validation':
        item = db.query(ContractAnalysis).filter(ContractAnalysis.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if user_id and item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        db.delete(item)
        
    elif item_type == 'generation':
        item = db.query(GeneratedContract).filter(GeneratedContract.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if user_id and item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        db.delete(item)
        
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    db.commit()
    return {"message": "Item deleted successfully"}
