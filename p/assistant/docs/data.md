# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

Во всех таблицах Heap автоматически присутствуют системные поля `id`, `createdAt`, `updatedAt`. Их **не объявляют** в схеме `Heap.Table`, но **можно использовать** в запросах (`order`, `where`) и в ответах API.

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__assistant__setting__7Fk2Qw | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__assistant__log__9Xm3Kp | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__assistant__note__2Kp9Qw | tables/notebook_notes.table.ts | Заметки блокнота (по пользователю) | userId, title, contentMarkdown; системные: createdAt, updatedAt |
| t__assistant__dayentry__Ab1Qw | tables/day_entries.table.ts | Записи «Мой день» (Утро/День/Вечер на дату) | userId, date (YYYY-MM-DD), morningText, dayText, eveningText |
| t__assistant__backlogfolder__Cd2Qw | tables/backlog_folders.table.ts | Папки бэклога «Мой день» | userId, name, sortOrder |
| t__assistant__mydaytask__Ef3Qw | tables/my_day_tasks.table.ts | Задачи «Мой день» (главные, доп., бэклог) | userId, section, date?, folderId?, title, completedAt?, sortOrder |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).
- `repos/notebookNotes.repo.ts` — listByUser, getByIdForUser, createForUser, updateForUser, deleteForUser (заметки блокнота; все операции с проверкой userId).
- `repos/dayEntries.repo.ts` — getByUserAndDate, upsertForUser (записи дня по дате).
- `repos/backlogFolders.repo.ts` — listByUser, createForUser, getByIdForUser, updateForUser, deleteForUser, reorderForUser (папки бэклога).
- `repos/myDayTasks.repo.ts` — listForDay, listBacklogByUser, listAllBacklogByUser, createForUser, getByIdForUser, updateForUser, deleteForUser, reorderForUser (задачи «Мой день»).

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).
- `lib/notebookMarkdown.ts` — extractPreview, toggleCheckbox, countCheckboxes (превью текста заметки, переключение чекбокса по индексу для API).

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
