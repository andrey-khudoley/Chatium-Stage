# Импорты страниц и схема зависимостей

Актуально для реализованной интеграции GetCourse + Lava: таблицы `lava_*`, репозитории в `repos/`, `lib/lava-types.ts`, `lib/lava-api.client.ts`, `lib/getcourse-api.client.ts`, `lib/lava-payment.service.ts`, `lib/lava-webhook.service.ts`, эндпоинты `api/integrations/lava/*`, тесты в `api/tests/endpoints-check/` — в т.ч. `lava-settings-getters.ts`, `lava-repos.ts`, `lava-webhook-service.ts`, `getcourse-deal-update.ts`, `lava-api-catalog.ts`, `lava-payment-link-route.ts`, `lava-api-client.ts`, `payment-link.ts`.

## 1) Страницы‑роуты (TSX entrypoints)

### `./shared/projectRoot.ts`
- первая строка: `// @shared`
- экспорт `PROJECT_ROOT` — единственная константа для Vue/страниц, которым нужен корень пути **без** импорта всего `config/routes.tsx` (иначе сборщик мог подтягивать API-модули).

### `./config/routes.tsx`
- первая строка: `// @shared` (нужна для импорта из `web/**/index.tsx` с `// @shared`)
- импорт `PROJECT_ROOT` из `../shared/projectRoot`, реэкспорт; **`ROUTES`** / **`ROUTE_PATHS`** — только страницы (без `/api/integrations/...`); `getFullUrl`, `withProjectRoot`, …

### `./config/project.tsx`
- первая строка: `// @shared` (как у `routes.tsx`, импортируется из тех же shared-роутов)
- нет внутренних импортов (только экспорт DEFAULT_PROJECT_TITLE, INDEX_PAGE_NAME, PROFILE_PAGE_NAME, ADMIN_PAGE_NAME, TESTS_PAGE_NAME, getPageTitle, getHeaderText, BODY_TEXT, BODY_SUBTEXT)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./styles` → `customScrollbarStyles`
- `./shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `./config/routes` → `getFullUrl`, `ROUTES`
- `./config/project` → `INDEX_PAGE_NAME`, `BODY_TEXT`, `BODY_SUBTEXT`, `getPageTitle`, `getHeaderText`
- `./lib/logger.lib` → `*`
- `./lib/settings.lib` → `*`

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `@app/socket` → `genSocketId`
- `../../pages/AdminPage.vue`
- `../login` → `loginPageRoute`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`
- `../../lib/logger.lib` → `getAdminLogsSocketId`, `writeServerLog` (и др.)
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `ADMIN_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/profile/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/ProfilePage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`
- `../../lib/logger.lib` → `*`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `PROFILE_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/tests/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `@app/socket` → `genSocketId`
- `../../lib/logger.lib` → `getAdminLogsSocketId`
- `../../pages/TestsPage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `TESTS_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/login/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/LoginPage.vue`
- `../../styles` → `baseHtmlStyles`, `customScrollbarStyles`
- `../../shared/projectRoot` → `PROJECT_ROOT`
- `../../lib/logger.lib` → `*`

## 2) Страницы‑компоненты (Vue)

### `./pages/HomePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/logger` → `createComponentLogger`

### `./pages/AdminPage.vue`
- `vue` → `onMounted`, `onBeforeUnmount`, `onUnmounted`, `ref`, `computed`, `watch`
- `@app/socket` → `getOrCreateBrowserSocketClient`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../api/settings/get` → `getSettingRoute`
- `../api/settings/save` → `saveSettingRoute`
- `../api/admin/lava/catalog` → `lavaCatalogRoute`
- `../api/admin/getcourse/verify` → `getcourseVerifyRoute`
- `../shared/gcSettingKeys` → `GC_SETTING_KEYS`
- `../shared/lavaSettingKeys` → `LAVA_SETTING_KEYS`
- `../shared/lavaBaseUrl` → `normalizeLavaBaseUrlInput`
- `../api/admin/logs/recent` → `getRecentLogsRoute`
- `../api/admin/logs/before` → `getLogsBeforeRoute`
- `../api/admin/dashboard/counts` → `getDashboardCountsRoute`
- `../api/admin/dashboard/reset` → `resetDashboardRoute`
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`

### `./pages/ProfilePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/logger` → `createComponentLogger`

### `./pages/TestsPage.vue`
- `vue` → `onMounted`, `onBeforeUnmount`, `onUnmounted`, `ref`, `computed`
- `@app/socket` → `getOrCreateBrowserSocketClient`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`
- `../api/admin/logs/recent` → `getRecentLogsRoute`
- `../api/admin/logs/before` → `getLogsBeforeRoute`
- `../shared/projectRoot` → `PROJECT_ROOT`

