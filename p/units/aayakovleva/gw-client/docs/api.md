# API

> Примечание (2026-05-28): в ходе технической декомпозиции (Phase B/B2/C) структура файлов страниц и тест-наборов изменилась. Поведение всех эндпоинтов, их пути, методы и авторизация не затронуты.

## Настройки (api/settings/)

| Method | Path                   | File                 | Auth  | Назначение                                   |
| ------ | ---------------------- | -------------------- | ----- | -------------------------------------------- |
| GET    | /api/settings/list     | api/settings/list.ts | Admin | Список всех настроек (с дефолтами)           |
| GET    | /api/settings/get?key= | api/settings/get.ts  | Admin | Получить одну настройку                      |
| POST   | /api/settings/save     | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`) |

Для `key`-ей `lp_apikey`, `lp_login`, `lp_webhook_token`, `gateway_base_url` (LifePay), `lava_test_apikey`, `lava_base_url`, `lava_webhook_secret` (Lava.Top) и `gc_base_url`, `gc_test_school_api_key`, `gc_test_school_host`, `gc_enabled` (GC) валидация выполняется в `lib/settings.mutations.setSetting` (см. `docs/data.md`). В exit-логе маскируются `lava_test_apikey`, `lava_webhook_secret`, `gc_test_school_api_key`.

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
| POST   | /api/lp/invoke                                       | api/lp/invoke.ts                | requireRealUser + requireInternalAccess | Прокладка `{ gatewayId: 'lifepay' \| 'lavatop' \| 'gc', op, args, httpMethod? }` → `<base_url>/api/v1/<op>` соответствующего gateway. **`gatewayId` обязательно**. Диспатчер выбирает клиент: LifePay (`X-Lp-Apikey`/`X-Lp-Login`, base = `gateway_base_url`), Lava.Top (`X-Lava-Apikey`, base = `lava_base_url`) или GC (`X-Gc-School-Api-Key`/`X-Gc-School-Host`, base = `gc_base_url`). Для `gatewayId: 'gc'` `httpMethod` обязателен (`'GET'` или `'POST'`); op проходит `validateGcOpName` (SSRF-защита). Возвращает тело gateway без изменений; `requestId` из `X-Gateway-Request-Id`. Журналирование в `request_log` с `gatewayId`. Без ретраев, без `Idempotency-Key`.                          |
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
| POST   | /api/lp/payment-socket                               | api/lp/payment-socket.ts        | requireRealUser + requireInternalAccess | Выдаёт `encodedSocketId` для подписки на канал уведомлений об оплате (`@app/socket`). Тело: `{ correlationId: string }` (1–128 символов, `[A-Za-z0-9._:-]`). Ответ: `{ success, channel, encodedSocketId }`. Имя сырого канала — `gw-client-payment-<correlationId>` (`shared/paymentSocket.ts`). Сервер публикует сообщение `{ type: 'payment', data: {...} }` в этот канал при получении соответствующего webhook (см. `web/webhook` и `web/webhook-lavatop`). 400 `PAYMENT_SOCKET_CORRELATION_ID_INVALID` — невалидный/пустой correlationId.                                                                                                                                                         |

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

Запрос (GetCourse):

```json
{
  "gatewayId": "gc",
  "op": "someOperation",
  "httpMethod": "POST",
  "args": { ... }
}
```

`gatewayId` обязательно. `httpMethod` обязателен для GC. Допустимые значения `gatewayId` определяются `SUPPORTED_GATEWAYS` (`shared/invokeApi.ts`): `['lifepay', 'lavatop', 'gc']`.

`correlationId` в `args` извлекается сервером и сохраняется в `request_log`; в тело запроса к gateway **не** передаётся (отделяется перед вызовом). Для LifePay `callbackUrl` с `correlationId` в query доходит до LifePay и возвращается приёмнику webhook. Для Lava.Top связка через `contractId` (см. webhook ниже).

Ответ (общий для обоих гейтвеев, зеркало gateway §9.1):

- Успех: `{ "ok": true, "data": {...}, "requestId": "..." }`.
- Ошибка: `{ "ok": false, "error": { "code": "...", "message": "...", "details": {...} }, "requestId": "..." }`.

Локальные коды ошибок прокладки (до сетевого вызова):

- `INVOKE_GATEWAY_REQUIRED` (HTTP 400) — `gatewayId` не указан.
- `INVOKE_GATEWAY_UNKNOWN` (HTTP 400) — `gatewayId` не из `SUPPORTED_GATEWAYS`.
- `INVOKE_SETTINGS_MISSING` (HTTP 503) — для LifePay не настроены `lp_apikey`/`lp_login`/`gateway_base_url`; для Lava.Top — `lava_test_apikey`/`lava_base_url`; для GC — `gc_base_url`/`gc_test_school_api_key`/`gc_test_school_host`.
- `INVOKE_OP_UNKNOWN` (HTTP 400) — операция не входит в каталог указанного гейтвея.
- `INVOKE_HTTP_METHOD_REQUIRED` (HTTP 400) — для GC не указан `httpMethod`.
- `INVOKE_HTTP_METHOD_INVALID` (HTTP 400) — для GC `httpMethod` не `'GET'` или `'POST'`.
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

### Контракт socket-уведомлений об оплате

Реальный поток: магазинный JS получает `encodedSocketId` через
`POST /api/lp/payment-socket` и подписывается на канал через
`getOrCreateBrowserSocketClient().subscribeToData(encodedSocketId)`. Сервер
публикует сообщение в канал из webhook-приёмников после успешной (не-дубль)
записи в `webhook_log`. Дубли (LifePay ретраит 10 раз) защищаются на стороне
сервера через `webhook_idempotency` — сообщение публикуется один раз.

Имя сырого канала: `gw-client-payment-<correlationId>`. Ключ `correlationId`:

- LifePay — берётся из query callbackUrl (`extractCorrelationId(queryObj)`,
  `shared/correlation.ts`). Магазин обязан передать `correlationId` в args
  при `createBill` — иначе ни связки с request_log, ни socket-уведомления.
- Lava.Top — берётся из поля `clientOrderId` тела вебхука (Lava.Top возвращает
  его как есть). Магазин обязан передать `clientOrderId` в args при
  `createInvoice` — иначе аналогично.

Формат сообщения (`PaymentSocketMessage`, `shared/paymentSocket.ts`):

```json
{
  "type": "payment",
  "data": {
    "gatewayId": "lifepay" | "lavatop",
    "correlationId": "<тот же ключ>",
    "status": "success" | "fail" | "<иной>",
    "eventType": "payment" | "refund" | "<eventType Lava.Top>",
    "externalId": "<id транзакции upstream>",
    "orderNumber": "<orderNumber/clientOrderId, если есть>",
    "amount": "1.00",
    "timestamp": 1716985200000
  }
}
```

Если `correlationId` пустой / невалидный — публикация в канал не делается,
но запись в `webhook_log` всё равно сохраняется (поведение приёмников не
ломается отсутствием подписчика).

## Публичные эндпоинты и страницы доступа

| Method | Path                      | File                        | Auth                                         | Назначение                                                                                                              |
| ------ | ------------------------- | --------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| POST   | /web/webhook              | web/webhook/index.tsx       | Анонимный + токен в query                    | Приёмник webhook LifePay                                                                                                |
| GET    | /web/access/invite?token= | web/access/invite/index.tsx | requireRealUser                              | Страница подтверждения инвайта. Переход по ссылке не расходует инвайт; расход — только POST /api/access/consume-invite. |
| GET    | /web/forbidden            | web/forbidden/index.tsx     | requireRealUser                              | Страница 403 «Нет доступа к панели».                                                                                    |
| GET    | /web/tests                | web/tests/index.tsx         | Admin (requireRealUser + requireAccountRole) | Страница тестов. Аноним → /web/login, авторизованный без роли Admin → /web/forbidden.                                   |

## Виджеты оплаты (api/widgets/)

Публичные и admin-эндпоинты для встраиваемых виджетов на стороннюю страницу магазина. Реализовано 2026-05-29.

> CORS-стратегия: simple-request без preflight (`Content-Type: text/plain`, тело — JSON-строка). Сервер парсит тело вручную. Заголовки CORS выставляются только при допустимом Origin (проверка через `shared/widgetCorsCheck.ts`).

| Method | Path                           | File                             | Auth                                                           | Назначение                                                                                                                                                                                                                                                                                                                                        |
| ------ | ------------------------------ | -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /api/widgets/config            | api/widgets/config.ts            | Публичный (CORS)                                               | Возвращает `WidgetPublicConfig` для виджетов. CORS-whitelist — объединение `widget_lifepay_domains` + `widget_lavatop_domains`. 403 при недопустимом Origin. Тело: `{ lifepay: { enabled, maxAmount }, lavatop: { enabled, maxAmount }, offerListType, offers: AllowedOffer[] }`. Поле `offers` — массив объектов `{id,title}` (новый формат с 2026-06-01; парсится из `widget_lifepay_offers` / `widget_lavatop_offers` с legacy-fallback на `widget_offer_ids`). |
| POST   | /api/widgets/intent-lifepay    | api/widgets/intent-lifepay.ts    | Публичный (CORS, `widget_lifepay_domains`)                     | Создать платёжное намерение LifePay. Парсит `text/plain`-тело. Серверный hard-limit `WIDGET_INTENT_HARD_LIMIT_RUB = 500 000 ₽` (применяется до per-user-max). Email/regex/orderNumber/description/callbackUrl формируются на сервере. Вызов `invokeByGateway('lifepay', 'createBill')`. Audit-лог через `loggerLib`. 403 при недопустимом Origin. Серверный offer-фильтр (одиночный `offerId`) удалён — двухуровневая проверка позиций реализована в `intent-by-deal`. |
| POST   | /api/widgets/intent-lavatop    | api/widgets/intent-lavatop.ts    | Публичный (CORS, `widget_lavatop_domains`)                     | **Deprecated** (offer-поток). Создать платёжное намерение Lava.Top. `email` и `offerId` обязательны; `amount` — опционален. Вызов `invokeByGateway('lavatop', 'createInvoice')`. `offerId` как продуктовый параметр `createInvoice` сохранён. Серверный offer-фильтр (одиночный) удалён; двухуровневая проверка — в `intent-by-deal`.                                                                                                                          |
| POST   | /api/widgets/intent-by-deal    | api/widgets/intent-by-deal.ts    | Публичный (CORS, `widget_lifepay_domains` или `widget_lavatop_domains` по методу) | Создать платёжное намерение по GetCourse deal id. Тело (`text/plain` JSON): `{ dealId: string\|number, method?: 'lifepay'\|'lavatop', currency?: 'RUB'\|'USD'\|'EUR' }`. `currency` только для Lava.Top. Поток LifePay: `resolveGcDeal` → **`areAllOffersAllowed`** (позиции из `getDealFields.positions`) → `invokeByGateway('lifepay','createBill')` (только RUB). Поток Lava.Top: аналогичная проверка → `convertRubTo` → `runWithExclusiveLock` → `updateOfferPrice` → `createInvoice` → `paymentUrl`. При запрещённой позиции — **403 `WIDGET_OFFER_NOT_ALLOWED`**. `orderNumber`/`correlationId` детерминированы: `gcdeal-{dealId}`. PII (email) в ответ не включается. |
| GET    | /api/widgets/settings-get      | api/widgets/settings-get.ts      | Сотрудник + Admin (`guardInternalApi`, `// @shared-route`)     | Возвращает `WidgetSettingsData` с текущими значениями 12 виджет-ключей для Vue-формы в `HomeWidgetSettings.vue` (вкладка «Настройки» главной).                                                                                                                                                                                                    |
| POST   | /api/widgets/settings-save     | api/widgets/settings-save.ts     | Сотрудник + Admin (`guardInternalApi`, `// @shared-route`)     | Сохранить одну виджет-настройку. Тело: `{ key, value }`. Whitelist: только 12 ключей из `WIDGET_SETTING_KEYS`. Делегирует `setSetting(ctx, key, value)`. Виджет-настройки — operational/бизнес, не секреты.                                                                                                                                       |
| GET    | /api/widgets/offers            | api/widgets/offers.ts            | Сотрудник + Admin (`guardInternalApi`, `// @shared-route`)     | Проксирует `getOffers` GetCourse. При `gc_enabled=false` → `GC_DISABLED`; при пустых GC-настройках → `GC_NOT_CONFIGURED`. Используется `HomeWidgetSettings` для загрузки списка офферов с чекбоксами.                                                                                                                                             |
| POST   | /api/settings/save-operational | api/settings/save-operational.ts | Сотрудник + Admin (`guardInternalApi`, `// @shared-route`)     | Сохранить одну operational-настройку. Тело: `{ key, value }`. Whitelist: `gc_enabled` (расширяется по мере добавления новых operational-ключей). Делегирует `setSetting(ctx, key, value)`. Используется `HomeSettingsTab.vue` для тоггла GC.                                                                                                       |

