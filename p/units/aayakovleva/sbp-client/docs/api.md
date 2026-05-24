# API

## Настройки (api/settings/)

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/settings/list | api/settings/list.ts | Admin | Список всех настроек (с дефолтами) |
| GET | /api/settings/get?key= | api/settings/get.ts | Admin | Получить одну настройку |
| POST | /api/settings/save | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`) |

Для `key`-ей `lp_apikey`, `lp_login`, `lp_webhook_token`, `gateway_base_url` валидация выполняется в `lib/settings.lib.setSetting` (см. `docs/data.md`).

## Логи (api/logger/, api/admin/logs/)

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/logger/log | api/logger/log.ts | AnyUser | Записать лог |
| POST | /api/logger/browser | api/logger/browser.ts | AnyUser | Браузерные логи пакетом |
| GET | /api/admin/logs/recent | api/admin/logs/recent.ts | Admin | Последние N логов |
| GET | /api/admin/logs/before | api/admin/logs/before.ts | Admin | N логов старше timestamp |

## Дашборд админки

| Method | Path | File | Auth |
| --- | --- | --- | --- |
| GET | /api/admin/dashboard/counts | api/admin/dashboard/counts.ts | Admin |
| POST | /api/admin/dashboard/reset | api/admin/dashboard/reset.ts | Admin |

## Тесты (api/tests/)

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tests/list | api/tests/list.ts | AnyUser | Каталог тестов |
| GET | /api/tests/unit | api/tests/unit/index.ts | AnyUser | Юнит-набор шаблона + LifePay (lifepayUnitSuite) |
| GET | /api/tests/integration | api/tests/integration/index.ts | AnyUser | Интеграционный набор |

## Внутренняя авторизация (api/access/)

Управление доступом к панели: пригласительные ссылки и гранты (ADR 0003, §1.11). Реализовано 2026-05-24.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/access/consume-invite | api/access/consume-invite.ts | requireRealUser | Потребить инвайт по токену (тело `{ token }`). Расходует инвайт и создаёт грант только при успехе; под `runWithExclusiveLock`. |
| POST | /api/access/generate-invite | api/access/generate-invite.ts | Admin | Создать пригласительную ссылку (тело `{ note? }`). Возвращает `{ inviteId, token, fullUrl, expiresAt }`. Токен показывается один раз. |
| POST | /api/access/revoke-invite | api/access/revoke-invite.ts | Admin | Отозвать инвайт (тело `{ inviteId }`). |
| POST | /api/access/revoke-grant | api/access/revoke-grant.ts | Admin | Отозвать грант пользователя (тело `{ userId }`). |
| GET | /api/access/invites | api/access/invites.ts | Admin | Список инвайтов без поля `token`. |
| GET | /api/access/grants | api/access/grants.ts | Admin | Список грантов (активных и отозванных). |

## LifePay (api/lp/, web/webhook)

Серверная прокладка к payments-gateway + журнал + аналитика + приёмник webhook (implementation-plan §1.8.2 — §1.8.4). Все эндпоинты `api/lp/*` защищены `requireRealUser` + `requireInternalAccess` через `guardInternalApi(ctx)` (ADR 0003 / §1.11.8, реализовано 2026-05-24).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/lp/invoke | api/lp/invoke.ts | requireRealUser + requireInternalAccess | Прокладка `{ op, args }` → `<gateway_base_url>/api/v1/<op>`. Возвращает тело gateway без изменений; `requestId` из `X-Gateway-Request-Id`. Журналирование в `request_log`. Без ретраев, без `Idempotency-Key`. |
| GET | /api/lp/recent-requests?limit=&beforeRequestedAt= | api/lp/recent-requests.ts | requireRealUser + requireInternalAccess | Последние записи `request_log` (без полных тел) |
| GET | /api/lp/recent-webhooks?limit= | api/lp/recent-webhooks.ts | requireRealUser + requireInternalAccess | Последние записи `webhook_log` |
| GET | /api/lp/analytics/summary?windowHours= | api/lp/analytics/summary.ts | requireRealUser + requireInternalAccess | Карточки: requests {total, okShare, avgDurationMs, p95DurationMs, topErrorCode}, webhooks {total, successShare, tokenValidShare} |
| GET | /api/lp/search-by-request-id?requestId= | api/lp/search-by-request-id.ts | requireRealUser + requireInternalAccess | `request_log` + связанные `webhook_log` по orderNumber |
| GET | /api/lp/raw-request?id=\<heapId\>\|requestId=\<rid\> | api/lp/raw-request.ts | requireRealUser + requireInternalAccess | Полная raw-запись `request_log` со всеми полями включая `rawResponseBody`. Если задан `id` — приоритет по нему; иначе по `requestId`. |
| GET | /api/lp/raw-webhook?id=\<heapId\> | api/lp/raw-webhook.ts | requireRealUser + requireInternalAccess | Полная raw-запись `webhook_log` включая `rawBody` и `rawQuery` (token замаскирован). Дополнительно возвращает `linkedRequests` и `relatedWebhooks`. |
| POST | /webhook?token= | web/webhook/index.tsx | Анонимный + токен | Приёмник webhook от LifePay. Сверка токена в query; расхождение/отсутствие → 401/403 без тела и без записи. При валидном → `unwrapWebhookBody` снимает обёртку `data` (см. ниже), `parseWebhookBody` извлекает `number/type/status/method/amount/order.number/email`, запись в `webhook_log` (включая `rawBody`/`rawQuery` через `prepareRawLog` — сырые, без PII-маски) + дедупликация по `number` через `webhook_idempotency`, ответ 200 OK. MD5-подпись webhook **не** проверяется. LifePay-ретраи: 1/3/5/10 мин, далее раз в час, до 10 попыток — дедупликация по `number` защищает от двойного учёта. |

### Контракт `/api/lp/invoke`

Запрос:
```json
{ "op": "createBill", "args": { "orderNumber": "A1", "amount": 1.0, "customerEmail": "x@y.z", "description": "...", "callbackUrl": "https://.../webhook?token=..." } }
```

Ответ (зеркало gateway §9.1):
- Успех: `{ "ok": true, "data": {...}, "requestId": "lp-..." }`.
- Ошибка: `{ "ok": false, "error": { "code": "...", "message": "...", "details": {...} }, "requestId": "lp-..." }`.

Локальные коды ошибок прокладки (до сетевого вызова):
- `INVOKE_SETTINGS_MISSING` (HTTP 503) — `lp_apikey`/`lp_login`/`gateway_base_url` не настроены.
- `INVOKE_OP_UNKNOWN` (HTTP 400) — операция не входит в локальный каталог.
- `INVOKE_PROXY_BODY_INVALID` (HTTP 400) — тело запроса некорректно.

Коды от gateway транзитом: `INVOKE_LP_TIMEOUT`, `INVOKE_LP_NETWORK_ERROR`, `INVOKE_LP_UPSTREAM_ERROR`, `INVOKE_LP_SEMANTIC_ERROR` (с `details.lpRule`, `details.lpNumericCode`, `details.lpHttpStatus`) и др. — см. `p/saas/gw/lifepay/lib/gateway/gatewayErrors.ts`.

### Контракт `/webhook`

Внешний (LifePay → клиент), apidoc.life-pay.ru/notification:
- Метод: `POST`, формат JSON.
- Query: `?token=<lp_webhook_token>`.
- Тело: payload в ключе `data` (либо JSON-обёртка `{"data":{...}}`, либо
  `application/x-www-form-urlencoded` с полем `data=<urlencoded-json>`).
  `lib/webhook/processWebhook.unwrapWebhookBody` снимает обёртку и поддерживает
  также чистый JSON-объект / JSON-строку / плоский form-encoded — для гибкости
  к разным версиям LifePay.
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
- При не-200 ответе LifePay повторяет webhook: 1 мин, 3 мин, 5 мин, 10 мин,
  далее раз в час, всего не более 10 попыток. Поэтому даже при ошибке записи
  в журнал отвечаем 200 OK — дедупликация по `number` через `webhook_idempotency`
  защищает от двойного учёта на стороне клиента.

## Публичные эндпоинты и страницы доступа
| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /web/webhook | web/webhook/index.tsx | Анонимный + токен в query | Приёмник webhook LifePay |
| GET | /web/access/invite?token= | web/access/invite/index.tsx | requireRealUser | Страница подтверждения инвайта. Переход по ссылке не расходует инвайт; расход — только POST /api/access/consume-invite. |
| GET | /web/forbidden | web/forbidden/index.tsx | requireRealUser | Страница 403 «Нет доступа к панели». |
