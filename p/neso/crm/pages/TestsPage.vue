<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUnmounted, ref, computed } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import AppShell from '../web/design/components/AppShell.vue'
import { createComponentLogger, setLogSink, type LogEntry } from '../shared/logger'
import { getRecentLogsRoute } from '../api/admin/logs/recent'
import { getLogsBeforeRoute } from '../api/admin/logs/before'

const log = createComponentLogger('TestsPage')

declare const ctx: app.Ctx

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl: string
  inquiriesUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  encodedLogsSocketId?: string
}>()

const navItems = computed(() =>
  [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная', href: props.indexUrl },
    { id: 'inquiries', icon: 'fa-comments', label: 'Обращения', href: props.inquiriesUrl },
    { id: 'profile', icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
    { id: 'admin', icon: 'fa-gear', label: 'Админка', href: props.adminUrl },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты', href: props.testsUrl }
  ].filter((item) => item.href)
)

const showContent = ref(false)
const bootLoaderDone = ref(false)

const displayedTitle = ref('')
const displayedDescription = ref('')
const showCursor = ref(false)
const cursorPosition = ref<'title' | 'description' | 'final'>('title')
const showTitleUnderline = ref(false)

const intervalIds = { title: null as ReturnType<typeof setInterval> | null, desc: null as ReturnType<typeof setInterval> | null }

const MAX_LOG_ENTRIES = 500
const logEntries = ref<LogEntry[]>([])
let logsSocketSubscription: { unsubscribe?: () => void } | null = null
const logsOutputRef = ref<HTMLElement | null>(null)
const logsLoading = ref(false)
const logsError = ref('')
const logsHasMore = ref(false)
const oldestLogTimestamp = ref<number | null>(null)
const logFilters = ref({ info: true, warn: true, error: true })

type LogDisplayItem =
  | { type: 'log'; entry: LogEntry; formattedTime: string; formattedMessage: string }
  | { type: 'divider'; date: string }

function formatLogTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function formatLogMessage(e: LogEntry): string {
  return e.args.map((a) =>
    typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)
  ).join(' ')
}

function formatDateDivider(timestamp: number): string {
  const d = new Date(timestamp)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function trimOldLogs() {
  if (logEntries.value.length > MAX_LOG_ENTRIES) {
    const sorted = [...logEntries.value].sort((a, b) => b.timestamp - a.timestamp)
    logEntries.value = sorted.slice(0, MAX_LOG_ENTRIES)
  }
}

const displayedLogs = computed<LogDisplayItem[]>(() => {
  const filtered = logEntries.value.filter((e) => {
    if (e.severity <= 3 && logFilters.value.error) return true
    if (e.severity === 4 && logFilters.value.warn) return true
    if (e.severity >= 5 && logFilters.value.info) return true
    return false
  })
  if (!filtered.length) return []
  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp)
  const items: LogDisplayItem[] = []
  let lastDateKey = ''
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    const dateKey = getDateKey(entry.timestamp)
    if (i > 0 && dateKey !== lastDateKey) {
      items.push({ type: 'divider', date: formatDateDivider(entry.timestamp) })
    }
    lastDateKey = dateKey
    items.push({
      type: 'log',
      entry,
      formattedTime: formatLogTime(entry.timestamp),
      formattedMessage: formatLogMessage(entry)
    })
  }
  return items
})

const toggleLogFilter = (level: 'info' | 'warn' | 'error') => {
  logFilters.value[level] = !logFilters.value[level]
  log.info('Фильтр логов переключён', level, logFilters.value[level])
}

const loadRecentLogs = async () => {
  logsLoading.value = true
  logsError.value = ''
  try {
    const res = await getRecentLogsRoute.query({ limit: 50 }).run(ctx)
    const data = res as { success?: boolean; entries?: Array<LogEntry & { id: string }>; error?: string }
    if (data?.success && Array.isArray(data.entries)) {
      logEntries.value = [...logEntries.value, ...data.entries]
      if (data.entries.length > 0) {
        const sorted = [...data.entries].sort((a, b) => a.timestamp - b.timestamp)
        oldestLogTimestamp.value = sorted[0].timestamp
      }
      logsHasMore.value = data.entries.length === 50
    } else {
      logsError.value = data?.error || 'Ошибка загрузки логов'
    }
  } catch (e) {
    logsError.value = (e as Error)?.message || 'Ошибка сети'
  } finally {
    logsLoading.value = false
  }
}

const loadMoreLogs = async () => {
  if (!oldestLogTimestamp.value) {
    log.warning('Попытка загрузить больше логов без oldestLogTimestamp')
    return
  }
  logsLoading.value = true
  logsError.value = ''
  try {
    const res = await getLogsBeforeRoute
      .query({ beforeTimestamp: String(oldestLogTimestamp.value), limit: 50 })
      .run(ctx)
    const data = res as {
      success?: boolean
      entries?: Array<LogEntry & { id: string }>
      hasMore?: boolean
      error?: string
    }
    if (data?.success && Array.isArray(data.entries)) {
      logEntries.value = [...logEntries.value, ...data.entries]
      if (data.entries.length > 0) {
        const sorted = [...data.entries].sort((a, b) => a.timestamp - b.timestamp)
        oldestLogTimestamp.value = sorted[0].timestamp
      }
      logsHasMore.value = data?.hasMore ?? data.entries.length === 50
      log.info('Дополнительные логи загружены', { count: data.entries.length })
    } else {
      logsError.value = data?.error || 'Ошибка загрузки логов'
      log.error('Ошибка загрузки дополнительных логов', logsError.value)
    }
  } catch (e) {
    logsError.value = (e as Error)?.message || 'Ошибка сети'
    log.error('Ошибка загрузки дополнительных логов', e)
  } finally {
    logsLoading.value = false
  }
}