### Контракт `/api/widgets/intent-lifepay`

Запрос (body в виде JSON-строки, `Content-Type: text/plain`):

```json
{ "amount": 1500.0, "email": "buyer@example.com", "orderNumber": "ORD-001" }
```

Ответ (успех, зеркало gateway):

```json
{ "ok": true, "data": { "paymentUrl": "https://..." }, "requestId": "..." }
```

### Контракт `/api/widgets/intent-lavatop`

Запрос:

```json
{ "email": "buyer@example.com", "offerId": "offer-uuid", "amount": 1500.0 }
```

Ответ — аналогично invoke, `data.paymentUrl` содержит URL формы оплаты.

### Контракт `/api/widgets/intent-by-deal`

Запрос (body в виде JSON-строки, `Content-Type: text/plain`):

```json
{ "dealId": "12345", "method": "lifepay" }
```

Для Lava.Top:

```json
{ "dealId": "12345", "method": "lavatop", "currency": "USD" }
```

`method` опционален (по умолчанию `'lifepay'`). `currency` (только для `method: 'lavatop'`): `'RUB'` | `'USD'` | `'EUR'`; опционален, по умолчанию — `'RUB'`. Неизвестное `method` → `WIDGET_GC_METHOD_UNSUPPORTED` (HTTP 422).

