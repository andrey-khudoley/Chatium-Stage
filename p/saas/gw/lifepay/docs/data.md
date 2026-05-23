# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__saas-gw-lifepay__setting__L4p9Vx | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__saas-gw-lifepay__log__M2k8Rj | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |
| t__saas-gw-lifepay__greq__G4n2Lp | tables/gatewayRequestLog.table.ts | Журнал входящих запросов клиентов к gateway (одна запись на каждый `POST /api/v1/{op}`) | requestId (searchable), op (searchable), contour, method, rawArgs (Heap.Any, PII-маска), rawHeadersSafe (Heap.Any, без секретов), clientHttpStatus, errorCode, durationMs, requestedAt |
| t__saas-gw-lifepay__gups__U7q3Mn | tables/gatewayUpstreamLog.table.ts | Журнал исходящих вызовов gateway → LifePay (на каждое реальное обращение через `lib/gateway/lifePayClient.ts`) | requestId (searchable), op (searchable), upstreamKind (json_ok/upstream_status/upstream_parse_error/network_error/timeout), rawLpJson (Heap.Any, полное тело LifePay с PII-маской или marker `{ __kind, lpHttpStatus, __rawText }`), lpHttpStatus, semanticRule, durationMs, sentAt |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).
- `repos/gatewayRequestLog.repo.ts` — create, findRecent, findById, findByRequestId, countSince, countErrorsSince.
- `repos/gatewayUpstreamLog.repo.ts` — create, findRecent, findById, findByRequestId, countSince, countOkSince.

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog (проверка уровня, запись в ctx.log/ctx.account.log, Heap, WebSocket, вебхук).
- `lib/gateway/lifePayClient.ts` — `lifePayPostJson`/`lifePayGetJson`: вызовы к LifePay через `@app/request`. Возвращает дискриминированный `LpClientResult` с `lpRawText` (обрезан до 64KB) для `json_ok`/`upstream_status`/`upstream_parse_error`.
- `lib/gateway/handleV1Op.ts` — общая цепочка обработки `/v1/{op}`. Заводит локальный `GatewayLogCtx`, заполняет его по ходу выполнения (`contour`, `method`, `rawArgs`, `rawHeadersSafe`, `upstream`), и в `finally`-блоке внешней функции вызывает `writeGatewayLogs` — запись `gatewayRequestLog` (всегда) + `gatewayUpstreamLog` (если был upstream-вызов). Try/catch на каждый repo-вызов, чтобы лог не валил основной поток.
- `shared/redactRaw.ts` — `redactRawDeep(value)`: рекурсивная PII-маска и удаление секретов. SECRET_KEYS_DEEP (apikey/login/token/authorization/cookie/lp_*/x-lp-*); PII_KEYS_DEEP (email/phone/passport/inn/snils/fio/address/...). Лимит `MAX_RAW_BYTES = 64 KB` с усечением до marker `{ __truncated: true, __originalBytes, __preview }`. Циклы → `__circular`, functions/symbols → `__nonSerializable`. Файл синхронизирован с `p/units/aayakovleva/sbp-client/shared/redactRaw.ts`.

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- `requestId`, `op` в `gatewayRequestLog` и `gatewayUpstreamLog` — searchable.
