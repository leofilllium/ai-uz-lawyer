import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger(__name__)
from typing import Optional
from app.services.telegram_service import telegram_service
from app.core.security import limiter, sanitize_html

router = APIRouter()

class ContactForm(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    message: str = Field(..., max_length=2000)

@router.post("/send")
@limiter.limit("3/minute")
async def send_contact_message(request: Request, form: ContactForm):
    """
    Send a contact message to the Telegram bot.
    """
    try:
        # Sanitize all user inputs to prevent injection
        safe_name = sanitize_html(form.name)
        safe_email = str(form.email)
        safe_phone = sanitize_html(form.phone) if form.phone else None
        safe_message = sanitize_html(form.message)

        phone_line = f"<b>Phone:</b> {safe_phone}\n" if safe_phone else ""
        text = (
            f"<b>New Contact Message</b>\n"
            f"<b>Name:</b> {safe_name}\n"
            f"<b>Email:</b> {safe_email}\n"
            f"{phone_line}"
            f"<b>Message:</b>\n{safe_message}"
        )
        await telegram_service.send_message(text)
        return {"status": "success", "message": "Message sent successfully"}
    except Exception as e:
        logger.exception("Contact form error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to send message")
