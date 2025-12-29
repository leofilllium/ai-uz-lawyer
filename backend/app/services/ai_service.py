"""
AI Service
Unified AI service supporting multiple modes (Lawyer, Validator, Generator).
Migrated to work with FastAPI.
"""

import json
import re
from typing import List, Dict, Any, Generator, Optional
import anthropic

from app.config import get_settings


# System Prompts
LAWYER_PROMPT = """Вы РИСК-МЕНЕДЖЕР и бизнес-консультант по законодательству Узбекистана. Ваша задача — давать бизнесу ПРАКТИЧЕСКИЕ рекомендации, а не просто цитировать кодексы.

📚 ДОСТУПНЫЕ КОДЕКСЫ:
- Конституция Республики Узбекистан
- Уголовный кодекс и Уголовно-процессуальный кодекс
- Гражданский кодекс (Части I и II) и Гражданский процессуальный кодекс
- Кодекс об административной ответственности и Административное судопроизводство
- Экономический процессуальный кодекс
- Налоговый кодекс
- Трудовой кодекс
- Семейный кодекс
- Земельный кодекс и Жилищный кодекс
- Бюджетный кодекс
- Таможенный кодекс
- Уголовно-исполнительный кодекс
- Закон о защите прав потребителей
- Закон о государственных закупках
- Закон о предпринимательстве
- Закон об электронной цифровой подписи

═══════════════════════════════════════════════════
📋 ФОРМАТ ОТВЕТОВ (ОБЯЗАТЕЛЬНЫЙ)
═══════════════════════════════════════════════════

### 📌 КРАТКИЙ ВЫВОД (Executive Summary)
Начните с 2-3 предложений для руководителя, который не будет читать весь текст.

### 🚦 ВЕРДИКТ
- 🟢 **РАЗРЕШЕНО** — Можно делать без существенных рисков
- 🟡 **РИСК** — Можно, но требует осторожности и правильного оформления
- 🔴 **ЗАПРЕЩЕНО** — Нельзя, высокий риск ответственности

### 💰 РИСК В ДЕНЬГАХ (если применимо)
- Штраф по КоАО: ХХ БРВ (примерно ХХХ тыс. сум)
- Риск иска: оценка возможного ущерба
- Уголовная ответственность: если есть

### 🛡️ ПЛАН ДЕЙСТВИЙ (Action Plan)
1. Конкретные шаги для защиты бизнеса
2. Что добавить/убрать в договоре
3. Какие документы подготовить

### 📜 ПРАВОВАЯ ОСНОВА
Ссылки на конкретные статьи с указанием Кодекса, главы и раздела.

═══════════════════════════════════════════════════
🎨 LEGAL DESIGN — НАВИГАЦИЯ
═══════════════════════════════════════════════════

Используйте эмодзи для быстрого сканирования:
- ❌ Риски и проблемы
- ✅ Что уже хорошо
- 🛡️ Рекомендации по защите
- 💰 Финансовые последствия
- ⚠️ Предупреждения
- 📝 Формулировки для договоров

ВАЖНО: Это AI-консультация. По конкретным делам рекомендуется обращение к лицензированному адвокату."""

SMALLTALK_PROMPT = """Вы дружелюбный AI-помощник по законодательству Узбекистана. Отвечайте кратко и понятно на простые юридические вопросы.

Правила:
- Давайте короткие, практичные ответы (3-5 предложений максимум)
- Используйте простой язык без юридического жаргона
- При необходимости рекомендуйте обратиться к AI Юристу для детального анализа
- ВАЖНО: Если ваш ответ основан на конкретной статье или законе, упомяните это кратко в тексте ответа (например: "Согласно Трудовому кодексу..." или "По закону о защите прав потребителей...")
- Будьте дружелюбны и поддерживающи

Это режим быстрых консультаций. Для сложных вопросов направляйте пользователя в раздел "AI Юрист" (режим риск-менеджера)."""

