"""
Security Module
Rate limiting, security headers, and input sanitization utilities.
"""

import re
import bleach
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Rate Limiter (slowapi)
# ---------------------------------------------------------------------------
def _limiter_exempt_options(request: Request) -> bool:
    """Do not rate-limit CORS preflight OPTIONS requests."""
    return request.method == "OPTIONS"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["30/minute"],
    enabled=settings.rate_limit_enabled,
    exempt_when=_limiter_exempt_options,
)

# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        # Prevent caching of API responses that may contain sensitive data
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
            response.headers["Pragma"] = "no-cache"

        return response


# ---------------------------------------------------------------------------
# Input Sanitization
# ---------------------------------------------------------------------------
def sanitize_html(text: str) -> str:
    """Strip all HTML tags from user input."""
    return bleach.clean(text, tags=[], strip=True)


def validate_password_strength(password: str) -> str | None:
    """
    Validate password meets minimum security requirements.
    Returns error message or None if valid.
    """
    min_length = settings.min_password_length
    if len(password) < min_length:
        return f"Пароль должен содержать минимум {min_length} символов"
    if not re.search(r"[A-Za-z]", password):
        return "Пароль должен содержать хотя бы одну букву"
    if not re.search(r"\d", password):
        return "Пароль должен содержать хотя бы одну цифру"
    return None
