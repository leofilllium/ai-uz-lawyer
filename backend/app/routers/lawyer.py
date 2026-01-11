"""
Lawyer Chat Router
Full AI Lawyer with RAG using Claude and extended thinking.
"""

import json
import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.routers.auth import get_current_user
from app.schemas.chat import ChatRequest, ChatSessionResponse, ChatSessionDetailResponse, ChatMessageResponse
from app.services.ai_service import AIService

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

router = APIRouter()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user)
):
    """Chat with AI lawyer using RAG (SSE streaming)."""
    logger.info(f"=== CHAT REQUEST RECEIVED ===")
    logger.info(f"Message: {request.message[:100]}...")
    logger.info(f"Session ID: {request.session_id}")
    logger.info(f"Chat Mode: {request.chat_mode}")
    logger.info(f"User ID: {current_user.id if current_user else 'Anonymous'}")
    
    user_message = request.message.strip()
    session_id = request.session_id
    user_id = current_user.id if current_user else None
    
    if not user_message:
        logger.warning("Empty message received")
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
        logger.info(f"Created new session with ID: {session.id}")
    
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
    logger.info(f"User message saved. Session ID: {session.id}")
    
    # Get chat history for context
    history = [
        {'role': msg.role, 'content': msg.content}
        for msg in db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).order_by(ChatMessage.created_at).all()
    ]
    logger.info(f"Chat history loaded: {len(history)} messages")
    
    current_session_id = session.id
    chat_mode = request.chat_mode
    
    async def generate():
        full_response = ""
        sources = []
        chunk_count = 0
        
        try:
            logger.info(f"=== STARTING AI SERVICE ===")
            logger.info(f"Initializing AIService with mode='lawyer'")
            ai_service = AIService(mode='lawyer')
            
            logger.info(f"Calling query_with_rag with chat_mode='{chat_mode}'")
            logger.info(f"Question length: {len(user_message)} chars")
            result = await ai_service.query_with_rag(user_message, history, chat_mode=chat_mode)
            logger.info(f"query_with_rag returned. Starting to stream response...")
            
            # Stream the response
            async for chunk in result['response']:
                chunk_count += 1
                full_response += chunk
                if chunk_count <= 3 or chunk_count % 50 == 0:
                    logger.debug(f"Streaming chunk #{chunk_count}, total length so far: {len(full_response)}")
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            logger.info(f"=== STREAMING COMPLETE ===")
            logger.info(f"Total chunks: {chunk_count}, Response length: {len(full_response)}")
            
            sources = result.get('sources', [])
            logger.info(f"Sources retrieved: {len(sources)}")
            
            # Save assistant message with sources
            logger.info(f"Saving assistant message to database...")
            with Session(db.get_bind()) as save_db:
                assistant_msg = ChatMessage(
                    session_id=current_session_id,
                    role='assistant',
                    content=full_response,
                    sources=sources
                )
                save_db.add(assistant_msg)
                save_db.commit()
            logger.info(f"Assistant message saved successfully")
            
            yield f"data: {json.dumps({'done': True, 'session_id': current_session_id, 'sources': sources})}\n\n"
            logger.info(f"=== CHAT COMPLETE ===")
            
        except Exception as e:
            logger.error(f"=== ERROR IN GENERATE ===")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
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
