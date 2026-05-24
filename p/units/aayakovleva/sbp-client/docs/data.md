# Data

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__lifepay-sbp-client__setting__a9Hk2P | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__lifepay-sbp-client__log__b3Lm7R | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message, payload, severity, level, timestamp |
| t__lifepay-sbp-client__reqlog__c7Np4S | tables/requestLog.table.ts | Журнал исходящих вызовов payments-gateway (§1.8.1) | requestId (searchable), op, argsRedacted (хранится сырым, имя колонки оставлено), orderNumber (searchable), clientHttpStatus, ok, errorCode, lpHttpStatus, lpSemanticRule, lpNumericCode, durationMs, requestedAt, **rawResponseBody** (Heap.Any, полное тело ответа gateway, raw, без маскирования) |
| t__lifepay-sbp-client__whlog__d2Pq8T | tables/webhookLog.table.ts | Журнал входящих webhook от LifePay (§1.8.1, записывается только при валидном токене) | number (searchable), type, status, method, amount, orderNumber (searchable), tokenValid, duplicate, processedAt, **email** (Heap.Optional, сырой email; старое имя `emailMasked` удалено), **rawBody** (Heap.Optional Heap.Any, полное тело webhook, raw), **rawQuery** (Heap.Optional Heap.Any, query параметры с raw token) |
| t__lifepay-sbp-client__whidem__e8Rs1V | tables/webhookIdempotency.table.ts | Дедупликация webhook по transaction number (§1.8.3) | number (searchable), firstSeenAt |
| t__lifepay-sbp-client__paccess__g7Cy3M | tables/panelAccess.table.ts | Выданные доступы к панели для не-Admin (ADR 0003). **Реализовано 2026-05-24**, используется `repos/panelAccess.repo.ts`, `lib/access/*` | userId (searchable), grantedAt, grantedByUserId, inviteId, revokedAt?, revokedByUserId? |
| t__lifepay-sbp-client__pinvite__f4Wb9K | tables/panelInvites.table.ts | Одноразовые пригласительные токены (ADR 0003). **Реализовано 2026-05-24**, используется `repos/panelInvites.repo.ts`, `lib/access/*` | token (searchable), createdByUserId, createdAt, expiresAt, usedAt?, usedByUserId?, revokedAt?, note? |

## Таблицы внутренней авторизации (ADR 0003)

> ✅ **Реализовано 2026-05-24.** Механизм полностью написан: `repos/panelAccess.repo.ts`, `repos/panelInvites.repo.ts`, `lib/access/*` (requireInternalAccess, invites, constants, apiGuard). Все эндпоинты `api/lp/*` и главный роут `/` защищены `requireRealUser` + `requireInternalAccess`. Обоснование модели — [ADR 0003](ADR/0003-internal-access-control.md), полный норматив — [implementation-plan §1.11](../../../../saas/gw/lifepay/docs/gateway/implementation-plan.md).

Типы: `UserRefLink` плана выражен как `Heap.String` (ID пользователя), `DateTime` — как `Heap.Number` (Unix ms). Дедицированных Heap-типов в проекте нет (зеркало `requestLog.table.ts`, `webhookIdempotency.table.ts`).

### `panel_access` (`t__lifepay-sbp-client__paccess__g7Cy3M`, `tables/panelAccess.table.ts`)

Одна запись на пользователя, которому выдан доступ к панели. Admin Chatium-аккаунта проходит проверку `requireInternalAccess` **без** записи здесь.

| Поле | Тип | Описание |
|---|---|---|
| `userId` | String (searchable) | ID пользователя с доступом. Уникальность — на уровне приложения (`consumeInvite`, не Heap-схема). Searchable: основной путь чтения — поиск по ID при `requireInternalAccess`. |
| `grantedAt` | Number (Unix ms) | Момент выдачи доступа. |
| `grantedByUserId` | String | ID Admin'а, через инвайт которого выдан доступ. |
| `inviteId` | String | ID использованного инвайта (`panel_invites.id`, для аудита). |
| `revokedAt` | Optional Number | Момент отзыва (null = активен). Запись с непустым `revokedAt` недействительна → `requireInternalAccess` отдаёт 403. |
| `revokedByUserId` | Optional String | Кто отозвал (null = активен). |

Повторная выдача доступа тому же пользователю — **обновление** существующей записи (сброс `revokedAt`/`revokedByUserId`, новые `grantedAt`/`grantedByUserId`/`inviteId`).

### `panel_invites` (`t__lifepay-sbp-client__pinvite__f4Wb9K`, `tables/panelInvites.table.ts`)

Одноразовые пригласительные токены. Жизненный цикл: создан Admin → передан получателю → потреблён по `/web/access/invite` (проставлены `usedAt`/`usedByUserId`). До потребления ссылка валидна любое число открытий в пределах TTL и пока Admin не отозвал (см. норматив §1.11.4).