### `./pages/LoginPage.vue`
- `vue` → `computed`, `onMounted`
- `../shared/logger` → `createComponentLogger`

## 3) Компоненты (components/)

### `./components/Header.vue`
- `vue` → `ref`, `onMounted`, `onUnmounted`
- `./LogoutModal.vue`
- `../shared/logger` → `createComponentLogger`

### `./components/LogoutModal.vue`
- `vue` → `watch`, `onMounted`
- `../shared/logger` → `createComponentLogger`

### `./components/AppFooter.vue`
- `vue` → `onMounted`
- `../shared/logger` → `createComponentLogger`

### `./components/GlobalGlitch.vue`
- `vue` → `onMounted`
- `../shared/logger` → `createComponentLogger`

## 4) Shared (общий код)

### `./styles.tsx`
- нет внутренних импортов (только экспорт `baseHtmlStyles`, `customScrollbarStyles`)

### `./shared/preloader.ts`
- нет импортов

### `./shared/logLevel.ts`
- `../lib/settings.lib` → `getLogLevel`, `LogLevel`
- `../lib/logger.lib` → `*`

### `./shared/logger.ts`
- нет импортов (клиентский логгер по syslog RFC 5424: severity -1…7, LOG_LEVEL_OFF=-1, читает window.__BOOT__.logLevel; createComponentLogger, setLogSink, LogEntry)

## 5) Таблицы (tables/)

### `./tables/settings.table.ts`
- `@app/heap` → `Heap`

### `./tables/logs.table.ts`
- `@app/heap` → `Heap`

### `./tables/lava_payment_contract.table.ts`
- `@app/heap` → `Heap`

### `./tables/lava_webhook_event.table.ts`
- `@app/heap` → `Heap`

### `./tables/lava_lock_log.table.ts`
- `@app/heap` → `Heap`

## 6) Репозитории (repos/)

### `./repos/settings.repo.ts`
- `../tables/settings.table` → `Settings`, `SettingsRow`
- (не импортирует logger.lib — иначе рекурсия: writeServerLog → getLogLevel → getSetting → findByKey → writeServerLog)

### `./repos/logs.repo.ts`
- `../tables/logs.table` → `Logs`, `LogsRow`
- `../lib/logger.lib` → `*`
- экспортирует: `create`, `findAll`, `findById`, `findBeforeTimestamp`, `countBySeverityAfter`, `countErrorsAfter`, `countWarningsAfter`

### `./repos/lava_payment_contract.repo.ts`
- `../tables/lava_payment_contract.table` → `LavaPaymentContract`, `LavaPaymentContractRow`
- `../lib/logger.lib` → `writeServerLog` (severity 7: вход/выход каждой операции; не создаёт рекурсии с `logs.repo`)
- экспортирует: `create`, `findByGcOrderId`, `findByLavaContractId`, `updateStatus`, `findActiveByGcOrderId`

### `./repos/lava_webhook_event.repo.ts`
- `../tables/lava_webhook_event.table` → `LavaWebhookEvent`, `LavaWebhookEventRow`
- `../lib/logger.lib` → `writeServerLog` (severity 7 на каждый метод)
- экспортирует: `create`, `findByDedupeKey`, `markProcessed`, `findUnprocessed`

### `./repos/lava_lock_log.repo.ts`
- `../tables/lava_lock_log.table` → `LavaLockLog`, `LavaLockLogRow`
- `../lib/logger.lib` → `writeServerLog` (severity 7 на каждый метод)
- экспортирует: `create`, `updateReleased`, `updateAcquiredAt`

## 7) Библиотеки (lib/)

