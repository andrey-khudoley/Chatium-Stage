# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, ROUTE_PATHS, getFullUrl, withProjectRoot, withProjectRootAndSubroute)

### `./config/project.tsx`
- нет внутренних импортов (только экспорт DEFAULT_PROJECT_TITLE, INDEX_PAGE_NAME, PROFILE_PAGE_NAME, ADMIN_PAGE_NAME, TESTS_PAGE_NAME, INQUIRIES_PAGE_NAME, getPageTitle, getHeaderText, BODY_TEXT, BODY_SUBTEXT)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/demoPageShell` → `getDemoPageHead`, `getBootLoaderDiv`
- `./shared/logLevel` → `getLogLevelForPage`
- `./config/routes` → `getFullUrl`, `ROUTES`
- `./config/project` → `INDEX_PAGE_NAME`, `BODY_TEXT`, `BODY_SUBTEXT`, `getHeaderText`
- `./lib/logger.lib` → `*`
- `./lib/settings.lib` → `*`

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `@app/socket` → `genSocketId`
- `../../pages/AdminPage.vue`
- `../login` → `loginPageRoute`
- `../../shared/demoPageShell` → `getDemoPageHead`, `getBootLoaderDiv`
- `../../shared/logLevel` → `getLogLevelForPage`
- `../../lib/logger.lib` → `getAdminLogsSocketId`, `writeServerLog` (и др.)
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `ADMIN_PAGE_NAME`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/profile/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/ProfilePage.vue`
- `../../shared/demoPageShell` → `getDemoPageHead`, `getBootLoaderDiv`
- `../../shared/logLevel` → `getLogLevelForPage`
- `../../lib/logger.lib` → `*`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `PROFILE_PAGE_NAME`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/tests/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `@app/socket` → `genSocketId`
- `../../lib/logger.lib` → `getAdminLogsSocketId`
- `../../pages/TestsPage.vue`
- `../../shared/demoPageShell` → `getDemoPageHead`, `getBootLoaderDiv`
- `../../shared/logLevel` → `getLogLevelForPage`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `TESTS_PAGE_NAME`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/login/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/LoginPage.vue`
- `../../config/routes` → `PROJECT_ROOT`
- `../../config/project` → `DEFAULT_PROJECT_TITLE`
- `../../shared/demoPageShell` → `getDemoPageHead`, `getBootLoaderDiv`
- `../../lib/logger.lib` → `*`

## 2) Страницы‑компоненты (Vue)

### `./pages/HomePage.vue`
- `vue` → `onMounted`, `ref`, `computed`
- `../components` → `DcDemoDashboard`, `DcDemoSidebar`, `DcHeaderActions`, `DcPageHeader`, типы `BarItem`, `ChangelogItem`, `QuickItem`, `NavItem`, `TableColumn`
- `../layout` → `DcAppShell`, `DcMain`
- `../shared/logger` → `createComponentLogger`

### `./pages/AdminPage.vue`
- `vue` → `onMounted`, `onBeforeUnmount`, `onUnmounted`, `ref`, `computed`, `watch`
- `@app/socket` → `getOrCreateBrowserSocketClient`
- `../components` → `DcDemoSidebar`, `DcPageHeader`, тип `NavItem`
- `../layout` → `DcAppShell`, `DcMain`
- `../api/settings/get` → `getSettingRoute`
- `../api/settings/save` → `saveSettingRoute`
- `../api/admin/logs/recent` → `getRecentLogsRoute`
- `../api/admin/logs/before` → `getLogsBeforeRoute`
- `../api/admin/dashboard/counts` → `getDashboardCountsRoute`
- `../api/admin/dashboard/reset` → `resetDashboardRoute`
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`

### `./pages/ProfilePage.vue`
- `vue` → `onMounted`, `ref`, `computed`
- `../components` → `DcDemoSidebar`, `DcPageHeader`, тип `NavItem`
- `../layout` → `DcAppShell`, `DcMain`
- `../shared/logger` → `createComponentLogger`

### `./pages/TestsPage.vue`
- `vue` → `onMounted`, `onBeforeUnmount`, `onUnmounted`, `ref`, `computed`
- `@app/socket` → `getOrCreateBrowserSocketClient`
- `../components` → `DcDemoSidebar`, `DcPageHeader`, тип `NavItem`
- `../layout` → `DcAppShell`, `DcMain`
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`
- `../api/admin/logs/recent` → `getRecentLogsRoute`
- `../api/admin/logs/before` → `getLogsBeforeRoute`
- (и др. api для тестов)

### `./pages/LoginPage.vue`
- `vue` → `computed`, `onMounted`, `ref`
- `../components` → `DcPageBackground`
- `../shared/logger` → `createComponentLogger`

## 3) Компоненты и layout

### `./components/index.ts`
- реэкспорт всех Dc*-компонентов и AppSidebar, типы (FilterTab, FilterTag, ListItem, TableColumn, NavItem, QuickItem, ChangelogItem, BarItem и др.)

### `./layout/index.ts`
- реэкспорт `DcAppShell`, `DcMain`, `DcContent`, `DcMainGrid`, `DcPageSection`, `DcSidebarOverlay`

## 4) Shared (общий код)

### `./shared/demoPageShell.tsx`
- `../config/project` → `getPageTitle`
- `./themeStyles` → `getGlobalThemeStyles`, `getThemeStyleElementId`
- `./preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./logLevel` → `getLogLevelScript`

### `./shared/themeStyles.ts`
- нет внутренних импортов (экспорт токенов темы dark/light, pageStyles, scrollbar, getGlobalThemeStyles, getThemeStyleElementId)

### `./shared/preloader.ts`
- нет импортов (экспорт getPreloaderStyles, getPreloaderScript(theme), getPreloaderHTML, PreloaderTheme)

### `./shared/logLevel.ts`
- `../lib/settings.lib` → `getLogLevel`, `LogLevel`
- `../lib/logger.lib` → `*`

### `./shared/logger.ts`
- нет импортов (клиентский логгер по syslog RFC 5424: severity -1…7, LOG_LEVEL_OFF=-1, читает window.__BOOT__.logLevel; createComponentLogger, setLogSink, LogEntry)

## 5) Таблицы (tables/)

(без изменений — см. ниже по файлу)
