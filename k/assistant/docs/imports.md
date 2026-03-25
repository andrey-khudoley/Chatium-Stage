# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, ROUTE_PATHS, getFullUrl, getApiUrlForRoute, withProjectRoot, withProjectRootAndSubroute)

### `./config/project.tsx`
- нет внутренних импортов (только экспорт DEFAULT_PROJECT_TITLE, INDEX_PAGE_NAME, PROFILE_PAGE_NAME, ADMIN_PAGE_NAME, TESTS_PAGE_NAME, JOURNAL_PAGE_NAME, TASKS_PAGE_NAME, TOOLS_PAGE_NAME, POMODORO_PAGE_NAME, getPageTitle, getHeaderText, BODY_TEXT, BODY_SUBTEXT)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./styles` → `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
- `./shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `./config/routes` → `getApiUrlForRoute`, `getFullUrl`, `ROUTES`
- `./config/project` → `INDEX_PAGE_NAME`, `BODY_TEXT`, `BODY_SUBTEXT`, `getPageTitle`, `getHeaderText`
- `./lib/logger.lib` → `*`
- `./lib/settings.lib` → `*`
- `./api/pomodoro/state/get` → `getPomodoroStateRoute`
- `./api/pomodoro/control` → `pomodoroControlRoute`
- передаёт в `HomePage`: `tasksUrl` (`getFullUrl(ROUTES.tasks)`), `journalUrl`, `toolsUrl`, `pomodoroStateGetUrl`, `pomodoroControlUrl`, др.

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `@app/socket` → `genSocketId`
- `../../pages/AdminPage.vue`
- `../login` → `loginPageRoute`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
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
- `../../styles` → `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
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
- `../../api/tasks/tasks-ai-chat-ensure` → `taskAiChatEnsureRoute`
- `../../api/tasks/tasks-ai-chat-reset` → `taskAiChatResetRoute`
- `../../api/pomodoro/assign-task` → `pomodoroAssignTaskRoute`
- `../../api/pomodoro/state/get` → `getPomodoroStateRoute`
- `../../api/pomodoro/control` → `pomodoroControlRoute`
- `../../shared/preloader`, `../../shared/logLevel`, `../../styles` → `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
- `../../lib/logger.lib`, `../../lib/settings.lib`
- `../../config/routes` → `getFullUrl`, `getApiUrlForRoute`, `ROUTES`
- `../../config/project` → `TASKS_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./web/journal/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/JournalPage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
- `../../lib/logger.lib` → `*`
- `../../repos/journal-notes.repo` → `*`
- `../../repos/tasks.repo` → `*`
- `../../lib/tasks-types` → `TasksTreeDto`
- `../../api/journal/notes/create` → `createJournalNoteRoute`
- `../../api/journal/notes/get` → `getJournalNoteRoute`
- `../../api/journal/notes/update` → `updateJournalNoteRoute`
- `../../api/journal/notes/delete` → `deleteJournalNoteRoute`
- `../../api/journal/day/get` → `getJournalDayEntryRoute`
- `../../api/journal/day/save` → `saveJournalDayEntryRoute`
- `../../api/journal/week/get` → `getJournalWeekEntryRoute`
- `../../api/journal/week/save` → `saveJournalWeekDayEntryRoute`
- `../../api/journal/week/save-summary` → `saveJournalWeekSummaryRoute`
- `../../api/tasks/tree/get` → `getTasksTreeRoute`
- `../../api/tasks/items/reorder-day` → `reorderTaskDayItemsRoute`
- `../../api/tasks/items/release-day` → `releaseTaskDayItemsRoute`
- `../../api/tasks/items/update` → `updateTaskItemRoute`
- `../../api/pomodoro/assign-task` → `pomodoroAssignTaskRoute`
- `../../api/pomodoro/state/get` → `getPomodoroStateRoute`
- `../../api/pomodoro/control` → `pomodoroControlRoute`
- `../../config/routes` → `getFullUrl`, `getApiUrlForRoute`, `ROUTES`
- `../../config/project` → `JOURNAL_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`
- `../../repos/journal-day-entries.repo` → `*`
- `../../lib/journal-day-key` → `computeJournalDayKeyInTimeZone`
- `../../repos/journal-week-entries.repo` → `*`
- `../../lib/journal-week-key` → `computeJournalWeekMondayKeyLocal`

