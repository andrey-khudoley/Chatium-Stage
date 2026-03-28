# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__lava-gc-integration__setting__8Qm4Rt | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__lava-gc-integration__log__8Qm4Rt | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.

## Планируемые Heap-сущности (интеграция Lava + GetCourse)

По мере реализации — отдельные файлы в `tables/` и репозитории в `repos/`. Поля и смысл — [integration-data-model.md](./integration-data-model.md); платформенные замечания — [integration-implementation-chatium.md](./integration-implementation-chatium.md).

| Концепт таблицы | Назначение |
| --- | --- |
| `lava_payment_contract` | Связь заказа GetCourse с контрактом Lava, сумма, URL оплаты, статус |
| `lava_webhook_event` | Сырой webhook, дедупликация, флаг обработки |
| `lava_runtime_lock_log` (опционально) | Аудит блокировок критической секции |
