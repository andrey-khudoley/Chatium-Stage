# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__assistant__setting__7Fk2Qw | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__assistant__log__9Xm3Kp | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__assistant__note__2Kp9Qw | tables/notebook_notes.table.ts | Заметки блокнота (по пользователю) | userId, title, contentMarkdown; системные: createdAt, updatedAt |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).
- `repos/notebookNotes.repo.ts` — listByUser, getByIdForUser, createForUser, updateForUser, deleteForUser (заметки блокнота; все операции с проверкой userId).

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).
- `lib/notebookMarkdown.ts` — extractPreview, toggleCheckbox, countCheckboxes (превью текста заметки, переключение чекбокса по индексу для API).

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
