# API

## Настройки (api/settings/)

Эндпоинты для управления настройками проекта (key-value в Heap). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/settings/list | api/settings/list.ts | Admin | Список всех настроек (с дефолтами) |
| GET | /api/settings/get?key= | api/settings/get.ts | Admin | Получить одну настройку |
| POST | /api/settings/save | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`). Для `log_level`: допускаются строки (Debug/Info/Warn/Error/Disable) и числа -1–4 (-1,0=Disable, 1=Info, 2=Warn, 3=Error, 4=Debug), нормализация в API. Слияние пар ключей интеграции перед verify — `lib/settings-save-credentials.lib` (`resolveGcCredentialsForSave`, `resolveLavaCredentialsForSave`, `shouldVerifyCredentialPair`). Перед записью в Heap: при сохранении `gc_api_key` или `gc_account_domain` (если после слияния с уже сохранённым вторым полем оба непусты) — запрос `verifyGcPlApiAccess` к GetCourse PL API; при `lava_api_key` или `lava_base_url` (оба непусты после слияния и нормализации URL) — GET Lava `/api/v2/products`, успех только при HTTP 200. Иначе `{ success: false, error }` без записи. |

Каждый файл — один эндпоинт с путём `/`.

## Логи (api/logger/, api/admin/logs/)

Эндпоинты для записи и чтения серверных логов (проверка уровня, Heap, WebSocket, вебхук).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/logger/log | api/logger/log.ts | AnyUser | Записать лог (body: `{ message, severity?, payload? }`). message — текст сообщения (имя модуля при необходимости в тексте); severity — 0–7, по умолчанию 6; payload — JSON с контекстом. timestamp и уровень (level) вычисляются в lib. В ctx.log и ctx.account.log выводится строка вида `[DD.MM.YYYY HH:mm:ss.SSS] [LEVEL] message` (пробелы между группами в скобках). Уровень сверяется с настройкой log_level; при прохождении — запись в ctx.log, ctx.account.log, Heap, WebSocket (admin-logs), опционально POST на log_webhook.url. |
| GET | /api/admin/logs/recent | api/admin/logs/recent.ts | Admin | Получить последние N логов (query: `limit`, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }> }`. |
| GET | /api/admin/logs/before | api/admin/logs/before.ts | Admin | Получить N логов старше указанного timestamp (query: `beforeTimestamp` — timestamp последней записи в миллисекундах, `limit` — количество, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }>, hasMore: boolean }`. |

## Дашборд админки (api/admin/dashboard/)

Счётчики ошибок и предупреждений в дашборде; таймштамп сброса хранится в настройках (`dashboard_reset_at`). Логика: lib/admin/dashboard.lib, репо — countBy по severity и timestamp (Heap where).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/admin/dashboard/counts | api/admin/dashboard/counts.ts | Admin | Получить счётчики ошибок и предупреждений после таймштампа сброса. Возвращает `{ success: true, errorCount, warnCount, resetAt }`. |
| POST | /api/admin/dashboard/reset | api/admin/dashboard/reset.ts | Admin | Сбросить дашборд: записать текущий таймштамп в настройки. Возвращает `{ success: true, errorCount: 0, warnCount: 0, resetAt }`. |

## Lava (api/admin/lava/)

Загрузка каталога продуктов для мастера настройки в админке (шаг перед сохранением `lava_product_id` / `lava_offer_id`).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/admin/lava/catalog | api/admin/lava/catalog/index.ts | Admin | Body: `{ lavaApiKey, lavaBaseUrl? }`. Запрос к Lava `GET /api/v2/products` с `X-Api-Key`, разбор `items` с `type: PRODUCT`, список пар продукт/оффер. Успех: `{ success: true, catalog: [{ productId, productTitle, offerId, offerName }] }`. Ошибка: `{ success: false, errorCode, message }`. Ключ в логах не записывается. |

## GetCourse (api/admin/getcourse/)

Проверка ключа Import API и домена аккаунта перед сохранением в Heap (`gc_api_key`, `gc_account_domain`). Реализация: `lib/getcourse-api.client` — `verifyGcPlApiAccess` (POST `https://{домен}/pl/api/deals` с тестовым `deal_number`).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/admin/getcourse/verify | api/admin/getcourse/verify/index.ts | Admin | Body: `{ gcApiKey, gcAccountDomain }`. Успех: `{ success: true, message }`. Ошибка: `{ success: false, errorCode: 'GC_VERIFY', message }`. Ключ в логах не пишется. |

Каждый файл — один эндпоинт с путём `/`.

## Интеграции Lava + GetCourse (api/integrations/lava/)