| Поле | Тип | Описание |
|---|---|---|
| `token` | String (searchable) | Токен ≥ 32 символа, генерируется `accountNanoid(ctx)`. Уникальность — на уровне приложения (`runWithExclusiveLock` при потреблении). Searchable: путь чтения — поиск по строке из query. |
| `createdByUserId` | String | ID Admin'а, создавшего инвайт. |
| `createdAt` | Number (Unix ms) | Момент создания. |
| `expiresAt` | Number (Unix ms) | `createdAt + INVITE_TTL_DAYS` (план — 7 дней, константа в `lib/access/constants.ts`). |
| `usedAt` | Optional Number | Момент потребления (null = не использован). |
| `usedByUserId` | Optional String | Кто использовал. |
| `revokedAt` | Optional Number | Момент отзыва Admin'ом (null = активен). |
| `note` | Optional String | Комментарий Admin'а при создании (например «для Ольги»). |

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
- `repos/panelAccess.repo.ts` — findByUserId, findActiveByUserId, upsertGrant (создать или реактивировать), revokeByUserId, findAll, deleteByUserId. (ADR 0003, реализовано 2026-05-24.)
- `repos/panelInvites.repo.ts` — findByToken, findById, create, markUsed, revokeById, findAll, deleteById. (ADR 0003, реализовано 2026-05-24.)

## Библиотеки (lib/)

- `lib/settings.lib.ts` — getSetting/getAllSettings/setSetting; ключи и дефолты; валидации `isValidLpLogin` (`^7\d{10}$`), `normalizeGatewayBaseUrl`, `isValidGatewayBaseUrl`; getLpApikey / getLpLogin / getLpWebhookToken / getGatewayBaseUrl; `generateWebhookToken(byteCount)`.
- `lib/logger.lib.ts` — без изменений: writeServerLog проверяет уровень, пишет в ctx.log, ctx.account.log, Heap, WebSocket, опц. webhook.
- `lib/gateway/constants.ts` — `INVOKE_TIMEOUT_MS = 15_000` (на 5 секунд больше gateway-таймаута 10 с), `RECENT_DEFAULT_LIMIT`, `RECENT_MAX_LIMIT`, `ANALYTICS_DEFAULT_WINDOW_HOURS`.
- `lib/gateway/buildInvokeUrl.ts` — чистая функция сборки URL `<base>/api/v1/<op>` + метода по `shared/gatewayContract`. Префикс `/api/` соответствует file-based роутингу gateway (`p/saas/gw/lifepay/api/v1/<op>.ts`).
- `lib/gateway/invokeClient.ts` — `invokeGateway(ctx, op, args)`: один исходящий вызов через `@app/request`, без серверных ретраев, без Idempotency-Key; читает секреты из Heap, заголовки `X-Lp-Apikey`/`X-Lp-Login`, тело JSON для POST или query для GET; `requestId` из заголовка `X-Gateway-Request-Id` ответа.
- `lib/gateway/recordRequestLog.ts` — запись результата invoke в Heap-таблицу `request_log`. `argsRedacted` и `rawResponseBody` хранятся **сырыми** (клиент — оператор ПД), структурная гигиена через `shared/prepareRawLog.prepareRawLog`. Для `rawResponseBody`: предпочтительно из `invoke.responseBody`; иначе пытается `JSON.parse(rawResponseBody)`; иначе пишет `{ __nonJson: true, __preview }`; для пустого ответа — `{ __noBody: true }`.
- `lib/webhook/processWebhook.ts` — `parseWebhookBody` (поля по apidoc.life-pay.ru/notification), `checkWebhookToken` (точное равенство строк).
- `shared/redactRaw.ts` — `redactRawDeep(value)` рекурсивно обходит JSON-дерево, удаляет ключи из SECRET_KEYS_DEEP (apikey/login/token/lp_*/authorization/cookie), маскирует значения PII_KEYS_DEEP (email/phone/passport/inn/snils/fio/address/...). Лимит `MAX_RAW_BYTES = 64 KB`; при превышении возвращает marker `{ __truncated: true, __originalBytes, __preview }`. Циклы → `__circular`, functions/symbols → `__nonSerializable`.
- `lib/access/constants.ts` — `INVITE_TTL_DAYS = 7`, `INVITE_TTL_MS`, константа `INTERNAL_ACCESS_DENIED`, `INVITE_CONSUME_LOCK_PREFIX`. (ADR 0003.)
- `lib/access/requireInternalAccess.ts` — класс `InternalAccessDeniedError`; чистая `decideInternalAccess(isAdmin, hasActiveGrant)`; `requireInternalAccess(ctx)` — Admin проходит всегда, не-Admin — только при активной записи в `panel_access`, иначе `InternalAccessDeniedError`. (ADR 0003.)
- `lib/access/invites.ts` — чистая `classifyInvite(invite, now)` (unknown/used/revoked/expired/valid); `generateInvite` (Admin-only, `accountNanoid` ≥ 32); `consumeInvite` (под `runWithExclusiveLock`, расходует инвайт только при успехе); `revokeInvite`; `revokeGrant`; `getInviteByToken`. (ADR 0003.)
- `lib/access/apiGuard.ts` — `guardInternalApi(ctx)`: `requireRealUser` + `requireInternalAccess`; при отказе возвращает HTTP 403/401 в объектной форме `{statusCode, rawHttpBody, headers}`. (ADR 0003.)

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- `requestId`, `orderNumber` в `request_log` — searchable.
- `number`, `orderNumber` в `webhook_log` — searchable.
- `number` в `webhook_idempotency` — searchable; уникальность поддерживается через `runWithExclusiveLock` + `findByField` + create (Heap-схема не выражает unique constraint напрямую).
- `userId` в `panel_access`, `token` в `panel_invites` — searchable (ADR 0003). Уникальность — на уровне приложения (см. план реализации ниже), Heap-схема её не выражает.