const clearLogs = () => {
  logEntries.value = []
  oldestLogTimestamp.value = Date.now()
  logsHasMore.value = true
  logsError.value = ''
  log.info('Логи очищены, таймштамп сдвинут на текущий — «Загрузить ещё 50» восстановит последние')
}

const typeTextSequence = () => {
  log.debug('Tests title animation started')
  const titleText = 'Тесты'
  cursorPosition.value = 'title'

  let titleIndex = 0
  intervalIds.title = setInterval(() => {
    if (titleIndex < titleText.length) {
      displayedTitle.value = titleText.substring(0, titleIndex + 1)
      titleIndex++
    } else {
      if (intervalIds.title) clearInterval(intervalIds.title)
      intervalIds.title = null
      showTitleUnderline.value = true
      typeDescription()
    }
  }, 15)
}

const typeDescription = () => {
  const descriptionText = 'Страница для тестов и проверок'
  cursorPosition.value = 'description'
  let descIndex = 0
  intervalIds.desc = setInterval(() => {
    if (descIndex < descriptionText.length) {
      displayedDescription.value = descriptionText.substring(0, descIndex + 1)
      descIndex++
    } else {
      if (intervalIds.desc) clearInterval(intervalIds.desc)
      intervalIds.desc = null
      cursorPosition.value = 'final'
      showContent.value = true
    }
  }, 15)
}

const startAnimations = () => {
  log.info('Boot loader complete, starting tests page animations')
  bootLoaderDone.value = true
  showCursor.value = true
  cursorPosition.value = 'title'
  setTimeout(() => typeTextSequence(), 200)
}

onMounted(() => {
  log.info('Component mounted')
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  if ((window as any).bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  if (props.encodedLogsSocketId) {
    setLogSink((entry: LogEntry) => {
      logEntries.value.push(entry)
      trimOldLogs()
    })
    getOrCreateBrowserSocketClient()
      .then((socketClient) => {
        logsSocketSubscription = socketClient.subscribeToData(props.encodedLogsSocketId!)
        logsSocketSubscription.listen((data: { type?: string; data?: LogEntry }) => {
          if (data?.type === 'new-log' && data.data) {
            const entry = data.data as LogEntry
            logEntries.value.push(entry)
            trimOldLogs()
          }
        })
      })
      .catch((err) => log.error('Не удалось подписаться на логи по WebSocket', err))
    loadRecentLogs()
  }
})

onBeforeUnmount(() => {
  if (logsSocketSubscription?.unsubscribe) {
    logsSocketSubscription.unsubscribe()
    logsSocketSubscription = null
  }
})

onUnmounted(() => {
  log.info('Component unmounted')
  setLogSink(null)
  window.removeEventListener('bootloader-complete', startAnimations)
  if (intervalIds.title) clearInterval(intervalIds.title)
  if (intervalIds.desc) clearInterval(intervalIds.desc)
})

/* Дашборд тестов */
const testMetrics = ref({
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  lastRunAt: null as string | null
})
const runAllTestsLoading = ref(false)

/** Результат одного теста */
type TestResult = { id: string; title: string; passed: boolean; error?: string }

/** Базовый URL (origin + путь проекта без trailing slash) */
function getApiBaseUrl(): string {
  const path = props.indexUrl.startsWith('http')
    ? new URL(props.indexUrl).pathname
    : props.indexUrl
  const basePath = path.replace(/\/$/, '') || '/p/template_project'
  const origin =
    props.indexUrl.startsWith('http') ? new URL(props.indexUrl).origin : window.location.origin
  return `${origin}${basePath.startsWith('/') ? basePath : '/' + basePath}`
}

/* --- Блок 1: Проверка эндпоинтов (маршруты /, /web/admin, ...) --- */
const ENDPOINTS_ROUTES: Array<{ id: string; path: string; title: string }> = [
  { id: 'index', path: '/', title: 'Эндпоинт /' },
  { id: 'web-admin', path: '/web/admin', title: 'Эндпоинт /web/admin' },
  { id: 'web-profile', path: '/web/profile', title: 'Эндпоинт /web/profile' },
  { id: 'web-login', path: '/web/login', title: 'Эндпоинт /web/login' },
  { id: 'web-tests', path: '/web/tests', title: 'Эндпоинт /web/tests' }
]
const endpointsResults = ref<TestResult[]>([])
const endpointsLoading = ref(false)
const endpointsLastRunAt = ref<string | null>(null)

const endpointsDisplay = computed(() => {
  const byId = new Map(endpointsResults.value.map((r) => [r.id, r]))
  return ENDPOINTS_ROUTES.map((t) => {
    const res = byId.get(t.id)
    return {
      id: t.id,
      title: t.title,
      path: t.path,
      status: res === undefined ? 'todo' : res.passed ? 'success' : 'fail',
      error: res && !res.passed ? res.error : undefined
    }
  })
})

async function runEndpointsTests() {
  endpointsLoading.value = true
  endpointsResults.value = []
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  log.info('Запуск проверки эндпоинтов')
  try {
    const results: TestResult[] = []
    for (const t of ENDPOINTS_ROUTES) {
      const url = `${baseUrl}${t.path === '/' ? '' : t.path}`
      try {
        const res = await fetch(url, { method: 'GET', credentials: 'include' })
        results.push({
          id: t.id,
          title: t.title,
          passed: res.ok,
          error: res.ok ? undefined : `HTTP ${res.status}`
        })
      } catch (e) {
        results.push({
          id: t.id,
          title: t.title,
          passed: false,
          error: (e as Error)?.message ?? String(e)
        })
      }
    }
    endpointsResults.value = results
    endpointsLastRunAt.value = new Date().toLocaleString('ru-RU')
    log.info('Проверка эндпоинтов завершена', { passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed).length })
  } finally {
    endpointsLoading.value = false
  }
}

