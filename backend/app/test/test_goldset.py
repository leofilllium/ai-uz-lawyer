"""
Test script that reads goldset.json, answers each question using agentic RAG
from AIService, and saves results to answers.json.

Usage:
    cd backend
    python -m app.test.test_goldset
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.services.ai_service import AIService, CHAT_MODE_PROMPTS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

TEST_DIR = Path(__file__).resolve().parent
GOLDSET_PATH = TEST_DIR / "goldset.json"
ANSWERS_PATH = TEST_DIR / "answers.json"

CUSTOM_GOLDSET_PROMPT = """Siz professional O'zbekiston yuristisiz. Sizning vazifangiz foydalanuvchi savoliga faqatkina taqdim etilgan qonunchilik hujjatlariga asoslanib, aniq, faktik va o'rtacha uzunlikdagi javob berishdir.

DIQQAT QILISHINGIZ KERAK BO'LGAN QOIDALAR:
1. Har doim o'zbek tilida (kirill yoki lotin yozuvida, savol qanday tilda bo'lsa shunday) javob bering. Hech qachon rus tilida javob bermang.
2. Faqat va faqat O'zbekiston qonunchiligidan (taqdim etilgan matndan) olingan faktlarni ishlating.
3. Agar savolga javob matnda umuman bo'lmasa, uni o'ylab topmang (gallyutsinatsiya qilmang). "Ushbu ma'lumot taqdim etilgan qonunchilikda yo'q" deb javob bering.
4. Javobingiz o'rtacha uzunlikda bo'lishi kerak: judayam qisqa bo'lmasin (mazmunni yo'qotmang), lekin judayam uzun ham bo'lmasin (ortiqcha mavzudan tashqari ma'lumot qoshmang). 
5. Qulay o'qilishi uchun ro'yxatlardan foydalaning, kerakli barcha shartlarni va istisnolarni sanab o'ting.
6. Imkoni bo'lsa qonun yoki modda raqamiga havola (silka) bering.
"""

# Inject custom prompt
CHAT_MODE_PROMPTS["goldset-eval"] = CUSTOM_GOLDSET_PROMPT


async def answer_question(ai_service: AIService, question: str) -> str:
    """Run query_with_rag and collect the full streamed answer."""
    result = await ai_service.query_with_rag(
        question=question,
        history=None,
        chat_mode="goldset-eval", # Use the dynamically injected custom mode
    )

    # Consume the async generator to get full text
    response_gen = result["response"]
    full_text = ""
    async for chunk in response_gen:
        full_text += chunk

    return full_text


async def main():
    # Load goldset
    with open(GOLDSET_PATH, "r", encoding="utf-8") as f:
        goldset = json.load(f)

    logger.info(f"Loaded {len(goldset)} questions from goldset.json")

    # Load existing answers for resume support
    answered: dict[str, dict] = {}
    if ANSWERS_PATH.exists():
        with open(ANSWERS_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
        for entry in existing:
            if entry.get("answer") and not entry["answer"].startswith("ERROR:"):
                answered[entry["id"]] = entry
        logger.info(f"Resuming — {len(answered)}/{len(goldset)} already answered, skipping them")

    ai_service = AIService(mode="lawyer") # The `chat_mode` is passed later in `answer_question`

    for i, item in enumerate(goldset):
        qid = item["id"]

        # Skip already answered
        if qid in answered:
            continue

        question = item["question"]
        logger.info(f"[{i+1}/{len(goldset)}] Answering: {question[:80]}...")

        try:
            answer = await answer_question(ai_service, question)
            logger.info(f"[{i+1}/{len(goldset)}] Done — {len(answer)} chars")
        except Exception as e:
            logger.error(f"[{i+1}/{len(goldset)}] Error: {e}")
            answer = f"ERROR: {e}"

        answered[qid] = {**item, "answer": answer}

        # Save after each question — rebuild full list in goldset order
        answers = [answered.get(g["id"], g) for g in goldset if g["id"] in answered]
        with open(ANSWERS_PATH, "w", encoding="utf-8") as f:
            json.dump(answers, f, ensure_ascii=False, indent=2)

    logger.info(f"Done! Saved {len(answered)}/{len(goldset)} answers to {ANSWERS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