### `./web/tools/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/ToolsPage.vue`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `TOOLS_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/timers/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/PomodoroPage.vue`
- `../../lib/pomodoro.lib` → `getState` (SSR начального состояния)
- `../../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyInTimeZone`
- `../../lib/pomodoro-types` → тип `PomodoroStateDto`
- `../../config/routes` → `getApiUrlForRoute`, `getFullUrl`, `ROUTES`
- `../../config/project` → `POMODORO_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`
- `../../api/pomodoro/state/get` → `getPomodoroStateRoute`
- `../../api/pomodoro/control` → `pomodoroControlRoute`
- `../../api/pomodoro/settings/save` → `savePomodoroSettingsRoute`
- `../../api/pomodoro/assign-task` → `pomodoroAssignTaskRoute`
- `../../api/tasks/in-progress` → `getInProgressTasksRoute`
- `../../api/tools/focus-log` → `toolsFocusLogRoute`
- `../../styles` → `customScrollbarStyles`, `formControlStyles`, `mobileSafeAreaStyles`, `VIEWPORT_META_CONTENT`

### `./web/tests/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `@app/socket` → `genSocketId`
- `../../lib/logger.lib` → `getAdminLogsSocketId`
- `../../pages/TestsPage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../shared/logLevel` → `getLogLevelForPage`, `getLogLevelScript`
- `../../styles` → `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `TESTS_PAGE_NAME`, `getPageTitle`, `getHeaderText`
- `../../lib/settings.lib` → `*`

### `./web/login/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/LoginPage.vue`
- `../../styles` → `baseHtmlStyles`, `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`
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

### `./components/admin/AiSettings.vue`
- `vue` → `ref`, `watch`, `onMounted`, `onBeforeUnmount`
- `../api/settings/get` → `getSettingRoute`
- `../api/settings/save` → `saveSettingRoute`
- `../shared/logger` → `createComponentLogger`
- `../config/prompts` → `AVAILABLE_AI_MODELS`, `DEFAULT_AI_MODEL`

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
- `../components/journal/JournalNav.vue`
- `../components/journal/JournalNotebookPane.vue`
- `../components/journal/JournalMonthPane.vue`
- `../components/journal/JournalWeekPane.vue`
- `../components/journal/JournalDayPane.vue`
- `../components/journal/JournalDayInDevelopmentPane.vue`
- `../components/journal/JournalHabitsPane.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`
- `../lib/tasks-types` → `TasksTreeDto`
- пропсы: `journalTabInitial?` — вкладка из `?tab=` при SSR; блокнот — `journalNotesInitial?`, `journalNotesCreateUrl?`, …; вкладка «Задачи» (`tasks`) — `tasksTreeInitial?`, `tasksTreeGetUrl?`, `taskItemReorderDayUrl?`, `taskReleaseDayUrl?`, `taskItemUpdateUrl?`, `tasksPageUrl?`; `panePropsForTab` подставляет `notebookPaneProps` или `dayPaneProps` по `activeTab`; обработчики `@note-*` только у блокнота; активная вкладка синхронизируется с адресной строкой (`replaceState`, `popstate`)

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
- `../components/tasks/TasksAiChatPanel.vue`
- `../shared/bootUi` → `subscribeBootStaticReady`, `scheduleHideBootLoader`
- `../shared/logger` → `createComponentLogger`
- `../lib/tasks-types` → `TasksTreeDto`, `TaskClientDto`, `TaskProjectDto`, `TaskItemDto`
- `../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyLocal` (при привязке задачи к Pomodoro)
- событие `tasks-maybe-changed` от чата — отложенный `refreshTree` после ответа ассистента

### `./pages/ToolsPage.vue`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`