### `./lib/lava-types.ts`
- нет внутренних импортов (типы TypeScript: валюта, webhook, payment-link request/response)

### `./lib/settings.lib.ts`
- `../repos/settings.repo` → `*` (findByKey, findAll, upsert, deleteByKey)
- `../shared/lavaSettingKeys` → `LAVA_SETTING_KEYS` (spread в `SETTING_KEYS`)
- `../shared/gcSettingKeys` → `GC_SETTING_KEYS` (spread в `SETTING_KEYS`)
- `../shared/lavaBaseUrl` → `normalizeLavaBaseUrlInput` (ветка `setSetting` для `lava_base_url`)
- `./logger.lib` → `*` (только для функций, не вызываемых из logger.lib: getSettingString, getLogsLimit, getDashboardResetAt, getAllSettings, setSetting)
- экспортирует также: `SETTING_KEYS`, интеграционные геттеры (`getLavaApiKey`, `getLavaBaseUrl`, …) без `writeServerLog` (аналогично `getLogLevel` / `getLogWebhook`)

### `./lib/lava-api.client.ts`
- `@app/request` → `request`
- `../shared/lavaBaseUrl` → `normalizeLavaBaseUrlInput`
- `./lava-types` → `LavaCurrency` (type)
- `./logger.lib` → `*`
- `./settings.lib` → `*` (геттеры Lava: base URL, API key, product/offer id)
- экспортирует: `updateOfferPrice`, `createContract`, `getProducts`, `CreateContractParams`, `fetchLavaProductsCatalog`, `LavaCatalogRow`

### `./lib/getcourse-api.client.ts`
- `@app/request` → `request`
- `./logger.lib` → `*`
- `./settings.lib` → `*` (`getGcApiKey`, `getGcAccountDomain`)
- экспортирует: `normalizeGcAccountDomain`, `verifyGcPlApiAccess`, `VerifyGcPlApiParams`, `updateDealStatus`, `UpdateDealStatusParams`

### `./lib/lava-payment.service.ts`
- `@app/sync` → `runWithExclusiveLock`, `LockAcquisitionError`
- `./lava-types` → `PaymentLinkRequest`, `PaymentLinkResponse` (types)
- `./lava-api.client` → `*` (`updateOfferPrice`, `createContract`)
- `./logger.lib` → `*`
- `./settings.lib` → `*` (`getLavaProductId`, `getLavaOfferId`)
- `../repos/lava_payment_contract.repo` → `*`
- `../repos/lava_lock_log.repo` → `*`
- экспортирует: `createPaymentLink`

### `./lib/lava-webhook.service.ts`
- `./lava-types` → `LavaWebhookPayload`, `LocalContractStatus` (types)
- `./getcourse-api.client` → `*` (`updateDealStatus`)
- `./logger.lib` → `*`
- `./settings.lib` → `*` (`getLavaWebhookSecret`)
- `../repos/lava_payment_contract.repo` → `*`
- `../repos/lava_webhook_event.repo` → `*`
- `../tables/lava_webhook_event.table` → `LavaWebhookEventRow` (type)
- экспортирует: `processWebhook`, `ProcessWebhookResult`

### `./shared/lavaBaseUrl.ts`
- нет внутренних импортов (файл с `// @shared`)

### `./shared/lavaSettingKeys.ts`
- нет внутренних импортов (файл с `// @shared`; ключи Lava для клиента и `SETTING_KEYS` на сервере)

### `./shared/gcSettingKeys.ts`
- нет внутренних импортов (файл с `// @shared`; ключи `gc_api_key` / `gc_account_domain` для админки и `SETTING_KEYS`)

### `./lib/admin/dashboard.lib.ts`
- `../settings.lib` → `*` (getDashboardResetAt, setSetting, SETTING_KEYS)
- `../../repos/logs.repo` → `*` (countErrorsAfter, countWarningsAfter)
- `../logger.lib` → `*`

### `./lib/logger.lib.ts`
- `./settings.lib` → `*` (getLogLevel, getLogWebhook, LogLevel)
- `../repos/logs.repo` → `*` (create)
- `@app/socket` → `sendDataToSocket`
- `@app/request` → `request`

## 8) API (api/)

