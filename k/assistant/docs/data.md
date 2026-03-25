# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__assistant__setting__7Fk2Qw | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__assistant__log__9Xm3Kp | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__assistant__journal_note__8Kp2Nx | tables/journal-notes.table.ts | Заметки блокнота журнала | userId (string), title (string), content (string); опционально: folderId (string), categoryIds (JSON string), linkedTaskId (string), linkedProjectId (string), linkedClientId (string), noteDate (string), isArchived (boolean), sortOrder (number); системные: id, createdAt, updatedAt |
| t__assistant__notebook_category__5Rk3Qw | tables/notebook-categories.table.ts | Категории блокнота | userId (string), name (string), color (string), sortOrder (number) |
| t__assistant__notebook_folder__8Lm4Tp | tables/notebook-folders.table.ts | Папки блокнота | userId (string), name (string), color (string), sortOrder (number), isArchived (boolean) |
| t__assistant__journal_day_entry__4Hd9Qa | tables/journal-day-entries.table.ts | Дневные записи по сегментам (Ночь/Утро/День/Вечер) | userId, dayKey (YYYY-MM-DD с границей 05:00), nightText/nightLocked, morningText/morningLocked, dayText/dayLocked, eveningText/eveningLocked |
| t__assistant__journal_week_entry__7Qm2Lp | tables/journal-week-entries.table.ts | Недельный план по дням | userId, dayKey (YYYY-MM-DD), planText, locked |
| t__assistant__journal_week_summary__3Fn8Rt | tables/journal-week-summary.table.ts | Общий план недели | userId, mondayKey (YYYY-MM-DD понедельник), summaryText, locked |
| t__assistant__task_client__7Hk3mN | tables/task-clients.table.ts | Клиенты (задачи) | userId, name, sortOrder |
| t__assistant__task_project__9Lp4qR | tables/task-projects.table.ts | Проекты внутри клиента | userId, clientId, name, sortOrder; опционально `details` (текст для пользователя), `context` (служебное, не отдаётся в клиентский API) |
| t__assistant__task_ai_chat_feed__3Kp9mX | tables/task-ai-chat-feeds.table.ts | Фид чата с AI на странице задач (на проект) | userId, projectId, feedId (UID фида Chatium) |
| t__assistant__task_item__2Vx8sT | tables/task-items.table.ts | Задачи внутри проекта | userId, projectId, title, priority (1–4), status (todo/in_progress/done/cancelled), sortOrder, daySortOrder (порядок в дневном списке «В работе»); опционально `details` (текст для пользователя), `context` (служебное, не отдаётся в клиентский API) |
| t__assistant__pomodoro_state__6Gs2mQ | tables/pomodoro-state.table.ts | Состояние Pomodoro пользователя | userId, status, phase, currentTaskId, phaseEndsAtMs, phaseRemainingSec, cyclesCompleted, totalWorkSec, totalRestSec, workMinutes, restMinutes, longRestMinutes, cyclesUntilLongRest, pauseAfterWork, pauseAfterRest, afterLongRest, autoStartRest, autoStartNextCycle, phaseChangeSound (1–5), tasksCompletedToday, statsPeriodDayKey (YYYY-MM-DD периода дневной статистики от 05:00), updatedAtMs |
| t__assistant__pomodoro_launch__9Hk2tR | tables/pomodoro-launches.table.ts | Журнал фокус-сегментов Pomodoro и Tools | userId, startedAtMs, endedAtMs, durationSec, phase, taskId, cyclesCompletedAtStart, source (`start/resume/auto_next_phase/task_changed/continue/skip/tools_timer/tools_stopwatch`), endReason (`pause/stop/restart/phase_completed/task_changed/state_recovered/phase_skip`) |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).
- `repos/journal-notes.repo.ts` — findSummariesByUserId (расширенное DTO с folderId, categoryIds, noteDate, isArchived, sortOrder, linkedTaskId, linkedProjectId, linkedClientId), createForUser, findByIdForUser, updateForUser, deleteByIdForUser, reorderForUser, bulkArchiveForUser, bulkMoveToFolderForUser, bulkDeleteForUser, bulkSetCategoryForUser, archiveByFolderForUser, clearFolderIdForUser, removeCategoryFromAllNotes.
- `repos/notebook-categories.repo.ts` — findByUserId, createForUser, updateForUser, deleteForUser.
- `repos/notebook-folders.repo.ts` — findByUserId, createForUser, updateForUser, deleteForUser, archiveForUser, reorderForUser.
- `repos/journal-day-entries.repo.ts` — getByUserAndDay, saveSegmentForUserDay (upsert сегмента в записи конкретного дня пользователя).
- `repos/journal-week-entries.repo.ts` — getWeekByUserAndMonday, saveDayPlanForUser, saveWeekSummaryForUser (чтение/запись недельного плана по дням + общего weekly-summary).
- `repos/tasks.repo.ts` — getTreeForUser, CRUD клиентов/проектов/задач, reorderTasks (порядок в проекте), reorderDayTasks (порядок задач со статусом `in_progress` для вкладки «День»), releaseAllInProgressToTodo (все «В работе» → «К выполнению»), addPomodoroSecondsToTask (накопление времени работы/отдыха в задаче при активном Pomodoro); при входе в `in_progress` выставляется `daySortOrder`, при выходе — 0; удаление клиента каскадом (проекты и задачи), проекта — с задачами. Endpoint `api/tasks/in-progress` дополнительно обогащает `tree.tasks` полями `projectName` и `clientName` (через join по `projectId -> clientId`) для UI-селекторов Pomodoro/Timer/Stopwatch.
- `repos/pomodoro.repo.ts` — getOrCreateState/getOrCreateStateRow, updateState, getOrCreateStateWithDailyStats/applyStatsPeriodIfNeeded (сброс `totalWorkSec`/`totalRestSec`/`tasksCompletedToday` при смене `statsPeriodDayKey` без изменения `updatedAtMs`); нормализация и маппинг состояния Pomodoro между Heap-строкой и DTO.
- `repos/pomodoro-launches.repo.ts` — append-only журнал сегментов Pomodoro: открытие сегмента при запуске/продолжении, закрытие при паузе/стопе/автопереходе/смене задачи, расчёт `durationSec`; `appendFocusLaunchSegment` — запись фокус-сегментов из `web/tools` (`tools_timer/tools_stopwatch`); `getWorkFocusByDayForMonth` — суммарное время work-фаз по дням для вкладки «Месяц».
- `repos/tasks.repo.ts` — дополнительно: `getCompletedTasksSummaryForMonth` — завершённые задачи (`status: done`) с `updatedAt` в указанном месяце, сгруппированные по дню обновления.

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).
- `lib/tasks-types.ts` — DTO дерева задач для UI/API (без импорта Heap).
- `lib/pomodoro.lib.ts` — бизнес-логика Pomodoro: тик по времени, переключение фаз (`work`/`rest`/`long_rest`), pause/resume/stop/start/reset, сохранение настроек, привязка задачи; все мутации под `runWithExclusiveLock`. `start` перезапускает рабочую фазу и сбрасывает `cyclesCompleted` в 0; `reset` — остановка и сброс к началу серии (`cyclesCompleted=0`); `pause`/`resume` вне валидного статуса возвращают текущее состояние без мутации. При «Пропустить» во время отсчёта в суммы работы/отдыха и в задачу не доначисляется неотработанный остаток фазы (учёт только через предшествующий `tick`). Дополнительно ведётся полный лог запусков в `pomodoro-launches`: сегменты закрываются/открываются на всех переходах фаз и при смене задачи во время `running`.
- `lib/pomodoro-types.ts` — DTO состояния Pomodoro и тип входа настроек; `normalizePhaseChangeSoundId` для поля `phaseChangeSound` (1–5).
- `lib/pomodoro-stats-day.ts` — ключ периода дневной статистики (граница 05:00 локально / fallback Europe/Moscow); `@shared`.
- `lib/journal-day-key.ts` — ключ периода дневника (граница 05:00 локально / fallback Europe/Moscow); `@shared`.
- `lib/journal-week-key.ts` — ключ понедельника недели, сдвиг недели, список дней недели и номер недели; `@shared`.
- `lib/pomodoro-phase-sounds.ts` — пресеты звука смены фазы (Web Audio API, только клиент).

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
