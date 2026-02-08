from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.telegram_service import telegram_service

router = APIRouter()

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/send")
async def send_contact_message(form: ContactForm):
    """
    Send a contact message to the Telegram bot.
    """
    try:
        text = (
            f"<b>New Contact Message</b>\n"
            f"<b>Name:</b> {form.name}\n"
            f"<b>Email:</b> {form.email}\n"
            f"<b>Message:</b>\n{form.message}"
        )
        await telegram_service.send_message(text)
        return {"status": "success", "message": "Message sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
