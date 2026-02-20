import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, Any

import anthropic

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

TEST_DIR = Path(__file__).resolve().parent
GOLDSET_PATH = TEST_DIR / "goldset.json"
ANSWERS_PATH = TEST_DIR / "answers.json"
CHUNKS_DIR = TEST_DIR / "chunks"
RESULTS_PATH = TEST_DIR / "evaluation_results.json"

JUDGE_MODEL = "claude-haiku-4-5-20251001" # fast and reliable for evaluation tasks

EVALUATION_PROMPT = """You are an expert legal AI evaluator. Your task is to evaluate the quality of a generated answer against a reference legal document chunk.

Here is the reference text (the Ground Truth core concept):
<reference>
{reference_text}
</reference>

Here is the user's question:
<question>
{question}
</question>

Here is the generated answer to evaluate:
<answer>
{answer}
</answer>

Please evaluate the generated answer based on the following three criteria:
1. Retrieval Recall (0-10): Did the generated answer include the essential facts and information necessary to answer the question, as found in the reference text? (10 = fully covered, 0 = completely missed)
2. Factual Accuracy / Non-Contradiction (0-10): Does the generated answer accurately reflect the core legal principles of the reference text? IMPORTANT: The AI had access to a full legal database. It is NOT a hallucination if the answer contains extra legal details, lists, or articles not explicitly in the short reference text, as long as that extra information is legally plausible and DOES NOT CONTRADICT the reference text. Only penalize if the answer contradicts the reference or gives objectively false legal advice. (10 = perfectly accurate and consistent, 0 = directly contradicts reference or is completely false). Ignore language differences (e.g. Russian vs Uzbek).
3. Generation Quality (0-10): Is the answer well-formatted, professional, clear, and easy to understand? Does it directly answer the specific question asked? (10 = excellent formatting and tone, 0 = poor formatting, unprofessional, or incoherent). Ignore language mismatches.

Output your evaluation strictly in the following JSON format:
{{
  "recall_score": 8,
  "precision_score": 9,
  "quality_score": 9,
  "reasoning": "Brief explanation (2-4 sentences max) justifying the scores. Do not penalize for extra information unless it contradicts the reference."
}}
"""

