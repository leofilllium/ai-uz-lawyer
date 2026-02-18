"""
Pricing Configuration
Defines costs for different AI models.
Prices are per 1M tokens (Million Tokens).
"""

from typing import Dict, Tuple

# Pricing in USD per 1M tokens
# Format: {model_name: (input_cost, output_cost)}
PRICING_RATES: Dict[str, Tuple[float, float]] = {
    # Gemini 2.0 Flash
    "gemini-2.0-flash": (0.10, 0.40),

    # Gemini 2.5 Flash Preview
    "gemini-2.5-flash": (0.15, 0.60),
    "gemini-2.5-flash-preview": (0.15, 0.60),

    # Gemini 3 Flash Preview (thinking enabled: input $0.15, output $0.60 per 1M)
    "gemini-3-flash": (0.15, 0.60),
    "gemini-3-flash-preview": (0.15, 0.60),

    # Gemini 1.5 Flash (legacy)
    "gemini-1.5-flash": (0.075, 0.30),

    # Gemini 1.5 Pro (legacy)
    "gemini-1.5-pro": (3.50, 10.50),

    # Gemini 2.5 Pro
    "gemini-2.5-pro": (1.25, 10.00),
    "gemini-2.5-pro-preview": (1.25, 10.00),

    # Text Embedding
    "text-embedding-004": (0.00, 0.00),

    # Claude models (if used for lawyer mode)
    "claude-sonnet-4": (3.00, 15.00),
    "claude-haiku": (0.80, 4.00),
}

# Fallback rates if model not found (conservative estimate based on Gemini Flash)
DEFAULT_RATE = (0.15, 0.60)

def calculate_cost(model_name: str, input_tokens: int, output_tokens: int) -> float:
    """
    Calculate cost in USD for a given model and token usage.
    """
    # Normalize model name to find matching key
    model_key = next((k for k in PRICING_RATES if k in model_name), None)
    
    if model_key:
        input_rate, output_rate = PRICING_RATES[model_key]
    else:
        input_rate, output_rate = DEFAULT_RATE
        
    # Calculate cost (rates are per 1M tokens)
    input_cost = (input_tokens / 1_000_000) * input_rate
    output_cost = (output_tokens / 1_000_000) * output_rate
    
    total_cost = input_cost + output_cost
    return round(total_cost, 6) # Precision up to 6 decimal places for micro-costs
