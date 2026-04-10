# ИИ Юрист — AI Lawyer Mobile

Мобильное приложение на Flutter для получения юридической помощи с использованием ИИ, разработанное для правовой экосистемы Узбекистана. Приложение взаимодействует с бэкендом на FastAPI по адресу `api.lawyerai.uz` и предлагает анализ договоров, их генерацию, юридический чат, управление задачами и координацию команды — всё на русском языке.

---

## ✨ Возможности

| Функция | Описание |
|---|---|
| **Юридический чат** | Многофункциональный ИИ-чат с 20+ режимами консультаций (консультант, литигатор, комплаенс, меморандум и др.) с потоковыми ответами и использованием RAG |
| **Валидатор договоров** | Загрузите или вставьте текст договора и получите полный ИИ-анализ: оценка, критические ошибки, предупреждения, недостающие пункты, скрытые риски, сильные стороны, предложения по улучшению, стратегия переговоров и правовые источники |
| **Валидатор документов** | Анализ документов, не являющихся договорами (доверенности, соглашения, заявления и т.д.) на предмет ошибок, предупреждений и недостающих пунктов |
| **Генератор договоров** | Генерация юридических договоров на основе категории и требований с потоковым выводом в формате Markdown |
| **История** | Единая история всех чатов, проверок и созданных договоров с детальным просмотром |
| **Управление задачами** | Канбан-трекер задач с назначением исполнителей, дедлайнами, приоритетом/сложностью/статусом, комментариями и вложениями |
| **Управление командой** | Управление пользователями в рамках организации (только для роли HEAD): одобрение новых пользователей, изменение ролей (SENIOR/EMPLOYEE) |
| **Календарь** | Календарь юридических событий и дедлайнов |
| **Авторизация** | Вход и регистрация на базе JWT с контролем доступа на основе ролей |

---

## 🏗️ Архитектура

Проект следует принципам **Clean Architecture** со строгим разделением ответственности по трем уровням для каждой функции:

```
feature/
├── data/
│   ├── datasources/       # Вызовы удаленного API (Dio)
│   ├── models/            # Маппинг JSON → Entity (расширяет доменные сущности)
│   └── repositories/      # Реализации репозиториев
│ ├── domain/
│   ├── entities/          # Чистые бизнес-объекты Dart
│   ├── repositories/      # Абстрактные контракты
│   └── usecases/          # Простые варианты использования (Use cases)
├── presentation/
│   ├── bloc/              # BLoC: Event → State
│   ├── pages/             # Виджеты экранов
│   └── widgets/           # UI-компоненты в рамках фичи
└── di/
    └── feature_module.dart  # Регистрация сервисов в GetIt
```

### Ключевые проектные решения

- **Однонаправленный поток данных** — UI → BLoC Event → Repository → BLoC State → UI
- **Отсутствие прямой связи** между фичами — навигация между ними осуществляется через `go_router`
- **BLoC на каждую фичу** — каждая фича независимо управляет своим состоянием
- **Единый контейнер `GetIt`** — все зависимости регистрируются в `lib/core/di/injection_container.dart`, каждая фича предоставляет свой `_module.dart`

---

## 📦 Технологический стек

| Слой | Технология |
|---|---|
| Фреймворк | Flutter 3.x (Dart SDK ≥3.2) |
| Управление состоянием | `flutter_bloc` ^8.1 + `equatable` |
| Внедрение зависимостей | `get_it` ^7.6 + `injectable` |
| Навигация | `go_router` ^17 |
| Сеть | `dio` ^5.3 |
| Безопасное хранилище | `flutter_secure_storage` (JWT) + `shared_preferences` |
| UI | Material 3 + `google_fonts` |
| Markdown | `flutter_markdown` |
| Локализация | Flutter ARB + `intl` (Русский) |
| Функциональный подход | `dartz` (Either/Option) |

---

## 📁 Структура проекта