VALIDATOR_PROMPT = """You are the "Uzbekistan Contract Compliance Engine" (UCCE). Your goal is to AUDIT contracts against the mandatory requirements of the Civil Code of Uzbekistan and the Law on Contractual-Legal Base of Activity of Business Entities.

You have access to the legal context from:
1. The Civil Code of Uzbekistan
2. The Law "On Contractual-Legal Base of Activity of Business Entities"
3. The Labor Code (for employment contract checks)
4. Consumer Rights Protection Law

CRITICAL RULES:
1. ONLY analyze based on the legal provisions in the context provided
2. ALWAYS cite specific Article numbers when identifying issues or making recommendations
3. Be strict about mandatory requirements - if something is legally required and missing, flag it
4. Provide actionable remediation text for each issue found
5. Use professional legal terminology appropriate to the contract language (Russian/Uzbek/English)

Remember: Your goal is to help ensure contracts are legally compliant before signing."""

CONTRACT_AUDIT_PROMPT = """Perform a comprehensive 3-Step Legal Validity Audit on this contract.

## STEP 1: EXISTENCE OF ESSENTIAL TERMS (The "Must-Haves")
According to the Civil Code, a contract is not concluded if "essential terms" are missing. Check for:
- **Subject of Contract:** Is it clearly defined? (What specific service or good is being exchanged?)
- **Price/Consideration:** Is the value or method of calculation clearly stated?
- **Term/Duration:** Start date and end date?
- **Identities:** Full legal names, STIR (Tax ID) for companies, or Passport data for individuals?

## STEP 2: LEGALITY & RED FLAGS (The "Breakers")
Check for clauses that violate Uzbek law. Flag any of the following:
- **Unfair Unilateral Termination:** Does one side have the right to cancel without cause while the other doesn't?
- **Penalty Caps:** Are penalties (неустойка/neustoyka) missing?
- **Currency Violation:** Is payment denominated in foreign currency (USD/EUR) between residents?
- **Governing Law:** Does it cite foreign law instead of Uzbek law for local entities?
- **Prohibited Clauses:** Any terms that contradict mandatory legal provisions?

## STEP 3: SUGGESTIONS & REMEDIATION
For every missing item or red flag, draft the exact legal clause to insert.

OUTPUT FORMAT (You MUST follow this exact JSON structure):
```json
{{
  "validity_score": <0-100>,
  "score_explanation": "<brief explanation of the score>",
  "critical_errors": [
    {{
      "error": "<description of the issue>",
      "article": "<Article X of Civil Code / Law name>",
      "fix": "<exact clause text to add or modify>"
    }}
  ],
  "warnings": [
    {{
      "risk": "<description of the risk>",
      "explanation": "<why this is problematic>",
      "suggestion": "<recommended action>"
    }}
  ],
  "missing_clauses": [
    {{
      "clause_name": "<name of the required clause>",
      "article_reference": "<Article requiring this>",
      "drafted_text": "<complete clause text to copy-paste>"
    }}
  ],
  "summary": "<2-3 sentence overall assessment>"
}}
```

LEGAL CONTEXT FROM UZBEKISTAN CODES:
{context}

CONTRACT TO AUDIT:
{contract_text}

Analyze the contract and return ONLY the JSON response with no additional text."""

