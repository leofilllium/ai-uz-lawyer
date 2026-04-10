# AI UZ Lawyer

AI-powered legal assistant platform for the Uzbekistan legal ecosystem. Monorepo containing a FastAPI backend with RAG, a React web frontend, and a Flutter mobile application — all orchestrated via Docker Compose with Nginx reverse proxy and Let's Encrypt SSL.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Backend](#backend)
- [Frontend](#frontend)
- [Mobile](#mobile)
- [Infrastructure](#infrastructure)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Production Deployment](#production-deployment)

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │            Nginx Reverse Proxy           │
                    │  lawyerai.uz         api.lawyerai.uz     │
                    │  (port 80/443)       (port 80/443)       │
                    └──────────┬───────────────────┬──────────┘
                               │                   │
                    ┌──────────▼──────┐  ┌─────────▼──────────┐
                    │  React Frontend  │  │  FastAPI Backend    │
                    │  (Nginx:80)      │  │  (Uvicorn:8000)     │
                    └─────────────────┘  └──────┬─────┬────────┘
                                                │     │
                                    ┌───────────▼┐  ┌─▼──────────────┐
                                    │ PostgreSQL  │  │  ChromaDB       │
                                    │ (port 5432) │  │  (vector store) │
                                    └────────────┘  └────────────────┘

                    ┌─────────────────────────────────────────┐
                    │         Flutter Mobile (iOS/Android)     │
                    │         → api.lawyerai.uz                │
                    └─────────────────────────────────────────┘
```

---

## Repository Structure

```
ai-uz-lawyer/
├── backend/              # FastAPI + SQLAlchemy + ChromaDB
├── frontend/             # React 19 + TypeScript + Vite
├── mobile/               # Flutter 3.x (iOS & Android)
├── nginx/
│   └── nginx.conf        # Reverse proxy, SSL, rate limiting
├── certbot/              # Let's Encrypt certificates
│   ├── conf/
│   └── www/
├── codes/                # Uzbek law corpus (read-only volume)
├── contracts/            # Contract templates (read-only volume)
├── docker-compose.yml
├── Dockerfile            # Legacy root Dockerfile
├── deploy.sh             # Production deploy script
└── setup-ssl.sh          # Let's Encrypt initialization
```

---

## Backend

### Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | PostgreSQL 15 via SQLAlchemy 2.0 |
| Vector Store | ChromaDB |
| AI | Anthropic Claude (Haiku + Sonnet) |
| Embeddings | Voyage AI (`voyage-4-large`) |
| RAG | LangChain + BM25 hybrid search |
| Auth | JWT (PyJWT + bcrypt) |
| Rate Limiting | SlowAPI + Nginx |
| Document Processing | pypdfium2, pdfplumber, python-docx |

### Directory Structure

```
backend/
├── app/
│   ├── main.py                        # FastAPI app, lifespan (init DB + VectorStore)
│   ├── database.py                    # SQLAlchemy engine, session factory
│   ├── config.py                      # Pydantic Settings, env vars
│   │
│   ├── core/
│   │   ├── document_processor.py      # PDF/DOCX parsing
│   │   ├── flexible_processor.py      # Multi-format processing
│   │   ├── uzbek_law_processor.py     # Law-specific chunking
│   │   ├── vector_store.py            # ChromaDB singleton, hybrid search
│   │   ├── security.py                # JWT helpers, rate limits, sanitization
│   │   ├── sync_service.py            # Data sync utilities
│   │   └── pricing.py                 # Credit cost calculation
│   │
│   ├── models/                        # SQLAlchemy ORM models
│   │   ├── user.py                    # User, UserRole enum (HEAD/SENIOR/EMPLOYEE)
│   │   ├── organization.py            # Organization, credit limits
│   │   ├── task.py                    # Task (Kanban), status/priority/complexity
│   │   ├── comment.py                 # TaskComment
│   │   ├── attachment.py              # TaskAttachment (file uploads)
│   │   ├── chat.py                    # ChatSession, ChatMessage
│   │   ├── contract.py                # ContractAnalysis
│   │   ├── generated_contract.py      # GeneratedContract
│   │   ├── document.py                # DocumentAnalysis
│   │   ├── calendar_event.py          # CalendarEvent
│   │   ├── usage.py                   # ModelUsage tracking
│   │   ├── credit.py                  # Credit transactions
│   │   └── legal_document.py          # LegalDocument chunks for RAG
│   │
│   ├── schemas/                       # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── task.py
│   │   ├── comment.py
│   │   ├── attachment.py
│   │   ├── chat.py
│   │   ├── contract.py
│   │   ├── document.py
│   │   ├── calendar_event.py
│   │   └── organization.py
│   │
│   ├── routers/                       # API endpoints (13 routers)
│   │   ├── auth.py                    # /api/auth
│   │   ├── lawyer.py                  # /api/lawyer
│   │   ├── validator.py               # /api/validator
│   │   ├── generator.py               # /api/generator
│   │   ├── doc_validator.py           # /api/document-validator
│   │   ├── tasks.py                   # /api/tasks
│   │   ├── organization.py            # /api/organization
│   │   ├── history.py                 # /api/history
│   │   ├── calendar.py                # /api/calendar
│   │   ├── admin.py                   # /api/admin
│   │   ├── stats.py                   # /api/stats
│   │   ├── credits.py                 # /api/credits
│   │   └── contact.py                 # /api/contact
│   │
│   └── services/
│       ├── ai_service.py              # Claude AI, RAG queries, SSE streaming
│       ├── auth_service.py            # Token generation/validation
│       ├── credit_service.py          # Balance management
│       ├── contract_service.py        # Contract templates
│       ├── usage_service.py           # Usage tracking
│       └── telegram_service.py        # Telegram notifications
│
├── scripts/
│   ├── test_rag_search.py
│   ├── migrate_users.py
│   └── migrate_add_validation_data.py
├── embed.py                           # Generate embeddings from docs
├── sync_laws_db.py                    # Sync law corpus into ChromaDB
├── verify_embeddings.py
├── check_resources.py
├── requirements.txt
└── Dockerfile
```

### API Routes

```
ROUTE                                    METHOD   DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/api/auth/register                       POST     Register (5/min)
/api/auth/login                          POST     Login (5/min)
/api/auth/me                             GET      Current user

/api/organization/                       GET      List organizations
/api/organization/                       POST     Create organization
/api/organization/my/users               GET      Users in my org
/api/organization/users/{id}/approve     POST     Approve user (HEAD only)
/api/organization/users/{id}/role        PUT      Change role (HEAD only)

/api/tasks/                              GET      List tasks
/api/tasks/                              POST     Create task
/api/tasks/{id}                          GET      Task detail + comments
/api/tasks/{id}                          PUT      Update task
/api/tasks/{id}                          DELETE   Delete task
/api/tasks/{id}/comments                 GET      List comments
/api/tasks/{id}/comments                 POST     Add comment
/api/tasks/{id}/comments/{cid}           DELETE   Delete comment
/api/tasks/{id}/attachments              GET      List attachments
/api/tasks/{id}/attachments              POST     Upload file (multipart)
/api/tasks/{id}/attachments/{aid}        DELETE   Delete attachment
/api/tasks/{id}/attachments/{aid}/download GET    Download file

/api/lawyer/chat                         POST     AI chat (SSE stream)
/api/lawyer/sessions                     GET      Chat sessions
/api/lawyer/sessions/{id}                GET      Session messages
/api/lawyer/draft-result                 POST     Save draft result

/api/validator/analyze                   POST     Analyze contract (SSE stream)
/api/validator/history                   GET      Validation history
/api/validator/{id}                      GET      Single analysis
/api/validator/fix                       POST     Fix contract clause

/api/generator/categories                GET      Available categories
/api/generator/templates/{category}      GET      Templates for category
/api/generator/generate                  POST     Generate contract (SSE stream)
/api/generator/history                   GET      Generation history
/api/generator/{id}                      GET      Single generated contract

/api/document-validator/analyze          POST     Analyze document (SSE stream)
/api/document-validator/history          GET      Document analysis history
/api/document-validator/{id}             GET      Single document analysis

/api/history                             GET      Unified history (?type=chat|validation|generation)

/api/calendar/                           GET      List events (?year=&month=)
/api/calendar/                           POST     Create event
/api/calendar/{id}                       PUT      Update event
/api/calendar/{id}                       DELETE   Delete event

/api/admin/documents                     GET      List documents (paginated, admin auth)
/api/admin/upload                        POST     Upload law document (admin auth)
/api/admin/documents/{id}                DELETE   Delete document (admin auth)
/api/admin/usage/stats                   GET      Usage statistics (admin auth)

/api/stats/per-user                      GET      Per-user stats
/api/stats/org-wide                      GET      Organization-wide stats
/api/stats/daily-usage                   GET      Daily usage breakdown
/api/stats/feature-usage                 GET      Feature usage breakdown

/api/credits/balance                     GET      Credit balance
/api/credits/costs                       GET      Feature credit costs
/api/credits/transactions                GET      Transaction history

/api/contact/send                        POST     Contact form (3/min)
```

All AI endpoints (`/api/lawyer/chat`, `/api/validator/analyze`, `/api/generator/generate`, `/api/document-validator/analyze`) return **Server-Sent Events (SSE)** for real-time streaming.

### Database Schema

```
User                Organization          Task
────────────────     ─────────────────    ─────────────────────────
id                   id                   id
name                 name                 title
email                credits_granted      description
password_hash        daily_limit_total    status (todo/in_progress/done)
role (enum)          daily_limit_per_user priority (low/medium/high)
is_approved          created_at           complexity
organization_id                           deadline
created_at                                reporter_id → User
                                          assignee_id → User
                                          organization_id → Organization

ChatSession          ChatMessage          ContractAnalysis
────────────────     ─────────────────    ─────────────────────────
id                   id                   id
session_type         session_id → Session user_id → User
title                role (user/assistant) contract_text
user_id → User       content              validity_score
created_at           sources (JSON)       critical_errors (JSON)
                     thinking             warnings (JSON)
                     created_at           missing_clauses (JSON)
                                          sources (JSON)
                                          created_at

LegalDocument        CalendarEvent        Credit
────────────────     ─────────────────    ─────────────────────────
id                   id                   id
source_name          title                organization_id → Org
chunk_index          description          user_id → User
content              event_datetime       action_type
embedding (vector)   organization_id      credits_deducted
metadata (JSON)      created_by → User    reason
                     created_at           created_at
```

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
cp .env.example .env

# Run database migrations (tables auto-created on startup)
# Or manually:
python -c "from app.database import engine; from app.models import *; Base.metadata.create_all(engine)"

# Embed law corpus into ChromaDB (first time only)
python embed.py

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Frontend

### Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Routing | React Router 7 |
| UI | Custom CSS (no component library) |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |
| Drag & Drop | @dnd-kit/core |
| Export | jsPDF, docx, html2canvas |

### Directory Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router config
│   ├── index.css
│   ├── App.css
│   │
│   ├── api/
│   │   ├── client.ts               # Axios/fetch wrapper, JWT injection
│   │   └── stats.ts                # Stats API calls
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         # User state, login/logout
│   │   └── ThemeContext.tsx        # Dark/light theme toggle
│   │
│   ├── components/                 # Shared reusable components
│   │
│   └── pages/
│       ├── Login.tsx
│       ├── Register.tsx
│       ├── PendingApproval.tsx     # Shown after register, before HEAD approval
│       ├── Dashboard.tsx
│       ├── Lawyer.tsx              # AI legal chat + SSE streaming
│       ├── Validator.tsx           # Contract validator
│       ├── Generator.tsx           # Contract generator
│       ├── DocumentValidator.tsx   # Non-contract document analysis
│       ├── ProjectBoard.tsx        # Kanban board with drag-and-drop
│       ├── TaskForm.tsx            # Create/edit task
│       ├── TaskDetail.tsx          # Task + comments + attachments
│       ├── Calendar.tsx            # Legal events calendar
│       ├── History.tsx             # Unified activity history
│       ├── TeamManagement.tsx      # Approve users, change roles (HEAD)
│       ├── Credits.tsx             # Credit balance and usage
│       ├── Admin.tsx               # Upload/manage law documents
│       └── About.tsx
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── nginx.conf                      # Nginx config for frontend container
├── Dockerfile
└── index.html
```

### Key Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.11.0",
  "lucide-react": "^0.563.0",
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "jspdf": "^4.0.0",
  "docx": "^9.5.1",
  "file-saver": "^2.0.5",
  "html2canvas": "^1.4.1"
}
```

### Auth Storage

Tokens and user info are stored in `localStorage`:

```
ai_lawyer_token   → JWT bearer token
ai_lawyer_user    → JSON-serialized user object
```

### Frontend Setup

```bash
cd frontend

npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev       # Development server on http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

---

## Mobile

### Stack

| Layer | Technology |
|---|---|
| Framework | Flutter 3.x (Dart SDK ≥ 3.2) |
| State | flutter_bloc ^8.1 + equatable |
| DI | get_it ^7.6 + injectable |
| Navigation | go_router ^17 |
| Networking | dio ^5.3 |
| Storage (plain) | shared_preferences |
| Storage (secure) | flutter_secure_storage (JWT) |
| UI | Material 3 + google_fonts (Inter) |
| Markdown | flutter_markdown |
| Localizations | Flutter ARB + intl (Russian + English) |
| Functional | dartz (Either/Option) |

### Directory Structure

```
mobile/
├── lib/
│   ├── main.dart                      # Entry point, MaterialApp.router
│   │
│   ├── l10n/                          # Localization
│   │   ├── app_localizations.dart
│   │   ├── app_localizations_ru.dart  # Russian strings
│   │   └── app_localizations_en.dart  # English strings
│   │
│   ├── config/
│   │   ├── routes/
│   │   │   └── app_router.dart        # GoRouter route definitions
│   │   └── theme/
│   │       ├── app_colors.dart        # Brand palette (light + dark)
│   │       ├── app_text_styles.dart   # Inter font, sizes, weights
│   │       ├── app_theme.dart         # ThemeData (light + dark)
│   │       ├── design_system.dart     # Spacing, radius, layout constants
│   │       └── custom_theme_extension.dart
│   │
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart     # Base URL + all endpoint paths
│   │   │   ├── app_constants.dart
│   │   │   └── error_constants.dart
│   │   ├── di/
│   │   │   └── injection_container.dart  # GetIt root registration
│   │   ├── error/
│   │   │   ├── exceptions.dart        # ServerException, CacheException, etc.
│   │   │   └── failures.dart          # ServerFailure, NetworkFailure, etc.
│   │   ├── l10n/
│   │   │   └── l10n.dart              # BuildContext.l10n extension
│   │   ├── network/
│   │   │   ├── api_client.dart        # Dio + JWT interceptor
│   │   │   ├── api_handler.dart       # Response/error handling
│   │   │   ├── logging_interceptor.dart
│   │   │   ├── network_info.dart      # Connectivity check
│   │   │   └── storage_service.dart   # SharedPrefs + SecureStorage abstraction
│   │   ├── usecases/
│   │   │   └── usecase.dart           # Abstract UseCase<Type, Params>
│   │   └── utils/
│   │       └── bloc_observer.dart
│   │
│   └── features/
│       ├── auth/
│       │   ├── data/
│       │   │   ├── datasources/auth_remote_data_source.dart
│       │   │   ├── models/user_model.dart
│       │   │   └── repositories/auth_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/user.dart
│       │   │   ├── repositories/auth_repository.dart
│       │   │   └── usecases/
│       │   │       ├── login.dart
│       │   │       └── register.dart
│       │   ├── presentation/
│       │   │   ├── bloc/
│       │   │   │   ├── auth_bloc.dart
│       │   │   │   ├── auth_event.dart
│       │   │   │   └── auth_state.dart
│       │   │   └── pages/
│       │   │       ├── login_page.dart
│       │   │       └── register_page.dart
│       │   └── di/auth_module.dart
│       │
│       ├── chat/
│       │   ├── data/
│       │   │   ├── datasources/chat_remote_data_source.dart
│       │   │   ├── models/
│       │   │   │   ├── chat_message_model.dart
│       │   │   │   └── chat_session_model.dart
│       │   │   └── repositories/chat_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   ├── chat_message.dart
│       │   │   │   ├── chat_modes.dart     # 20+ consultation modes
│       │   │   │   └── chat_session.dart
│       │   │   ├── repositories/chat_repository.dart
│       │   │   └── usecases/
│       │   │       ├── get_chat_messages.dart
│       │   │       ├── get_chat_sessions.dart
│       │   │       └── send_message.dart
│       │   ├── presentation/
│       │   │   ├── bloc/
│       │   │   │   ├── chat_bloc.dart
│       │   │   │   ├── chat_event.dart
│       │   │   │   └── chat_state.dart
│       │   │   ├── pages/chat_page.dart
│       │   │   └── widgets/
│       │   │       ├── chat_input.dart
│       │   │       ├── chat_mode_selection_view.dart
│       │   │       └── message_bubble.dart
│       │   └── di/chat_module.dart
│       │
│       ├── validator/
│       │   ├── data/
│       │   │   ├── datasources/validator_remote_data_source.dart
│       │   │   ├── models/contract_analysis_model.dart
│       │   │   └── repositories/validator_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/contract_analysis.dart
│       │   │   ├── repositories/validator_repository.dart
│       │   │   └── usecases/
│       │   │       ├── analyze_contract.dart
│       │   │       └── get_validation_history.dart
│       │   ├── presentation/
│       │   │   ├── bloc/
│       │   │   │   ├── validator_bloc.dart
│       │   │   │   ├── validator_event.dart
│       │   │   │   └── validator_state.dart
│       │   │   ├── pages/
│       │   │   │   ├── validator_page.dart
│       │   │   │   └── document_validator_page.dart
│       │   │   └── widgets/analysis_result_view.dart
│       │   └── di/validator_module.dart
│       │
│       ├── tasks/
│       │   ├── data/
│       │   │   ├── datasources/tasks_remote_data_source.dart
│       │   │   ├── models/
│       │   │   │   ├── task_model.dart
│       │   │   │   ├── task_detail_model.dart
│       │   │   │   ├── task_comment_model.dart
│       │   │   │   └── task_attachment_model.dart
│       │   │   └── repositories/tasks_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   ├── task.dart
│       │   │   │   ├── task_detail.dart
│       │   │   │   ├── task_comment.dart
│       │   │   │   ├── task_attachment.dart
│       │   │   │   └── task_enums.dart
│       │   │   └── repositories/tasks_repository.dart
│       │   ├── presentation/
│       │   │   ├── bloc/
│       │   │   │   ├── tasks_bloc.dart
│       │   │   │   ├── tasks_event.dart
│       │   │   │   └── tasks_state.dart
│       │   │   └── pages/
│       │   │       ├── project_board_page.dart
│       │   │       ├── task_detail_page.dart
│       │   │       └── task_form_page.dart
│       │   └── di/tasks_module.dart
│       │
│       ├── calendar/
│       │   ├── data/
│       │   │   ├── datasources/calendar_remote_data_source.dart
│       │   │   ├── models/calendar_event_model.dart
│       │   │   └── repositories/calendar_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/calendar_event.dart
│       │   │   └── repositories/calendar_repository.dart
│       │   ├── presentation/
│       │   │   ├── bloc/
│       │   │   │   ├── calendar_bloc.dart
│       │   │   │   ├── calendar_event.dart
│       │   │   │   └── calendar_state.dart
│       │   │   └── pages/calendar_page.dart
│       │   └── di/calendar_module.dart
│       │
│       ├── organization/
│       │   ├── data/
│       │   │   ├── datasources/organization_remote_data_source.dart
│       │   │   ├── models/organization_model.dart
│       │   │   └── repositories/organization_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/organization.dart
│       │   │   └── repositories/organization_repository.dart
│       │   ├── presentation/
│       │   │   ├── bloc/
│       │   │   │   ├── organization_bloc.dart
│       │   │   │   ├── organization_event.dart
│       │   │   │   └── organization_state.dart
│       │   │   └── pages/team_management_page.dart
│       │   └── di/organization_module.dart
│       │
│       └── home/
│           └── presentation/
│               └── pages/
│                   ├── home_page.dart
│                   └── main_navigation_page.dart  # Bottom navigation shell
│
├── pubspec.yaml
├── android/
├── ios/
└── web/
```

### pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5

  # Dependency Injection
  get_it: ^7.6.4
  injectable: ^2.3.2
  dartz: ^0.10.1

  # Networking
  dio: ^5.3.3

  # Storage
  shared_preferences: ^2.2.1
  flutter_secure_storage: ^9.0.0

  # UI
  google_fonts: ^6.1.0
  flutter_svg: ^2.0.9
  cupertino_icons: ^1.0.2
  flutter_markdown: ^0.7.3

  # Navigation
  go_router: ^17.1.0
  intl: ^0.20.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.6
  injectable_generator: ^2.4.1
```

### Data Flow Pattern

```
UI (Widget)
  └─► BLoC Event
        └─► UseCase
              └─► Repository (abstract)
                    └─► RemoteDataSource
                          └─► ApiClient (Dio)
                                └─► api.lawyerai.uz
```

### Mobile Setup

```bash
cd mobile

# Install dependencies
flutter pub get

# Generate DI code (run once, or after adding @injectable)
dart run build_runner build --delete-conflicting-outputs

# Run on connected device or emulator
flutter run

# Build release APK
flutter build apk --release

# Build iOS (macOS required)
flutter build ios --release
```

The API base URL is configured in `lib/core/constants/api_constants.dart`.

---

## Infrastructure

### docker-compose.yml Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `db` | postgres:15-alpine | 5432 | PostgreSQL database |
| `backend` | ./backend/Dockerfile | 8000 (internal) | FastAPI application |
| `frontend` | ./frontend/Dockerfile | 80 (internal) | React app via Nginx |
| `nginx` | nginx:alpine | 80, 443 | Reverse proxy + SSL termination |
| `certbot` | certbot/certbot | — | Let's Encrypt cert renewal |

### Volumes

```
postgres_data    → /var/lib/postgresql/data  (database files)
chroma_data      → /app/data/chroma_db       (vector embeddings)
./codes          → /app/codes (read-only)    (Uzbek law corpus)
./contracts      → /app/contracts (read-only)(contract templates)
./certbot/conf   → /etc/letsencrypt          (SSL certificates)
./certbot/www    → /var/www/certbot          (ACME challenge)
```

### Nginx Rate Limiting

| Zone | Limit | Applied To |
|---|---|---|
| `api_general` | 30 req/min | All other endpoints |
| `api_auth` | 5 req/min | `/api/auth/login`, `/api/auth/register` |
| `api_contact` | 3 req/min | `/api/contact/send` |
| `api_ai` | 10 req/min | `/api/lawyer`, `/api/validator`, `/api/generator`, `/api/document-validator` |

### SSE Streaming Config (Nginx)

AI endpoints are configured for long-lived SSE connections:

```nginx
proxy_buffering off;
chunked_transfer_encoding on;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

### SSL Setup

Certificates are managed via Let's Encrypt. Initialize on first deploy:

```bash
./setup-ssl.sh
```

Renewal happens automatically via the `certbot` container.

---

## Environment Variables

### Backend `.env`

```bash
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db:5432/ai_lawyer

# Security
SECRET_KEY=generate-a-long-random-string-here
JWT_ALGORITHM=HS256
JWT_EXPIRY_DAYS=30
MIN_PASSWORD_LENGTH=8

# Admin Panel (HTTP Basic Auth)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_HAIKU_MODEL=claude-haiku-4-5-20251001
CLAUDE_SONNET_MODEL=claude-sonnet-4-6
THINKING_BUDGET_TOKENS=8000

# Voyage AI (embeddings)
VOYAGE_API_KEY=pa-...
EMBEDDING_PROVIDER=voyage
EMBEDDING_MODEL=voyage-4-large

# Paths
CODES_PATH=codes
CONTRACTS_PATH=contracts
CHROMA_DB_PATH=data/chroma_db

# CORS
ALLOWED_ORIGINS=https://lawyerai.uz,https://api.lawyerai.uz,http://localhost:5173

# Rate Limiting
RATE_LIMIT_ENABLED=true

# Telegram (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Root `.env` (Docker Compose)

```bash
POSTGRES_PASSWORD=your-postgres-password
JWT_SECRET_KEY=your-jwt-secret
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
RATE_LIMIT_ENABLED=true
```

### Frontend `.env`

```bash
VITE_API_URL=https://api.lawyerai.uz   # or http://localhost:8000 for local dev
```

---

## Running Locally

### Prerequisites

- Docker + Docker Compose
- Or: Python 3.11+, Node.js 20+, Flutter SDK ≥ 3.2

### Option A — Docker Compose (Full Stack)

```bash
# Clone and configure
git clone <repo>
cd ai-uz-lawyer
cp .env.example .env    # fill in required values

# Start all services
docker compose up --build

# On first run, seed the vector store
docker compose exec backend python embed.py
```

Services available at:
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Option B — Local Development (per service)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values

# Requires a running PostgreSQL instance
# Update DATABASE_URL in .env to point to local db

uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
# → http://localhost:5173
```

**Mobile:**
```bash
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
# Update lib/core/constants/api_constants.dart baseUrl to http://localhost:8000
flutter run
```

---

## Production Deployment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production values

# 2. Initialize SSL certificates
./setup-ssl.sh

# 3. Deploy
./deploy.sh
# or manually:
docker compose pull
docker compose up -d --build

# 4. Seed embeddings (first deploy only)
docker compose exec backend python embed.py
```

### User Roles

| Role | Permissions |
|---|---|
| `HEAD` | Full access: manage tasks, approve new users, change user roles |
| `SENIOR` | Task management, review and approve task submissions |
| `EMPLOYEE` | View/work on assigned tasks, submit for review |

New users are created with `is_approved=false` and must be approved by a `HEAD` user before gaining access.
