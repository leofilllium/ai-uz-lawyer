"""
Contract Validator Router
Contract compliance checking using RAG and structured analysis.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.contract import ContractAnalysis
from app.models.chat import ChatSession, ChatMessage
from app.routers.auth import get_current_user
from app.schemas.contract import (
    ValidateContractRequest,
    ValidateContractResponse,
    ContractAudit,
    ContractAnalysisResponse
)
from app.services.ai_service import AIService


router = APIRouter()


def format_audit_as_markdown(audit: dict) -> str:
    """Format contract audit result as markdown for display."""
    lines = []
    
    # Score header
    score = audit.get('validity_score', 0)
    if score >= 80:
        emoji = "🟢"
        verdict = "ДОПУСТИМО"
    elif score >= 50:
        emoji = "🟡"
        verdict = "ТРЕБУЕТ ДОРАБОТКИ"
    else:
        emoji = "🔴"
        verdict = "ВЫСОКИЙ РИСК"
    
    lines.append(f"# {emoji} Оценка договора: {score}/100")
    lines.append(f"## 🚦 Вердикт: **{verdict}**")
    lines.append("")
    lines.append(audit.get('score_explanation', ''))
    lines.append("")
    lines.append("---")
    
    # Critical errors
    critical = audit.get('critical_errors', [])
    if critical:
        lines.append("")
        lines.append("## ❌ Критические ошибки")
        lines.append("")
        for err in critical:
            lines.append(f"### {err.get('error', 'Ошибка')}")
            lines.append(f"**Статья:** {err.get('article', 'Не указана')}")
            lines.append(f"**Исправление:** {err.get('fix', 'Требуется консультация')}")
            lines.append("")
    
    # Warnings
    warnings = audit.get('warnings', [])
    if warnings:
        lines.append("")
        lines.append("## ⚠️ Предупреждения")
        lines.append("")
        for warn in warnings:
            lines.append(f"### {warn.get('risk', 'Риск')}")
            lines.append(f"{warn.get('explanation', '')}")
            lines.append(f"**Рекомендация:** {warn.get('suggestion', '')}")
            lines.append("")
    
    # Missing clauses
    missing = audit.get('missing_clauses', [])
    if missing:
        lines.append("")
        lines.append("## 📝 Недостающие пункты")
        lines.append("")
        for clause in missing:
            lines.append(f"### {clause.get('clause_name', 'Пункт')}")
            lines.append(f"**Основание:** {clause.get('article_reference', 'Не указано')}")
            lines.append("")
            lines.append("```")
            lines.append(clause.get('drafted_text', 'Текст не предоставлен'))
            lines.append("```")
            lines.append("")
    
    # Summary
    summary = audit.get('summary', '')
    if summary:
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 📌 Итоговое заключение")
        lines.append("")
        lines.append(summary)
    
    return "\n".join(lines)


@router.post("/analyze", response_model=ValidateContractResponse)
async def analyze_contract(
    request: ValidateContractRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Analyze contract for compliance."""
    contract_text = request.contract.strip()
    user_id = current_user.id if current_user else None
    
    if len(contract_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Contract text is too short for meaningful analysis"
        )
    
    try:
        # Analyze contract
        ai_service = AIService(mode='validator')
        result = ai_service.analyze_contract(contract_text)
        
        audit = result.get('audit', {})
        
        # Save analysis to ContractAnalysis table
        analysis = ContractAnalysis(
            user_id=user_id,
            contract_text=contract_text,
            validity_score=audit.get('validity_score', 0),
            score_explanation=audit.get('score_explanation', ''),
            critical_errors=audit.get('critical_errors', []),
            warnings=audit.get('warnings', []),
            missing_clauses=audit.get('missing_clauses', []),
            summary=audit.get('summary', ''),
            sources=result.get('sources', []),
            raw_response=result.get('raw_response', '')
        )
        db.add(analysis)
        db.flush()
        
        # Also save to ChatSession for unified history view
        session_title = f"Проверка договора (Оценка: {audit.get('validity_score', 0)}/100)"
        chat_session = ChatSession(
            user_id=user_id,
            session_type='validator',
            title=session_title
        )
        db.add(chat_session)
        db.flush()
        
        # Save user message (contract text preview)
        contract_preview = contract_text[:500] + "..." if len(contract_text) > 500 else contract_text
        user_msg = ChatMessage(
            session_id=chat_session.id,
            role='user',
            content=f"**Текст договора для проверки:**\n\n```\n{contract_preview}\n```"
        )
        db.add(user_msg)
        
        # Save assistant response (formatted audit result)
        formatted_response = format_audit_as_markdown(audit)
        assistant_msg = ChatMessage(
            session_id=chat_session.id,
            role='assistant',
            content=formatted_response,
            sources=result.get('sources', [])
        )
        db.add(assistant_msg)
        
        db.commit()
        
        return ValidateContractResponse(
            success=True,
            analysis_id=analysis.id,
            session_id=chat_session.id,
            audit=ContractAudit(**audit),
            sources=result.get('sources', [])
        )
        
    except Exception as e:
        import traceback
        print(f"Validator error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=list[ContractAnalysisResponse])
async def get_validation_history(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get contract validation history for current user."""
    query = db.query(ContractAnalysis).order_by(ContractAnalysis.created_at.desc())
    
    if current_user:
        query = query.filter(ContractAnalysis.user_id == current_user.id)
    else:
        query = query.filter(ContractAnalysis.user_id.is_(None))
    
    analyses = query.limit(20).all()
    
    return [ContractAnalysisResponse.model_validate(a.to_dict()) for a in analyses]


@router.get("/{analysis_id}", response_model=ContractAnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get a specific analysis result."""
    analysis = db.query(ContractAnalysis).filter(ContractAnalysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Verify ownership
    if current_user and analysis.user_id and analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return ContractAnalysisResponse.model_validate(analysis.to_dict())