```
lib/
├── main.dart                  # Точка входа, MaterialApp.router, градиентный фон
├── config/
│   ├── routes/app_router.dart # Определения маршрутов go_router
│   └── theme/
│       ├── app_colors.dart    # Брендовая палитра (светлая + темная)
│       ├── app_text_styles.dart
│       ├── app_theme.dart     # ThemeData (светлая + темная)
│       ├── design_system.dart # Отступы, радиусы, константы макета
│       └── custom_theme_extension.dart
├── core/
│   ├── constants/api_constants.dart  # Пути ко всем эндпоинтам API
│   ├── di/injection_container.dart   # Настройка корня GetIt
│   ├── error/                        # Ошибки и исключения
│   ├── network/api_client.dart       # Dio + внедрение JWT
│   ├── usecases/usecase.dart         # Базовый класс UseCase<T, P>
│   └── utils/bloc_observer.dart
├── shared/
│   ├── utils/markdown_styler.dart
│   └── widgets/
│       ├── glass_card.dart        # Карточка с эффектом стекла и градиентным акцентом
│       ├── primary_button.dart
│       ├── custom_text_field.dart
│       ├── section_header.dart
│       ├── feature_icon.dart
│       ├── status_badge.dart
│       └── empty_state.dart
├── l10n/                            # Файлы локализации ARB (Русский)
└── features/
    ├── auth/          # Логин, регистрация, хранение JWT, AuthBloc
    ├── chat/          # Сессии, потоковые сообщения, 20+ режимов, MessageBubble
    ├── validator/     # Анализ договоров и документов, AnalysisResultView
    ├── generator/     # Выбор категории, потоковый генератор, история
    ├── history/       # Единая история, чипы фильтров, HistoryDetailPage
    ├── tasks/         # CRUD задач, комментарии, TaskFormPage, TaskDetailPage
    ├── organization/  # Управление командой, одобрение/смена ролей, OrganizationBloc
    ├── calendar/      # События календаря
    └── home/          # HomePage, MainNavigationPage (нижняя навигация)
```

---

## 🔑 Авторизация и роли

Авторизация основана на JWT. Токен сохраняется в `flutter_secure_storage` и добавляется в каждый запрос через интерцептор `Dio`.

Существует три роли пользователей:

| Роль | Возможности |
|---|---|
| `HEAD` | Полный доступ: управление задачами, управление командой, одобрение пользователей, смена ролей |
| `SENIOR` | Управление задачами, проверка и одобрение задач |
| `EMPLOYEE` | Просмотр и работа над назначенными задачами, отправка на проверку |

---

## 🌐 API

Базовый URL: `https://api.lawyerai.uz`

| Группа | Эндпоинты |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Chat | `GET/POST /api/lawyer/sessions`, `POST /api/lawyer/chat` (SSE поток) |
| Validator | `POST /api/validator/analyze` (SSE поток), `GET /api/validator/history` |
| Document Validator | `POST /api/document-validator/analyze` (SSE поток), `GET /api/document-validator/history` |
| Generator | `GET /api/generator/categories`, `POST /api/generator/generate` (SSE поток), `GET /api/generator/history` |
| History | `GET /api/history` (единый, с фильтром `?type=`) |
| Tasks | `CRUD /api/tasks/` |
| Organization | `GET /api/organization/my/users`, одобрение, обновление роли |
| Calendar | `CRUD /api/calendar/` |

Все потоковые эндпоинты используют **Server-Sent Events (SSE)** для передачи обновлений статуса и фрагментов контента в реальном времени.

---

## 🚀 Начало работы

### Требования
- Flutter SDK ≥ 3.2
- Dart SDK ≥ 3.2

### Настройка

```bash
# Клонирование репозитория
git clone https://github.com/your-org/AI-UZ-Lawyer-Mobile.git
cd AI-UZ-Lawyer-Mobile

# Установка зависимостей
flutter pub get

# Генерация кода DI (при необходимости)
dart run build_runner build --delete-conflicting-outputs

# Запуск приложения
flutter run
```

Приложение по умолчанию использует **темную тему** (`AppTheme.darkTheme`) и русскую локаль (`ru`).

---

## 🎨 Дизайн-система

Все токены дизайна централизованы в `lib/config/theme/`:

- **Цвета** — Брендовый красный `#C41E3A` (светлая) / `#EF4666` (темная), акцентные цвета функций (синий, оранжевый, бирюзовый, индиго, розовый, циановый)
- **Отступы** — `DesignSystem.spacingSm/Md/Base/Xl/2xl` и т.д.
- **Радиусы** — `DesignSystem.radiusSm/Md/cardRadius/buttonRadius` и т.д.
- **Типографика** — Inter (Google Fonts), определена в `AppTextStyles`

Виджет `GlassCard` является основным контейнером, используемым во всем приложении — он обрамляет контент скругленными углами, опциональной акцентной рамкой и поддерживает обратный вызов `onTap`.

---

## 📝 Локализация

Приложение полностью локализовано на **русский язык** с использованием системы ARB от Flutter. Файлы локализации находятся в `lib/l10n/`. Доступ к строкам осуществляется через `context.l10n.someKey`.

---

## 🔒 Безопасность

- JWT хранится в `flutter_secure_storage` (зашифрованная связка ключей iOS / Android EncryptedSharedPreferences)
- Все API-запросы добавляют токен Bearer через интерцептор `Dio`
- Проверки ролей применяются как в UI (условные виджеты/перенаправления), так и на уровне бэкенда
