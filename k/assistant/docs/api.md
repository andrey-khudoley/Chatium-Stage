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
| GET | /api/tests/endpoints-check/config | api/tests/endpoints-check/config.ts | AnyUser | Тест слоя config (routes, project). Возвращает `{ success, test: 'config', routes: { index, admin, login, profile, tests, journal, tasks, tools, pomodoro }, pageTitle, headerText, at }`. |
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

## Журнал — день (api/journal/day/)

Дневные записи пользователя по сегментам `night/morning/day/evening` с фиксацией (блокировка редактирования). Данные хранятся отдельно по `dayKey` (`YYYY-MM-DD`) с границей суток в **05:00**.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/journal/day/get?dayKey= | api/journal/day/get.ts | RealUser | Получить запись дня: `{ success, entry }`, где `entry = { dayKey, night, morning, day, evening }`, а каждый сегмент — `{ value, locked }`. `dayKey` опционален (если не передан, сервер использует fallback-ключ по `Europe/Moscow`). |
| POST | /api/journal/day/save | api/journal/day/save.ts | RealUser | Сохранить один сегмент дня. Body: `{ dayKey?, segment, value, locked }`, где `segment ∈ { night, morning, day, evening }`. Ответ: `{ success, entry }` (актуальный снимок всего дня после записи). |

## Журнал — неделя (api/journal/week/)

Недельный план пользователя: по одному многострочному полю на каждый день недели (`Пн..Вс`) с фиксацией/разблокировкой.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/journal/week/get?mondayKey= | api/journal/week/get.ts | RealUser | Получить недельный план: `{ success, week }`, где `week = { mondayKey, weekNumber, summary, days }`, `summary = { value, locked }`, `days = [{ dayId, dayKey, value, locked }]`. `mondayKey` опционален, по умолчанию берётся текущая локальная неделя. |
| POST | /api/journal/week/save | api/journal/week/save.ts | RealUser | Сохранить план дня недели. Body: `{ dayKey, value, locked }`. Ответ: `{ success, week }` — актуальный снимок всей недели, к которой относится `dayKey`. |
| POST | /api/journal/week/save-summary | api/journal/week/save-summary.ts | RealUser | Сохранить общий weekly-summary. Body: `{ mondayKey, value, locked }`. Ответ: `{ success, week }` — актуальный снимок недели после сохранения общего плана. |

## Задачи (api/tasks/)

Иерархия «клиент → проект → задача» в Heap; все мутации и дерево — только `requireRealUser`. Один файл — один эндпоинт с путём `/`.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tasks/tree/get | api/tasks/tree/get.ts | RealUser | Полное дерево: `{ success, tree: { clients, projects, tasks } }`. |
| POST | /api/tasks/clients/create | api/tasks/clients/create.ts | RealUser | Body: `{ name }`. Ответ: `{ success, client }`. |
| POST | /api/tasks/clients/update | api/tasks/clients/update.ts | RealUser | Body: `{ id, name }`. |
| POST | /api/tasks/clients/delete | api/tasks/clients/delete.ts | RealUser | Body: `{ id }` — каскадное удаление проектов и задач. |
| POST | /api/tasks/clients/reorder | api/tasks/clients/reorder.ts | RealUser | Body: `{ orderedIds: string[] }` — полный список id клиентов пользователя в новом порядке. |
| POST | /api/tasks/projects/create | api/tasks/projects/create.ts | RealUser | Body: `{ clientId, name, details? }` — `details` (текст «Детали»), опционально. |
| POST | /api/tasks/projects/update | api/tasks/projects/update.ts | RealUser | Body: `{ id, name, clientId?, details? }` — смена клиента у проекта допустима; `details` — опционально обновить текст «Детали». |
| POST | /api/tasks/projects/delete | api/tasks/projects/delete.ts | RealUser | Body: `{ id }` — удаление задач проекта. |
| POST | /api/tasks/projects/reorder | api/tasks/projects/reorder.ts | RealUser | Body: `{ clientId, orderedIds: string[] }` — полный список id проектов этого клиента в новом порядке. |
| POST | /api/tasks/items/create | api/tasks/items/create.ts | RealUser | Body: `{ projectId, title, details?, priority?, status? }` — `details` (текст «Детали»), опционально. |
| POST | /api/tasks/items/update | api/tasks/items/update.ts | RealUser | Body: `{ id, title?, details?, priority?, status?, projectId? }`. |
| POST | /api/tasks/items/delete | api/tasks/items/delete.ts | RealUser | Body: `{ id }`. |
| POST | /api/tasks/items/reorder | api/tasks/items/reorder.ts | RealUser | Body: `{ projectId, orderedIds: string[] }` — полный список id задач проекта в новом порядке. |
| POST | /api/tasks/items/reorder-day | api/tasks/items/reorder-day.ts | RealUser | Body: `{ orderedIds: string[] }` — полный список id всех задач со статусом «В работе» в новом порядке (дневной список). |
| POST | /api/tasks/items/release-day | api/tasks/items/release-day.ts | RealUser | Body: `{}` (опционально). Все задачи «В работе» → «К выполнению». Ответ: `{ success, count }`. |
| POST | /api/tasks/tasks-ai-chat-ensure | api/tasks/tasks-ai-chat-ensure.ts | RealUser | Body: `{ projectId }`. Создаёт/возвращает фид чата с AI для пары пользователь+проект, участник фида, `getChat` только с URL `messages/get`, `changes`, `add` (без `useAppAccount` — иначе `@app/feed` требует proxy `ctx.app` и падает в UGC). Ответ: `{ success, chat?, feedId?, error? }`. |
| POST | /api/tasks/tasks-ai-chat-reset | api/tasks/tasks-ai-chat-reset.ts | RealUser | Body: `{ projectId }`. Удаляет старый фид, создаёт новый, обновляет Heap-маппинг (сброс истории). Ответ: `{ success, feedId?, error? }`. Клиент затем вызывает `tasks-ai-chat-ensure`. |
| GET | `/tasks-ai-chat/:feedId/messages/get` | api/tasks/tasks-ai-chat-messages-get.ts | RealUser | `feedMessagesGetHandler` + маппинг авторов (ассистент/пользователь); список **сортируется по времени** (старые→новые), т.к. фид по умолчанию может отдавать новые первыми. Доступ к `feedId` — через Heap `task_ai_chat_feeds`. URL в чате: `taskAiChatMessagesGetRoute({ feedId }).url()`. |
| GET | `/tasks-ai-chat/:feedId/messages/changes` | api/tasks/tasks-ai-chat-messages-changes.ts | RealUser | `feedMessagesChangesHandler` + тот же маппинг авторов. |
| POST | `/tasks-ai-chat/:feedId/messages/add` | api/tasks/tasks-ai-chat-messages-add.ts | RealUser | `feedMessagesAddHandler`; после успешного add — `runTaskAiChatReplyIfNeeded` в `tasks-ai-chat-reply.ts` (`startCompletion`, в proxy context). В system перед каждым запросом подставляется актуальный блок из `buildTaskAiChatProjectContextBlock` (`tasks-ai-chat-lib.ts`): проект, задачи, **details** и служебные **context** у проекта и задач из Heap, с явной шапкой «СЛУЖЕБНЫЙ КОНТЕКСТ ПРОЕКТА (НЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ)». Последнее пользовательское сообщение передаётся отдельным user-блоком «ТЕКУЩЕЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ». Системный текст: `getAiFormulateSystemPrompt` + `TASKS_AI_CHAT_JSON_APPENDIX` в `config/prompts.tsx` (разделение: сквозная рамка проекта — `update_project.context` без повторения списка задач; уточнения по строкам — `update_task` / `create_task`, полные слитые `context` по правилам промпта). Ответ модели — JSON с `reply`, `actions`, `summary`; применение в Heap — `tasks-ai-chat-completion-completed.ts` → `tasks-ai-formulate-apply.ts` (create/update/delete/reorder, `reorder_tasks` с `$new:N`). В ленту пишется только текст `reply`. Отдельного роута `ai-formulate` нет. |

