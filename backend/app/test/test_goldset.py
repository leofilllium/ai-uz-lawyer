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

from app.services.ai_service import AIService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

TEST_DIR = Path(__file__).resolve().parent
GOLDSET_PATH = TEST_DIR / "goldset.json"
ANSWERS_PATH = TEST_DIR / "answers.json"


async def answer_question(ai_service: AIService, question: str) -> str:
    """Run query_with_rag and collect the full streamed answer."""
    result = await ai_service.query_with_rag(
        question=question,
        history=None,
        chat_mode="quick-answer",
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

    ai_service = AIService(mode="lawyer")

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
