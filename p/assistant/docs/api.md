# API

## Настройки (api/settings/)

Эндпоинты для управления настройками проекта (key-value в Heap). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/settings/list | api/settings/list.ts | Admin | Список всех настроек (с дефолтами) |
| GET | /api/settings/get?key= | api/settings/get.ts | Admin | Получить одну настройку |
| POST | /api/settings/save | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`). Для `log_level`: допускаются строки (Debug/Info/Warn/Error/Disable) и числа -1–4 (-1,0=Disable, 1=Info, 2=Warn, 3=Error, 4=Debug), нормализация в API. |

Каждый файл — один эндпоинт с путём `/`.

## Логи (api/logger/, api/admin/logs/)

Эндпоинты для записи и чтения серверных логов (проверка уровня, Heap, WebSocket, вебхук).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/logger/log | api/logger/log.ts | AnyUser | Записать лог (body: `{ message, severity?, payload? }`). message — текст сообщения (имя модуля при необходимости в тексте); severity — 0–7, по умолчанию 6; payload — JSON с контекстом. timestamp и уровень (level) вычисляются в lib. В ctx.log и ctx.account.log выводится строка вида `[DD.MM.YYYY HH:mm:ss.SSS] [LEVEL] message` (пробелы между группами в скобках). Уровень сверяется с настройкой log_level; при прохождении — запись в ctx.log, ctx.account.log, Heap, WebSocket (admin-logs), опционально POST на log_webhook.url. |
| GET | /api/admin/logs/recent | api/admin/logs/recent.ts | Admin | Получить последние N логов (query: `limit`, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }> }`. |
| GET | /api/admin/logs/before | api/admin/logs/before.ts | Admin | Получить N логов старше указанного timestamp (query: `beforeTimestamp` — timestamp последней записи в миллисекундах, `limit` — количество, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }>, hasMore: boolean }`. |

## Дашборд админки (api/admin/dashboard/)

Счётчики ошибок и предупреждений в дашборде; таймштамп сброса хранится в настройках (`dashboard_reset_at`). Логика: lib/admin/dashboard.lib, репо — countBy по severity и timestamp (Heap where).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/admin/dashboard/counts | api/admin/dashboard/counts.ts | Admin | Получить счётчики ошибок и предупреждений после таймштампа сброса. Возвращает `{ success: true, errorCount, warnCount, resetAt }`. |
| POST | /api/admin/dashboard/reset | api/admin/dashboard/reset.ts | Admin | Сбросить дашборд: записать текущий таймштамп в настройки. Возвращает `{ success: true, errorCount: 0, warnCount: 0, resetAt }`. |

Каждый файл — один эндпоинт с путём `/`.

## Тесты (api/tests/)

Каталог тестов: категории и отдельные тесты. Один файл — один эндпоинт с путём `/`. Внутри категории (например, «проверка эндпоинтов») — по одному файлу на тест.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tests/list | api/tests/list.ts | AnyUser | Каталог тестов: список категорий и тестов. Возвращает `{ success: true, categories }`. |
| GET | /api/tests/endpoints-check/health | api/tests/endpoints-check/health.ts | AnyUser | Тест: health check. Возвращает `{ success: true, ok: true, test: 'health', at }`. |
| GET | /api/tests/endpoints-check/ping | api/tests/endpoints-check/ping.ts | AnyUser | Тест: ping. Возвращает `{ success: true, pong: true, test: 'ping', at }`. |
| GET | /api/tests/endpoints-check/config | api/tests/endpoints-check/config.ts | AnyUser | Тест слоя config (routes, project). Возвращает `{ success, test: 'config', routes: { index, admin, login, profile, tests, journal, tasks }, pageTitle, headerText, at }`. |
| GET | /api/tests/endpoints-check/settings-lib | api/tests/endpoints-check/settings-lib.ts | AnyUser | Тесты библиотеки настроек: массив `results` по каждой функции (getSettingString, getLogLevel, getLogsLimit, getLogWebhook, getDashboardResetAt, getAllSettings). |
| GET | /api/tests/endpoints-check/settings-repo | api/tests/endpoints-check/settings-repo.ts | AnyUser | Тесты репозитория настроек: массив `results` (upsert, deleteByKey, findByKey, findAll). Порядок: создание до чтения. |
| GET | /api/tests/endpoints-check/logger-lib | api/tests/endpoints-check/logger-lib.ts | AnyUser | Тесты библиотеки логов: массив `results` (getAdminLogsSocketId, shouldLogByLevel). |
| GET | /api/tests/endpoints-check/logs-repo | api/tests/endpoints-check/logs-repo.ts | AnyUser | Тесты репозитория логов: массив `results` (create, findAll, findBeforeTimestamp, countErrorsAfter, countWarningsAfter). Порядок: create до чтения. |
| GET | /api/tests/endpoints-check/dashboard-lib | api/tests/endpoints-check/dashboard-lib.ts | AnyUser | Тесты библиотеки админки: массив `results` (getDashboardCounts, resetDashboard). |

Структура: `api/tests/` — общий каталог; `api/tests/<категория>/` — директория категории (например, `endpoints-check`); внутри категории — отдельные файлы с одним эндпоинтом `/` в каждом.

## Журнал — блокнот (api/journal/notes/)

Заметки пользователя в Heap; доступ только авторизованным пользователям (`requireRealUser`).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/journal/notes/list | api/journal/notes/list.ts | RealUser | Список заметок: `{ success, notes: [{ id, title }] }` (без поля content). |
| GET | /api/journal/notes/get?id= | api/journal/notes/get.ts | RealUser | Одна заметка: `{ success, note: { id, title, content } }` или ошибка. |
| POST | /api/journal/notes/create | api/journal/notes/create.ts | RealUser | Создать заметку. Body (опционально): `{ title?, content? }`; по умолчанию заголовок «Новая заметка», пустое содержимое. Ответ: `{ success, note: { id, title } }`. |
| POST | /api/journal/notes/update | api/journal/notes/update.ts | RealUser | Обновить свою заметку. Body: `{ id, title, content }`. Пустой `title` после trim заменяется на «Без названия». Ответ: `{ success, note: { id, title } }`. |
| POST | /api/journal/notes/delete | api/journal/notes/delete.ts | RealUser | Удалить свою заметку. Body: `{ id }`. Ответ: `{ success: true }`. |

## Задачи (api/tasks/)

Иерархия «клиент → проект → задача» в Heap; все мутации и дерево — только `requireRealUser`. Один файл — один эндпоинт с путём `/`.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tasks/tree/get | api/tasks/tree/get.ts | RealUser | Полное дерево: `{ success, tree: { clients, projects, tasks } }`. |
| POST | /api/tasks/clients/create | api/tasks/clients/create.ts | RealUser | Body: `{ name }`. Ответ: `{ success, client }`. |
| POST | /api/tasks/clients/update | api/tasks/clients/update.ts | RealUser | Body: `{ id, name }`. |
| POST | /api/tasks/clients/delete | api/tasks/clients/delete.ts | RealUser | Body: `{ id }` — каскадное удаление проектов и задач. |
| POST | /api/tasks/projects/create | api/tasks/projects/create.ts | RealUser | Body: `{ clientId, name }`. |
| POST | /api/tasks/projects/update | api/tasks/projects/update.ts | RealUser | Body: `{ id, name, clientId? }` — смена клиента у проекта допустима. |
| POST | /api/tasks/projects/delete | api/tasks/projects/delete.ts | RealUser | Body: `{ id }` — удаление задач проекта. |
| POST | /api/tasks/items/create | api/tasks/items/create.ts | RealUser | Body: `{ projectId, title, description?, priority?, status? }`. |
| POST | /api/tasks/items/update | api/tasks/items/update.ts | RealUser | Body: `{ id, title?, description?, priority?, status?, projectId? }`. |
| POST | /api/tasks/items/delete | api/tasks/items/delete.ts | RealUser | Body: `{ id }`. |
| POST | /api/tasks/items/reorder | api/tasks/items/reorder.ts | RealUser | Body: `{ projectId, orderedIds: string[] }` — полный список id задач проекта в новом порядке. |
| POST | /api/tasks/items/reorder-day | api/tasks/items/reorder-day.ts | RealUser | Body: `{ orderedIds: string[] }` — полный список id всех задач со статусом «В работе» в новом порядке (дневной список). |
| POST | /api/tasks/items/release-day | api/tasks/items/release-day.ts | RealUser | Body: `{}` (опционально). Все задачи «В работе» → «К выполнению». Ответ: `{ success, count }`. |

## Публичные эндпоинты
| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| - | - | - | - | - |

## События и webhooks
- Не используются.