Ответ (успех):

```json
{
  "ok": true,
  "paymentUrl": "https://...",
  "orderNumber": "gcdeal-12345",
  "correlationId": "gcdeal-12345",
  "requestId": "..."
}
```

PII (email покупателя) в ответ **не включается**. Поток резолвинга на сервере:

**LifePay (`method: 'lifepay'`, только RUB):**

1. `resolveGcDeal(ctx, dealId)` (`lib/gateway/gcDealResolver.ts`) — `getDealFields` → `getUserFields` через GC-гейтвей; извлекает из двойной обёртки `responseBody.data.data`.
2. Проверки: сделка найдена, не оплачена, валюта RUB, email присутствует, сумма в пределах hard-limit + min/max.
3. `invokeByGateway('lifepay','createBill')` с суммой/валютой от GC.

**Lava.Top (`method: 'lavatop'`, RUB/USD/EUR):**

1. Аналогичный `resolveGcDeal` — сумма/email из GC (рублёвый `cost`).
2. Проверки сделки + фильтр суммы (hard-limit + `widget_lavatop_min`/`widget_lavatop_max` по рублёвому `cost`).
3. `convertRubTo(cost, currency)` (`lib/rates/currencyConverter.ts`) — для RUB тождество; для USD/EUR: ручной курс из настроек (`widget_lavatop_manual_rate_usd`/`eur`) приоритетнее, иначе курс ЦБ РФ (cbr-xml-daily.ru через `@app/request`). Возвращает `{ok, amount, rate, source: 'identity'|'manual'|'cbr'}`.
4. Проверка `MIN_AMOUNT` по валюте (RUB 10, USD 1, EUR 1).
5. `runWithExclusiveLock('lavatop-offer:'+offerId)` → `updateOfferPrice(offerId, productId, amount, currency)` → `createInvoice(offerId, email, currency)` → `paymentUrl`. `clientOrderId = 'gcdeal-{dealId}'`.

