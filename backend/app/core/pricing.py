"""
Advanced Pricing Configuration
Supports:
- Tiered pricing
- Modality-based pricing
- Batch pricing
- Context caching
- Storage cost
- Tool pricing (Google Search)
"""

from typing import Dict, Optional
from dataclasses import dataclass


# ==============================
# Core Pricing Structures
# ==============================

@dataclass
class TieredRate:
    input_le_200k: float
    output_le_200k: float
    input_gt_200k: float
    output_gt_200k: float


@dataclass
class ModalityRate:
    input_text: float
    input_audio: Optional[float]
    output: float


@dataclass
class SimpleRate:
    input_rate: float
    output_rate: float


@dataclass
class ContextCachingRate:
    le_200k: float
    gt_200k: float
    storage_per_million_per_hour: float


@dataclass
class ToolPricing:
    google_search_per_1000: float


@dataclass
class ModelPricing:
    standard: Optional[object] = None
    batch: Optional[object] = None
    context_caching: Optional[ContextCachingRate] = None
    tools: Optional[ToolPricing] = None


# ==============================
# PRICING TABLE
# ==============================

PRICING_RATES: Dict[str, ModelPricing] = {

    # =========================================
    # Gemini 3 Pro Preview
    # =========================================
    "gemini-3-pro-preview": ModelPricing(
        standard=TieredRate(
            input_le_200k=2.00,
            output_le_200k=12.00,
            input_gt_200k=4.00,
            output_gt_200k=18.00,
        ),
        batch=TieredRate(
            input_le_200k=1.00,
            output_le_200k=6.00,
            input_gt_200k=2.00,
            output_gt_200k=9.00,
        ),
        context_caching=ContextCachingRate(
            le_200k=0.20,
            gt_200k=0.40,
            storage_per_million_per_hour=4.50
        ),
        tools=ToolPricing(
            google_search_per_1000=14.00
        )
    ),

    # =========================================
    # Gemini 3 Flash Preview
    # =========================================
    "gemini-3-flash-preview": ModelPricing(
        standard=ModalityRate(
            input_text=0.50,   # text / image / video
            input_audio=1.00,
            output=3.00
        ),
        context_caching=ContextCachingRate(
            le_200k=0.05,
            gt_200k=0.10,
            storage_per_million_per_hour=1.00
        ),
        tools=ToolPricing(
            google_search_per_1000=14.00
        )
    ),

    # =========================================
    # Claude 4.5 Haiku
    # =========================================
    "claude-haiku-4-5-20251001": ModelPricing(
        standard=SimpleRate(
            input_rate=1.00,
            output_rate=5.00
        ),
        batch=SimpleRate(
            input_rate=1.00,
            output_rate=2.50
        )
    ),
}

def calculate_cost(
    model_name: str,
    input_tokens: int,
    output_tokens: int,
    batch: bool = False,
    modality: str = "text"
) -> float:

    # Try exact match first, then partial match
    pricing = PRICING_RATES.get(model_name)
    if not pricing:
        for key in PRICING_RATES:
            if key in model_name or model_name in key:
                pricing = PRICING_RATES[key]
                break
    if not pricing:
        # Fallback: use Flash rates to avoid crashing
        pricing = PRICING_RATES.get("gemini-3-flash-preview", ModelPricing(standard=ModalityRate(0.50, 1.00, 3.00)))

    tier = pricing.batch if batch and pricing.batch else pricing.standard

    # Tiered pricing
    if isinstance(tier, TieredRate):
        if input_tokens <= 200_000:
            input_rate = tier.input_le_200k
            output_rate = tier.output_le_200k
        else:
            input_rate = tier.input_gt_200k
            output_rate = tier.output_gt_200k

    # Modality pricing
    elif isinstance(tier, ModalityRate):
        if modality == "audio":
            input_rate = tier.input_audio or tier.input_text
        else:
            input_rate = tier.input_text
        output_rate = tier.output

    # Simple pricing
    elif isinstance(tier, SimpleRate):
        input_rate = tier.input_rate
        output_rate = tier.output_rate

    else:
        raise ValueError("Unsupported pricing structure")

    input_cost = (input_tokens / 1_000_000) * input_rate
    output_cost = (output_tokens / 1_000_000) * output_rate

    return round(input_cost + output_cost, 6)