/* --- Блок 2: Библиотека настроек (settings.lib) --- */
const SETTINGS_LIB_TESTS: Array<{ id: string; title: string }> = [
  { id: 'getSettingString', title: 'getSettingString (project_name)' },
  { id: 'getLogLevel', title: 'getLogLevel' },
  { id: 'getLogsLimit', title: 'getLogsLimit' },
  { id: 'getLogWebhook', title: 'getLogWebhook' },
  { id: 'getDashboardResetAt', title: 'getDashboardResetAt' },
  { id: 'getAllSettings', title: 'getAllSettings' }
]
const settingsResults = ref<TestResult[]>([])
const settingsLoading = ref(false)
const settingsLastRunAt = ref<string | null>(null)

const settingsDisplay = computed(() => {
  const byId = new Map(settingsResults.value.map((r) => [r.id, r]))
  return SETTINGS_LIB_TESTS.map((t) => {
    const res = byId.get(t.id)
    return {
      id: t.id,
      title: t.title,
      status: res === undefined ? 'todo' : res.passed ? 'success' : 'fail',
      error: res && !res.passed ? res.error : undefined
    }
  })
})

async function runSettingsTests() {
  settingsLoading.value = true
  settingsResults.value = []
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  log.info('Запуск проверки библиотеки настроек')
  try {
    const res = await fetch(`${baseUrl}/api/tests/endpoints-check/settings-lib`, { method: 'GET', credentials: 'include' })
    const data = (await res.json().catch(() => null)) as { success?: boolean; results?: TestResult[] }
    if (res.ok && data?.success && Array.isArray(data.results)) {
      settingsResults.value = data.results
    } else {
      settingsResults.value = SETTINGS_LIB_TESTS.map((t) => ({ id: t.id, title: t.title, passed: false, error: 'Ошибка запроса' }))
    }
    settingsLastRunAt.value = new Date().toLocaleString('ru-RU')
  } finally {
    settingsLoading.value = false
  }
}

/* --- Блок 3: Репозиторий настроек (settings.repo) --- */
const SETTINGS_REPO_TESTS: Array<{ id: string; title: string }> = [
  { id: 'upsert', title: 'upsert' },
  { id: 'deleteByKey', title: 'deleteByKey' },
  { id: 'findByKey', title: 'findByKey' },
  { id: 'findAll', title: 'findAll' }
]
const settingsRepoResults = ref<TestResult[]>([])
const settingsRepoLoading = ref(false)
const settingsRepoLastRunAt = ref<string | null>(null)

const settingsRepoDisplay = computed(() => {
  const byId = new Map(settingsRepoResults.value.map((r) => [r.id, r]))
  return SETTINGS_REPO_TESTS.map((t) => {
    const res = byId.get(t.id)
    return {
      id: t.id,
      title: t.title,
      status: res === undefined ? 'todo' : res.passed ? 'success' : 'fail',
      error: res && !res.passed ? res.error : undefined
    }
  })
})

async function runSettingsRepoTests() {
  settingsRepoLoading.value = true
  settingsRepoResults.value = []
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  log.info('Запуск проверки репозитория настроек')
  try {
    const res = await fetch(`${baseUrl}/api/tests/endpoints-check/settings-repo`, { method: 'GET', credentials: 'include' })
    const data = (await res.json().catch(() => null)) as { success?: boolean; results?: TestResult[] }
    if (res.ok && data?.success && Array.isArray(data.results)) {
      settingsRepoResults.value = data.results
    } else {
      settingsRepoResults.value = SETTINGS_REPO_TESTS.map((t) => ({ id: t.id, title: t.title, passed: false, error: 'Ошибка запроса' }))
    }
    settingsRepoLastRunAt.value = new Date().toLocaleString('ru-RU')
  } finally {
    settingsRepoLoading.value = false
  }
}

/* --- Блок 4: Библиотека логов (logger.lib) --- */
const LOGGER_LIB_TESTS: Array<{ id: string; title: string }> = [
  { id: 'getAdminLogsSocketId', title: 'getAdminLogsSocketId' },
  { id: 'shouldLogByLevel_Info', title: 'shouldLogByLevel (Info, 6)' },
  { id: 'shouldLogByLevel_Error', title: 'shouldLogByLevel (Error, 3)' },
  { id: 'shouldLogByLevel_Disable', title: 'shouldLogByLevel (Disable, 7)' }
]
const loggerLibResults = ref<TestResult[]>([])
const loggerLibLoading = ref(false)
const loggerLibLastRunAt = ref<string | null>(null)

const loggerLibDisplay = computed(() => {
  const byId = new Map(loggerLibResults.value.map((r) => [r.id, r]))
  return LOGGER_LIB_TESTS.map((t) => {
    const res = byId.get(t.id)
    return {
      id: t.id,
      title: t.title,
      status: res === undefined ? 'todo' : res.passed ? 'success' : 'fail',
      error: res && !res.passed ? res.error : undefined
    }
  })
})