- **Входящий payment-link:** заголовки авторизации **не** требуются (в т.ч. вызов из браузера / скрипта на странице оплаты).
- **От Lava (webhook):** заголовок `X-Api-Key` = настройка `lava_webhook_secret`. Проверка, что URL открывается: **GET** `…/webhook` (без секрета) — JSON о готовности эндпоинта.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/integrations/lava/payment-link | api/integrations/lava/payment-link/index.ts | — | Тело валидируется через `@app/schema` (`.body`): обязательные `gcOrderId`, `buyerEmail`, `amount` (> 0 после парсинга), `currency` ∈ { RUB, USD, EUR }; опционально `gcUserId`, `description`, `paymentProvider`, `paymentMethod`, `buyerLanguage`, `utm` (record строка→строка), `requestId`, **`integrationTestDryRun`** (boolean). При `integrationTestDryRun: true` после валидации полей возвращается успех **без** вызова Lava/Heap (тестовый контракт; GetCourse поле не шлёт). Иначе — `lib/lava-payment.service` → `createPaymentLink`. Успех: `success: true`, `paymentUrl`, `lavaContractId`, … Ошибки: `VALIDATION_ERROR`, `CONFIG_ERROR`, `LAVA_*`, `PAYMENT_TEMPLATE_BUSY`, `INTERNAL_ERROR` (см. ответ сервиса). |
| GET | /api/integrations/lava/webhook | api/integrations/lava/webhook/index.ts | — | Проверка доступности (браузер): JSON `{ ok, status: 'ready', message, expectedMethod: 'POST', webhookSecretConfigured }`. Секрет не отдаётся. Экспорт `lavaWebhookInfoRoute`. |
| POST | /api/integrations/lava/webhook | api/integrations/lava/webhook/index.ts | `X-Api-Key` (= `lava_webhook_secret`) | Тело — payload Lava (`LavaWebhookPayload`), валидация `.body` (`@app/schema`). Экспорт `lavaWebhookRoute`, вызов `lib/lava-webhook.service` → `processWebhook`. Успех HTTP 200: `{ success: true }`. Неверный секрет: HTTP 401, `{ success: false }`. Логи входа/обработки через `writeServerLog`. |

## Тесты (api/tests/)