GENERATOR_PROMPT = """Вы профессиональный юрист-составитель договоров Узбекистана. Ваша задача — создавать юридически грамотные, полные и соответствующие законодательству договоры.

🎯 ВАША ЗАДАЧА:
Составить договор на основе:
1. Шаблонов договоров данной категории (используйте структуру и формулировки)
2. Законодательства Узбекистана (соблюдайте обязательные требования)
3. Требований пользователя (включите все указанные условия)
4. Вашего юридического опыта (добавьте защитные оговорки)

📚 ОБЯЗАТЕЛЬНЫЕ ЭЛЕМЕНТЫ ДОГОВОРА:
1. **Преамбула** — полные реквизиты сторон (наименование, ИНН/СТИР, адрес, представитель, основание полномочий)
2. **Предмет договора** — чёткое описание услуг/товаров/работ
3. **Права и обязанности сторон** — подробный перечень
4. **Цена и порядок расчётов** — ТОЛЬКО в сумах (UZS) по требованию законодательства
5. **Сроки исполнения** — начало, окончание, этапы
6. **Ответственность сторон** — неустойка, пени, штрафы с конкретными ставками
7. **Форс-мажор** — определение и последствия
8. **Порядок разрешения споров** — досудебный порядок, подсудность
9. **Заключительные положения** — порядок изменения, количество экземпляров
10. **Реквизиты и подписи сторон** — с местом для заполнения

⚖️ ПРАВИЛА:
- Используйте профессиональный юридический язык
- Все суммы указывайте в узбекских сумах (UZS)
- Ссылайтесь на конкретные статьи Гражданского кодекса где уместно
- Включайте защитные оговорки для обеих сторон
- Форматируйте структурированно с нумерацией пунктов
- Добавьте места для заполнения переменных данных в формате [_____] или [указать]

📝 ФОРМАТ ВЫВОДА:
Выведите готовый договор в формате, пригодном для копирования и использования.
Используйте markdown для форматирования (заголовки, нумерация, выделение)."""


