# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, getFullUrl, getApiUrlForRoute, withProjectRoot, withProjectRootAndSubroute)

### `./config/project.tsx`
- нет внутренних импортов (только экспорт DEFAULT_PROJECT_TITLE, INDEX_PAGE_NAME, PROFILE_PAGE_NAME, ADMIN_PAGE_NAME, TESTS_PAGE_NAME, JOURNAL_PAGE_NAME, TASKS_PAGE_NAME, getPageTitle, getHeaderText, BODY_TEXT, BODY_SUBTEXT)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./styles` → `customScrollbarStyles`, `formControlStyles`
- `./shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `./config/routes` → `getFullUrl`, `ROUTES`
- `./config/project` → `INDEX_PAGE_NAME`, `BODY_TEXT`, `BODY_SUBTEXT`, `getPageTitle`, `getHeaderText`
- `./lib/logger.lib` → `*`
- `./lib/settings.lib` → `*`
- передаёт в `HomePage`: `tasksUrl` (`getFullUrl(ROUTES.tasks)`), `journalUrl`, др.

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `@app/socket` → `genSocketId`
- `../../pages/AdminPage.vue`
- `../login` → `loginPageRoute`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`, `formControlStyles`
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
- `../../styles` → `customScrollbarStyles`, `formControlStyles`
- `../../lib/logger.lib` → `*`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `PROFILE_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/tasks/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/TasksPage.vue`
- `../../lib/tasks-types` → тип `TasksTreeDto`
- `../../repos/tasks.repo` → `getTreeForUser` и др.
- `../../api/tasks/tree/get` → `getTasksTreeRoute`
- `../../api/tasks/clients/create` → `createTaskClientRoute`
- `../../api/tasks/clients/update` → `updateTaskClientRoute`
- `../../api/tasks/clients/delete` → `deleteTaskClientRoute`
- `../../api/tasks/clients/reorder` → `reorderTaskClientsRoute`
- `../../api/tasks/projects/create` → `createTaskProjectRoute`
- `../../api/tasks/projects/update` → `updateTaskProjectRoute`
- `../../api/tasks/projects/delete` → `deleteTaskProjectRoute`
- `../../api/tasks/projects/reorder` → `reorderTaskProjectsRoute`
- `../../api/tasks/items/create` → `createTaskItemRoute`
- `../../api/tasks/items/update` → `updateTaskItemRoute`
- `../../api/tasks/items/delete` → `deleteTaskItemRoute`
- `../../api/tasks/items/reorder` → `reorderTaskItemsRoute`
- `../../shared/preloader`, `../../shared/logLevel`, `../../styles` → `customScrollbarStyles`, `formControlStyles`
- `../../lib/logger.lib`, `../../lib/settings.lib`
- `../../config/routes` → `getFullUrl`, `getApiUrlForRoute`, `ROUTES`
- `../../config/project` → `TASKS_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./web/journal/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/JournalPage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`, `formControlStyles`
- `../../lib/logger.lib` → `*`
- `../../repos/journal-notes.repo` → `*`
- `../../repos/tasks.repo` → `*`
- `../../lib/tasks-types` → `TasksTreeDto`
- `../../api/journal/notes/create` → `createJournalNoteRoute`
- `../../api/journal/notes/get` → `getJournalNoteRoute`
- `../../api/journal/notes/update` → `updateJournalNoteRoute`
- `../../api/journal/notes/delete` → `deleteJournalNoteRoute`
- `../../api/tasks/tree/get` → `getTasksTreeRoute`
- `../../api/tasks/items/reorder-day` → `reorderTaskDayItemsRoute`
- `../../api/tasks/items/release-day` → `releaseTaskDayItemsRoute`
- `../../api/tasks/items/update` → `updateTaskItemRoute`
- `../../config/routes` → `getFullUrl`, `getApiUrlForRoute`, `ROUTES`
- `../../config/project` → `JOURNAL_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/tests/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `@app/socket` → `genSocketId`
- `../../lib/logger.lib` → `getAdminLogsSocketId`
- `../../pages/TestsPage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`, `formControlStyles`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `TESTS_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/login/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/LoginPage.vue`
- `../../styles` → `baseHtmlStyles`, `customScrollbarStyles`, `formControlStyles`
- `../../config/routes` → `PROJECT_ROOT`
- `../../lib/logger.lib` → `*`

## 2) Страницы‑компоненты (Vue)

### `./pages/HomePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
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
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`

### `./pages/ProfilePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`

### `./pages/JournalPage.vue`
- `vue` → `computed`, `markRaw`, `onMounted`, `onUnmounted`, `ref`, `watch`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../components/journal/JournalNotebookPane.vue`
- `../components/journal/JournalMonthPane.vue`
- `../components/journal/JournalWeekPane.vue`
- `../components/journal/JournalDayPane.vue`
- `../components/journal/JournalHabitsPane.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`
- `../lib/tasks-types` → `TasksTreeDto`
- пропсы: `journalTabInitial?` — вкладка из `?tab=` при SSR; блокнот — `journalNotesInitial?`, `journalNotesCreateUrl?`, …; вкладка «День» — `tasksTreeInitial?`, `tasksTreeGetUrl?`, `taskItemReorderDayUrl?`, `taskReleaseDayUrl?`, `taskItemUpdateUrl?`, `tasksPageUrl?`; `panePropsForTab` подставляет `notebookPaneProps` или `dayPaneProps` по `activeTab`; обработчики `@note-*` только у блокнота; активная вкладка синхронизируется с адресной строкой (`replaceState`, `popstate`)

