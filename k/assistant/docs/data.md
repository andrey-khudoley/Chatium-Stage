# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__assistant__setting__7Fk2Qw | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__assistant__log__9Xm3Kp | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__assistant__journal_note__8Kp2Nx | tables/journal-notes.table.ts | Заметки блокнота журнала | userId (string), title (string), content (string); системные: id, createdAt, updatedAt |
| t__assistant__task_client__7Hk3mN | tables/task-clients.table.ts | Клиенты (задачи) | userId, name, sortOrder |
| t__assistant__task_project__9Lp4qR | tables/task-projects.table.ts | Проекты внутри клиента | userId, clientId, name, sortOrder; опционально `details` (текст для пользователя), `context` (служебное, не отдаётся в клиентский API) |
| t__assistant__task_item__2Vx8sT | tables/task-items.table.ts | Задачи внутри проекта | userId, projectId, title, description, priority (1–4), status (todo/in_progress/done/cancelled), sortOrder, daySortOrder (порядок в дневном списке «В работе») |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).
- `repos/journal-notes.repo.ts` — findSummariesByUserId, createForUser, findByIdForUser, updateForUser (`JournalNotes.update(ctx, { id, title, content })`), deleteByIdForUser.
- `repos/tasks.repo.ts` — getTreeForUser, CRUD клиентов/проектов/задач, reorderTasks (порядок в проекте), reorderDayTasks (порядок задач со статусом `in_progress` для вкладки «День»), releaseAllInProgressToTodo (все «В работе» → «К выполнению»); при входе в `in_progress` выставляется `daySortOrder`, при выходе — 0; удаление клиента каскадом (проекты и задачи), проекта — с задачами.

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).
- `lib/tasks-types.ts` — DTO дерева задач для UI/API (без импорта Heap).

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
