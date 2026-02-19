"""
Contract Validator Router
Contract compliance checking using RAG and structured analysis.
"""

import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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
    ContractAnalysisResponse,
    FixContractRequest
)
from app.services.ai_service import AIService


router = APIRouter()


def format_audit_as_markdown(audit: dict) -> str:
    """Format contract audit result as markdown for display (Strict Mode)."""
    lines = []
    
    # Score header
    score = audit.get('validity_score', 0)
    strictness = audit.get('strictness_level', 'standard')
    
    if score >= 90:
        emoji = "🟢"
        verdict = "ДОПУСТИМО (ИДЕАЛ)"
    elif score >= 75:
        emoji = "🟡"
        verdict = "ТРЕБУЕТ ДОРАБОТКИ"
    elif score >= 50:
        emoji = "🟠"
        verdict = "РИСКОВАНО"
    else:
        emoji = "🔴"
        verdict = "КРИТИЧЕСКИ ОПАСНО"
    
    lines.append(f"# {emoji} Оценка договора: {score}/100")
    lines.append(f"## 🚦 Вердикт: **{verdict}**")
    if strictness == 'maximum':
        lines.append(f"🔒 **РЕЖИМ ПРОВЕРКИ: RUTHLESS AUDITOR (МАКСИМАЛЬНАЯ СТРОГОСТЬ)**")
    
    lines.append("")
    lines.append(audit.get('score_explanation', ''))
    lines.append("")
    lines.append("---")
    
    # Critical errors
    critical = audit.get('critical_errors', [])
    if critical:
        lines.append("")
        lines.append("## ❌ КРИТИЧЕСКИЕ ОШИБКИ И НАРУШЕНИЯ ЗАКОНА")
        lines.append("")
        for err in critical:
            lines.append(f"### 🛑 {err.get('error', 'Ошибка')}")
            lines.append(f"**Основание (Статья):** {err.get('article', 'Не указана')}")
            lines.append(f"**Последствия:** {err.get('consequence', 'Юридические риски')}")
            lines.append(f"**ИСПРАВЛЕНИЕ:** `{err.get('fix', 'Требуется консультация')}`")
            lines.append("")

    # Hidden Risks (New)
    hidden_risks = audit.get('hidden_risks', [])
    if hidden_risks:
        lines.append("")
        lines.append("## 🕵️ СКРЫТЫЕ УГРОЗЫ И ЛОВУШКИ")
        lines.append("> *Эти пункты юридически корректны, но создают кабальные условия.*")
        lines.append("")
        for risk in hidden_risks:
            severity = risk.get('severity', 'medium').upper()
            icon = "💣" if severity == 'HIGH' else "⚠️"
            lines.append(f"### {icon} {risk.get('risk', 'Скрытый риск')}")
            lines.append(f"**Где найдено:** {risk.get('location', 'Весь текст')}")
            lines.append(f"**Как обезвредить:** {risk.get('mitigation', '')}")
            lines.append("")

    # Ambiguities (New)
    ambiguities = audit.get('ambiguities', [])
    if ambiguities:
        lines.append("")
        lines.append("## 🌫️ РАЗМЫТЫЕ ФОРМУЛИРОВКИ (AMBIGUITY CHECK)")
        lines.append("")
        for amb in ambiguities:
            lines.append(f"- **Фраза:** \"{amb.get('phrase', '')}\"")
            lines.append(f"  - *Риск:* {amb.get('risk', '')}")
            lines.append(f"  - *Лучше написать:* `{amb.get('suggestion', '')}`")
        lines.append("")
    
    # Warnings
    warnings = audit.get('warnings', [])
    if warnings:
        lines.append("")
        lines.append("## ⚠️ ПРЕДУПРЕЖДЕНИЯ")
        lines.append("")
        for warn in warnings:
            lines.append(f"**Риск:** {warn.get('risk', 'Риск')}")
            lines.append(f"{warn.get('explanation', '')}")
            lines.append(f"--> *Рекомендация:* {warn.get('suggestion', '')}")
            lines.append("")
    
    # Missing clauses
    missing = audit.get('missing_clauses', [])
    if missing:
        lines.append("")
        lines.append("## 📝 НЕОБХОДИМО ДОБАВИТЬ")
        lines.append("")
        for clause in missing:
            importance = clause.get('importance', 'medium').upper()
            icon = "❗" if importance == 'CRITICAL' else "🔹"
            lines.append(f"### {icon} {clause.get('clause_name', 'Пункт')}")
            if clause.get('article_reference'):
                lines.append(f"**Основание:** {clause.get('article_reference')}")
            lines.append("```text")
            lines.append(clause.get('drafted_text', 'Текст не предоставлен'))
            lines.append("```")
            lines.append("")
            
    # Negotiation Strategy (New)
    strategy = audit.get('negotiation_strategy', '')
    if strategy:
        lines.append("")
        lines.append("## 🤝 СТРАТЕГИЯ ПЕРЕГОВОРОВ")
        if isinstance(strategy, list):
            strategy = "\n".join(str(s) for s in strategy)
        lines.append(str(strategy))
        lines.append("")
    
    # Summary
    summary = audit.get('summary', '')
    if summary:
        lines.append("")
        lines.append("---")
        lines.append(f"### 🧑‍⚖️ РЕЗЮМЕ АУДИТОРА")
        if isinstance(summary, list):
            summary = "\n".join(str(s) for s in summary)
        lines.append(str(summary))
    
    return "\n".join(lines)


