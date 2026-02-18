# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered legal assistant for Uzbekistan law. Features: AI lawyer chat (RAG-powered), contract validator, contract generator, document validator, project/task management, and calendar. Deployed at lawyerai.uz.

## Architecture

**Backend** (FastAPI + Python 3.11) → **PostgreSQL 15** + **ChromaDB** (vectors) → **Frontend** (React 19 + TypeScript + Vite)

### Core AI Pipeline

The central file is `backend/app/services/ai_service.py` (~6700 lines). It's a unified `AIService` class with three modes:
- **Lawyer mode**: Agentic RAG with Claude tool-use loop — the AI iteratively searches the legal knowledge base
- **Validator mode**: Contract analysis via Gemini Flash — type detection → targeted RAG queries → multi-step audit → risk scoring
- **Generator mode**: Contract generation from `.docx` templates in `/contracts/` with optional ultra mode (generate → validate → regenerate)

### RAG System (`backend/app/core/vector_store.py`)

Hybrid search combining ChromaDB semantic search (60% weight) + custom BM25 keyword search (40% weight). Embeddings via Voyage AI (`voyage-4-large`) or OpenAI. Legal documents from `/codes/` (Uzbek law `.docx` files) are chunked (12k chars, 500 overlap) and embedded via `backend/embed.py`. A Russian→Uzbek legal term dictionary (~2000 terms) translates queries before search.

### Streaming

All AI responses use SSE (Server-Sent Events) via FastAPI `StreamingResponse`. Frontend consumes via `EventSource`. Events: `{"status": ...}` for progress, `{"chunk": ...}` for content, `{"done": true, ...}` for completion.

### Auth

JWT tokens (PyJWT + bcrypt). Tokens stored in localStorage. `get_current_user` dependency in routers returns `User | None` (optional auth).

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # dev server
python embed.py                    # rebuild vector embeddings
python sync_laws_db.py             # sync legal docs to PostgreSQL
python scripts/test_rag_search.py  # test RAG search quality
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # dev server (Vite)
npm run build    # production build
npm run lint     # ESLint
```

### Docker (Production)
```bash
docker compose build backend frontend
docker compose up -d
docker compose ps
docker compose logs -f backend  # tail logs
```

## Environment Variables

Required in `.env` (see `.env.example`):
- `POSTGRES_PASSWORD`, `JWT_SECRET_KEY` — database and auth
- `GOOGLE_API_KEY` — Gemini Flash (primary AI model)
- `OPENAI_API_KEY` or `VOYAGE_API_KEY` — embeddings
- `CHROMA_DB_PATH`, `CODES_PATH`, `CONTRACTS_PATH` — data paths
- `GEMINI_FLASH_MODEL` — default `gemini-3-flash-preview`

## Key Patterns

- **Database migrations**: No Alembic in active use. Manual migrations in `backend/app/database.py` via `check_and_migrate_db()`. New columns need manual SQL ALTER TABLE or model `to_dict()` fallback logic.
- **Contract templates**: `.docx` files in `/contracts/{category}/`. `ContractService` loads them. Categories: rent, loan, sale, services, employment, etc.
- **Legal codes**: `.docx` files in `/codes/`. Parsed by `uzbek_law_processor.py` with article/section awareness.
- **Pydantic schemas**: All in `backend/app/schemas/`. Request/response validation with `model_validate()`.
- **All AI prompts**: Inline in `ai_service.py` as class-level constants (VALIDATOR_PROMPT, CONTRACT_AUDIT_PROMPT, GENERATOR_PROMPT, etc.). They are in Russian.
- **`ai_service.py` is very large**: Use offset/limit when reading. Key sections: prompts (top ~1500 lines), RAG methods (middle), analyze/generate methods (bottom half).

## API Routes

All prefixed with `/api/`:
- `/api/auth/` — login, register, profile
- `/api/lawyer/` — AI chat (SSE streaming)
- `/api/validator/` — contract validation
- `/api/generator/` — contract generation (SSE streaming)
- `/api/doc-validator/` — document validation
- `/api/history/` — unified chat/analysis history
- `/api/tasks/`, `/api/calendar/`, `/api/organizations/` — project management

## Docker Services

`db` (PostgreSQL 15) → `backend` (FastAPI, port 8000) → `frontend` (React via nginx) → `nginx` (reverse proxy, ports 80/443) → `certbot` (SSL renewal)

Persistent volumes: `postgres_data`, `chroma_data`.