Каталог тестов: категории и отдельные тесты. Один файл — один эндпоинт с путём `/`. Внутри категории (например, «проверка эндпоинтов») — по одному файлу на тест. Как устроены проверки, роль **`ctx`** (реальный контекст запроса, без «мока») и запуск со страницы `/web/tests` — см. **[testing.md](./testing.md)**.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tests/list | api/tests/list.ts | AnyUser | Каталог тестов: список категорий и тестов. Возвращает `{ success: true, categories }`. |
| GET | /api/tests/endpoints-check/health | api/tests/endpoints-check/health.ts | AnyUser | Тест: health check. Возвращает `{ success: true, ok: true, test: 'health', at }`. |
| GET | /api/tests/endpoints-check/ping | api/tests/endpoints-check/ping.ts | AnyUser | Тест: ping. Возвращает `{ success: true, pong: true, test: 'ping', at }`. |
| GET | /api/tests/endpoints-check/config | api/tests/endpoints-check/config.ts | AnyUser | Тест слоя config (routes, project). Возвращает `{ success, test: 'config', routes, pageTitle, headerText, at }`. |
| GET | /api/tests/endpoints-check/settings-lib | api/tests/endpoints-check/settings-lib.ts | AnyUser | Тесты библиотеки настроек: массив `results` по каждой функции (getSettingString, getLogLevel, getLogsLimit, getLogWebhook, getDashboardResetAt, getAllSettings). Опционально: query `testId` — выполнить только одну проверку (id как в `results`). |
| GET | /api/tests/endpoints-check/settings-repo | api/tests/endpoints-check/settings-repo.ts | AnyUser | Тесты репозитория настроек: массив `results` (upsert, deleteByKey, findByKey, findAll). Порядок: создание до чтения. Опционально: query `testId` — одна проверка. |
| GET | /api/tests/endpoints-check/logger-lib | api/tests/endpoints-check/logger-lib.ts | AnyUser | Тесты библиотеки логов: массив `results` (getAdminLogsSocketId, shouldLogByLevel). Опционально: query `testId` — одна проверка. |
| GET | /api/tests/endpoints-check/logs-repo | api/tests/endpoints-check/logs-repo.ts | AnyUser | Тесты репозитория логов: массив `results` (create, findAll, findBeforeTimestamp, countErrorsAfter, countWarningsAfter). Порядок: create до чтения. Опционально: query `testId` — одна проверка. |
| GET | /api/tests/endpoints-check/dashboard-lib | api/tests/endpoints-check/dashboard-lib.ts | AnyUser | Тесты библиотеки админки: массив `results` (getDashboardCounts, resetDashboard). Опционально: query `testId` — одна проверка. |
| GET | /api/tests/endpoints-check/lava-settings-getters | api/tests/endpoints-check/lava-settings-getters.ts | AnyUser | Геттеры интеграции в `settings.lib`: `getLavaApiKey`, `getLavaBaseUrl`, `getLavaProductId`, `getLavaOfferId`, `getLavaWebhookSecret`, `getGcApiKey`, `getGcAccountDomain` — массив `results`. |
| GET | /api/tests/endpoints-check/integration-gc-credentials | api/tests/endpoints-check/integration-gc-credentials.ts | AnyUser | Проверка GetCourse из Heap: `gc_api_key` + `gc_account_domain` → `verifyGcPlApiAccess`. Ответ: `{ success, skipped?, test, message?, error?, at }`; при неполной паре в настройках — `success: true`, `skipped: true`. |
| GET | /api/tests/endpoints-check/integration-lava-credentials | api/tests/endpoints-check/integration-lava-credentials.ts | AnyUser | Проверка Lava из Heap: `lava_api_key` + `lava_base_url` → `verifyLavaCredentials` (GET `/api/v2/products`). Ответ: `{ success, skipped?, test, message?, error?, httpStatus?, at }`; при неполной паре — `skipped: true`. |
| GET | /api/tests/endpoints-check/integration-credentials-both | api/tests/endpoints-check/integration-credentials-both.ts | AnyUser | Обе проверки из Heap за один запрос: `runIntegrationCredentialChecksFromSettings`. Успех, если для GetCourse и Lava либо `skipped` (неполная пара), либо `ran && ok`. Ответ: `{ success, test, gc, lava, at }`. |
| GET | /api/tests/endpoints-check/settings-save-credentials-unit | api/tests/endpoints-check/settings-save-credentials-unit.ts | AnyUser | Юнит-проверки слияния полей для save (без сети): массив `results` с фикстурами. Query `testId` — один кейс (id из списка в файле). |
| GET | /api/tests/endpoints-check/page-routes-unit | api/tests/endpoints-check/page-routes-unit.ts | RealUser | Юнит по пяти HTML-страницам: для каждого `app.html`-роута вызывается `route.run(ctx, req)` с тем же `ctx`, что у запроса к API (сессия админа); без HTTP. Успех: непустой результат (JSX с `type` или ответ похожий на редирект). Массив `results`. Query `testId` — одна страница (`index`, `web-admin`, …). Файл **без** `@shared-route` (импорты страничных роутов с Vue). |
| GET | /api/tests/endpoints-check/lava-repos | api/tests/endpoints-check/lava-repos.ts | AnyUser | Репозитории Heap интеграции: контракт оплаты, webhook-события, lock-log; массив `results`. |
| GET | /api/tests/endpoints-check/lava-webhook-service | api/tests/endpoints-check/lava-webhook-service.ts | AnyUser | `processWebhook`: 401 при неверном ключе, сценарий без контракта в Heap, дедупликация; массив `results` (часть проверок пропускается, если не задан `lava_webhook_secret`). |
| GET | /api/tests/endpoints-check/lava-webhook-route | api/tests/endpoints-check/lava-webhook-route.ts | AnyUser | Юнит HTTP-роута интеграции: `lavaWebhookInfoRoute.run` (структура GET), `lavaWebhookRoute.run` с полями тела и `headers['X-Api-Key']` на верхнем уровне второго аргумента — неверный ключ, отсутствие ключа при заданном секрете, невалидный `eventType`, успех при верном секрете и валидном теле (контракт не в Heap). Файл **без** `@shared-route` (схема `app.body`). |
| GET | /api/tests/endpoints-check/getcourse-deal-update | api/tests/endpoints-check/getcourse-deal-update.ts | AnyUser | Вызов `updateDealStatus` без исключения (при отсутствии ключей GetCourse — no-op в клиенте). |
| GET | /api/tests/endpoints-check/lava-api-catalog | api/tests/endpoints-check/lava-api-catalog.ts | AnyUser | `fetchLavaProductsCatalog` с ключом и URL из настроек; при отсутствии ключа — `{ success: true, skipped: true }`. |
| GET | /api/tests/endpoints-check/lava-payment-link-route | api/tests/endpoints-check/lava-payment-link-route.ts | AnyUser | `lavaPaymentLinkRoute.run`: VALIDATION_ERROR (пустой заказ) и успешный dry-run. Файл **без** `@shared-route`: импорт `lavaPaymentLinkRoute` тянет схему `app.body` и не должен попадать в shared-бандл. |
| GET | /api/tests/endpoints-check/lava-api-client | api/tests/endpoints-check/lava-api-client.ts | AnyUser | Интеграция: вызов `getProducts` (Lava GET `/api/v2/products`). Успех: `{ success: true, test, body }`; при ошибке конфигурации/API: `{ success: false, test, error }`. |
| GET | /api/tests/endpoints-check/payment-link | api/tests/endpoints-check/payment-link.ts | AnyUser | Интеграция: `createPaymentLink` с тестовыми данными (уникальный `gcOrderId`, 50 RUB — минимум Lava для RUB, email `lava-test@example.com`). Ответ: `{ success: true, test, result }` с полями `createPaymentLink` или `{ success: false, test, error }`. |
| GET | /api/tests/endpoints-check/payment-link-dry-run-unit | api/tests/endpoints-check/payment-link-dry-run-unit.ts | AnyUser | Юнит: `lavaPaymentLinkRoute.run` с `integrationTestDryRun: true` (без HTTP к себе, без Lava). |
| POST | /api/tests/endpoints-check/payment-link-http-integration | api/tests/endpoints-check/payment-link-http-integration.ts | AnyUser | Интеграция: исходящий `request()` POST на абсолютный URL `…/api/integrations/lava/payment-link` с телом (по умолчанию dry-run). Тело: опционально `paymentLinkOverrides` — частичное переопределение полей. Нужна возможность собрать origin из заголовков запроса (`Host`/`Origin`). При пропуске (нет URL): `{ success: true, skipped: true, reason?, hint? }` — для UI это **не** ошибка. |
| GET | /api/tests/endpoints-check/payment-link-heap-settings-read | api/tests/endpoints-check/payment-link-heap-settings-read.ts | AnyUser | Лайв: чтение из Heap четырёх полей Lava для payment-link (`lava_api_key` маскируется). `{ success, settingsRead: { allRequiredPresent, … } }`. |
| GET | /api/tests/endpoints-check/payment-link-full-route-run | api/tests/endpoints-check/payment-link-full-route-run.ts | AnyUser | Лайв: деактивация активных контрактов `gc_order_id=test` → `lavaPaymentLinkRoute.run` без dry-run (полный вызов Lava). |
| POST | /api/tests/endpoints-check/payment-link-full-http-integration | api/tests/endpoints-check/payment-link-full-http-integration.ts | AnyUser | Лайв: то же + `request()` POST на `payment-link` без dry-run; без абсолютного URL — `skipped`. |
| POST | /api/tests/endpoints-check/webhook-live-test-arm | api/tests/endpoints-check/webhook-live-test-arm.ts | AnyUser | Тело: `expectedLavaContractId`, опционально `paymentUrl` — вооружить сессию лайв-проверки webhook на странице `/web/tests` (состояние в Heap settings). |
| GET | /api/tests/endpoints-check/webhook-live-test-status | api/tests/endpoints-check/webhook-live-test-status.ts | AnyUser | Абсолютный URL `POST …/api/integrations/lava/webhook` и текущее состояние лайв-проверки (`state`: armed / success, `otherEvents`). |

