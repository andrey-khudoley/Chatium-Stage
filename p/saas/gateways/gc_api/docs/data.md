# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__gc-api-gateway__setting__8Gp3Qw | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__gc-api-gateway__log__6Km9Xp | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__gc-api-gateway__school__7Np2Qx | tables/gatewaySchool.table.ts | Школа клиента gateway | schoolId, schoolSlug, зашифрованный API key школы, hash/salt Bearer, allowedOps?, isEnabled, … |
| t__gc-api-gateway__opcat__8Mq3Wy | tables/opCatalog.table.ts | Каталог op (схемы args, circuit, флаги) | op, circuit, argsSchemaJson, gcMethod?, gcPath?, deprecated, disabled, … |
| t__gc-api-gateway__reqlog__9Kr4Ez | tables/requestLog.table.ts | Лог вызовов `/v1/invoke` | correlationId, schoolId, op, status, latencyMs, errorCode?, … |
| t__gc-api-gateway__openapi__1Jv5Ua | tables/openapiCache.table.ts | Кеш JSON OpenAPI GC | key, json, version, fetchedAt |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).
- `repos/gatewaySchool.repo.ts`, `repos/opCatalog.repo.ts`, `repos/requestLog.repo.ts`, `repos/openapiCache.repo.ts` — CRUD для gateway ([ADR-0004](ADR/0004-key-encryption-strategy.md), [ADR-0006](ADR/0006-openapi-as-ssot.md)).

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация); ключи секретов gateway (`gateway_master_key`, `gc_dev_key_encrypted`, `onboarding_token`).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).
- `lib/crypto.lib.ts`, `lib/authToken.lib.ts`, `lib/secretSettings.lib.ts`, `lib/gatewaySchoolSecrets.lib.ts` — шифрование и токены ([ADR-0004](ADR/0004-key-encryption-strategy.md), [ADR-0005](ADR/0005-bearer-token-rotation.md)).
- `lib/openapiLoader.lib.ts`, `lib/catalogBuilder.lib.ts`, `lib/catalogEnsure.lib.ts`, `lib/openapiSchema.lib.ts` — каталог и OpenAPI.
- `lib/gcClients/*`, `lib/opMapper.lib.ts`, `lib/errorNormalizer.lib.ts`, `lib/argsValidator.lib.ts`, `lib/jsonSchemaValidate.lib.ts` — вызов GC и валидация.
- `lib/requestLogger.lib.ts`, `lib/legacyExportLimit.lib.ts` — учёт вызовов и лимиты Legacy.

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
