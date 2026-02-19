"""
Contract Generator Router
Generate contracts based on templates, legal context, and user requirements.
"""

import json
import asyncio
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
    
    # Load templates for the category (fast, no AI calls)
    contract_service = ContractService()
    template_context = contract_service.load_all_templates_for_category(category)
    template_names = [t['name'] for t in contract_service.get_templates_in_category(category)]

    if not template_context:
        raise HTTPException(
            status_code=404,
            detail=f'Шаблоны для категории "{category}" не найдены'
        )

    # Prepare context for Ultra Mode data capture
    ultra_context = {}

    async def generate_stream():
        full_response = ""
        sources = []
        # Use queue to stream progress updates while waiting for long-running AI task
        progress_queue = asyncio.Queue()

        try:
            # Run AI generation as a background task so we can send keep-alives
            ai_service = AIService(mode='generator')

            async def run_generation():
                if request.ultra_mode:
                    return await ai_service.generate_contract_ultra(
                        category=category,
                        requirements=requirements,
                        template_context=template_context,
                        context=ultra_context,
                        user_id=user_id
                    )
                else:
                    return await ai_service.generate_contract(
                        category=category,
                        requirements=requirements,
                        template_context=template_context,
                        user_id=user_id
                    )

            # Start generation in background task
            gen_task = asyncio.create_task(run_generation())

            # Send keep-alives while waiting for generation to prepare
            while not gen_task.done():
                try:
                    await asyncio.wait_for(asyncio.sleep(3.0), timeout=3.1)
                    if not gen_task.done():
                        yield ": keep-alive\n\n"
                except asyncio.TimeoutError:
                    continue

            # Get result (will raise if generation failed)
            result = await gen_task
            sources = result.get('sources', [])

            # Stream the response with keep-alive support (non-cancelling)
            response_iter = result['response'].__aiter__()
            next_item_task = None
            
            try:
                while True:
                    if next_item_task is None:
                        next_item_task = asyncio.create_task(response_iter.__anext__())
                    
                    # Wait for next chunk WITHOUT cancelling if timeout occurs
                    done, _ = await asyncio.wait(
                        [next_item_task], 
                        timeout=10.0, 
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    
                    if next_item_task in done:
                        try:
                            item = await next_item_task
                            next_item_task = None
                        except StopAsyncIteration:
                            break
                        except Exception as e:
                            # Re-raise so it's caught by the outer try-except
                            raise e
                    else:
                        # Timeout reached, send keep-alive but continue waiting for the same task
                        yield ": keep-alive\n\n"
                        continue

                    if isinstance(item, dict):
                        if item.get("type") == "status":
                            yield f"data: {json.dumps({'status': item['text']})}\n\n"
                        elif item.get("type") == "content":
                            chunk = item['text']
                            full_response += chunk
                            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                    else:
                        full_response += item
                        yield f"data: {json.dumps({'chunk': item})}\n\n"
            finally:
                if next_item_task and not next_item_task.done():
                    next_item_task.cancel()

        except Exception as stream_error:
            import traceback
            print(f"Streaming error: {traceback.format_exc()}")
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
                    sources=sources,
                    validation_data=ultra_context.get('ultra_data', {})
                )
                save_db.add(generated)

                session_title = f"Договор: {category}"
                chat_session = ChatSession(
                    user_id=user_id,
                    session_type='generator',
                    title=session_title
                )
                save_db.add(chat_session)
                save_db.flush()

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