### `./pages/PomodoroPage.vue`
- `vue` → `computed`, `onMounted`, `onUnmounted`, `ref`, `watch`, `nextTick`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`
- `../components/pomodoro/PomodoroToolsWorkspace.vue`
- `../lib/pomodoro-phase-sounds` → `playPomodoroPhaseChangeSound`
- `../lib/pomodoro-types` → `formatPomodoroSecondsDisplay` (как `fmt`)
- `../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyLocal`
- пропсы SSR от `web/timers/index.tsx`: `initialPomodoroState`, `initialServerNowMs` (опционально)
- второй блок `<style>` без `scoped` в этом же файле — глобальные CRT-стили (`.pomodoro-phase-bar`, `.pomodoro-actions`, `.pomo-btn`, …) для `/web/timers`; отдельные `.css` из `import` в `<script>` в этой среде не подключаются в бандл

### `./components/tasks/TasksAiChatPanel.vue`
- `vue` → `computed`, `onMounted`, `onUnmounted`, `ref`, `watch`, `nextTick`
- `@app/socket` → `getOrCreateBrowserSocketClient`
- `../../shared/logger` → `createComponentLogger`
- `../../shared/tasks-ai-chat-message-order` → `sortTaskAiChatMessagesForDisplay`
- пропсы: `projectId`, `isAuthenticated`, `ensureUrl`, `resetUrl` — чат с AI на фиде (`getChat`), вебсокет + polling `messages/changes`
- `emit('tasks-maybe-changed')` при появлении нового сообщения ассистента в фиде (после JSON-действий на сервере список задач мог обновиться)

### `./pages/LoginPage.vue`
- `vue` → `computed`, `onMounted`
- `../shared/logger` → `createComponentLogger`

## 3) Компоненты (components/)

### `./components/Header.vue`
- `vue` → `ref`, `onMounted`, `onUnmounted`
- `./LogoutModal.vue`
- `../shared/logger` → `createComponentLogger`
- `../lib/pomodoro-types` → `formatPomodoroSecondsDisplay`
- `../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyLocal`

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

### `./components/pomodoro/PomodoroTimerDial.vue`
- `vue` → `computed`
- `defineProps`: `phase`, `remainingSec`, `overtimeSec`, `phaseDurationSec`, `status`, `phaseLabel`, `statusLabel`, `timeLabel`

### `./components/pomodoro/PomodoroSettingsModal.vue`
- `vue` → `reactive`, `watch`
- `../../lib/pomodoro-types` → `PomodoroAfterLongRest`, `normalizePhaseChangeSoundId`
- `../../lib/pomodoro-phase-sounds` → `POMODORO_PHASE_CHANGE_SOUND_OPTIONS`, `playPomodoroPhaseChangeSound`
- `defineProps`: `isOpen`, `saving`, `modelValue`
- `defineEmits`: `close`, `save`

### `./components/pomodoro/PomodoroTaskSelector.vue`
- `vue` → `computed`, `onMounted`, `ref`
- `defineProps`: `assignTaskUrl`, `getTasksUrl`, `currentTaskId`, `statsDayKey` (передаётся в `assign-task` вместе с `taskId`)

### `./components/pomodoro/PomodoroToolStatsRow.vue`
- `defineProps`: `firstText`, `secondText`, `thirdText`, `firstLabel`, `secondLabel`, `thirdLabel`, `firstIcon`, `secondIcon`, `thirdIcon` (три ячейки `.stat-cell` в одной сетке; общая вёрстка для вкладок Pomodoro и таймера/секундомера)

### `./components/pomodoro/PomodoroToolsWorkspace.vue`
- `vue` → `computed`
- `../../lib/focus-clock-local-stats` → `readFocusClockStatsFromStorage`
- `../../lib/pomodoro-types` → `formatPomodoroSecondsDisplay`, типы `PomodoroPhaseCompleteAction`, `PomodoroAfterLongRest`
- `../../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyLocal`
- `./PomodoroTimerDial.vue`, `./PomodoroSettingsModal.vue`, `./PomodoroTaskSelector.vue`, `./FocusClockPane.vue`, `./PomodoroToolStatsRow.vue`
- `defineProps`: `state`, `localTickMs`, `sharedSelectedTaskId`, `settingsModel`, `saving`, `actionPending`, `assignTaskUrl`, `getTasksUrl`, `toolsFocusLogUrl`, `activeTool`, `settingsOpen`
- `defineEmits`: `update:activeTool`, `update:settingsOpen`, `control`, `save-settings`, `pomodoro-task-assigned`, `shared-task-selected`

### `./components/pomodoro/FocusClockPane.vue`
- стили панели фазы и кнопок — глобальный блок в `PomodoroPage.vue` (см. выше); в scoped `FocusClockPane` остаются оболочка, модалка настроек (`clock-settings-*`), оформление секундомерного dial
- `vue` → `computed`, `onMounted`, `onUnmounted`, `ref`, `watch`
- `../../lib/pomodoro-types` → `formatPomodoroSecondsDisplay` (как `fmt`)
- `../../lib/focus-clock-local-stats` → `buildFocusClockStatsPayload`, `readFocusClockStatsFromStorage`, `writeFocusClockStatsToStorage`
- `../../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyLocal`
- `./PomodoroTimerDial.vue`, `./PomodoroTaskSelectDropdown.vue`
- `defineProps`: `mode`, `focusLogUrl`, `getTasksUrl`, `selectedTaskId?`
- `defineEmits`: `taskSelected`

### `./components/journal/JournalStubPanel.vue`
- (только разметка заглушки «В разработке»)

### `./components/journal/JournalNav.vue`
- `defineProps`: `tabs`, `activeTab`, `showNotebookToolbar`, `showTasksToolbar`, `isAuthenticated`, `notebookCreateTitle`, `notebookCreateError`
- `defineEmits`: `select-tab`, `create-note`, `open-all-tasks`
- отвечает за левое меню журнала: список вкладок, разделитель, динамические кнопки (`Новая заметка` / `Все задачи` на вкладке «Задачи») и их стили/focus

### `./components/journal/JournalNotebookPane.vue`
- `vue` → `reactive`, `ref`, `watch`
- `../../shared/logger` → `createComponentLogger`
- `defineProps`: `notes`, `isAuthenticated`, `journalNotesCreateUrl?`, `journalNotesGetUrl?`, `journalNotesUpdateUrl?`, `journalNotesDeleteUrl?`, `openNotebookEditorRequest?`
- `defineEmits`: `noteCreated`, `noteUpdated`, `noteDeleted`

### `./components/journal/JournalMonthPane.vue`
- `./JournalStubPanel.vue`

### `./components/journal/JournalWeekPane.vue`
- `vue` → `computed`, `onMounted`, `ref`, `watch`
- `../../lib/journal-week-key` → `computeJournalWeekMondayKeyLocal`, `getWeekDayKeysFromMonday`, `getWeekNumberFromMondayKey`, `shiftWeekMondayKey`

### `./components/journal/JournalDayInDevelopmentPane.vue`
- `vue` → `computed`, `onMounted`, `ref`, `watch`
- `../../lib/journal-day-key` → `computeJournalDayKeyLocal`

### `./components/journal/JournalDayPane.vue`
- `vue` → `computed`, `onUnmounted`, `ref`, `watch`
- `../JnCrtSelect.vue`
- `../../lib/tasks-types` → `TasksTreeDto`, `TaskItemDto`, `TaskProjectDto`
- `../../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyLocal` (добавление задачи в Pomodoro)
- `../../shared/logger` → `createComponentLogger`
- пропсы: `isAuthenticated`, `tasksTreeInitial`, `tasksTreeGetUrl`, `taskItemReorderDayUrl`, `taskReleaseDayUrl`, `taskItemUpdateUrl`, `tasksPageUrl` — список задач «В работе», сортировка (кнопки и drag-and-drop), клик по названию — модалка редактирования (POST `taskItemUpdateUrl`), ссылки на страницу задач с `?client=&project=`

### `./components/journal/JournalHabitsPane.vue`
- `./JournalStubPanel.vue`

## 4) Shared (общий код)

### `./styles.tsx`
- нет внутренних импортов (только экспорт `baseHtmlStyles`, `customScrollbarStyles`, `mobileSafeAreaStyles`, `formControlStyles`, `VIEWPORT_META_CONTENT`)

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

### `./shared/tasks-ai-chat-message-order.ts`
- первая строка: `// @shared`
- нет импортов — `taskAiChatMsgTime`, `sortTaskAiChatMessagesForDisplay` (хронологический порядок сообщений чата с AI для UI и сервера)

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

