"""
Usage Service
Service to track AI model usage and save to database.
"""

import logging
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models.usage import ModelUsage
from app.core.pricing import calculate_cost

logger = logging.getLogger(__name__)

class UsageService:
    """Service for tracking model usage."""
    
    @staticmethod
    def track_usage(
        user_id: int,
        model_name: str,
        input_tokens: int,
        output_tokens: int,
        request_type: str = 'unknown'
    ) -> ModelUsage:
        """
        Track usage for a request.
        
        Args:
            user_id: ID of the user making the request (None if system)
            model_name: Name of the model used
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            request_type: Type of request (chat, document, etc.)
            
        Returns:
            Created ModelUsage instance
        """
        try:
            db = SessionLocal()
            try:
                # Calculate cost
                cost = calculate_cost(model_name, input_tokens, output_tokens)
                
                # Create usage record
                usage = ModelUsage(
                    user_id=user_id,
                    model_name=model_name,
                    request_type=request_type,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=input_tokens + output_tokens,
                    cost=cost,
                    timestamp=datetime.utcnow()
                )
                
                db.add(usage)
                db.commit()
                db.refresh(usage)
                
                logger.info(
                    f"Usage tracked: {model_name} | "
                    f"In: {input_tokens}, Out: {output_tokens} | "
                    f"Cost: ${cost:.6f}"
                )
                
                return usage
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to track usage: {e}")
            return None

    @staticmethod
    async def track_usage_async(
        user_id: int,
        model_name: str,
        input_tokens: int,
        output_tokens: int,
        request_type: str = 'unknown'
    ):
        """Async wrapper for tracking usage (blocking I/O in thread pool if needed, but simple wrap for now)."""
        # For now, just call the synchronous method. 
        # In a high-load async app, this should ideally run in a run_in_executor block or be truly async with asyncpg.
        # But given SessionLocal is blocking, we keep it simple or use run_in_executor.
        import asyncio
        from functools import partial
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, 
            partial(
                UsageService.track_usage, 
                user_id, 
                model_name, 
                input_tokens, 
                output_tokens, 
                request_type
            )
        )
