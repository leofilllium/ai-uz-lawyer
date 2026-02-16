import asyncio
import logging
import sys
import os
from pprint import pprint

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.vector_store import get_vector_store
from app.services.ai_service import fast_translate_to_uzbek, extract_search_keywords

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_search():
    print("\n" + "="*60)
    print("🔍 RAG SEARCH QUALITY VERIFICATION")
    print("="*60 + "\n")

    vs = get_vector_store()
    
    # Wait for BM25 index if needed (it might be building in background or lazy)
    print(f"📚 Document count: {vs.get_document_count()}")
    
    test_queries = [
        {
            "query": "расторжение трудового договора",
            "expected_terms": ["mehnat taraflarning kelishuvi", "bekor qilish", "97-modda"],
            "type": "Labor Law"
        },
        {
            "query": "налог на добавленную стоимость",
            "expected_terms": ["qo'shilgan qiymat solig'i", "QQS", "237-modda"],
            "type": "Tax Law"
        },
        {
            "query": "уставный капитал ООО",
            "expected_terms": ["ustav fondi", "jamiyat", "MChJ"],
            "type": "Corporate Law"
        }
    ]

    for test in test_queries:
        query = test["query"]
        print(f"\n⚡️ Testing Query: '{query}' ({test['type']})")
        
        # 1. Test Translation
        translated = fast_translate_to_uzbek(query)
        keywords = extract_search_keywords(query)
        print(f"   Running translation check:")
        print(f"   → Dictionary translation: '{translated}'")
        print(f"   → Extracted keywords: {keywords}")
        
        # 2. Test Hybrid Search
        print(f"   Running hybrid search (top_k=5)...")
        results = await vs.ahybrid_search(
            translated, 
            top_k=5,
            semantic_weight=0.6, 
            keyword_weight=0.4
        )
        
        print(f"   Found {len(results)} results.")
        
        # 3. Validation
        found_terms = []
        for i, res in enumerate(results):
            content = res.get("content", "").lower()
            metadata = res.get("metadata", {})
            source = metadata.get("source", "unknown")
            article = metadata.get("article_display", "?")
            score = res.get("similarity", 0)
            
            # Check for expected terms
            matches = [term for term in test["expected_terms"] if term.lower() in content]
            found_terms.extend(matches)
            
            match_icon = "✅" if matches else "❌"
            print(f"   {i+1}. {match_icon} [{score:.1%}] {source} (Art. {article})")
            if i == 0:
                print(f"      Preview: {content[:150]}...")

        if found_terms:
            print(f"   ✅ SUCCESS: Found expected terms: {set(found_terms)}")
        else:
            print(f"   ⚠️ WARNING: Did not find specific expected terms in top 5.")

    print("\n" + "="*60)
    print("🔍 CONTEXT EXTRACTION CHECK")
    print("="*60)
    
    sample_context = """
    Задача: Составить приказ о расторжении трудового договора.
    Основание: соглашение сторон.
    Ст. 97 Трудового кодекса.
    """
    print(f"Sample Context:\n{sample_context.strip()}")
    
    ctx_keywords = extract_search_keywords(sample_context)
    print(f"Extracted Context Keywords: {ctx_keywords}")
    
    expected_ctx_terms = ["mehnat shartnomasi", "bekor qilish", "Mehnat kodeksi"]
    
    found_any = any(term in ctx_keywords for term in expected_ctx_terms)
    if found_any:
         print(f"   ✅ SUCCESS: Found relevant context keywords")
    else:
         print(f"   ⚠️ WARNING: Context extraction might be weak")

    print("\n" + "="*60)
    print("✅ Verification Complete")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(test_search())