@router.post("/analyze")
async def analyze_contract(
    request: ValidateContractRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Analyze contract for compliance (SSE Streaming)."""
    contract_text = request.contract.strip()
    user_id = current_user.id if current_user else None
    
    if len(contract_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Contract text is too short for meaningful analysis"
        )
    
    async def generate_stream():
        try:
            ai_service = AIService(mode='validator')
            
            # Start analysis in background task
            analysis_task = asyncio.create_task(
                ai_service.analyze_contract_stream(contract_text, user_id=user_id)
            )
            
            # Streaming loop with robust keep-alive
            analysis_iter = (await analysis_task).__aiter__()
            next_event_task = None
            
            while True:
                if next_event_task is None:
                    next_event_task = asyncio.create_task(analysis_iter.__anext__())
                
                # Wait for next event without cancelling
                done, _ = await asyncio.wait(
                    [next_event_task],
                    timeout=8.0,
                    return_when=asyncio.FIRST_COMPLETED
                )
                
                if next_event_task in done:
                    try:
                        event = await next_event_task
                        next_event_task = None
                    except StopAsyncIteration:
                        break
                    except Exception as e:
                        raise e
                    
                    if event["type"] == "status":
                        yield f"data: {json.dumps({'status': event['text']})}\n\n"
                    elif event["type"] == "result":
                        audit = event["audit"]
                        sources = event["sources"]
                        raw_response = event["raw_response"]
                        
                        # Save result to DB (same logic as before)
                        analysis = ContractAnalysis(
                            user_id=user_id,
                            contract_text=contract_text,
                            validity_score=audit.get('validity_score', 0),
                            score_explanation=audit.get('score_explanation', ''),
                            critical_errors=audit.get('critical_errors', []),
                            warnings=audit.get('warnings', []),
                            missing_clauses=audit.get('missing_clauses', []),
                            hidden_risks=audit.get('hidden_risks', []),
                            ambiguities=audit.get('ambiguities', []),
                            summary=audit.get('summary', ''),
                            sources=sources,
                            raw_response=raw_response
                        )
                        db.add(analysis)
                        db.flush()
                        
                        session_title = f"Проверка договора (Оценка: {audit.get('validity_score', 0)}/100)"
                        chat_session = ChatSession(
                            user_id=user_id,
                            session_type='validator',
                            title=session_title
                        )
                        db.add(chat_session)
                        db.flush()
                        
                        contract_preview = contract_text[:500] + "..." if len(contract_text) > 500 else contract_text
                        user_msg = ChatMessage(
                            session_id=chat_session.id,
                            role='user',
                            content=f"**Текст договора для проверки:**\n\n```\n{contract_preview}\n```"
                        )
                        db.add(user_msg)
                        
                        formatted_response = format_audit_as_markdown(audit)
                        assistant_msg = ChatMessage(
                            session_id=chat_session.id,
                            role='assistant',
                            content=formatted_response,
                            sources=sources
                        )
                        db.add(assistant_msg)
                        db.commit()
                        
                        # Yield final done event
                        done_payload = json.dumps({
                            'done': True,
                            'analysis_id': analysis.id,
                            'session_id': chat_session.id,
                            'audit': audit,
                            'sources': sources
                        })
                        yield f"data: {done_payload}\n\n"
                else:
                    # Timeout, send keep-alive
                    yield ": keep-alive\n\n"
                    
        except Exception as e:
            import traceback
            import logging
            logging.getLogger(__name__).error(f"Validator stream error: {traceback.format_exc()}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            if 'next_event_task' in locals() and next_event_task and not next_event_task.done():
                next_event_task.cancel()

    return StreamingResponse(generate_stream(), media_type="text/event-stream")


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


@router.post("/fix")
async def fix_contract(
    request: FixContractRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Automatically fix contract issues using AI."""
    analysis = db.query(ContractAnalysis).filter(ContractAnalysis.id == request.analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Verify ownership
    if current_user and analysis.user_id and analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        ai_service = AIService(mode='validator')
        
        # Prepare context for fixing
        # analysis.raw_response contains the full JSON audit
        # we also need the original contract text and legal context (sources)
        
        audit_results = analysis.raw_response
        original_text = analysis.contract_text
        
        # Reconstruct legal context from sources
        legal_context = ""
        for source in analysis.sources:
            legal_context += f"--- SOURCE: {source.get('title', 'Unknown')} ---\n"
            legal_context += f"{source.get('text', '')}\n\n"
            
        fixed_text = await ai_service.fix_contract_with_ai(
            original_text=original_text,
            audit_results=audit_results,
            legal_context=legal_context,
            user_id=current_user.id if current_user else None
        )
        
        return {"success": True, "fixed_contract": fixed_text}
        
    except Exception as e:
        import traceback
        import logging
        logging.getLogger(__name__).error(f"Fixer error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