## План реализации внутренней авторизации (ADR 0003)

> **Зачем.** Закрыть auth-разрыв (аудит 24-05-2026): `api/lp/*` и `/` принимают запросы без проверки прав. Модель — `requireRealUser(ctx)` + `requireInternalAccess(ctx)`: Admin воркспэйса проходит всегда; не-Admin — только при активной записи в `panel_access`; доступ выдаётся одноразовой пригласительной ссылкой (`panel_invites`). Полный норматив (контракты функций, тексты страниц, тест-сценарии) — [implementation-plan §1.11](../../../../saas/gw/lifepay/docs/gateway/implementation-plan.md); этот раздел — рабочий чек-лист на стороне `sbp-client`.

**Статус на 24-05-2026:** ✅ **Реализовано полностью.** Все 11 шагов выполнены.

### Шаги (выполнено 2026-05-24)

1. ✅ **`lib/access/constants.ts`** — `INVITE_TTL_DAYS = 7`, `INVITE_TTL_MS`, `INTERNAL_ACCESS_DENIED`, `INVITE_CONSUME_LOCK_PREFIX`.
2. ✅ **`repos/panelAccess.repo.ts`** — findByUserId, findActiveByUserId, upsertGrant, revokeByUserId, findAll, deleteByUserId.
3. ✅ **`repos/panelInvites.repo.ts`** — findByToken, findById, create, markUsed, revokeById, findAll, deleteById.
4. ✅ **`lib/access/requireInternalAccess.ts`** — `InternalAccessDeniedError`, `decideInternalAccess`, `requireInternalAccess(ctx)`.
5. ✅ **`lib/access/invites.ts`** — `classifyInvite`, `generateInvite`, `consumeInvite` (под `runWithExclusiveLock`), `revokeInvite`, `revokeGrant`, `getInviteByToken`.
6. ✅ **`web/access/invite/index.tsx`** — страница `/web/access/invite?token=`, только `requireRealUser`. Переход не расходует инвайт; расход — только POST `/api/access/consume-invite`.
7. ✅ **`web/forbidden/index.tsx`** — страница 403 с понятным текстом.
8. ✅ **`api/access/*`** — consume-invite (requireRealUser), generate-invite / revoke-invite / revoke-grant / invites / grants (Admin).
9. ✅ **Миграция эндпоинтов** — `guardInternalApi(ctx)` вписан в начало всех 7 эндпоинтов `api/lp/*` и в `index.tsx`; ложные комментарии «Admin-only» удалены.
10. ✅ **UI «Доступ»** — вкладка в `pages/PanelHomePage.vue`, видна только при `isAdmin`; создание/отзыв инвайтов, список грантов.
11. ✅ **Не защищены (§1.11.9):** `POST /web/webhook`, `/web/access/invite`, `/web/forbidden`, `/web/login`, `/api/logger/*`.

### Критерий завершения — выполнен
- Анонимный на `/` и `api/lp/*` → редирект на вход; авторизованный без гранта → `/web/forbidden` (403); Admin или активный грант → доступ.
- Инвайт расходуется только по «Подтвердить»; повторное потребление заблокировано `runWithExclusiveLock`.
- Юниты (9 чистых в `lifepayUnitSuite.ts`) и интеграционные тесты (8 Heap-тестов в `integrationSuite.ts`) добавлены в блоки `unit-access` / `int-access` каталога (`shared/testCatalog.ts`).
