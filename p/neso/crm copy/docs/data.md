# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__neso-crm__setting__M4n8Tx | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__neso-crm__log__K7v2Pq | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__neso-crm__client__H3k9Lm | tables/clients.table.ts | Клиенты (контрагенты) | name, phone, email, assignee (id), source, tags (any) |
| t__neso-crm__inquiry__R2w5Yz | tables/inquiries.table.ts | Обращения (заявки) клиентов по каналам | client (RefLink→clients), channel, channelExternalId, status, unread (0/1), assignee, tags (any) |
| t__neso-crm__inquiryMessage__X9m3Np | tables/inquiryMessages.table.ts | Сообщения в рамках обращения | inquiry (RefLink→inquiries), author, text, timestamp (Unix ms), type (incoming/outgoing/system), sendState (опц.) |

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
