# Data

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__lifepay-sbp-client__setting__a9Hk2P | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__lifepay-sbp-client__log__b3Lm7R | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message, payload, severity, level, timestamp |
| t__lifepay-sbp-client__reqlog__c7Np4S | tables/requestLog.table.ts | Журнал исходящих вызовов payments-gateway (§1.8.1) | requestId (searchable), op, argsRedacted (хранится сырым, имя колонки оставлено), orderNumber (searchable), clientHttpStatus, ok, errorCode, lpHttpStatus, lpSemanticRule, lpNumericCode, durationMs, requestedAt, **rawResponseBody** (Heap.Any, полное тело ответа gateway, raw, без маскирования) |
| t__lifepay-sbp-client__whlog__d2Pq8T | tables/webhookLog.table.ts | Журнал входящих webhook от LifePay (§1.8.1, записывается только при валидном токене) | number (searchable), type, status, method, amount, orderNumber (searchable), tokenValid, duplicate, processedAt, **email** (Heap.Optional, сырой email; старое имя `emailMasked` удалено), **rawBody** (Heap.Optional Heap.Any, полное тело webhook, raw), **rawQuery** (Heap.Optional Heap.Any, query параметры с raw token) |
| t__lifepay-sbp-client__whidem__e8Rs1V | tables/webhookIdempotency.table.ts | Дедупликация webhook по transaction number (§1.8.3) | number (searchable), firstSeenAt |

## Настройки (Heap key-value)

Стандартные:
- `project_name` — отображаемое имя (default: `LifePay SBP Client`).
- `project_title` — заголовок (default: `LifePay SBP Client`).
- `log_level` (Debug / Info / Warn / Error / Disable).
- `logs_limit`.
- `log_webhook` (`{ enable, url }`).
- `dashboard_reset_at` (Unix ms).

LifePay-настройки (§1.8.1, валидируются в `lib/settings.lib.setSetting`):
- `lp_apikey` — API-ключ магазина LifePay (тип password, непустой после trim).
- `lp_login` — телефон владельца в формате `7XXXXXXXXXX` (11 цифр, первая 7).
- `lp_webhook_token` — случайный токен ≥ 32 символов (тип password, генерируется кнопкой «Сгенерировать» в панели).
- `gateway_base_url` — публичный базовый URL payments-gateway (http(s)://...).

Секреты в логи (`writeServerLog`, `argsRedacted`) **не пишутся**. В Heap значения хранятся как строки.

## Репозитории (repos/)

- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey.
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp, countBySeverityAfter / Errors / Warnings.
- `repos/requestLog.repo.ts` — create, findRecent, findBeforeRequestedAt, findByRequestId, **findById**, findRecentSince, countSince, countOkSince. Поле упорядочения — `requestedAt` (Unix ms, наше явное поле; не системное `createdAt`).
- `repos/webhookLog.repo.ts` — create, findRecent, **findById**, findByOrderNumber, countSince, countStatusSuccessSince, countTokenValidSince.
- `repos/webhookIdempotency.repo.ts` — tryRegister (через `runWithExclusiveLock` из `@app/sync`), findByNumber.

## Библиотеки (lib/)

- `lib/settings.lib.ts` — getSetting/getAllSettings/setSetting; ключи и дефолты; валидации `isValidLpLogin` (`^7\d{10}$`), `normalizeGatewayBaseUrl`, `isValidGatewayBaseUrl`; getLpApikey / getLpLogin / getLpWebhookToken / getGatewayBaseUrl; `generateWebhookToken(byteCount)`.
- `lib/logger.lib.ts` — без изменений: writeServerLog проверяет уровень, пишет в ctx.log, ctx.account.log, Heap, WebSocket, опц. webhook.
- `lib/gateway/constants.ts` — `INVOKE_TIMEOUT_MS = 15_000` (на 5 секунд больше gateway-таймаута 10 с), `RECENT_DEFAULT_LIMIT`, `RECENT_MAX_LIMIT`, `ANALYTICS_DEFAULT_WINDOW_HOURS`.
- `lib/gateway/buildInvokeUrl.ts` — чистая функция сборки URL `<base>/api/v1/<op>` + метода по `shared/gatewayContract`. Префикс `/api/` соответствует file-based роутингу gateway (`p/saas/gw/lifepay/api/v1/<op>.ts`).
- `lib/gateway/invokeClient.ts` — `invokeGateway(ctx, op, args)`: один исходящий вызов через `@app/request`, без серверных ретраев, без Idempotency-Key; читает секреты из Heap, заголовки `X-Lp-Apikey`/`X-Lp-Login`, тело JSON для POST или query для GET; `requestId` из заголовка `X-Gateway-Request-Id` ответа.
- `lib/gateway/recordRequestLog.ts` — запись результата invoke в Heap-таблицу `request_log`. `argsRedacted` и `rawResponseBody` хранятся **сырыми** (клиент — оператор ПД), структурная гигиена через `shared/prepareRawLog.prepareRawLog`. Для `rawResponseBody`: предпочтительно из `invoke.responseBody`; иначе пытается `JSON.parse(rawResponseBody)`; иначе пишет `{ __nonJson: true, __preview }`; для пустого ответа — `{ __noBody: true }`.
- `lib/webhook/processWebhook.ts` — `parseWebhookBody` (поля по apidoc.life-pay.ru/notification), `checkWebhookToken` (точное равенство строк).
- `shared/redactRaw.ts` — `redactRawDeep(value)` рекурсивно обходит JSON-дерево, удаляет ключи из SECRET_KEYS_DEEP (apikey/login/token/lp_*/authorization/cookie), маскирует значения PII_KEYS_DEEP (email/phone/passport/inn/snils/fio/address/...). Лимит `MAX_RAW_BYTES = 64 KB`; при превышении возвращает marker `{ __truncated: true, __originalBytes, __preview }`. Циклы → `__circular`, functions/symbols → `__nonSerializable`.

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- `requestId`, `orderNumber` в `request_log` — searchable.
- `number`, `orderNumber` в `webhook_log` — searchable.
- `number` в `webhook_idempotency` — searchable; уникальность поддерживается через `runWithExclusiveLock` + `findByField` + create (Heap-схема не выражает unique constraint напрямую).
