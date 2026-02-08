import httpx
from app.config import get_settings


class TelegramService:
    """Service for sending messages to Telegram bot."""
    
    @property
    def settings(self):
        """Lazy load settings to ensure env vars are available."""
        return get_settings()
    
    @property
    def bot_token(self):
        return self.settings.telegram_bot_token
    
    @property
    def chat_id(self):
        return self.settings.telegram_chat_id
    
    @property
    def api_url(self):
        return f"https://api.telegram.org/bot{self.bot_token}/sendMessage"

    async def send_message(self, text: str):
        if not self.bot_token or not self.chat_id:
            print(f"Telegram credentials not configured: token={bool(self.bot_token)}, chat_id={bool(self.chat_id)}")
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.api_url,
                    json={
                        "chat_id": self.chat_id,
                        "text": text,
                        "parse_mode": "HTML"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
                print(f"Telegram message sent successfully: {result}")
                return result
            except Exception as e:
                print(f"Failed to send Telegram message: {e}")
                raise  # Re-raise to let the caller handle it


telegram_service = TelegramService()