## Pomodoro (api/pomodoro/)

Личный таймер пользователя (состояние и настройки в Heap), синхронизация с задачами и шапкой UI. Все маршруты работают для `requireRealUser`.
Дополнительно внутри `lib/pomodoro.lib.ts` ведётся полный лог сегментов запуска в `tables/pomodoro-launches.table.ts` (каждый `start`/`resume`, автопереходы фаз и смена задачи во время `running`).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/pomodoro/state/get | api/pomodoro/state/get.ts | RealUser | Текущее состояние таймера: `{ success, state, serverNowMs }`. Опционально query `statsDayKey=YYYY-MM-DD` — ключ «дня» дневной статистики (граница смены в **05:00 по локальному времени клиента**; считается в `lib/pomodoro-stats-day.ts`). Без параметра на сервере используется тот же алгоритм для `Europe/Moscow`. При смене ключа обнуляются `totalWorkSec`, `totalRestSec`, `tasksCompletedToday` (таймер и `cyclesCompleted` не трогаются). |
| POST | /api/pomodoro/control | api/pomodoro/control.ts | RealUser | Управление состоянием. Body: `{ action, statsDayKey? }`, где `action ∈ { start, resume, pause, stop, skip, reset }` (`skip` — пропуск текущей фазы; `reset` — остановка и сброс к началу серии: `stopped`, полный work, `cyclesCompleted=0`). Ответ: `{ success, state, serverNowMs }`. В `state.status` возможно значение `awaiting_continue` (фаза закончилась по таймеру, ожидание «Продолжить»). |
| POST | /api/pomodoro/settings/save | api/pomodoro/settings/save.ts | RealUser | Сохранить настройки таймера. Body: поля длительностей и флагов + опционально `statsDayKey` (см. выше). |
| POST | /api/pomodoro/assign-task | api/pomodoro/assign-task.ts | RealUser | Привязать текущую задачу к Pomodoro. Body: `{ taskId, statsDayKey? }`. Проверяется, что задача принадлежит пользователю; при активном тике накопленное время задачи синхронизируется перед сменой привязки. |

## Публичные эндпоинты
| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| - | - | - | - | - |

Примечания по семантике `control`:
- `start` запускает/перезапускает рабочую фазу (`phase=work`, полный `workMinutes`, `cyclesCompleted=0`); на странице Pomodoro кнопка доступна только в `stopped`, прямой вызов API из других статусов по-прежнему перезапускает работу.
- `resume` изменяет состояние из `paused` или `awaiting_continue`; иначе возвращает текущее состояние без ошибки.
- `pause` изменяет состояние только из `running` (в остальных случаях возвращает текущее состояние без ошибки).
- `stop` переводит в `stopped`, сбрасывает фазу в `work` и очищает `currentTaskId` (счётчик циклов не обнуляет).
- `reset` переводит в `stopped` с полным таймером работы, очищает задачу и обнуляет `cyclesCompleted` (кнопка «Сбросить» на странице).

## События и webhooks
- Не используются.
