# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, getFullUrl, withProjectRoot, withProjectRootAndSubroute)

### `./config/project.tsx`
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
- `@app/auth` → `requireRealUser`, `requireAccountRole` (страница только для роли Admin)
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
- `../../config/routes` → `PROJECT_ROOT`
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
- `../shared/testCatalog` → блоки и тесты каталога (`UNIT_TEST_BLOCKS`, …)
- `../api/admin/logs/recent` → `getRecentLogsRoute`
- `../api/admin/logs/before` → `getLogsBeforeRoute`

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

### `./shared/testCatalog.ts`
- первая строка: `// @shared`
- нет импортов — каталог блоков для `/api/tests/list` и UI тестов

### `./shared/logger.ts`
- нет импортов (клиентский логгер по syslog RFC 5424: severity -1…7, LOG_LEVEL_OFF=-1, читает window.__BOOT__.logLevel; createComponentLogger, setLogSink, LogEntry)

### `./shared/correlation.ts`
- первая строка: `// @shared`
- нет внутренних импортов — чистые функции без Heap/ctx/сети
- экспортирует: `generateCorrelationId`, `appendCorrelationId`, `extractCorrelationId`, `mergeWebhooksById`
- используется в: `pages/PanelHomePage.vue` (generateCorrelationId + appendCorrelationId), `api/lp/invoke.ts` (extractCorrelationId), `web/webhook/index.tsx` (extractCorrelationId), `api/lp/search-by-request-id.ts` (mergeWebhooksById), `lib/tests/lifepayUnitSuite.ts` (все четыре функции)

## 5) Таблицы (tables/)

### `./tables/settings.table.ts`
- `@app/heap` → `Heap`

### `./tables/logs.table.ts`
- `@app/heap` → `Heap`

## 6) Репозитории (repos/)

### `./repos/settings.repo.ts`
- `../tables/settings.table` → `Settings`, `SettingsRow`
- (не импортирует logger.lib — иначе рекурсия: writeServerLog → getLogLevel → getSetting → findByKey → writeServerLog)

### `./repos/logs.repo.ts`
- `../tables/logs.table` → `Logs`, `LogsRow`
- `../lib/logger.lib` → `*`
- экспортирует: `create`, `findAll`, `findById`, `findBeforeTimestamp`, `countBySeverityAfter`, `countErrorsAfter`, `countWarningsAfter`

### `./repos/requestLog.repo.ts`
- `../tables/requestLog.table` → `RequestLog`, `RequestLogRow`
- `../lib/logger.lib` → `*`
- экспортирует: `create`, `findById`, `findByOrderNumber`, `findByRequestId`, `countSince`, `countOkSince`, `findInRange`, `countInRange`, `countOkInRange` (диапазон `$gte/$lt` по `requestedAt`, cursor-пагинация ≤ 1000); `@deprecated`: `findRecent`, `findBeforeRequestedAt`, `findRecentSince`

### `./repos/webhookLog.repo.ts`
- `../tables/webhookLog.table` → `WebhookLog`, `WebhookLogRow`
- `../lib/logger.lib` → `*`
- экспортирует: `create`, `findById`, `findByOrderNumber`, `findByOrderNumberInRange`, `countSince`, `countStatusSuccessSince`, `countTokenValidSince`, `findInRange`, `countInRange`, `countStatusSuccessInRange`, `countTokenValidInRange` (диапазон `$gte/$lt` по `processedAt`); `@deprecated`: `findRecent`, `findRecentSince`

## 7) Библиотеки (lib/)

### `./lib/settings.lib.ts`
- `../repos/settings.repo` → `*` (findByKey, findAll, upsert, deleteByKey)
- `./logger.lib` → `*` (только для функций, не вызываемых из logger.lib: getSettingString, getLogsLimit, getDashboardResetAt, getAllSettings, setSetting)

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

### `./api/lp/analytics/filter-save.ts` (новый — глобальный фильтр панели)
- `../../../lib/access/apiGuard` → `guardInternalApi`
- `../../../lib/logger.lib` → `*`
- `../../../lib/settings.lib` → `*` (`setSetting`, `SETTING_KEYS`, `DateFilter`)
- `../../../repos/settings.repo` → `*` (`deleteByKey` для сброса)
- POST `/`; тело `{ from?, to? }` (Unix ms), сброс при отсутствии обеих границ; ответ `{ success, filter }`

### `./api/lp/analytics/summary.ts`, `./api/lp/recent-requests.ts`, `./api/lp/recent-webhooks.ts`, `./api/lp/search-by-request-id.ts`
- общий паттерн: `../../../lib/access/apiGuard`→`guardInternalApi`, `../../../lib/logger.lib`, `repos/*` (`requestLog.repo`, `webhookLog.repo`)
- читают глобальный фильтр через `lib/settings.lib`→`getPanelDateFilter` и применяют `findInRange`/`countInRange*` (диапазон `$gte/$lt`)

### `./api/tests/list.ts`
- `@app/auth` → `requireAccountRole` (Admin-only)
- `../../lib/logger.lib` → `*`
- `../../shared/testCatalog` → `UNIT_TEST_BLOCKS`, `INTEGRATION_SERVER_TEST_BLOCKS`, `INTEGRATION_HTTP_TEST_BLOCK`, `flattenCatalogBlocks`

### `./api/tests/unit/index.ts`
- `@app/auth` → `requireAccountRole` (Admin-only)
- `../../../lib/logger.lib` → `*`
- `../../../lib/tests/templateUnitSuite` → `runTemplateUnitChecks`, `TemplateUnitTestResult`
- `../../../lib/tests/logTestRunFailures` → `logTestRunFailures`

### `./api/tests/integration/index.ts`
- `@app/auth` → `requireAccountRole` (Admin-only)
- `../../../lib/logger.lib` → `*`
- `../../../lib/tests/integrationSuite` → `runTemplateIntegrationChecks`
- `../../../lib/tests/logTestRunFailures` → `logTestRunFailures`

### `./lib/tests/logTestRunFailures.ts`
- `../logger.lib` → `writeServerLog` — поштучное логирование провалов тестов (severity 3)

### `./lib/tests/templateUnitSuite`
- `../logger.lib`, `../settings.lib`, `config/*`, `shared/*`, `shared/testCatalog` — юнит-прогон без Heap

### `./lib/tests/integrationSuite`
- `../settings.lib`, `repos/*` (включая `requestLog.repo`, `webhookLog.repo` — границы выборок фильтра), `../admin/dashboard.lib`, `../logger.lib`, `api/settings/*`, `api/logger/log`, `api/admin/*`, `api/tests/list`, `./templateUnitSuite` (`runTemplateUnitChecks`)
- проверки фильтра по дате/времени: `getPanelDateFilter` roundtrip, валидация `setSetting(PANEL_DATE_FILTER)`, границы `findInRange`/`countInRange`

### `./lib/tests/lifepayUnitSuite`
- `../gateway/buildInvokeUrl`, `../../shared/redact`, `../../shared/redactRaw`, `../../shared/gatewayContract`, `../settings.lib` (валидации, включая `isValidDateFilter`, `normalizeDateFilter`), `../webhook/processWebhook`, `../access/*`, `../../shared/correlation` (generateCorrelationId, appendCorrelationId, extractCorrelationId, mergeWebhooksById — блок `unit-correlation`, 7 тестов) — юнит-прогон без Heap
