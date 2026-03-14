# Architecture

## Назначение
Проект «Ассистент» (p/assistant) на базе шаблона Chatium. Минимальный набор страниц и документации.

## Ограничения платформы
- Серверная инфраструктура предоставляется Chatium.
- Нельзя менять стек и зависимости.
- Деплой — автоматически при пуше.

## Основные сценарии
- Открыть главную страницу.
- Авторизоваться и попасть в профиль.
- Открыть админку (только роль Admin).

## Роутинг
- `index.tsx` — главная (SSR + Vue), единственный роут в корне. Ниже hero — блоки разделов (Календарь, Мой день, Неделя, Привычки, Блокнот).
- `web/admin/index.tsx` — админка, `requireAccountRole('Admin')`.
- `web/profile/index.tsx` — профиль, `requireRealUser()`.
- `web/tests/index.tsx` — страница тестов, `requireRealUser()`.
- `web/login/index.tsx` — вход (редирект на системный `/s/auth/signin`).
- `web/calendar/index.tsx` — раздел «Календарь» (публичный).
- `web/my-day/index.tsx` — раздел «Мой день» (публичный).
- `web/week/index.tsx` — раздел «Неделя» (публичный).
- `web/habits/index.tsx` — раздел «Привычки» (публичный).
- `web/notebook/index.tsx` — раздел «Блокнот» (только для авторизованных, `requireRealUser`); список заметок, просмотр и редактирование по hash-роутингу (#view/:id, #edit/:id, #edit/new).

## Разделение слоёв

Принцип разделения ответственности при работе с данными (см. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md)):

| Слой | Каталог | Ответственность |
| --- | --- | --- |
| **Таблицы** | `tables/` | Схемы Heap (поля, типы). Только определение структуры данных. |
| **Репозитории** | `repos/` | Работа с БД: CRUD, запросы. Никакой бизнес‑логики, только вызовы Heap API. |
| **Бизнес‑логика** | `lib/` | Правила, дефолты, валидация значений, вычисления. Вызывает репозитории. |
| **API** | `api/` | HTTP‑эндпоинты, парсинг и первичная валидация запросов, проверка прав. Вызывает lib. |

Поток данных: `HTTP → API → lib → repos → Heap`.

## Структура каталогов
- `config/` — маршруты и `PROJECT_ROOT`.
- `web/` — браузерные роуты модулей (admin, profile, tests, login).
- `pages/` — Vue‑страницы (HomePage, ProfilePage, AdminPage, LoginPage, TestsPage; разделы: CalendarPage, MyDayPage, WeekPage, HabitsPage, NotebookPage).
- `components/` — переиспользуемые Vue‑компоненты (Header, AppFooter, GlobalGlitch, LogoutModal, SectionNav — навигация по разделам).
- `shared/sectionPageStyles.ts` — общие стили для страниц разделов (календарь, мой день, неделя, привычки, блокнот).
- `api/` — API‑эндпоинты (получение и валидация входных данных). File-based: один файл — один эндпоинт с `/`. Пример: `api/settings/list.ts`, `api/settings/get.ts`, `api/settings/save.ts`, `api/logger/log.ts`, `api/notebook/list.ts`, `api/notebook/get.ts`, `api/notebook/save.ts`, `api/notebook/delete.ts`, `api/notebook/toggleCheckbox.ts`, `api/admin/logs/recent.ts`, `api/admin/logs/before.ts`, `api/tests/list.ts`, `api/tests/endpoints-check/health.ts`, `api/tests/endpoints-check/ping.ts`.
- `tables/` — Heap‑таблицы (схемы: settings, logs, notebook_notes).
- `repos/` — репозитории (работа с БД: settings, logs, notebookNotes; logs.repo — findBeforeTimestamp; notebookNotes.repo — listByUser, getByIdForUser, createForUser, updateForUser, deleteForUser).
- `lib/` — бизнес‑логика (settings.lib, logger.lib, notebookMarkdown: extractPreview, toggleCheckbox, countCheckboxes).
- `shared/` — общий код (preloader, logLevel для передачи уровня логирования на клиент, logger — уровни syslog RFC 5424, createComponentLogger, setLogSink/LogEntry для дашборда, logEmergency…logDebug в браузере с проверкой порога).
- `docs/` — документация проекта.

## Интеграции
- Внешние сервисы: нет.
- Внутренние SDK: стандартные модули Chatium.
