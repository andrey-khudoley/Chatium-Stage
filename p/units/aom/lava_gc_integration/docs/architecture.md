# Architecture

## Назначение
Базовый шаблон проекта Chatium с минимальным набором страниц и документации. Спецификация целевой интеграции GetCourse + Lava — в [README.md](./README.md) и `integration-*.md`.

## Ограничения платформы
- Серверная инфраструктура предоставляется Chatium.
- Нельзя менять стек и зависимости.
- Деплой — автоматически при пуше.

## Основные сценарии
- Открыть главную страницу.
- Авторизоваться и попасть в профиль.
- Открыть админку (только роль Admin).

## Роутинг
- `index.tsx` — главная (SSR + Vue), единственный роут в корне.
- `web/admin/index.tsx` — админка, `requireAccountRole('Admin')`.
- `web/profile/index.tsx` — профиль, `requireRealUser()`.
- `web/tests/index.tsx` — страница тестов, `requireRealUser()`.
- `web/login/index.tsx` — вход (редирект на системный `/s/auth/signin`).

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
- `pages/` — Vue‑страницы (минимальные).
- `components/` — переиспользуемые Vue‑компоненты (Header, AppFooter, GlobalGlitch, LogoutModal).
- `api/` — API‑эндпоинты (получение и валидация входных данных). File-based: один файл — один эндпоинт с `/`. Пример: `api/settings/list.ts`, `api/settings/get.ts`, `api/settings/save.ts`, `api/logger/log.ts`, `api/admin/logs/recent.ts`, `api/admin/logs/before.ts`, `api/tests/list.ts`, `api/tests/endpoints-check/health.ts`, `api/tests/endpoints-check/ping.ts`.
- `tables/` — Heap‑таблицы (схемы: settings, logs).
- `repos/` — репозитории (работа с БД: settings, logs; logs.repo включает findBeforeTimestamp для пагинации).
- `lib/` — бизнес‑логика (settings.lib, logger.lib: проверка уровня, запись в ctx/Heap/WebSocket/вебхук).
- `shared/` — общий код (preloader, logLevel для передачи уровня логирования на клиент, logger — уровни syslog RFC 5424, createComponentLogger, setLogSink/LogEntry для дашборда, logEmergency…logDebug в браузере с проверкой порога).
- `docs/` — документация проекта.

## Интеграции

### Планируемая интеграция GetCourse + Lava.top
Полное описание — в **[docs/README.md](./README.md)** (оглавление) и файлах `integration-*.md`. Кратко:

- Входящие API: создание ссылки на оплату (`payment-link`), приём webhook Lava; file-based роуты под `api/`.
- Критическая секция обновления цены оффера и создания контракта — под **`runWithExclusiveLock`** (`@app/sync`).
- Исходящие вызовы к Lava и GetCourse — **`@app/request`**.
- Персистентность контрактов и событий webhook — **Heap** (`tables/` + `repos/`), секреты — в settings или отдельных ключах.

Контракты HTTP и приёмка — [integration-http-contracts.md](./integration-http-contracts.md), [integration-readiness-decisions-open-questions.md](./integration-readiness-decisions-open-questions.md). Пути и схемы Lava API — [reference/lavatop-openapi3.yaml](./reference/lavatop-openapi3.yaml), сводка — [integration-lava-openapi-reference.md](./integration-lava-openapi-reference.md). GetCourse PL API — [reference/getcourse-pl-api-spec.md](./reference/getcourse-pl-api-spec.md).

### Текущее состояние
- Внешние сервисы Lava/GetCourse в коде пока не подключены.
- Внутренние SDK: стандартные модули Chatium.