async function runLoggerLibTests() {
  loggerLibLoading.value = true
  loggerLibResults.value = []
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  log.info('Запуск проверки библиотеки логов')
  try {
    const res = await fetch(`${baseUrl}/api/tests/endpoints-check/logger-lib`, { method: 'GET', credentials: 'include' })
    const data = (await res.json().catch(() => null)) as { success?: boolean; results?: TestResult[] }
    if (res.ok && data?.success && Array.isArray(data.results)) {
      loggerLibResults.value = data.results
    } else {
      loggerLibResults.value = LOGGER_LIB_TESTS.map((t) => ({ id: t.id, title: t.title, passed: false, error: 'Ошибка запроса' }))
    }
    loggerLibLastRunAt.value = new Date().toLocaleString('ru-RU')
  } finally {
    loggerLibLoading.value = false
  }
}

/* --- Блок 5: Репозиторий логов (logs.repo) --- */
const LOGS_REPO_TESTS: Array<{ id: string; title: string }> = [
  { id: 'create', title: 'create' },
  { id: 'findAll', title: 'findAll' },
  { id: 'findBeforeTimestamp', title: 'findBeforeTimestamp' },
  { id: 'countErrorsAfter', title: 'countErrorsAfter' },
  { id: 'countWarningsAfter', title: 'countWarningsAfter' }
]
const logsRepoResults = ref<TestResult[]>([])
const logsRepoLoading = ref(false)
const logsRepoLastRunAt = ref<string | null>(null)

const logsRepoDisplay = computed(() => {
  const byId = new Map(logsRepoResults.value.map((r) => [r.id, r]))
  return LOGS_REPO_TESTS.map((t) => {
    const res = byId.get(t.id)
    return {
      id: t.id,
      title: t.title,
      status: res === undefined ? 'todo' : res.passed ? 'success' : 'fail',
      error: res && !res.passed ? res.error : undefined
    }
  })
})

async function runLogsRepoTests() {
  logsRepoLoading.value = true
  logsRepoResults.value = []
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  log.info('Запуск проверки репозитория логов')
  try {
    const res = await fetch(`${baseUrl}/api/tests/endpoints-check/logs-repo`, { method: 'GET', credentials: 'include' })
    const data = (await res.json().catch(() => null)) as { success?: boolean; results?: TestResult[] }
    if (res.ok && data?.success && Array.isArray(data.results)) {
      logsRepoResults.value = data.results
    } else {
      logsRepoResults.value = LOGS_REPO_TESTS.map((t) => ({ id: t.id, title: t.title, passed: false, error: 'Ошибка запроса' }))
    }
    logsRepoLastRunAt.value = new Date().toLocaleString('ru-RU')
  } finally {
    logsRepoLoading.value = false
  }
}

/* --- Блок 6: Библиотека админки (dashboard.lib) --- */
const DASHBOARD_LIB_TESTS: Array<{ id: string; title: string }> = [
  { id: 'getDashboardCounts', title: 'getDashboardCounts' },
  { id: 'resetDashboard', title: 'resetDashboard' }
]
const dashboardLibResults = ref<TestResult[]>([])
const dashboardLibLoading = ref(false)
const dashboardLibLastRunAt = ref<string | null>(null)

const dashboardLibDisplay = computed(() => {
  const byId = new Map(dashboardLibResults.value.map((r) => [r.id, r]))
  return DASHBOARD_LIB_TESTS.map((t) => {
    const res = byId.get(t.id)
    return {
      id: t.id,
      title: t.title,
      status: res === undefined ? 'todo' : res.passed ? 'success' : 'fail',
      error: res && !res.passed ? res.error : undefined
    }
  })
})

async function runDashboardLibTests() {
  dashboardLibLoading.value = true
  dashboardLibResults.value = []
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  log.info('Запуск проверки библиотеки админки')
  try {
    const res = await fetch(`${baseUrl}/api/tests/endpoints-check/dashboard-lib`, { method: 'GET', credentials: 'include' })
    const data = (await res.json().catch(() => null)) as { success?: boolean; results?: TestResult[] }
    if (res.ok && data?.success && Array.isArray(data.results)) {
      dashboardLibResults.value = data.results
    } else {
      dashboardLibResults.value = DASHBOARD_LIB_TESTS.map((t) => ({ id: t.id, title: t.title, passed: false, error: 'Ошибка запроса' }))
    }
    dashboardLibLastRunAt.value = new Date().toLocaleString('ru-RU')
  } finally {
    dashboardLibLoading.value = false
  }
}

/** Запустить все тесты (все шесть блоков) и обновить метрики дашборда */
const runAllTests = async () => {
  runAllTestsLoading.value = true
  log.info('Запуск всех тестов')
  try {
    await runEndpointsTests()
    await runSettingsTests()
    await runSettingsRepoTests()
    await runLoggerLibTests()
    await runLogsRepoTests()
    await runDashboardLibTests()
    const all = [
      ...endpointsResults.value,
      ...settingsResults.value,
      ...settingsRepoResults.value,
      ...loggerLibResults.value,
      ...logsRepoResults.value,
      ...dashboardLibResults.value
    ]
    const passed = all.filter((r) => r.passed).length
    const failed = all.filter((r) => !r.passed).length
    testMetrics.value = {
      total: all.length,
      passed,
      failed,
      skipped: 0,
      lastRunAt: new Date().toLocaleString('ru-RU')
    }
    log.info('Все тесты завершены', testMetrics.value)
  } finally {
    runAllTestsLoading.value = false
  }
}
</script>