Предусловия Lava.Top deal-потока: `widget_lavatop_offer_id` + `widget_lavatop_product_id` заданы; оффер поддерживает RUB/USD/EUR; домен GC-страницы в `widget_lavatop_domains`.

### Коды ошибок виджетных эндпоинтов

- `WIDGET_ORIGIN_NOT_ALLOWED` (HTTP 403) — Origin не в whitelist доменов.
- `WIDGET_DISABLED` (HTTP 403) — виджет отключён в настройках.
- `WIDGET_AMOUNT_EXCEEDS_HARD_LIMIT` (HTTP 400) — сумма > 500 000 ₽.
- `WIDGET_AMOUNT_EXCEEDS_USER_LIMIT` (HTTP 400) — сумма > `widget_*_max_amount`.
- `WIDGET_EMAIL_REQUIRED` / `WIDGET_OFFER_ID_REQUIRED` (HTTP 400) — Lava.Top: обязательные поля.
- `LAVATOP_NOT_CONFIGURED` — Lava.Top: `lava_test_apikey` не задан.

Коды ошибок `intent-by-deal` (маппинг на HTTP):

- `WIDGET_GC_DEAL_ID_INVALID` (HTTP 400) — `dealId` не число или отсутствует.
- `WIDGET_GC_METHOD_UNSUPPORTED` (HTTP 422) — `method` не `'lifepay'` и не `'lavatop'`.
- `WIDGET_GC_DEAL_NOT_FOUND` (HTTP 404) — сделка не найдена в GC.
- `WIDGET_GC_ALREADY_PAID` (HTTP 409) — сделка уже оплачена (`is_payed=true`).
- `WIDGET_GC_EMAIL_MISSING` (HTTP 422) — email покупателя не задан в GC.
- `WIDGET_GC_CURRENCY_UNSUPPORTED` (HTTP 422) — для LifePay: валюта сделки != RUB.
- `WIDGET_GC_GATEWAY_ERROR` (HTTP 502) — ошибка при вызове GC-гейтвея.

