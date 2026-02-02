# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, getFullUrl, withProjectRoot, withProjectRootAndSubroute)

### `./config/project.tsx`
- нет внутренних импортов (только экспорт PROJECT_TITLE, INDEX_PAGE_NAME, PROFILE_PAGE_NAME, ADMIN_PAGE_NAME, getPageTitle, getHeaderText, BODY_TEXT, BODY_SUBTEXT)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `./config/routes` → `getFullUrl`, `ROUTES`
- `./config/project` → `INDEX_PAGE_NAME`, `BODY_TEXT`, `BODY_SUBTEXT`, `getPageTitle`, `getHeaderText`
- `./lib/logger.lib` → `*`

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `@app/socket` → `genSocketId`
- `../../pages/AdminPage.vue`
- `../login` → `loginPageRoute`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../lib/logger.lib` → `getAdminLogsSocketId`, `writeServerLog` (и др.)
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `ADMIN_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./web/profile/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/ProfilePage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../lib/logger.lib` → `*`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `PROFILE_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./web/login/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/LoginPage.vue`
- `../../styles`
- `../../config/routes`
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
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`

### `./pages/ProfilePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/logger` → `createComponentLogger`

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

## 6) Репозитории (repos/)

### `./repos/settings.repo.ts`
- `../tables/settings.table` → `Settings`, `SettingsRow`

### `./repos/logs.repo.ts`
- `../tables/logs.table` → `Logs`, `LogsRow`
- экспортирует: `create`, `findAll`, `findById`, `findBeforeTimestamp`

## 7) Библиотеки (lib/)

### `./lib/settings.lib.ts`
- `../repos/settings.repo` → `*` (findByKey, findAll, upsert, deleteByKey)

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