### `./api/settings/list.ts`
- `@app/auth` → `requireAccountRole`
- `../../lib/settings.lib` → `*`
- `../../lib/logger.lib` → `*`

### `./api/settings/get.ts`
- `@app/auth` → `requireAccountRole`
- `../../lib/settings.lib` → `*`
- `../../lib/logger.lib` → `*`

### `./api/settings/save.ts`
- `@app/auth` → `requireAccountRole`
- `../../lib/settings.lib` → `*`
- `../../lib/logger.lib` → `*`

### `./api/admin/lava/catalog/index.ts`
- `@app/auth` → `requireAccountRole`
- `../../../../lib/lava-api.client` → `*`
- `../../../../lib/logger.lib` → `*`

### `./api/admin/getcourse/verify/index.ts`
- `@app/auth` → `requireAccountRole`
- `../../../../lib/getcourse-api.client` → `verifyGcPlApiAccess`
- `../../../../lib/logger.lib` → `*`
- экспорт: `getcourseVerifyRoute`

### `./api/integrations/lava/payment-link/index.ts`
- `../../../../lib/logger.lib` → `*`
- `../../../../lib/lava-payment.service` → `createPaymentLink`
- `../../../../lib/lava-types` → `PaymentLinkRequest` (type)
- `../../../../lib/settings.lib` → `getGcServiceToken`
- валидация body через `.body((s) => …)` (`@app/schema`); экспорт: `lavaPaymentLinkRoute`

### `./api/integrations/lava/webhook/index.ts`
- `../../../../lib/logger.lib` → `*`
- `../../../../lib/lava-webhook.service` → `processWebhook`
- `../../../../lib/lava-types` → `LavaWebhookPayload` (type)
- валидация body через `.body((s) => …)` (`@app/schema`); при неверном `X-Api-Key` — `ctx.resp.json({ success: false }, 401)`; экспорт: `lavaWebhookRoute`

### `./api/logger/log.ts`
- `@app/auth` → `requireAnyUser`
- `../../lib/logger.lib` → `*`

### `./api/admin/logs/recent.ts`
- `@app/auth` → `requireAccountRole`
- `../../../repos/logs.repo` → `*`
- `../../../lib/logger.lib` → `*`
- `../../../tables/logs.table` → `LogsRow` (type)

### `./api/admin/logs/before.ts`
- `@app/auth` → `requireAccountRole`
- `../../../repos/logs.repo` → `*`
- `../../../lib/logger.lib` → `*`
- `../../../tables/logs.table` → `LogsRow` (type)

### `./api/admin/dashboard/counts.ts`
- `@app/auth` → `requireAccountRole`
- `../../../lib/admin/dashboard.lib` → `*`
- `../../../lib/logger.lib` → `*`

### `./api/admin/dashboard/reset.ts`
- `@app/auth` → `requireAccountRole`
- `../../../lib/admin/dashboard.lib` → `*`
- `../../../lib/logger.lib` → `*`

### `./api/tests/list.ts`
- `@app/auth` → `requireAnyUser`
- `../../lib/logger.lib` → `*`

### `./api/tests/endpoints-check/health.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`

### `./api/tests/endpoints-check/ping.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`

### `./api/tests/endpoints-check/config.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`
- `../../../config/routes` → `getFullUrl`, `ROUTES`
- `../../../config/project` → `TESTS_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./api/tests/endpoints-check/settings-lib.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`
- `../../../lib/settings.lib` → `*`

### `./api/tests/endpoints-check/settings-repo.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`
- `../../../lib/settings.lib` → `SETTING_KEYS`
- `../../../repos/settings.repo` → `*`

### `./api/tests/endpoints-check/logger-lib.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`

### `./api/tests/endpoints-check/logs-repo.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/logs.repo` → `*`

### `./api/tests/endpoints-check/dashboard-lib.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/logger.lib` → `*`
- `../../../lib/admin/dashboard.lib` → `*`

### `./api/tests/endpoints-check/lava-api-client.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/lava-api.client` → `*`
- `../../../lib/logger.lib` → `*`

### `./api/tests/endpoints-check/payment-link.ts`
- `@app/auth` → `requireAnyUser`
- `../../../lib/lava-payment.service` → `*`
- `../../../lib/logger.lib` → `*`