<template>
  <AppShell
    :pageTitle="'Тесты'"
    :pageSubtitle="'Проверка слоёв и эндпоинтов'"
    :navItems="navItems"
    activeSection="tests"
  >
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
          <div class="content-inner">
            <section class="tests-section" :class="{ 'content-visible': showContent }">
              <div class="tests-header">
                <div class="tests-icon-wrapper">
                  <i class="fas fa-flask tests-icon"></i>
                </div>
                <h1 class="tests-heading" :class="{ 'show-underline': showTitleUnderline }">
                  {{ displayedTitle }}<span v-if="showCursor && (cursorPosition === 'title' || cursorPosition === 'final')" class="typing-cursor">▮</span>
                </h1>
                <p class="tests-description">
                  {{ displayedDescription }}<span v-if="showCursor && cursorPosition === 'description'" class="typing-cursor">▮</span>
                </p>
              </div>

              <!-- Логи (тот же сокет, что в админке; только для админа) -->
              <div v-if="showContent && props.encodedLogsSocketId" class="tests-logs-card">
                <div class="tests-logs-card-header">
                  <i class="fas fa-terminal tests-logs-card-icon"></i>
                  <h2 class="tests-logs-card-title">Логи</h2>
                </div>
                <div class="tests-logs-filters">
                  <button
                    type="button"
                    class="tests-log-filter-chip chip-info"
                    :class="{ active: logFilters.info }"
                    @click="toggleLogFilter('info')"
                  >
                    <i class="fas fa-info-circle"></i>
                    Info
                  </button>
                  <button
                    type="button"
                    class="tests-log-filter-chip chip-warn"
                    :class="{ active: logFilters.warn }"
                    @click="toggleLogFilter('warn')"
                  >
                    <i class="fas fa-exclamation-triangle"></i>
                    Warn
                  </button>
                  <button
                    type="button"
                    class="tests-log-filter-chip chip-error"
                    :class="{ active: logFilters.error }"
                    @click="toggleLogFilter('error')"
                  >
                    <i class="fas fa-exclamation-circle"></i>
                    Error
                  </button>
                </div>
                <div class="tests-logs-output custom-scrollbar" ref="logsOutputRef">
                  <div v-if="displayedLogs.length === 0" class="tests-logs-empty">
                    Логи появятся здесь...
                  </div>
                  <div v-for="(item, index) in displayedLogs" :key="index" class="tests-log-item">
                    <div v-if="item.type === 'divider'" class="tests-log-date-divider">
                      --- {{ item.date }} ---
                    </div>
                    <div v-else class="tests-log-entry">
                      <span class="tests-log-time">{{ item.formattedTime }}</span>
                      <span class="tests-log-level" :class="`tests-log-level-${item.entry.level}`">
                        [{{ item.entry.level.toUpperCase() }}]
                      </span>
                      <span class="tests-log-message">{{ item.formattedMessage }}</span>
                    </div>
                  </div>
                </div>
                <div class="tests-logs-actions">
                  <div v-if="logsLoading" class="tests-logs-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Загрузка логов...
                  </div>
                  <p v-if="logsError" class="tests-logs-error">{{ logsError }}</p>
                  <div class="tests-logs-action-row">
                    <button
                      v-if="!logsLoading"
                      type="button"
                      class="tests-load-more-btn"
                      :class="{ 'tests-load-more-btn-disabled': !logsHasMore }"
                      :disabled="!logsHasMore"
                      :title="logsHasMore ? 'Загрузить более старые логи' : 'Нет более старых логов'"
                      @click="loadMoreLogs"
                    >
                      <i class="fas fa-arrow-down"></i>
                      Загрузить ещё 50
                    </button>
                    <button
                      type="button"
                      class="tests-logs-clear-btn"
                      title="Очистить логи"
                      @click="clearLogs"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Дашборд с метриками по тестам -->
              <div v-if="showContent" class="tests-card tests-dashboard">
                <div class="tests-dashboard-header">
                  <i class="fas fa-chart-line tests-dashboard-icon"></i>
                  <h2 class="tests-dashboard-title">Метрики тестов</h2>
                </div>
                <div class="tests-dashboard-metrics">
                  <div class="tests-metric tests-metric-total">
                    <span class="tests-metric-value">{{ testMetrics.total }}</span>
                    <span class="tests-metric-label">всего</span>
                  </div>
                  <div class="tests-metric tests-metric-passed">
                    <span class="tests-metric-value">{{ testMetrics.passed }}</span>
                    <span class="tests-metric-label">пройдено</span>
                  </div>
                  <div class="tests-metric tests-metric-failed">
                    <span class="tests-metric-value">{{ testMetrics.failed }}</span>
                    <span class="tests-metric-label">провалено</span>
                  </div>
                  <div class="tests-metric tests-metric-skipped">
                    <span class="tests-metric-value">{{ testMetrics.skipped }}</span>
                    <span class="tests-metric-label">пропущено</span>
                  </div>
                </div>
                <p v-if="testMetrics.lastRunAt" class="tests-dashboard-last-run">
                  Последний запуск: {{ testMetrics.lastRunAt }}
                </p>
                <div class="tests-dashboard-actions">
                  <button
                    type="button"
                    class="tests-run-all-btn"
                    :disabled="runAllTestsLoading"
                    @click="runAllTests"
                  >
                    <i class="fas" :class="runAllTestsLoading ? 'fa-spinner fa-spin' : 'fa-play'"></i>
                    {{ runAllTestsLoading ? 'Запуск...' : 'Запустить все тесты' }}
                  </button>
                </div>
              </div>

              <!-- Блок 1: Проверка эндпоинтов -->
              <div v-if="showContent" class="tests-card tests-endpoints-card">
                <div class="tests-endpoints-header">
                  <i class="fas fa-plug tests-endpoints-icon"></i>
                  <h2 class="tests-endpoints-title">Проверка эндпоинтов</h2>
                </div>
                <p class="tests-endpoints-desc">
                  Проверка доступности маршрутов приложения (HTTP 200).
                </p>
                <div v-if="endpointsLastRunAt" class="tests-endpoints-last-run">
                  Результаты от: {{ endpointsLastRunAt }}
                </div>
                <div class="tests-endpoints-list-wrap">
                  <ul class="tests-endpoints-list" role="list">
                    <li
                      v-for="item in endpointsDisplay"
                    :key="item.id"
                    class="tests-endpoints-list-item"
                    :class="`tests-endpoints-status-${item.status}`"
                  >
                    <span class="tests-endpoints-badge" :class="`tests-endpoints-badge-${item.status}`">
                      {{ item.status === 'todo' ? '[TODO]' : item.status === 'success' ? '[OK]' : '[FAIL]' }}
                    </span>
                    <span class="tests-endpoints-list-title-inline">{{ item.title }}</span>
                    <span v-if="item.error" class="tests-endpoints-list-error">{{ item.error }}</span>
                  </li>
                  </ul>
                </div>
                <div class="tests-endpoints-actions">
                  <button
                    type="button"
                    class="tests-run-group-btn"
                    :disabled="endpointsLoading"
                    @click="runEndpointsTests"
                  >
                    <i class="fas" :class="endpointsLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                    {{ endpointsLoading ? 'Проверяем...' : 'Запустить проверку эндпоинтов' }}
                  </button>
                </div>
              </div>

              <!-- Блок 2: Библиотека настроек -->
              <div v-if="showContent" class="tests-card tests-endpoints-card">
                <div class="tests-endpoints-header">
                  <i class="fas fa-cog tests-endpoints-icon"></i>
                  <h2 class="tests-endpoints-title">Библиотека настроек</h2>
                </div>
                <p class="tests-endpoints-desc">
                  Тесты библиотеки настроек (settings.lib).
                </p>
                <div v-if="settingsLastRunAt" class="tests-endpoints-last-run">
                  Результаты от: {{ settingsLastRunAt }}
                </div>
                <div class="tests-endpoints-list-wrap">
                  <ul class="tests-endpoints-list" role="list">
                    <li
                      v-for="item in settingsDisplay"
                      :key="item.id"
                      class="tests-endpoints-list-item"
                      :class="`tests-endpoints-status-${item.status}`"
                    >
                      <span class="tests-endpoints-badge" :class="`tests-endpoints-badge-${item.status}`">
                        {{ item.status === 'todo' ? '[TODO]' : item.status === 'success' ? '[OK]' : '[FAIL]' }}
                      </span>
                      <span class="tests-endpoints-list-title-inline">{{ item.title }}</span>
                      <span v-if="item.error" class="tests-endpoints-list-error">{{ item.error }}</span>
                    </li>
                  </ul>
                </div>
                <div class="tests-endpoints-actions">
                  <button
                    type="button"
                    class="tests-run-group-btn"
                    :disabled="settingsLoading"
                    @click="runSettingsTests"
                  >
                    <i class="fas" :class="settingsLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                    {{ settingsLoading ? 'Проверяем...' : 'Запустить проверку библиотеки настроек' }}
                  </button>
                </div>
              </div>

              <!-- Блок 3: Репозиторий настроек -->
              <div v-if="showContent" class="tests-card tests-endpoints-card">
                <div class="tests-endpoints-header">
                  <i class="fas fa-table tests-endpoints-icon"></i>
                  <h2 class="tests-endpoints-title">Репозиторий настроек</h2>
                </div>
                <p class="tests-endpoints-desc">
                  Тесты репозитория настроек (settings.repo).
                </p>
                <div v-if="settingsRepoLastRunAt" class="tests-endpoints-last-run">
                  Результаты от: {{ settingsRepoLastRunAt }}
                </div>
                <div class="tests-endpoints-list-wrap">
                  <ul class="tests-endpoints-list" role="list">
                    <li
                      v-for="item in settingsRepoDisplay"
                      :key="item.id"
                      class="tests-endpoints-list-item"
                      :class="`tests-endpoints-status-${item.status}`"
                    >
                      <span class="tests-endpoints-badge" :class="`tests-endpoints-badge-${item.status}`">
                        {{ item.status === 'todo' ? '[TODO]' : item.status === 'success' ? '[OK]' : '[FAIL]' }}
                      </span>
                      <span class="tests-endpoints-list-title-inline">{{ item.title }}</span>
                      <span v-if="item.error" class="tests-endpoints-list-error">{{ item.error }}</span>
                    </li>
                  </ul>
                </div>
                <div class="tests-endpoints-actions">
                  <button
                    type="button"
                    class="tests-run-group-btn"
                    :disabled="settingsRepoLoading"
                    @click="runSettingsRepoTests"
                  >
                    <i class="fas" :class="settingsRepoLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                    {{ settingsRepoLoading ? 'Проверяем...' : 'Запустить проверку репозитория настроек' }}
                  </button>
                </div>
              </div>

              <!-- Блок 4: Библиотека логов -->
              <div v-if="showContent" class="tests-card tests-endpoints-card">
                <div class="tests-endpoints-header">
                  <i class="fas fa-file-alt tests-endpoints-icon"></i>
                  <h2 class="tests-endpoints-title">Библиотека логов</h2>
                </div>
                <p class="tests-endpoints-desc">
                  Тесты библиотеки логов (logger.lib).
                </p>
                <div v-if="loggerLibLastRunAt" class="tests-endpoints-last-run">
                  Результаты от: {{ loggerLibLastRunAt }}
                </div>
                <div class="tests-endpoints-list-wrap">
                  <ul class="tests-endpoints-list" role="list">
                    <li
                      v-for="item in loggerLibDisplay"
                      :key="item.id"
                      class="tests-endpoints-list-item"
                      :class="`tests-endpoints-status-${item.status}`"
                    >
                      <span class="tests-endpoints-badge" :class="`tests-endpoints-badge-${item.status}`">
                        {{ item.status === 'todo' ? '[TODO]' : item.status === 'success' ? '[OK]' : '[FAIL]' }}
                      </span>
                      <span class="tests-endpoints-list-title-inline">{{ item.title }}</span>
                      <span v-if="item.error" class="tests-endpoints-list-error">{{ item.error }}</span>
                    </li>
                  </ul>
                </div>
                <div class="tests-endpoints-actions">
                  <button
                    type="button"
                    class="tests-run-group-btn"
                    :disabled="loggerLibLoading"
                    @click="runLoggerLibTests"
                  >
                    <i class="fas" :class="loggerLibLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                    {{ loggerLibLoading ? 'Проверяем...' : 'Запустить проверку библиотеки логов' }}
                  </button>
                </div>
              </div>

              <!-- Блок 5: Репозиторий логов -->
              <div v-if="showContent" class="tests-card tests-endpoints-card">
                <div class="tests-endpoints-header">
                  <i class="fas fa-database tests-endpoints-icon"></i>
                  <h2 class="tests-endpoints-title">Репозиторий логов</h2>
                </div>
                <p class="tests-endpoints-desc">
                  Тесты репозитория логов (logs.repo).
                </p>
                <div v-if="logsRepoLastRunAt" class="tests-endpoints-last-run">
                  Результаты от: {{ logsRepoLastRunAt }}
                </div>
                <div class="tests-endpoints-list-wrap">
                  <ul class="tests-endpoints-list" role="list">
                    <li
                      v-for="item in logsRepoDisplay"
                      :key="item.id"
                      class="tests-endpoints-list-item"
                      :class="`tests-endpoints-status-${item.status}`"
                    >
                      <span class="tests-endpoints-badge" :class="`tests-endpoints-badge-${item.status}`">
                        {{ item.status === 'todo' ? '[TODO]' : item.status === 'success' ? '[OK]' : '[FAIL]' }}
                      </span>
                      <span class="tests-endpoints-list-title-inline">{{ item.title }}</span>
                      <span v-if="item.error" class="tests-endpoints-list-error">{{ item.error }}</span>
                    </li>
                  </ul>
                </div>
                <div class="tests-endpoints-actions">
                  <button
                    type="button"
                    class="tests-run-group-btn"
                    :disabled="logsRepoLoading"
                    @click="runLogsRepoTests"
                  >
                    <i class="fas" :class="logsRepoLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                    {{ logsRepoLoading ? 'Проверяем...' : 'Запустить проверку репозитория логов' }}
                  </button>
                </div>
              </div>

              <!-- Блок 6: Библиотека админки -->
              <div v-if="showContent" class="tests-card tests-endpoints-card">
                <div class="tests-endpoints-header">
                  <i class="fas fa-chart-line tests-endpoints-icon"></i>
                  <h2 class="tests-endpoints-title">Библиотека админки</h2>
                </div>
                <p class="tests-endpoints-desc">
                  Тесты библиотеки админки (dashboard.lib).
                </p>
                <div v-if="dashboardLibLastRunAt" class="tests-endpoints-last-run">
                  Результаты от: {{ dashboardLibLastRunAt }}
                </div>
                <div class="tests-endpoints-list-wrap">
                  <ul class="tests-endpoints-list" role="list">
                    <li
                      v-for="item in dashboardLibDisplay"
                      :key="item.id"
                      class="tests-endpoints-list-item"
                      :class="`tests-endpoints-status-${item.status}`"
                    >
                      <span class="tests-endpoints-badge" :class="`tests-endpoints-badge-${item.status}`">
                        {{ item.status === 'todo' ? '[TODO]' : item.status === 'success' ? '[OK]' : '[FAIL]' }}
                      </span>
                      <span class="tests-endpoints-list-title-inline">{{ item.title }}</span>
                      <span v-if="item.error" class="tests-endpoints-list-error">{{ item.error }}</span>
                    </li>
                  </ul>
                </div>
                <div class="tests-endpoints-actions">
                  <button
                    type="button"
                    class="tests-run-group-btn"
                    :disabled="dashboardLibLoading"
                    @click="runDashboardLibTests"
                  >
                    <i class="fas" :class="dashboardLibLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                    {{ dashboardLibLoading ? 'Проверяем...' : 'Запустить проверку библиотеки админки' }}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
  </AppShell>
