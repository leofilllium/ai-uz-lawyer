"""
Contract Generator Router
Generate contracts based on templates, legal context, and user requirements.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.generated_contract import GeneratedContract
from app.models.chat import ChatSession, ChatMessage
from app.routers.auth import get_current_user
from app.schemas.contract import (
    GenerateContractRequest,
    ContractCategory,
    ContractTemplate,
    GeneratedContractResponse
)
from app.services.ai_service import AIService
from app.services.contract_service import ContractService


router = APIRouter()


@router.get("/categories", response_model=list[ContractCategory])
async def get_categories():
    """Get all contract categories with template counts."""
    contract_service = ContractService()
    categories = contract_service.get_categories()
    return [ContractCategory(**c) for c in categories]


@router.get("/templates/{category}", response_model=list[ContractTemplate])
async def get_templates(category: str):
    """Get templates in a specific category."""
    contract_service = ContractService()
    templates = contract_service.get_templates_in_category(category)
    return [ContractTemplate(**t) for t in templates]


@router.post("/generate")
async def generate_contract(
    request: GenerateContractRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Generate a contract based on category and requirements (SSE streaming)."""
    category = request.category.strip()
    requirements = request.requirements.strip()
    user_id = current_user.id if current_user else None
    
    if not category:
        raise HTTPException(status_code=400, detail="Выберите категорию договора")
    
    if len(requirements) < 20:
        raise HTTPException(
            status_code=400,
            detail="Требования слишком короткие. Укажите больше деталей."
        )
    
    try:
        # Load templates for the category
        contract_service = ContractService()
        template_context = contract_service.load_all_templates_for_category(category)
        template_names = [t['name'] for t in contract_service.get_templates_in_category(category)]
        
        if not template_context:
            raise HTTPException(
                status_code=404,
                detail=f'Шаблоны для категории "{category}" не найдены'
            )
        
        # Generate contract using AI service
        ai_service = AIService(mode='generator')
        result = await ai_service.generate_contract(
            category=category,
            requirements=requirements,
            template_context=template_context
        )
        
        async def generate_stream():
            full_response = ""
            sources = result.get('sources', [])
            
            try:
                async for chunk in result['response']:
                    full_response += chunk
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as stream_error:
                print(f"Streaming error: {stream_error}")
                yield f"data: {json.dumps({'error': str(stream_error)})}\n\n"
                return
            
            # Save to database after streaming completes
            try:
                with Session(db.get_bind()) as save_db:
                    generated = GeneratedContract(
                        user_id=user_id,
                        category=category,
                        requirements=requirements,
                        generated_text=full_response,
                        template_names=template_names,
                        sources=sources
                    )
                    save_db.add(generated)
                    
                    # Also save to ChatSession for unified history
                    session_title = f"Договор: {category}"
                    chat_session = ChatSession(
                        user_id=user_id,
                        session_type='generator',
                        title=session_title
                    )
                    save_db.add(chat_session)
                    save_db.flush()
                    
                    # Save messages
                    user_msg = ChatMessage(
                        session_id=chat_session.id,
                        role='user',
                        content=f"**Категория:** {category}\n\n**Требования:**\n{requirements}"
                    )
                    save_db.add(user_msg)
                    
                    assistant_msg = ChatMessage(
                        session_id=chat_session.id,
                        role='assistant',
                        content=full_response,
                        sources=sources
                    )
                    save_db.add(assistant_msg)
                    
                    save_db.commit()
                    
                    # Send final event with metadata
                    yield f"data: {json.dumps({'done': True, 'sources': sources, 'contract_id': generated.id})}\n\n"
                    
            except Exception as e:
                print(f"Error saving generated contract: {e}")
                yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Generator error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=list[GeneratedContractResponse])
async def get_generation_history(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get contract generation history for current user."""
    query = db.query(GeneratedContract).order_by(GeneratedContract.created_at.desc())
    
    if current_user:
        query = query.filter(GeneratedContract.user_id == current_user.id)
    else:
        query = query.filter(GeneratedContract.user_id.is_(None))
    
    contracts = query.limit(20).all()
    
    return [GeneratedContractResponse.model_validate(c.to_dict()) for c in contracts]


@router.get("/contract/{contract_id}", response_model=GeneratedContractResponse)
async def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get a specific generated contract."""
    contract = db.query(GeneratedContract).filter(GeneratedContract.id == contract_id).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify ownership
    if current_user and contract.user_id and contract.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return GeneratedContractResponse.model_validate(contract.to_dict())