Дополнительные коды для Lava.Top deal-потока:

- `WIDGET_LAVATOP_CURRENCY_INVALID` (HTTP 400) — `currency` не `'RUB'`, `'USD'` или `'EUR'`.
- `WIDGET_LAVATOP_NOT_CONFIGURED` (HTTP 502) — `widget_lavatop_offer_id` или `widget_lavatop_product_id` не заданы.
- `WIDGET_LAVATOP_RATE_UNAVAILABLE` (HTTP 502) — конвертация невозможна (ЦБ РФ недоступен, ручной курс не задан).
- `WIDGET_LAVATOP_PRICE_UPDATE_FAILED` (HTTP 502) — `updateOfferPrice` вернул ошибку.
- `WIDGET_LAVATOP_AMOUNT_TOO_SMALL` (HTTP 400) — итоговая сумма после конвертации ниже `MIN_AMOUNT` по валюте.

Коды двухуровневого offer-фильтра (добавлены 2026-06-01):

- `WIDGET_OFFER_NOT_ALLOWED` (HTTP 403) — серверная проверка `areAllOffersAllowed` не прошла: хотя бы одна позиция заказа из `getDealFields.resolved.positions` не входит в whitelist или входит в blacklist по `id` ИЛИ `title` (нормализованный: trim + схлопывание пробелов + lowercase). Сервер проверяет независимо от клиентского DOM-фильтра.