Структура: `api/tests/` — общий каталог; `api/tests/<категория>/` — директория категории (например, `endpoints-check`); внутри категории — отдельные файлы с одним эндпоинтом `/` в каждом. Каталог `GET /api/tests/list`: категории `unit-save-credentials`, `unit-page-routes` (те же пять страниц, что и в интеграции — GET `page-routes-unit`, `route.run` на сервере), `integration-pages-http` (пять страниц — UI на `/web/tests`, браузерный `fetch` + `shared/pageRouteProbe.ts`), `integration-credentials-heap` (два теста: GetCourse и Lava), `integration-check` (те же два GET учётных данных), плюс прочие; опционально эндпоинт `integration-credentials-both` — таблица выше. Страница `/web/tests`, вкладка «Юнит» — слияние ключей и `route.run` по страницам; вкладка «Интеграция» — сначала проверка страниц из браузера, затем два GET к ключам Heap.

## Публичные эндпоинты
| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| - | - | - | - | - |

## Дополнительно по интеграции Lava + GetCourse

Входящие эндпоинты интеграции перечислены в разделе «Интеграции Lava + GetCourse» выше (`payment-link`, `webhook`). Отдельный бэклог новых входящих URL под эту интеграцию не ведётся в этом файле. Детали контрактов и сценарии — [integration-http-contracts.md](./integration-http-contracts.md), оглавление — [README.md](./README.md). Исходящие вызовы к Lava — [reference/lavatop-openapi3.yaml](./reference/lavatop-openapi3.yaml), сводка — [integration-lava-openapi-reference.md](./integration-lava-openapi-reference.md). Исходящие вызовы к GetCourse — [reference/getcourse-pl-api-spec.md](./reference/getcourse-pl-api-spec.md).

## События и webhooks
- Webhook Lava реализован: `POST /api/integrations/lava/webhook` — см. таблицу в разделе «Интеграции Lava + GetCourse».