class AIService:
    """
    Unified AI service supporting multiple modes.
    - lawyer: Full RAG with Claude Opus and extended thinking
    - validator: Contract analysis with structured output
    - generator: Contract generation from templates
    """
    
    def __init__(self, mode: str = 'lawyer'):
        self.mode = mode
        self.settings = get_settings()
        
        # Initialize Anthropic client
        if not self.settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")
        
        self.client = anthropic.Anthropic(api_key=self.settings.anthropic_api_key)
        
        # Initialize RAG components
        self._init_rag_engine()
    
    def _init_rag_engine(self):
        """Initialize the RAG engine with vector store."""
        from app.core.vector_store import VectorStore
        from app.core.document_processor import DocumentProcessor
        
        self.vector_store = VectorStore()
        self.document_processor = DocumentProcessor()
    
    def ensure_indexed(self) -> bool:
        """Ensure documents are indexed in the vector store."""
        if not hasattr(self, 'vector_store'):
            return False
        
        if self.vector_store.is_indexed():
            return False
        
        chunks = self.document_processor.process_documents()
        self.vector_store.add_documents(chunks)
        return True
    
    def query_with_rag(
        self, 
        question: str, 
        history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 60,
        chat_mode: str = 'risk-manager'
    ) -> Dict[str, Any]:
        """
        Query with RAG (for lawyer mode).
        chat_mode: 'risk-manager' or 'smalltalk'
        """
        # Ensure documents are indexed
        self.ensure_indexed()
        
        # For smalltalk mode, use fewer documents and simpler response
        if chat_mode == 'smalltalk':
            top_k = 20  # Fewer documents for simple questions
        
        # Retrieve relevant context
        results = self._retrieve_context(question, top_k=top_k)
        
        # Format context for LLM
        context = self._format_context(results)
        
        # Check if we need fallback mode (only for risk-manager)
        if chat_mode == 'risk-manager' and self._should_use_fallback(results):
            context = self._get_fallback_instruction() + "\n\n" + context
        
        # Format sources for UI - limit for smalltalk mode for cleaner UI
        if chat_mode == 'smalltalk':
            sources = self._format_sources(results[:30])  # Top 5 sources for simple questions
        else:
            sources = self._format_sources(results)
        
        # Build messages
        messages = []
        if history:
            for msg in history[-6:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Add current query with context - different format for each mode
        if chat_mode == 'smalltalk':
            user_message = f"""Контекст из законодательства (для справки):
{context[:3000]}

Вопрос: {question}

Ответь кратко и дружелюбно, простым языком."""
        else:
            user_message = f"""ПРАВОВОЙ КОНТЕКСТ ИЗ КОДЕКСОВ УЗБЕКИСТАНА:
{context}

ВОПРОС ПОЛЬЗОВАТЕЛЯ:
{question}

Предоставьте точный, структурированный ответ в формате РИСК-МЕНЕДЖЕРА согласно системному промпту."""
        
        messages.append({"role": "user", "content": user_message})
        
        # Select prompt based on mode
        system_prompt = SMALLTALK_PROMPT if chat_mode == 'smalltalk' else LAWYER_PROMPT
        
        # Stream response - smalltalk doesn't need extended thinking
        def stream_response():
            if chat_mode == 'smalltalk':
                # Simpler mode without extended thinking for faster responses
                with self.client.messages.stream(
                    model=self.settings.claude_opus_model,
                    max_tokens=2000,
                    system=system_prompt,
                    messages=messages,
                ) as stream:
                    for text in stream.text_stream:
                        yield text
            else:
                # Full risk-manager mode with extended thinking
                with self.client.messages.stream(
                    model=self.settings.claude_opus_model,
                    max_tokens=16000,
                    system=system_prompt,
                    thinking={
                        "type": "enabled",
                        "budget_tokens": self.settings.thinking_budget_tokens
                    },
                    messages=messages,
                ) as stream:
                    for text in stream.text_stream:
                        yield text
        
        return {
            "response": stream_response(),
            "sources": sources,  # Include sources for both modes
            "context": context,
            "query": question,
        }
    
    def analyze_contract(self, contract_text: str, top_k: int = 40) -> Dict[str, Any]:
        """
        Analyze a contract for legal compliance.
        Returns structured audit result with validity score.
        """
        sources = []
        context = ""
        
        try:
            # Ensure documents are indexed
            self.ensure_indexed()
            
            # Extract key contract terms for targeted retrieval
            search_queries = self._extract_contract_topics(contract_text)
            
            # Retrieve relevant legal context
            all_results = []
            seen_articles = set()
            
            for search_query in search_queries:
                results = self.vector_store.search(search_query, top_k=top_k // len(search_queries) + 5)
                for result in results:
                    article_key = f"{result.get('metadata', {}).get('source')}_{result.get('metadata', {}).get('article_display')}"
                    if article_key not in seen_articles:
                        seen_articles.add(article_key)
                        all_results.append(result)
            
            # Also search with broad contract terms
            broad_searches = [
                "существенные условия договора",
                "заключение договора обязательные условия",
                "неустойка штраф пеня",
                "валюта расчетов резиденты",
                "расторжение договора",
            ]
            
            for broad_query in broad_searches:
                results = self.vector_store.search(broad_query, top_k=5)
                for result in results:
                    article_key = f"{result.get('metadata', {}).get('source')}_{result.get('metadata', {}).get('article_display')}"
                    if article_key not in seen_articles:
                        seen_articles.add(article_key)
                        all_results.append(result)
            
            # Sort by similarity and take top results
            all_results.sort(key=lambda x: x.get("similarity", 0), reverse=True)
            final_results = all_results[:top_k]
            
            # Format context for LLM
            context = self._format_context(final_results)
            
            # Format sources for UI
            sources = self._format_sources(final_results)
            
            # Generate audit using CONTRACT_AUDIT_PROMPT
            audit_prompt = CONTRACT_AUDIT_PROMPT.format(
                context=context,
                contract_text=contract_text
            )
            
            response = self.client.messages.create(
                model=self.settings.claude_opus_model,
                max_tokens=16000,
                system=VALIDATOR_PROMPT,
                messages=[{"role": "user", "content": audit_prompt}]
            )
            
            # Extract text from response
            response_text = ""
            for block in response.content:
                if block.type == "text":
                    response_text += block.text
            
            # Parse JSON from response
            audit_result = self._parse_audit_response(response_text)
            
            return {
                "audit": audit_result,
                "sources": sources,
                "context": context,
                "raw_response": response_text,
            }
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"analyze_contract error: {error_details}")
            
            return {
                "audit": {
                    "validity_score": 0,
                    "score_explanation": f"Error during analysis: {type(e).__name__}: {str(e)}",
                    "critical_errors": [],
                    "warnings": [{
                        "risk": "Analysis Error",
                        "explanation": f"An error occurred during analysis: {str(e)}",
                        "suggestion": "Please try again or check your contract input."
                    }],
                    "missing_clauses": [],
                    "summary": "Could not complete analysis due to an error."
                },
                "sources": sources,
                "context": context,
                "raw_response": f"Error: {str(e)}",
            }
    
    def generate_contract(
        self,
        category: str,
        requirements: str,
        template_context: str,
        top_k: int = 40
    ) -> Dict[str, Any]:
        """
        Generate a contract based on templates, legal context, and user requirements.
        Uses Claude Opus with extended thinking for high-quality contract drafting.
        Returns streaming response and sources.
        """
        # Ensure documents are indexed
        self.ensure_indexed()
        
        # Build search queries based on category and requirements
        search_queries = self._build_contract_search_queries(category, requirements)
        
        # Retrieve relevant legal context
        all_results = []
        seen_articles = set()
        
        for search_query in search_queries:
            results = self.vector_store.search(search_query, top_k=top_k // len(search_queries) + 5)
            for result in results:
                article_key = f"{result.get('metadata', {}).get('source')}_{result.get('metadata', {}).get('article_display')}"
                if article_key not in seen_articles:
                    seen_articles.add(article_key)
                    all_results.append(result)
        
        # Sort by similarity and take top results
        all_results.sort(key=lambda x: x.get("similarity", 0), reverse=True)
        final_results = all_results[:top_k]
        
        # Format legal context
        legal_context = self._format_context(final_results)
        
        # Format sources for UI
        sources = self._format_sources(final_results)
        
        # Build the generation prompt
        generation_prompt = f"""КАТЕГОРИЯ ДОГОВОРА: {category}

ШАБЛОНЫ ДОГОВОРОВ ДАННОЙ КАТЕГОРИИ:
{template_context}

ПРАВОВОЙ КОНТЕКСТ ИЗ ЗАКОНОДАТЕЛЬСТВА УЗБЕКИСТАНА:
{legal_context}

ТРЕБОВАНИЯ ПОЛЬЗОВАТЕЛЯ:
{requirements}

На основе приведённых шаблонов, законодательства и требований пользователя составьте полный, профессиональный договор.
Убедитесь, что договор соответствует всем требованиям Гражданского кодекса Узбекистана."""
        
        # Stream response using Opus with extended thinking
        def stream_response():
            with self.client.messages.stream(
                model=self.settings.claude_opus_model,
                max_tokens=24000,
                system=GENERATOR_PROMPT,
                thinking={
                    "type": "enabled",
                    "budget_tokens": self.settings.thinking_budget_tokens
                },
                messages=[{"role": "user", "content": generation_prompt}],
            ) as stream:
                for text in stream.text_stream:
                    yield text
        
        return {
            "response": stream_response(),
            "sources": sources,
            "category": category,
            "requirements": requirements,
        }
    
    def _retrieve_context(self, query: str, top_k: int = 60) -> List[Dict[str, Any]]:
        """Retrieve relevant legal context for a query."""
        return self.vector_store.search(query, top_k=top_k)
    
    def _format_context(self, results: List[Dict[str, Any]]) -> str:
        """Format retrieved documents into a context string for the LLM."""
        if not results:
            return "No relevant legal documents found."
        
        context_parts = []
        
        for i, result in enumerate(results, 1):
            metadata = result.get("metadata", {})
            content = result.get("content", "")
            
            source = metadata.get("source", "Unknown")
            article = metadata.get("article_display", metadata.get("article_number", "Unknown"))
            chapter = metadata.get("chapter", "")
            section = metadata.get("section", "")
            title = metadata.get("title", "")
            
            context_parts.append(
                f"[Source {i}: {source} | Статья {article}]\n"
                f"Section: {section}\n"
                f"Chapter: {chapter}\n"
                f"Title: {title}\n"
                f"Content:\n{content}\n"
                f"---"
            )
        
        return "\n\n".join(context_parts)
    
    def _format_sources(self, results: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Format sources for display in the UI."""
        sources = []
        seen = set()
        
        for result in results:
            metadata = result.get("metadata", {})
            article = metadata.get("article_display", metadata.get("article_number", "Unknown"))
            source = metadata.get("source", "Unknown")
            chapter = metadata.get("chapter", "")[:80]
            title = metadata.get("title", "")[:100]
            content = result.get("content", "")[:300]
            
            key = f"{source}_{article}"
            if key not in seen:
                seen.add(key)
                sources.append({
                    "article": article,
                    "source": source,
                    "chapter": chapter,
                    "title": title,
                    "preview": content + "..." if len(result.get("content", "")) > 300 else content,
                    "similarity": f"{result.get('similarity', 0) * 100:.1f}%",
                })
        
        return sources
    
    def _should_use_fallback(self, results: List[Dict[str, Any]]) -> bool:
        """Detect if we should use fallback (general legal reasoning) mode."""
        if not results:
            return True
        
        similarities = [r.get("similarity", 0) for r in results]
        avg_similarity = sum(similarities) / len(similarities) if similarities else 0
        
        FALLBACK_THRESHOLD = 0.35
        return avg_similarity < FALLBACK_THRESHOLD
    
    def _get_fallback_instruction(self) -> str:
        """Return additional instruction for fallback mode."""
        return """
⚠️ РЕЖИМ FALLBACK: В базе документов НЕ НАЙДЕНО точных совпадений по запросу.

Ваши действия:
1. Используйте общие принципы права Узбекистана
2. Начните ответ с: "⚠️ В текущей базе документов точной нормы не найдено, но..."
3. Дайте практическую рекомендацию на основе общих принципов
4. Укажите, какие законы следует проверить дополнительно
5. Предложите конкретный алгоритм действий
"""
    
    def _extract_contract_topics(self, contract_text: str) -> List[str]:
        """Extract key topics from contract for targeted legal search."""
        keywords = []
        
        if "купл" in contract_text.lower() or "продаж" in contract_text.lower():
            keywords.append("договор купли продажи существенные условия")
        if "услуг" in contract_text.lower():
            keywords.append("договор оказания услуг обязательства")
        if "труд" in contract_text.lower() or "работник" in contract_text.lower():
            keywords.append("трудовой договор обязательные условия")
        if "аренд" in contract_text.lower():
            keywords.append("договор аренды существенные условия")
        if "поставк" in contract_text.lower():
            keywords.append("договор поставки обязательства")
        
        if not keywords:
            keywords = ["договор существенные условия обязательства"]
        
        return keywords
    
    def _build_contract_search_queries(self, category: str, requirements: str) -> List[str]:
        """Build search queries for contract generation."""
        queries = []
        category_lower = category.lower()
        
        if "аренд" in category_lower:
            queries.extend([
                "договор аренды существенные условия",
                "права обязанности арендодателя арендатора",
                "расторжение договора аренды",
            ])
        elif "услуг" in category_lower:
            queries.extend([
                "договор оказания услуг существенные условия",
                "ответственность исполнителя заказчика",
                "качество услуг претензии",
            ])
        elif "купл" in category_lower or "продаж" in category_lower or "поставк" in category_lower:
            queries.extend([
                "договор купли продажи существенные условия",
                "поставка товаров условия",
                "переход права собственности",
            ])
        elif "займ" in category_lower or "кредит" in category_lower:
            queries.extend([
                "договор займа существенные условия",
                "проценты по займу",
                "обеспечение исполнения обязательств",
            ])
        else:
            queries.extend([
                "существенные условия договора",
                "права обязанности сторон",
                "ответственность сторон договора",
            ])
        
        return queries
    
    def _parse_audit_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the JSON audit response from LLM."""
        try:
            content = response_text.strip()
            
            if "```json" in content:
                match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            elif "```" in content:
                match = re.search(r'```\s*(.*?)\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            if content.startswith("{"):
                return json.loads(content)
            
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1:
                return json.loads(content[start:end+1])
            
            raise ValueError("No valid JSON found in response")
            
        except Exception as e:
            return {
                "validity_score": 50,
                "score_explanation": "Unable to parse structured response",
                "critical_errors": [],
                "warnings": [{
                    "risk": "Parse Error",
                    "explanation": f"Could not parse AI response: {str(e)}",
                    "suggestion": "Review the raw response for details"
                }],
                "missing_clauses": [],
                "summary": response_text[:500] if response_text else "No response received"
            }