### Двухуровневая модель offer-фильтра (реализовано 2026-06-01)

Фильтрация офферов выполняется на двух независимых уровнях:

**Уровень 1 — клиент (показ виджета):** userscript читает все позиции заказа из DOM-блока `.deal-positions` (каждая `<li class="offer-position-{posId}" data-offer-id="{offerId}">` + `.position-actual-title`). Для каждой позиции проверяется соответствие whitelist/blacklist разрешённых офферов по `id` ИЛИ нормализованному `title`. Виджет рендерится только если ВСЕ позиции разрешены; хотя бы одна запрещённая → виджет не показывается. Логика реализована в `userscripts/common.js` (`extractDealPositions`, `areAllPositionsAllowed`).

**Уровень 2 — сервер (допуск к intent):** в `api/widgets/intent-by-deal.ts` позиции берутся из `getDealFields` (`lib/gateway/gcDealResolver.ts` возвращает `positions: {id, title}[]`), затем вызывается `areAllOffersAllowed` из `shared/widgetSettingsTypes.ts`. Запрещённая позиция → 403 `WIDGET_OFFER_NOT_ALLOWED`. Сервер не доверяет клиентскому DOM-фильтру.

**Семантика проверки** (синхронизирована между `shared/widgetSettingsTypes.ts` и `userscripts/common.js`, помечена комментариями-якорями «СИНХРОНИЗИРОВАНО»):
- whitelist: позиция разрешена, если её `id` ИЛИ нормализованный `title` есть в списке. Пустой whitelist → всё запрещено.
- blacklist: позиция разрешена, если ни `id`, ни нормализованный `title` не в списке. Пустой blacklist → всё разрешено.
- Нет позиций в заказе → виджет не показывается (клиент) / сервер пропускает проверку (поведение при пустом `positions`).

**Режим «Выключен» в веб-панели** = `blacklist` + пустой список (= показать всем). Дефолт `offerListType` теперь `'blacklist'`.

## SSR-контракт пропа `gcOperations` (index.tsx → ClientHomePage)

`index.tsx` вызывает `fetchGcOperations(ctx)` при SSR и передаёт массив `GcOperationEntry[]` пропом `gcOperations` в компонент `ClientHomePage`.

Тип `GcOperationEntry` (`shared/operationsClientCatalog.ts`):

| Поле         | Тип                         | Описание                                                                                                                                                                                  |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`        | `string`                    | Ключ операции (имя)                                                                                                                                                                       |
| `label`      | `string`                    | Отображаемое название                                                                                                                                                                     |
| `httpMethod` | `'GET' \| 'POST'`           | HTTP-метод для `POST /api/lp/invoke`                                                                                                                                                      |
| `argsTree`   | `ArgsTreeNode \| undefined` | Иерархия полей из `GET /v1/operations` GC-гейтвея. При наличии — форма строится через `buildFormRows` (`shared/gcArgsForm.ts`). При отсутствии — форма деградирует к `__root__` textarea. |

`ArgsTreeNode` и `ArgsTreeField` определены в `shared/gcArgsForm.ts` и зеркалят wire-контракт `p/saas/gw/gc/shared/requestTestForm.ts`. Источник данных — `GET /api/v1/operations` GC-гейтвея; парсинг — `lib/gateway/gcOperationsLoader.ts:normalizeEntry`. При изменении схемы полей на стороне гейтвея клиент правок не требует.