### `./pages/TestsPage.vue`
- `vue` → `onMounted`, `onBeforeUnmount`, `onUnmounted`, `ref`, `computed`
- `@app/socket` → `getOrCreateBrowserSocketClient`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`, `setLogSink`, `LogEntry`
- `../api/admin/logs/recent` → `getRecentLogsRoute`
- `../api/admin/logs/before` → `getLogsBeforeRoute`

### `./pages/TasksPage.vue`
- `vue` → `computed`, `nextTick`, `onMounted`, `onUnmounted`, `ref`, `watch`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../components/JnCrtSelect.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`
- `../lib/tasks-types` → `TasksTreeDto`, `TaskClientDto`, `TaskProjectDto`, `TaskItemDto`

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

### `./components/JnCrtSelect.vue`
- `vue` → `computed`, `onMounted`, `onUnmounted`, `ref`
- `defineProps`: `modelValue`, `options`, `disabled?`, `id?`
- `defineEmits`: `update:modelValue`

### `./components/journal/JournalStubPanel.vue`
- (только разметка заглушки «В разработке»)

### `./components/journal/JournalNotebookPane.vue`
- `vue` → `reactive`, `ref`, `watch`
- `../../shared/logger` → `createComponentLogger`
- `defineProps`: `notes`, `isAuthenticated`, `journalNotesCreateUrl?`, `journalNotesGetUrl?`, `journalNotesUpdateUrl?`, `journalNotesDeleteUrl?`, `openNotebookEditorRequest?`
- `defineEmits`: `noteCreated`, `noteUpdated`, `noteDeleted`

### `./components/journal/JournalMonthPane.vue`
- `./JournalStubPanel.vue`

### `./components/journal/JournalWeekPane.vue`
- `./JournalStubPanel.vue`

### `./components/journal/JournalDayPane.vue`
- `vue` → `computed`, `onUnmounted`, `ref`, `watch`
- `../JnCrtSelect.vue`
- `../../lib/tasks-types` → `TasksTreeDto`, `TaskItemDto`, `TaskProjectDto`
- `../../shared/logger` → `createComponentLogger`
- пропсы: `isAuthenticated`, `tasksTreeInitial`, `tasksTreeGetUrl`, `taskItemReorderDayUrl`, `taskReleaseDayUrl`, `taskItemUpdateUrl`, `tasksPageUrl` — список задач «В работе», сортировка (кнопки и drag-and-drop), клик по названию — модалка редактирования (POST `taskItemUpdateUrl`), ссылки на страницу задач с `?client=&project=`

### `./components/journal/JournalHabitsPane.vue`
- `./JournalStubPanel.vue`

## 4) Shared (общий код)

### `./styles.tsx`
- нет внутренних импортов (только экспорт `baseHtmlStyles`, `customScrollbarStyles`, `formControlStyles`)

### `./shared/preloader.ts`
- нет импортов

### `./shared/bootUi.ts`
- первая строка: `// @shared` (обязательная пометка для загрузки в клиентском бандле Chatium)
- `vue` → `nextTick` (подписка на `boot-static-ready`; ожидание `document.fonts` с таймаутом 10 с; затем `hideBootLoader`)

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

### `./tables/journal-notes.table.ts`
- `@app/heap` → `Heap`

### `./tables/task-clients.table.ts`
- `@app/heap` → `Heap`

### `./tables/task-projects.table.ts`
- `@app/heap` → `Heap`

### `./tables/task-items.table.ts`
- `@app/heap` → `Heap`

## 6) Репозитории (repos/)

### `./repos/settings.repo.ts`
- `../tables/settings.table` → `Settings`, `SettingsRow`
- (не импортирует logger.lib — иначе рекурсия: writeServerLog → getLogLevel → getSetting → findByKey → writeServerLog)

### `./repos/logs.repo.ts`
- `../tables/logs.table` → `Logs`, `LogsRow`
- `../lib/logger.lib` → `*`
- экспортирует: `create`, `findAll`, `findById`, `findBeforeTimestamp`, `countBySeverityAfter`, `countErrorsAfter`, `countWarningsAfter`

### `./repos/journal-notes.repo.ts`
- `../tables/journal-notes.table` → `JournalNotes`, `JournalNotesRow`
- экспортирует: `JournalNoteSummary` (type), `findSummariesByUserId`, `createForUser`, `findByIdForUser`, `updateForUser`, `deleteByIdForUser`

### `./repos/tasks.repo.ts`
- `../tables/task-clients.table`, `task-projects.table`, `task-items.table`
- `../lib/tasks-types` → DTO и `TaskStatus`
- реэкспорт типов из `lib/tasks-types`

### `./lib/tasks-types.ts`
- нет импортов (чистые типы DTO для задач)

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

### `./api/journal/notes/list.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-notes.repo` → `*`

### `./api/journal/notes/create.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-notes.repo` → `*`

### `./api/journal/notes/get.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-notes.repo` → `*`

### `./api/journal/notes/update.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-notes.repo` → `*`

### `./api/journal/notes/delete.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-notes.repo` → `*`

### `./api/tasks/tree/get.ts` и CRUD `api/tasks/{clients,projects,items}/`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/tasks.repo` → `*`

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