### `./tables/pomodoro-state.table.ts`
- `@app/heap` → `Heap`

### `./tables/journal-day-entries.table.ts`
- `@app/heap` → `Heap`

### `./tables/journal-week-entries.table.ts`
- `@app/heap` → `Heap`

### `./tables/journal-week-summary.table.ts`
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

### `./repos/journal-day-entries.repo.ts`
- `../tables/journal-day-entries.table` → `JournalDayEntries`, `JournalDayEntriesRow`

### `./repos/journal-week-entries.repo.ts`
- `../tables/journal-week-entries.table` → `JournalWeekEntries`
- `../tables/journal-week-summary.table` → `JournalWeekSummary`
- `../lib/journal-week-key` → `getWeekDayKeysFromMonday`, `getWeekNumberFromMondayKey`

### `./repos/tasks.repo.ts`
- `../tables/task-clients.table`, `task-projects.table`, `task-items.table`
- `../lib/tasks-types` → DTO и `TaskStatus`
- реэкспорт типов из `lib/tasks-types`

### `./repos/pomodoro.repo.ts`
- `../tables/pomodoro-state.table` → `PomodoroState`
- `../lib/pomodoro-types` → `PomodoroAfterLongRest`, `PomodoroPhase`, `PomodoroStatus`, `PomodoroSettingsInput`, `PomodoroStateDto`, `normalizePhaseChangeSoundId`
- `../lib/pomodoro-stats-day` → `computePomodoroStatsDayKeyInTimeZone`, `normalizeClientStatsDayKey`

