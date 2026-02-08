from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.telegram_service import telegram_service

router = APIRouter()

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

@router.post("/send")
async def send_contact_message(form: ContactForm):
    """
    Send a contact message to the Telegram bot.
    """
    try:
        phone_line = f"<b>Phone:</b> {form.phone}\n" if form.phone else ""
        text = (
            f"<b>New Contact Message</b>\n"
            f"<b>Name:</b> {form.name}\n"
            f"<b>Email:</b> {form.email}\n"
            f"{phone_line}"
            f"<b>Message:</b>\n{form.message}"
        )
        await telegram_service.send_message(text)
        return {"status": "success", "message": "Message sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
