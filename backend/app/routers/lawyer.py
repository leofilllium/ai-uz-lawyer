"""
Lawyer Chat Router
Full AI Lawyer with RAG using Claude and extended thinking.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.routers.auth import get_current_user
from app.schemas.chat import ChatRequest, ChatSessionResponse, ChatSessionDetailResponse, ChatMessageResponse
from app.services.ai_service import AIService


router = APIRouter()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Chat with AI lawyer using RAG (SSE streaming)."""
    user_message = request.message.strip()
    session_id = request.session_id
    user_id = current_user.id if current_user else None
    
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Get or create session
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first() if session_id else None
    is_new_session = session is None
    
    # Verify ownership of existing session
    if session and user_id and session.user_id:
        if session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
    
    if is_new_session:
        session = ChatSession(
            session_type='lawyer',
            title='Юридическая консультация',
            user_id=user_id
        )
        db.add(session)
        db.flush()
    
    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role='user',
        content=user_message
    )
    db.add(user_msg)
    
    # Update session title from first message
    if is_new_session:
        session.title = user_message[:50] + '...' if len(user_message) > 50 else user_message
    
    db.commit()
    
    # Get chat history for context
    history = [
        {'role': msg.role, 'content': msg.content}
        for msg in db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).order_by(ChatMessage.created_at).all()
    ]
    
    current_session_id = session.id
    
    async def generate():
        full_response = ""
        sources = []
        
        try:
            ai_service = AIService(mode='lawyer')
            result = ai_service.query_with_rag(user_message, history, chat_mode=request.chat_mode)
            
            # Stream the response
            for chunk in result['response']:
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            sources = result.get('sources', [])
            
            # Save assistant message with sources
            with Session(db.get_bind()) as save_db:
                assistant_msg = ChatMessage(
                    session_id=current_session_id,
                    role='assistant',
                    content=full_response,
                    sources=sources
                )
                save_db.add(assistant_msg)
                save_db.commit()
            
            yield f"data: {json.dumps({'done': True, 'session_id': current_session_id, 'sources': sources})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """List lawyer sessions for current user."""
    query = db.query(ChatSession).filter(ChatSession.session_type == 'lawyer')
    
    if current_user:
        query = query.filter(ChatSession.user_id == current_user.id)
    else:
        # Only show sessions without user_id for anonymous users
        query = query.filter(ChatSession.user_id.is_(None))
    
    sessions = query.order_by(ChatSession.updated_at.desc()).limit(20).all()
    
    return [ChatSessionResponse.model_validate(s.to_dict()) for s in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Get a specific session with messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify ownership
    if current_user and session.user_id and session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    
    session_dict = session.to_dict()
    session_dict['messages'] = [ChatMessageResponse.model_validate(m.to_dict()) for m in messages]
    
    return ChatSessionDetailResponse.model_validate(session_dict)
