import httpx
from app.config import get_settings

settings = get_settings()

class TelegramService:
    def __init__(self):
        self.bot_token = settings.telegram_bot_token
        self.chat_id = settings.telegram_chat_id
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"

    async def send_message(self, text: str):
        if not self.bot_token or not self.chat_id:
            print("Telegram credentials not configured")
            return

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
                return response.json()
            except Exception as e:
                print(f"Failed to send Telegram message: {e}")
                # We don't want to break the app if Telegram fails, so we just log it
                pass

telegram_service = TelegramService()