</template>

<style scoped>
.content-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 4px 0 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tests-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tests-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tests-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 12px 22px color-mix(in srgb, var(--accent-primary) 28%, transparent);
}

.tests-heading {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.4vw, 1.95rem);
  margin: 0;
}

.typing-cursor {
  margin-left: 4px;
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.tests-heading.show-underline {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--accent-primary) 42%, transparent);
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
}

.tests-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.tests-logs-card,
.tests-card {
  background: linear-gradient(165deg, color-mix(in srgb, var(--surface-glass-card) 96%, transparent), color-mix(in srgb, var(--surface-soft) 92%, transparent));
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-lg);
  padding: 18px;
  box-shadow: var(--shadow-soft);
}

.tests-logs-card-header,
.tests-dashboard-header,
.tests-endpoints-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tests-logs-card-title,
.tests-dashboard-title,
.tests-endpoints-title {
  margin: 0;
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.tests-dashboard-icon,
.tests-endpoints-icon {
  color: var(--accent-primary);
}

.tests-endpoints-desc {
  margin: 0 0 10px;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.tests-logs-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tests-log-filter-chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-glass-light);
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.16s ease;
}

.tests-log-filter-chip.active {
  background: color-mix(in srgb, var(--accent-soft) 82%, var(--surface-soft));
  border-color: var(--border-glass);
  color: var(--text-primary);
}

