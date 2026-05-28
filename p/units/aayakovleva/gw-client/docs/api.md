# API

> Примечание (2026-05-28): в ходе технической декомпозиции (Phase B/B2/C) структура файлов страниц и тест-наборов изменилась. Поведение всех эндпоинтов, их пути, методы и авторизация не затронуты.

## Настройки (api/settings/)

| Method | Path                   | File                 | Auth  | Назначение                                   |
| ------ | ---------------------- | -------------------- | ----- | -------------------------------------------- |
| GET    | /api/settings/list     | api/settings/list.ts | Admin | Список всех настроек (с дефолтами)           |
| GET    | /api/settings/get?key= | api/settings/get.ts  | Admin | Получить одну настройку                      |
| POST   | /api/settings/save     | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`) |

Для `key`-ей `lp_apikey`, `lp_login`, `lp_webhook_token`, `gateway_base_url` валидация выполняется в `lib/settings.lib.setSetting` (см. `docs/data.md`).

## Логи (api/logger/, api/admin/logs/)

| Method | Path                   | File                     | Auth    | Назначение               |
| ------ | ---------------------- | ------------------------ | ------- | ------------------------ |
| POST   | /api/logger/log        | api/logger/log.ts        | AnyUser | Записать лог             |
| POST   | /api/logger/browser    | api/logger/browser.ts    | AnyUser | Браузерные логи пакетом  |
| GET    | /api/admin/logs/recent | api/admin/logs/recent.ts | Admin   | Последние N логов        |
| GET    | /api/admin/logs/before | api/admin/logs/before.ts | Admin   | N логов старше timestamp |

## Дашборд админки

| Method | Path                        | File                          | Auth  |
| ------ | --------------------------- | ----------------------------- | ----- |
| GET    | /api/admin/dashboard/counts | api/admin/dashboard/counts.ts | Admin |
| POST   | /api/admin/dashboard/reset  | api/admin/dashboard/reset.ts  | Admin |

## Тесты (api/tests/)

| Method | Path                   | File                           | Auth  | Назначение                                      |
| ------ | ---------------------- | ------------------------------ | ----- | ----------------------------------------------- |
| GET    | /api/tests/list        | api/tests/list.ts              | Admin | Каталог тестов                                  |
| GET    | /api/tests/unit        | api/tests/unit/index.ts        | Admin | Юнит-набор шаблона + LifePay (lifepayUnitSuite) |
| GET    | /api/tests/integration | api/tests/integration/index.ts | Admin | Интеграционный набор                            |

## Внутренняя авторизация (api/access/)

Управление доступом к панели: пригласительные ссылки и гранты (ADR 0003, §1.11). Реализовано 2026-05-24.

| Method | Path                        | File                          | Auth            | Назначение                                                                                                                            |
| ------ | --------------------------- | ----------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | /api/access/consume-invite  | api/access/consume-invite.ts  | requireRealUser | Потребить инвайт по токену (тело `{ token }`). Расходует инвайт и создаёт грант только при успехе; под `runWithExclusiveLock`.        |
| POST   | /api/access/generate-invite | api/access/generate-invite.ts | Admin           | Создать пригласительную ссылку (тело `{ note? }`). Возвращает `{ inviteId, token, fullUrl, expiresAt }`. Токен показывается один раз. |
| POST   | /api/access/revoke-invite   | api/access/revoke-invite.ts   | Admin           | Отозвать инвайт (тело `{ inviteId }`).                                                                                                |
| POST   | /api/access/revoke-grant    | api/access/revoke-grant.ts    | Admin           | Отозвать грант пользователя (тело `{ userId }`).                                                                                      |
| GET    | /api/access/invites         | api/access/invites.ts         | Admin           | Список инвайтов без поля `token`.                                                                                                     |
| GET    | /api/access/grants          | api/access/grants.ts          | Admin           | Список грантов (активных и отозванных).                                                                                               |

## LifePay (api/lp/, web/webhook)

Серверная прокладка к payments-gateway + журнал + аналитика + приёмник webhook (implementation-plan §1.8.2 — §1.8.4). Все эндпоинты `api/lp/*` защищены `requireRealUser` + `requireInternalAccess` через `guardInternalApi(ctx)` (ADR 0003 / §1.11.8, реализовано 2026-05-24).

| Method | Path                                                 | File                            | Auth                                    | Назначение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ---------------------------------------------------- | ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | /api/lp/invoke                                       | api/lp/invoke.ts                | requireRealUser + requireInternalAccess | Прокладка `{ gatewayId: 'lifepay' \| 'lavatop', op, args }` → `<base_url>/api/v1/<op>` соответствующего gateway. **`gatewayId` обязательно** (с 2026-05-28). Диспатчер выбирает клиент: LifePay (`X-Lp-Apikey`/`X-Lp-Login`, base = `gateway_base_url`) или Lava.Top (`X-Lava-Apikey`, base = `lava_base_url`). Возвращает тело gateway без изменений; `requestId` из `X-Gateway-Request-Id`. Журналирование в `request_log` с `gatewayId`, включая `correlationId` из `args` (LifePay-механизм связки с webhook). Без ретраев, без `Idempotency-Key`.                                                                                                                                                  |
| GET    | /api/lp/recent-requests?limit=                       | api/lp/recent-requests.ts       | requireRealUser + requireInternalAccess | Последние записи `request_log` в пределах глобального фильтра `panel_date_filter` (без полных тел). Ответ: `{ success, entries, hasMore }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| GET    | /api/lp/recent-webhooks?limit=                       | api/lp/recent-webhooks.ts       | requireRealUser + requireInternalAccess | Последние записи `webhook_log` в пределах глобального фильтра `panel_date_filter`. Ответ: `{ success, entries, hasMore }`. Поле `entries[].orderNumber` обогащается из связанного `request_log` по `correlationId`, если в самом webhook оно пустое (LifePay SBP-webhook не возвращает orderNumber). Поле `entries[].correlationId` возвращается. Поле `entries[].method` возвращается в ответе, но в UI-таблицах не отображается (убрана колонка «метод»).                                                                                                                                                                                                                                             |
| GET    | /api/lp/analytics/summary                            | api/lp/analytics/summary.ts     | requireRealUser + requireInternalAccess | Карточки аналитики за диапазон из глобального фильтра `panel_date_filter` (без параметра `windowHours`). Если фильтр не задан — все данные (до `ANALYTICS_SCAN_LIMIT = 5000`). Ответ: `dateFilter: { from, to }` (null если граница не задана) + `orders { created, paid, createdSum, paidSum }` + `requests { total, okShare, avgDurationMs, p95DurationMs, topErrorCode, topErrorCount }` + `webhooks { total, successShare, tokenValidShare }`.                                                                                                                                                                                                                                                      |
| POST   | /api/lp/analytics/filter-save                        | api/lp/analytics/filter-save.ts | requireRealUser + requireInternalAccess | Сохранить или сбросить глобальный фильтр панели. Тело: `{ from?: number\|null, to?: number\|null }` (Unix ms). Обе границы отсутствуют или null → сброс. Валидация: число > 0; при обеих заданных `from <= to`; иначе 400. Ответ: `{ success, filter: null \| { from?, to? } }`.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GET    | /api/lp/search-by-request-id?requestId=              | api/lp/search-by-request-id.ts  | requireRealUser + requireInternalAccess | `request_log` + связанные `webhook_log`. Связка выполняется по двум ключам одновременно: `correlationId` (основной путь, надёжный) и `orderNumber` (исторический путь). Результаты объединяются без дублей (`mergeWebhooksById`). Поиск работает в пределах глобального фильтра `panel_date_filter`. Ответ включает `request.correlationId` и `webhook[].correlationId`.                                                                                                                                                                                                                                                                                                                                |
| GET    | /api/lp/raw-request?id=\<heapId\>\|requestId=\<rid\> | api/lp/raw-request.ts           | requireRealUser + requireInternalAccess | Полная raw-запись `request_log` со всеми полями включая `rawResponseBody`. Если задан `id` — приоритет по нему; иначе по `requestId`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| GET    | /api/lp/raw-webhook?id=\<heapId\>                    | api/lp/raw-webhook.ts           | requireRealUser + requireInternalAccess | Полная raw-запись `webhook_log` включая `rawBody` и `rawQuery` (token замаскирован). Дополнительно возвращает `linkedRequests` и `relatedWebhooks`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| POST   | /webhook?token=&correlationId=                       | web/webhook/index.tsx           | Анонимный + токен                       | Приёмник webhook от LifePay. Сверка токена в query; расхождение/отсутствие → 401/403 без тела и без записи. При валидном → `correlationId` извлекается из query (`extractCorrelationId`); `unwrapWebhookBody` снимает обёртку `data`, `parseWebhookBody` извлекает `number/type/status/method/amount/order.number/email`; запись в `webhook_log` с `gatewayId='lifepay'` (включая `correlationId`, `rawBody`/`rawQuery` через `prepareRawLog` — сырые, без PII-маски) + дедупликация по `number` через `webhook_idempotency`, ответ 200 OK. MD5-подпись webhook **не** проверяется. LifePay-ретраи: 1/3/5/10 мин, далее раз в час, до 10 попыток — дедупликация по `number` защищает от двойного учёта. |
| GET    | /webhook-lavatop                                     | web/webhook-lavatop/index.tsx   | Анонимный                               | Проверка доступности приёмника Lava.Top. Возвращает `{ ok, status: 'ready', webhookSecretConfigured }` без раскрытия секрета.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| POST   | /webhook-lavatop                                     | web/webhook-lavatop/index.tsx   | Анонимный + секрет (X-Api-Key / Basic)  | Приёмник webhook Lava.Top. Авторизация — `X-Api-Key` или Basic Authorization, значение должно совпадать с `lava_webhook_secret`. Без секрета — 503; неверная авторизация — 401; некорректное тело — 400. При валидном — запись в `webhook_log` с `gatewayId='lavatop'` и `gatewayExternalId=contractId`; дедупликация через `webhook_idempotency` по композитному ключу `lavatop:contractId:eventType:status` (`tryRegister`). Ответ 200 `{ success: true, duplicate }`.                                                                                                                                                                                                                                |

### Контракт `/api/lp/invoke`

Запрос (LifePay):

```json
{
  "gatewayId": "lifepay",
  "op": "createBill",
  "args": {
    "orderNumber": "A1",
    "amount": 1.0,
    "customerEmail": "x@y.z",
    "description": "...",
    "callbackUrl": "https://.../webhook?token=...&correlationId=<uuid>",
    "correlationId": "<uuid>"
  }
}
```

Запрос (Lava.Top):

```json
{
  "gatewayId": "lavatop",
  "op": "createInvoice",
  "args": {
    "email": "buyer@example.com",
    "offerId": "...",
    "currency": "RUB",
    "callbackUrl": "https://.../webhook-lavatop"
  }
}
```

`gatewayId` обязательно (с 2026-05-28). Допустимые значения определяются `SUPPORTED_GATEWAYS` (`shared/invokeApi.ts`).

`correlationId` в `args` извлекается сервером и сохраняется в `request_log`; в тело запроса к gateway **не** передаётся (отделяется перед вызовом). Для LifePay `callbackUrl` с `correlationId` в query доходит до LifePay и возвращается приёмнику webhook. Для Lava.Top связка через `contractId` (см. webhook ниже).

Ответ (общий для обоих гейтвеев, зеркало gateway §9.1):

- Успех: `{ "ok": true, "data": {...}, "requestId": "..." }`.
- Ошибка: `{ "ok": false, "error": { "code": "...", "message": "...", "details": {...} }, "requestId": "..." }`.

Локальные коды ошибок прокладки (до сетевого вызова):

- `INVOKE_GATEWAY_REQUIRED` (HTTP 400) — `gatewayId` не указан.
- `INVOKE_GATEWAY_UNKNOWN` (HTTP 400) — `gatewayId` не из `SUPPORTED_GATEWAYS`.
- `INVOKE_SETTINGS_MISSING` (HTTP 503) — для LifePay не настроены `lp_apikey`/`lp_login`/`gateway_base_url`; для Lava.Top — `lava_test_apikey`/`lava_base_url`.
- `INVOKE_OP_UNKNOWN` (HTTP 400) — операция не входит в каталог указанного гейтвея.
- `INVOKE_PROXY_BODY_INVALID` (HTTP 400) — тело запроса некорректно.

Коды от LifePay-gateway транзитом: `INVOKE_LP_TIMEOUT`, `INVOKE_LP_NETWORK_ERROR`, `INVOKE_LP_UPSTREAM_ERROR`, `INVOKE_LP_SEMANTIC_ERROR` (с `details.lpRule`, `details.lpNumericCode`, `details.lpHttpStatus`) и др. — см. `p/saas/gw/lifepay/lib/gateway/gatewayErrors.ts`.

Коды от Lava.Top-gateway транзитом: `INVOKE_LAVA_TIMEOUT`, `INVOKE_LAVA_NETWORK_ERROR` + публичные коды контура `invoices_v1` (см. `p/saas/gw/lavatop/lib/gateway/gatewayErrors.ts`).

### Контракт `/webhook`

Внешний (LifePay → клиент), контракт — `../project-docs/knowledge/lifepay/webhooks.md` §1:

- Метод: `POST`. Транспорт — `multipart/form-data` с единственным текстовым полем
  `data` (JSON-строка транзакции), подтверждён живым webhook 2026-05-20. Подпись
  LifePay не публикует — аутентификация только токеном в query.
- Query: `?token=<lp_webhook_token>`.
- Чтение тела (`web/webhook/index.tsx`) — канонический `req.formData()` (Chatium native
  multipart с патча 18-05-2026, см. `../project-docs/knowledge/chatium/multipart-form-data.md`).
  Порядок источников с фоллбэками:
  1. `req.formData()` → поле `data` (`readWebhookDataField`) — основной путь LifePay;
  2. `req.body` → `unwrapWebhookBody` (если придёт `application/json` или
     `x-www-form-urlencoded`, в т.ч. обёртка `{data:"<json>"}` / `{"data":{...}}`);
  3. сырое тело строкой → `extractDataFromRawMultipart` (защитный фоллбэк, если
     `req.formData()` недоступен в рантайме).
     Выбранный источник и стратегия пишутся в лог `webhook_payload_parsed`
     (`source`, `strategy`).
- Поля payload (внутри `data`): `number`, `original_number`, `type` (payment/refund),
  `status` (success/fail), `method` (card / cash / recurrent / internetAcquiring /
  mobileInternetAcquiring), `terminal_serial`, `recipient_inn`, `operator_login`,
  `operator_name`, `amount`, `tip_amount`, `discount_amount`, `description`,
  `phone`, `email`, `pan`, `cardholder`, `rrn`, `lat`, `lng`, `created` (ISO 8601),
  `purchase[]` (позиции), `order` (`ext_id`, `number`, `name`, `phone`, `email`,
  `comment`, `barcode`), `add_fields`, `original_add_fields`.
- В Heap-таблице `webhook_log` под отдельными колонками хранятся `number`,
  `type`, `status`, `method`, `amount`, `orderNumber` (из `order.number`),
  `email` — остальное доступно через `rawBody` (Heap.Any, raw).

Поведение:

- `lp_webhook_token` пуст в Heap → 503, без тела, без записи.
- Токен отсутствует в query → 401, без тела, без записи.
- Токен не совпадает → 403, без тела, без записи (значение в логи не попадает).
- Токен валиден → запись в `webhook_log` (`tokenValid: true`, `duplicate` по результату дедупа), ответ 200 OK с `OK`.
- Бизнес-исход: обновление заказа в GetCourse допустимо только при `type='payment'`
  - `status='success'` (`isSuccessfulPayment`). В Прототипе обработка заканчивается
    журналом; флаг `eligibleForOrderUpdate` пишется в лог `webhook_done` для будущего
    downstream-вызова (MVP §2.8).
- При не-200 ответе LifePay повторяет webhook: 1 мин, 3 мин, 5 мин, 10 мин,
  далее раз в час, всего не более 10 попыток. Поэтому даже при ошибке записи
  в журнал отвечаем 200 OK — дедупликация по `number` через `webhook_idempotency`
  защищает от двойного учёта на стороне клиента.

## Публичные эндпоинты и страницы доступа

| Method | Path                      | File                        | Auth                                         | Назначение                                                                                                              |
| ------ | ------------------------- | --------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| POST   | /web/webhook              | web/webhook/index.tsx       | Анонимный + токен в query                    | Приёмник webhook LifePay                                                                                                |
| GET    | /web/access/invite?token= | web/access/invite/index.tsx | requireRealUser                              | Страница подтверждения инвайта. Переход по ссылке не расходует инвайт; расход — только POST /api/access/consume-invite. |
| GET    | /web/forbidden            | web/forbidden/index.tsx     | requireRealUser                              | Страница 403 «Нет доступа к панели».                                                                                    |
| GET    | /web/tests                | web/tests/index.tsx         | Admin (requireRealUser + requireAccountRole) | Страница тестов. Аноним → /web/login, авторизованный без роли Admin → /web/forbidden.                                   |
