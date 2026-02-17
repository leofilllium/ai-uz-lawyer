"""
Pricing Configuration
Defines costs for different AI models.
Prices are per 1M tokens (Million Tokens).
"""

from typing import Dict, Tuple

# Pricing in USD per 1M tokens
# Format: {model_name: (input_cost, output_cost)}
PRICING_RATES: Dict[str, Tuple[float, float]] = {
    # Gemini 1.5 Flash
    "gemini-1.5-flash": (0.075, 0.30),
    "gemini-1.5-flash-latest": (0.075, 0.30),
    "gemini-1.5-flash-001": (0.075, 0.30),
    "gemini-1.5-flash-002": (0.075, 0.30),
    
    # Gemini 1.5 Pro
    "gemini-1.5-pro": (3.50, 10.50),
    "gemini-1.5-pro-latest": (3.50, 10.50),
    "gemini-1.5-pro-001": (3.50, 10.50),
    "gemini-1.5-pro-002": (3.50, 10.50),
    
    # Text Embedding
    "text-embedding-004": (0.00, 0.00), # Usually free or very cheap, checking specific pricing 
}

# Fallback rates if model not found (conservative estimate based on Pro)
DEFAULT_RATE = (3.50, 10.50)

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