.tests-logs-output {
  max-height: 340px;
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border-glass-light);
  background: var(--surface-soft);
}

.tests-log-item {
  margin-bottom: 3px;
}

.tests-log-entry {
  display: grid;
  grid-template-columns: 96px 70px minmax(0, 1fr);
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--border-glass-light) 84%, transparent);
  background: var(--surface-glass);
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.tests-log-entry:last-child {
  margin-bottom: 0;
}

.tests-log-time {
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

.tests-log-level {
  color: var(--info);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.69rem;
}

.tests-log-level-error {
  color: var(--danger);
}

.tests-log-level-warning,
.tests-log-level-warn {
  color: var(--warning);
}

.tests-log-level-notice,
.tests-log-level-info {
  color: var(--info);
}

.tests-log-level-debug {
  color: var(--text-tertiary);
}

.tests-log-message {
  word-break: break-word;
}

.tests-log-date-divider {
  color: var(--text-tertiary);
  font-size: 0.74rem;
  margin: 10px 0 7px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tests-log-date-divider::before,
.tests-log-date-divider::after {
  content: '';
  flex: 1;
  border-top: 1px dashed var(--border-glass-light);
}

.tests-logs-empty {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.82rem;
  padding: 10px 0;
}

.tests-logs-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.tests-logs-action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tests-logs-loading {
  color: var(--text-tertiary);
  font-size: 0.78rem;
}

.tests-load-more-btn,
.tests-run-group-btn,
.tests-run-all-btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border-glass-light);
  background: var(--surface-soft);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.16s ease;
}