### `./lib/tasks-types.ts`
- нет импортов (чистые типы DTO для задач)

### `./lib/pomodoro-phase-sounds.ts`
- первая строка: `// @shared` (импорт из Vue)
- `./pomodoro-types` → `PomodoroPhaseChangeSoundId`, `normalizePhaseChangeSoundId`
- экспорт `POMODORO_PHASE_CHANGE_SOUND_OPTIONS`, `playPomodoroPhaseChangeSound` (Web Audio API)

### `./lib/pomodoro-types.ts`
- первая строка: `// @shared` (импорт из Vue)
- нет импортов (типы статуса/фаз Pomodoro, DTO, `PomodoroPhaseChangeSoundId`, `normalizePhaseChangeSoundId`, `formatPomodoroSecondsDisplay`)

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

### `./lib/pomodoro-stats-day.ts`
- `@shared` — ключ периода дневной статистики (05:00 локально / Москва): `computePomodoroStatsDayKeyLocal`, `computePomodoroStatsDayKeyInTimeZone`, `normalizeClientStatsDayKey`

### `./lib/journal-day-key.ts`
- `@shared` — ключ дневного периода (граница 05:00): `computeJournalDayKeyLocal`, `computeJournalDayKeyInTimeZone`, `normalizeClientJournalDayKey`

### `./lib/journal-week-key.ts`
- `@shared` — ключ понедельника недели и диапазон дат: `computeJournalWeekMondayKeyLocal`, `normalizeWeekMondayKey`, `shiftWeekMondayKey`, `getWeekDayKeysFromMonday`, `getWeekMondayKeyForDateKey`, `getWeekNumberFromMondayKey`

### `./lib/pomodoro.lib.ts`
- `@app/sync` → `runWithExclusiveLock`
- `../repos/pomodoro.repo` → `*`
- `../repos/pomodoro-launches.repo` → `*`
- `../repos/tasks.repo` → `*`
- `./pomodoro-types` → `PomodoroSettingsInput`, `PomodoroStateDto`

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

### `./api/journal/day/get.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-day-entries.repo` → `*`
- `../../../lib/journal-day-key` → `computeJournalDayKeyInTimeZone`, `normalizeClientJournalDayKey`

### `./api/journal/day/save.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-day-entries.repo` → `*`
- `../../../lib/journal-day-key` → `computeJournalDayKeyInTimeZone`, `normalizeClientJournalDayKey`

### `./api/journal/week/get.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-week-entries.repo` → `*`
- `../../../lib/journal-week-key` → `computeJournalWeekMondayKeyLocal`, `normalizeWeekMondayKey`

### `./api/journal/week/save.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-week-entries.repo` → `*`
- `../../../lib/journal-week-key` → `getWeekMondayKeyForDateKey`, `normalizeClientJournalDateKey`

### `./api/journal/week/save-summary.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/logger.lib` → `*`
- `../../../repos/journal-week-entries.repo` → `*`
- `../../../lib/journal-week-key` → `normalizeWeekMondayKey`

### `./api/tasks/tasks-ai-chat-lib.ts`
- `@app/auth` → `findUsersByIds`, `SmartUser`
- `@app/feed` → `createFeedMessage`
- `../../shared/tasks-ai-chat-message-order` → `taskAiChatMsgTime` (реэкспорт)
- `../../repos/task-ai-chat.repo`, `../../repos/tasks.repo`
- типы и хелперы чата с AI (маппинг авторов, контекст проекта для completion, `appendTaskAiChatAssistantMessage`)

