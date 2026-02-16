"""
Document Validator Router
Comprehensive document validation using RAG and structured analysis.
Validates legal documents for formal validity, legal validity, up-to-dateness,
compliance, risks, and provides improvement suggestions.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import DocumentAnalysis
from app.models.chat import ChatSession, ChatMessage
from app.routers.auth import get_current_user
from app.schemas.document import (
    ValidateDocumentRequest,
    ValidateDocumentResponse,
    DocumentAudit,
    DocumentAnalysisResponse
)
from app.services.ai_service import AIService


router = APIRouter()


def get_risk_emoji(risk_level: str) -> str:
    """Get emoji for risk level."""
    return {
        "low": "🟢",
        "medium": "🟡",
        "high": "🟠",
        "critical": "🔴"
    }.get(risk_level, "⚪")


def format_audit_as_markdown(audit: dict) -> str:
    """Format document audit result as markdown for display."""
    lines = []
    
    # Score header
    score = audit.get('overall_score', 0)
    if score >= 80:
        emoji = "🟢"
        verdict = "ДОКУМЕНТ СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ"
    elif score >= 60:
        emoji = "🟡"
        verdict = "ТРЕБУЮТСЯ НЕЗНАЧИТЕЛЬНЫЕ ИСПРАВЛЕНИЯ"
    elif score >= 40:
        emoji = "🟠"
        verdict = "ТРЕБУЮТСЯ ЗНАЧИТЕЛЬНЫЕ ДОРАБОТКИ"
    else:
        emoji = "🔴"
        verdict = "КРИТИЧЕСКИЕ НАРУШЕНИЯ"
    
    doc_type = audit.get('document_type_detected', 'Документ')
    lines.append(f"# {emoji} Оценка документа: {score}/100")
    lines.append(f"**Тип:** {doc_type}")
    lines.append(f"## 🚦 Вердикт: **{verdict}**")
    lines.append("")
    
    # Formal Validity
    formal = audit.get('formal_validity', {})
    if formal:
        status = "✅" if formal.get('is_valid', True) else "❌"
        lines.append(f"## 📋 Формальная действительность {status} ({formal.get('score', 0)}/100)")
        lines.append(formal.get('explanation', ''))
        issues = formal.get('issues', [])
        if issues:
            lines.append("")
            for issue in issues:
                severity = issue.get('severity', 'medium')
                sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(severity, "⚪")
                lines.append(f"- {sev_emoji} **{issue.get('issue', '')}**")
                lines.append(f"  - Требование: {issue.get('requirement', '')}")
                lines.append(f"  - Статья: {issue.get('article', '')}")
        lines.append("")
    
    # Legal Validity
    legal = audit.get('legal_validity', {})
    if legal:
        status = "✅" if legal.get('is_valid', True) else "❌"
        lines.append(f"## ⚖️ Правовая действительность {status} ({legal.get('score', 0)}/100)")
        lines.append(legal.get('explanation', ''))
        issues = legal.get('issues', [])
        if issues:
            lines.append("")
            for issue in issues:
                severity = issue.get('severity', 'medium')
                sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(severity, "⚪")
                lines.append(f"- {sev_emoji} **{issue.get('issue', '')}**")
                lines.append(f"  - Статья: {issue.get('article', '')}")
                lines.append(f"  - Последствия: {issue.get('consequence', '')}")
        lines.append("")
    
    # Up-to-dateness
    uptodate = audit.get('up_to_dateness', {})
    if uptodate:
        status = "✅" if uptodate.get('is_current', True) else "⚠️"
        lines.append(f"## 🕐 Актуальность {status} ({uptodate.get('score', 0)}/100)")
        lines.append(uptodate.get('explanation', ''))
        outdated = uptodate.get('outdated_references', [])
        if outdated:
            lines.append("")
            lines.append("### Устаревшие ссылки:")
            for ref in outdated:
                lines.append(f"- ⚠️ **{ref.get('reference', '')}**")
                lines.append(f"  - Статус: {ref.get('status', '')}")
                lines.append(f"  - Актуальная норма: {ref.get('current_version', '')}")
        lines.append("")
    
    # Compliance
    compliance = audit.get('compliance_check', {})
    if compliance:
        status = "✅" if compliance.get('is_compliant', True) else "❌"
        lines.append(f"## ✅ Комплаенс {status} ({compliance.get('score', 0)}/100)")
        lines.append(compliance.get('explanation', ''))
        violations = compliance.get('violations', [])
        if violations:
            lines.append("")
            lines.append("### Нарушения:")
            for v in violations:
                lines.append(f"- 🔴 **{v.get('violation', '')}**")
                lines.append(f"  - Требование: {v.get('requirement', '')}")
                lines.append(f"  - Регулятор: {v.get('regulator', '')}")
                lines.append(f"  - Санкция: {v.get('penalty', '')}")
        lines.append("")
    
    # Risk Analysis
    risk = audit.get('risk_analysis', {})
    if risk:
        risk_level = risk.get('risk_level', 'medium')
        risk_emoji = get_risk_emoji(risk_level)
        lines.append(f"## 🔍 Анализ рисков {risk_emoji} ({risk.get('score', 0)}/100)")
        lines.append(f"**Уровень риска:** {risk_level.upper()}")
        lines.append(risk.get('explanation', ''))
        risks = risk.get('risks', [])
        if risks:
            lines.append("")
            for r in risks:
                prob = r.get('probability', 'medium')
                impact = r.get('impact', 'medium')
                lines.append(f"- **{r.get('risk', '')}**")
                lines.append(f"  - Вероятность: {prob} | Влияние: {impact}")
                lines.append(f"  - Категория: {r.get('category', '')}")
        mitigations = risk.get('mitigation_suggestions', [])
        if mitigations:
            lines.append("")
            lines.append("### Рекомендации по снижению рисков:")
            for m in mitigations:
                lines.append(f"- ✅ {m}")
        lines.append("")
    
    # Consistency Check (NEW)
    consistency = audit.get('consistency_check', {})
    if consistency:
        status = "✅" if consistency.get('is_consistent', True) else "⚠️"
        lines.append(f"## 🔗 Согласованность {status} ({consistency.get('score', 0)}/100)")
        lines.append(consistency.get('explanation', ''))
        inconsistencies = consistency.get('inconsistencies', [])
        if inconsistencies:
            lines.append("")
            lines.append("### Внутренние противоречия:")
            for inc in inconsistencies:
                lines.append(f"- **{inc.get('issue', '')}**")
                lines.append(f"  - Место 1: {inc.get('location1', '')}")
                lines.append(f"  - Место 2: {inc.get('location2', '')}")
        lines.append("")
    
    # Jurisdiction Intelligence (NEW)
    jurisdiction = audit.get('jurisdiction_intelligence', {})
    if jurisdiction:
        lines.append(f"## 🌍 Юрисдикция ({jurisdiction.get('score', 0)}/100)")
        lines.append(f"**Основная юрисдикция:** {jurisdiction.get('primary_jurisdiction', 'Узбекистан')}")
        lines.append(jurisdiction.get('explanation', ''))
        courts = jurisdiction.get('applicable_courts', [])
        if courts:
            lines.append("")
            lines.append("**Компетентные суды:** " + ", ".join(courts))
        sol = jurisdiction.get('statute_of_limitations', {})
        if sol:
            lines.append(f"**Срок давности:** {sol.get('applicable_period', '')} ({sol.get('article', '')})")
        lines.append("")
    
    # Litigation Readiness (NEW)
    litigation = audit.get('litigation_readiness', {})
    if litigation:
        readiness = litigation.get('readiness_level', 'medium')
        read_emoji = {"low": "🔴", "medium": "🟡", "high": "🟢"}.get(readiness, "⚪")
        lines.append(f"## ⚔️ Готовность к суду {read_emoji} ({litigation.get('score', 0)}/100)")
        lines.append(f"**Уровень готовности:** {readiness.upper()}")
        lines.append(litigation.get('explanation', ''))
        gaps = litigation.get('evidence_gaps', [])
        if gaps:
            lines.append("")
            lines.append("### Пробелы в доказательствах:")
            for gap in gaps:
                lines.append(f"- **{gap.get('gap', '')}**")
                lines.append(f"  - Необходимо: {gap.get('required_evidence', '')}")
                lines.append(f"  - Как получить: {gap.get('how_to_obtain', '')}")
        strategies = litigation.get('litigation_strategy', [])
        if strategies:
            lines.append("")
            lines.append("### Стратегические рекомендации:")
            for s in strategies:
                lines.append(f"- 💡 {s}")
        lines.append("")
    
    # Ethical Guardrails (NEW)
    ethics = audit.get('ethical_guardrails', {})
    if ethics:
        status = "✅" if ethics.get('passes_ethics', True) else "⚠️"
        lines.append(f"## ⚖️ Этика и добросовестность {status} ({ethics.get('score', 0)}/100)")
        lines.append(ethics.get('explanation', ''))
        concerns = ethics.get('ethical_concerns', [])
        if concerns:
            lines.append("")
            lines.append("### Этические проблемы:")
            for c in concerns:
                sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(c.get('severity', 'medium'), "⚪")
                lines.append(f"- {sev_emoji} **{c.get('concern', '')}**")
                lines.append(f"  - Рекомендация: {c.get('recommendation', '')}")
        unfair = ethics.get('unfair_terms', [])
        if unfair:
            lines.append("")
            lines.append("### Несправедливые условия:")
            for u in unfair:
                lines.append(f"- **{u.get('term', '')}**")
                lines.append(f"  - Почему: {u.get('why_unfair', '')}")
                lines.append(f"  - Исправление: {u.get('fix', '')}")
        lines.append("")
    
    # Improvements
    improvements = audit.get('improvements', [])
    if improvements:
        lines.append("## 🛠️ Рекомендуемые исправления")
        lines.append("")
        for i, imp in enumerate(improvements, 1):
            priority = imp.get('priority', 'medium')
            prio_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(priority, "⚪")
            lines.append(f"### {i}. {prio_emoji} {imp.get('issue', '')}")
            lines.append(f"**Место в документе:** {imp.get('location', '')}")
            if imp.get('current_text'):
                lines.append(f"**Текущий текст:**")
                lines.append(f"```")
                lines.append(imp.get('current_text', ''))
                lines.append(f"```")
            lines.append(f"**Предлагаемый текст:**")
            lines.append(f"```")
            lines.append(imp.get('suggested_text', ''))
            lines.append(f"```")
            lines.append(f"*{imp.get('explanation', '')}*")
            lines.append("")
    
    # Summary
    summary = audit.get('summary', '')
    if summary:
        lines.append("---")
        lines.append("")
        lines.append("## 📌 Заключение")
        lines.append("")
        lines.append(summary)
        lines.append("")
    
    # Explainability (Non-negotiable)
    explain = audit.get('explainability', '')
    if explain:
        lines.append("---")
        lines.append("")
        lines.append("## 💡 Объяснение для неюриста")
        lines.append("")
        lines.append(explain)
    
    return "\n".join(lines)


@router.post("/analyze", response_model=ValidateDocumentResponse)
async def analyze_document(
    request: ValidateDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Analyze document for comprehensive validation."""
    document_text = request.document.strip()
    document_type = request.document_type
    user_id = current_user.id if current_user else None
    
    if len(document_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Document text is too short for meaningful analysis"
        )
    
    try:
        # Analyze document
        ai_service = AIService(mode='document-validator')
        result = await ai_service.analyze_document(document_text, document_type, top_k=50)
        
        audit = result.get('audit', {})
        
        # Save analysis to DocumentAnalysis table
        analysis = DocumentAnalysis(
            user_id=user_id,
            document_text=document_text,
            document_type=audit.get('document_type_detected', document_type),
            overall_score=audit.get('overall_score', 0),
            formal_validity=audit.get('formal_validity', {}),
            legal_validity=audit.get('legal_validity', {}),
            up_to_dateness=audit.get('up_to_dateness', {}),
            compliance_check=audit.get('compliance_check', {}),
            risk_analysis=audit.get('risk_analysis', {}),
            consistency_check=audit.get('consistency_check', {}),
            jurisdiction_intelligence=audit.get('jurisdiction_intelligence', {}),
            litigation_readiness=audit.get('litigation_readiness', {}),
            ethical_guardrails=audit.get('ethical_guardrails', {}),
            improvements=audit.get('improvements', []),
            summary=audit.get('summary', ''),
            explainability=audit.get('explainability', ''),
            sources=result.get('sources', []),
            raw_response=result.get('raw_response', '')
        )
        db.add(analysis)
        db.flush()
        
        # Also save to ChatSession for unified history view
        session_title = f"Проверка документа: {audit.get('document_type_detected', 'Документ')} (Оценка: {audit.get('overall_score', 0)}/100)"
        chat_session = ChatSession(
            user_id=user_id,
            session_type='document-validator',
            title=session_title
        )
        db.add(chat_session)
        db.flush()
        
        # Save user message (document text preview)
        doc_preview = document_text[:500] + "..." if len(document_text) > 500 else document_text
        user_msg = ChatMessage(
            session_id=chat_session.id,
            role='user',
            content=f"**Документ для проверки:**\n\n```\n{doc_preview}\n```"
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
        
        return ValidateDocumentResponse(
            success=True,
            analysis_id=analysis.id,
            session_id=chat_session.id,
            audit=DocumentAudit(**audit),
            sources=result.get('sources', [])
        )
        
    except Exception as e:
        import traceback
        print(f"Document validator error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=list[DocumentAnalysisResponse])
async def get_document_validation_history(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get document validation history for current user."""
    query = db.query(DocumentAnalysis).order_by(DocumentAnalysis.created_at.desc())
    
    if current_user:
        query = query.filter(DocumentAnalysis.user_id == current_user.id)
    else:
        query = query.filter(DocumentAnalysis.user_id.is_(None))
    
    analyses = query.limit(20).all()
    
    return [DocumentAnalysisResponse.model_validate(a.to_dict()) for a in analyses]


@router.get("/{analysis_id}", response_model=DocumentAnalysisResponse)
async def get_document_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get a specific document analysis result."""
    analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Verify ownership
    if current_user and analysis.user_id and analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return DocumentAnalysisResponse.model_validate(analysis.to_dict())