.tests-load-more-btn:hover,
.tests-run-group-btn:hover,
.tests-run-all-btn:hover {
  background: color-mix(in srgb, var(--accent-soft) 82%, var(--surface-soft));
  border-color: var(--border-glass);
}

.tests-dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.tests-metric {
  background: var(--surface-soft);
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.tests-metric-value {
  font-size: 1.3rem;
  font-weight: 700;
}

.tests-metric-label {
  font-size: 0.74rem;
  color: var(--text-tertiary);
}

.tests-metric-total .tests-metric-value {
  color: var(--text-primary);
}

.tests-metric-passed .tests-metric-value {
  color: var(--success);
}

.tests-metric-failed .tests-metric-value {
  color: var(--danger);
}

.tests-metric-skipped .tests-metric-value {
  color: var(--warning);
}

.tests-dashboard-last-run,
.tests-endpoints-last-run {
  margin: 0 0 10px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.tests-dashboard-actions,
.tests-endpoints-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.tests-endpoints-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tests-endpoints-list-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border-glass-light);
  background: var(--surface-soft);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.tests-endpoints-badge {
  font-weight: 600;
  border: 1px solid var(--border-glass-light);
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tests-endpoints-badge-success {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 46%, transparent);
  background: color-mix(in srgb, var(--success) 12%, transparent);
}

.tests-endpoints-badge-fail {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 42%, transparent);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
}

.tests-endpoints-badge-todo {
  color: var(--warning);
  border-color: color-mix(in srgb, var(--warning) 42%, transparent);
  background: color-mix(in srgb, var(--warning) 12%, transparent);
}

.tests-endpoints-list-title-inline {
  font-weight: 700;
  color: var(--text-primary);
}

.tests-endpoints-status-success {
  border-color: color-mix(in srgb, var(--success) 42%, var(--border-glass-light));
}

.tests-endpoints-status-fail {
  border-color: color-mix(in srgb, var(--danger) 40%, var(--border-glass-light));
}

.tests-endpoints-status-todo {
  border-color: color-mix(in srgb, var(--warning) 36%, var(--border-glass-light));
}

.tests-endpoints-list-error {
  color: var(--danger);
}

.tests-endpoints-list-wrap {
  display: grid;
  gap: 8px;
}

@media (max-width: 900px) {
  .content-inner {
    padding: 0 4px 24px;
  }

  .tests-log-entry {
    grid-template-columns: 1fr;
    gap: 3px;
  }

  .tests-endpoints-list-item {
    grid-template-columns: 1fr;
  }
}
</style>