async def evaluate_single_answer(client: anthropic.AsyncAnthropic, q_id: str, question: str, answer: str, reference_text: str) -> Dict[str, Any]:
    prompt = EVALUATION_PROMPT.format(
        reference_text=reference_text,
        question=question,
        answer=answer
    )
    
    try:
        response = await client.messages.create(
            model=JUDGE_MODEL,
            max_tokens=500,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        raw_text = "".join(block.text for block in response.content if block.type == "text")
                
        # Parse JSON
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            json_str = raw_text[start_idx:end_idx+1]
            try:
                eval_data = json.loads(json_str)
                return {
                    "id": q_id,
                    "question": question,
                    "recall_score": eval_data.get("recall_score", 0),
                    "precision_score": eval_data.get("precision_score", 0),
                    "quality_score": eval_data.get("quality_score", 0),
                    "reasoning": eval_data.get("reasoning", "")
                }
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON for {q_id}. Raw: {raw_text}")
        
        return {
            "id": q_id,
            "error": "Failed to extract valid JSON",
            "raw_response": raw_text
        }
    except Exception as e:
        logger.error(f"Error evaluating {q_id}: {e}")
        return {"id": q_id, "error": str(e)}

def get_reference_chunk(q_id: str) -> str:
    # IDs format: baseid_index, e.g., -4674902_0
    parts = q_id.rsplit('_', 1)
    if len(parts) != 2:
        return ""
    
    base_id = parts[0]
    chunk_file = CHUNKS_DIR / f"{base_id}.json"
    
    if not chunk_file.exists():
        return ""
        
    try:
        with open(chunk_file, 'r', encoding='utf-8') as f:
            chunks = json.load(f)
            for chunk in chunks:
                if chunk.get("id") == q_id:
                    return chunk.get("text", "")
    except Exception as e:
        logger.error(f"Error reading chunk file {chunk_file}: {e}")
        
    return ""

async def main():
    settings = get_settings()
    api_key = settings.anthropic_api_key
    
    if not api_key:
        logger.error("ANTHROPIC_API_KEY is not configured in settings.")
        return

    if not ANSWERS_PATH.exists():
        logger.error(f"Answers file not found: {ANSWERS_PATH}")
        return
        
    with open(ANSWERS_PATH, 'r', encoding='utf-8') as f:
        answers_data = json.load(f)
        
    logger.info(f"Loaded {len(answers_data)} answers for evaluation.")
    
    client = anthropic.AsyncAnthropic(api_key=api_key)
    
    existing_evals = {}
    if RESULTS_PATH.exists():
        try:
            with open(RESULTS_PATH, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                if isinstance(existing_data, dict) and "evaluations" in existing_data:
                    for ev in existing_data["evaluations"]:
                        if "error" not in ev:
                            existing_evals[ev["id"]] = ev
            logger.info(f"Resuming evaluating. {len(existing_evals)} already evaluated.")
        except Exception:
            logger.info("Starting fresh evaluation.")
    
    semaphore = asyncio.Semaphore(10) # process up to 10 concurrently
    
    async def process_item(item):
        q_id = item.get("id")
        
        if q_id in existing_evals:
            return existing_evals[q_id]
            
        question = item.get("question", "")
        answer = item.get("answer", "")
        
        if answer.startswith("ERROR:"):
            return {
                "id": q_id,
                "question": question,
                "error": answer,
                "recall_score": 0,
                "precision_score": 0,
                "quality_score": 0,
                "reasoning": "Generation failed."
            }
            
        reference_text = get_reference_chunk(q_id)
        if not reference_text:
            return {
                "id": q_id,
                "question": question,
                "error": f"Reference chunk not found for {q_id}",
                "recall_score": 0,
                "precision_score": 0,
                "quality_score": 0,
                "reasoning": "Could not find reference text."
            }
            
        async with semaphore:
            return await evaluate_single_answer(client, q_id, question, answer, reference_text)
    
    tasks = [process_item(item) for item in answers_data]
    
    # Process with progress tracking
    evaluations = []
    total = len(tasks)
    for i, task in enumerate(asyncio.as_completed(tasks)):
        result = await task
        evaluations.append(result)
        if (i + 1) % 20 == 0 or i + 1 == total:
            logger.info(f"Evaluated {i + 1}/{total} answers")
            
            # Save intermediate results safely
            with open(RESULTS_PATH, 'w', encoding='utf-8') as f:
                json.dump({"evaluations": evaluations}, f, ensure_ascii=False, indent=2)
    
    # Calculate metrics
    valid_evals = [e for e in evaluations if "error" not in e and "recall_score" in e]
    
    if not valid_evals:
        logger.warning("No valid evaluations to calculate metrics.")
        avg_recall = avg_precision = avg_quality = 0
    else:
        avg_recall = sum(e["recall_score"] for e in valid_evals) / len(valid_evals)
        avg_precision = sum(e["precision_score"] for e in valid_evals) / len(valid_evals)
        avg_quality = sum(e["quality_score"] for e in valid_evals) / len(valid_evals)
        
    final_output = {
        "metrics": {
            "total_questions": len(answers_data),
            "evaluated_questions": len(valid_evals),
            "average_recall": round(avg_recall, 2),
            "average_precision": round(avg_precision, 2),
            "average_quality": round(avg_quality, 2)
        },
        "evaluations": evaluations
    }
    
    with open(RESULTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
        
    logger.info("Evaluation complete.")
    logger.info(f"Metrics (out of 10): Recall={avg_recall:.2f}, Precision={avg_precision:.2f}, Quality={avg_quality:.2f}")
    logger.info(f"Results saved to {RESULTS_PATH}")

if __name__ == "__main__":
    asyncio.run(main())