### `./api/tasks/tasks-ai-chat-messages-get.ts`
- `@app/auth` → `requireRealUser`, `findUsersByIds`
- `@app/feed` → `feedMessagesGetHandler`, `getFeedById`
- `./tasks-ai-chat-lib` → `assertTaskAiChatFeedAccess`, `mapTaskAiChatMessage`, `TaskAiChatFeedMsg`
- `../../shared/tasks-ai-chat-message-order` → `sortTaskAiChatMessagesForDisplay` (после маппинга — порядок старые→новые для UI)

### `./api/tasks/tasks-ai-chat-messages-changes.ts`
- `@app/auth` → `requireRealUser`, `findUsersByIds`
- `@app/feed` → `feedMessagesChangesHandler`, `getFeedById`
- `./tasks-ai-chat-lib` → `assertTaskAiChatFeedAccess`, `mapTaskAiChatMessage`, `TaskAiChatFeedMsg`

### `./api/tasks/tasks-ai-chat-messages-add.ts`
- `@app/auth` → `requireRealUser`, `findUsersByIds`
- `@app/feed` → `feedMessagesAddHandler`, `getFeedById`
- `./tasks-ai-chat-lib` → `mapAuthorForTaskAiChat`, `assertTaskAiChatFeedAccess`, `TaskAiChatFeedMsg`
- `./tasks-ai-chat-reply` → `runTaskAiChatReplyIfNeeded`
- `../../repos/task-ai-chat.repo`

### `./api/tasks/tasks-ai-chat-reply.ts`
- `@app/feed` → `findFeedMessages`
- `@app/sync` → `runWithExclusiveLock`
- `@start/sdk` → `startCompletion`
- `../../config/prompts` → `TASKS_AI_CHAT_JSON_APPENDIX`; `../../lib/settings.lib` → `getAiFormulateSystemPrompt`, `getAiModel`
- `../../repos/task-ai-chat.repo`
- `./tasks-ai-chat-completion-completed`, `./tasks-ai-chat-completion-failed`, `./tasks-ai-chat-lib`
- вызывается из `tasks-ai-chat-messages-add` (HTTP) — `startCompletion` требует proxy app context (`ctx.app`)

### `./api/tasks/tasks-ai-formulate-apply.ts`
- `../../lib/logger.lib`, `../../repos/tasks.repo`
- `parseAiFormulateJsonFromText`, `stripJsonFences`, `applyAiFormulateJsonResponse` (логика бывшего `ai-formulate` по `actions`)

### `./api/tasks/tasks-ai-chat-completion-completed.ts` / `tasks-ai-chat-completion-failed.ts`
- `@start/sdk` → `CompletionCompletedBody` / `CompletionFailedBody`
- `../../lib/logger.lib`, `./tasks-ai-chat-lib` → `appendTaskAiChatAssistantMessage`
- completed: `./tasks-ai-formulate-apply` (JSON → Heap)

### `./api/tasks/tasks-ai-chat-ensure.ts`
- `@app/auth` → `requireRealUser`
- `@app/feed` → `getChat`, `getOrCreateParticipant`
- `./tasks-ai-chat-messages-add` → `taskAiChatMessagesAddRoute`
- `./tasks-ai-chat-messages-changes` → `taskAiChatMessagesChangesRoute`
- `./tasks-ai-chat-messages-get` → `taskAiChatMessagesGetRoute`
- `../../lib/logger.lib`, `../../repos/task-ai-chat.repo`

### `./api/tasks/tasks-ai-chat-reset.ts`
- `@app/auth` → `requireRealUser`
- `@app/feed` → `getOrCreateParticipant`
- `../../lib/logger.lib`, `../../repos/task-ai-chat.repo`

### `./repos/task-ai-chat.repo.ts`
- `@app/feed` → `createFeed`, `deleteFeed`
- `@app/sync` → `runWithExclusiveLock`
- `../tables/task-ai-chat-feeds.table`, `../tables/task-projects.table`

### `./tables/task-ai-chat-feeds.table.ts`
- `@app/heap` → `Heap`

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

### `./api/pomodoro/assign-task.ts`
- `@app/auth` → `requireRealUser`
- `../../lib/pomodoro.lib` → `*`

### `./api/pomodoro/control.ts`
- `@app/auth` → `requireRealUser`
- `../../lib/pomodoro.lib` → `start`, `resume`, `pause`, `stop`, `reset`, `skipPhase`

### `./api/pomodoro/state/get.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/pomodoro.lib` → `*`

### `./api/pomodoro/settings/save.ts`
- `@app/auth` → `requireRealUser`
- `../../../lib/pomodoro.lib` → `*`
