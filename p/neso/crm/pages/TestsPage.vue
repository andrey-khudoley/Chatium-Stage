<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import CrmStatCard from '../components/base/CrmStatCard.vue'
import { createComponentLogger, setLogSink, type LogEntry } from '../shared/logger'
import { getRecentLogsRoute } from '../api/admin/logs/recent'
import { getLogsBeforeRoute } from '../api/admin/logs/before'
import { useUiI18n } from '../shared/design/i18n'

const log = createComponentLogger('TestsPage')

declare const ctx: app.Ctx

declare global {
  interface Window {
    hideAppLoader?: () => void
    triggerGlobalGlitch?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  encodedLogsSocketId?: string
  initialLocale?: string
}>()

const { t } = useUiI18n(props.initialLocale || 'ru')
const bootLoaderDone = ref(false)

const MAX_LOG_ENTRIES = 500
const logEntries = ref<LogEntry[]>([])
let logsSocketSubscription: { unsubscribe?: () => void; listen?: (cb: (data: unknown) => void) => void } | null = null
const logsLoading = ref(false)
const logsError = ref('')
const logsHasMore = ref(false)
const oldestLogTimestamp = ref<number | null>(null)
const logFilters = ref({ info: true, warn: true, error: true })

type LogDisplayItem =
  | { type: 'log'; entry: LogEntry; formattedTime: string; formattedMessage: string }
  | { type: 'divider'; date: string }

type TestResult = { id: string; title: string; passed: boolean; error?: string }

const testMetrics = ref({
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  lastRunAt: null as string | null
})
const runAllTestsLoading = ref(false)

const ENDPOINTS_ROUTES: Array<{ id: string; path: string; title: string }> = [
  { id: 'index', path: '/', title: 'GET /' },
  { id: 'web-admin', path: '/web/admin', title: 'GET /web/admin' },
  { id: 'web-profile', path: '/web/profile', title: 'GET /web/profile' },
  { id: 'web-login', path: '/web/login', title: 'GET /web/login' },
  { id: 'web-tests', path: '/web/tests', title: 'GET /web/tests' }
]

const SETTINGS_LIB_TESTS: Array<{ id: string; title: string }> = [
  { id: 'getSettingString', title: 'getSettingString (project_name)' },
  { id: 'getLogLevel', title: 'getLogLevel' },
  { id: 'getLogsLimit', title: 'getLogsLimit' },
  { id: 'getLogWebhook', title: 'getLogWebhook' },
  { id: 'getDashboardResetAt', title: 'getDashboardResetAt' },
  { id: 'getAllSettings', title: 'getAllSettings' }
]

const SETTINGS_REPO_TESTS: Array<{ id: string; title: string }> = [
  { id: 'upsert', title: 'upsert' },
  { id: 'deleteByKey', title: 'deleteByKey' },
  { id: 'findByKey', title: 'findByKey' },
  { id: 'findAll', title: 'findAll' }
]

const LOGGER_LIB_TESTS: Array<{ id: string; title: string }> = [
  { id: 'getAdminLogsSocketId', title: 'getAdminLogsSocketId' },
  { id: 'shouldLogByLevel_Info', title: 'shouldLogByLevel (Info, 6)' },
  { id: 'shouldLogByLevel_Error', title: 'shouldLogByLevel (Error, 3)' },
  { id: 'shouldLogByLevel_Disable', title: 'shouldLogByLevel (Disable, 7)' }
]

const LOGS_REPO_TESTS: Array<{ id: string; title: string }> = [
  { id: 'create', title: 'create' },
  { id: 'findAll', title: 'findAll' },
  { id: 'findBeforeTimestamp', title: 'findBeforeTimestamp' },
  { id: 'countErrorsAfter', title: 'countErrorsAfter' },
  { id: 'countWarningsAfter', title: 'countWarningsAfter' }
]

const DASHBOARD_LIB_TESTS: Array<{ id: string; title: string }> = [
  { id: 'getDashboardCounts', title: 'getDashboardCounts' },
  { id: 'resetDashboard', title: 'resetDashboard' }
]

const endpointsResults = ref<TestResult[]>([])
const settingsResults = ref<TestResult[]>([])
const settingsRepoResults = ref<TestResult[]>([])
const loggerLibResults = ref<TestResult[]>([])
const logsRepoResults = ref<TestResult[]>([])
const dashboardLibResults = ref<TestResult[]>([])

const endpointsLoading = ref(false)
const settingsLoading = ref(false)
const settingsRepoLoading = ref(false)
const loggerLibLoading = ref(false)
const logsRepoLoading = ref(false)
const dashboardLibLoading = ref(false)

const endpointsLastRunAt = ref<string | null>(null)
const settingsLastRunAt = ref<string | null>(null)
const settingsRepoLastRunAt = ref<string | null>(null)
const loggerLibLastRunAt = ref<string | null>(null)
const logsRepoLastRunAt = ref<string | null>(null)
const dashboardLibLastRunAt = ref<string | null>(null)

function getApiBaseUrl(): string {
  const path = props.indexUrl.startsWith('http')
    ? new URL(props.indexUrl).pathname
    : props.indexUrl

  const basePath = path.replace(/\/$/, '') || '/p/template_project'
  const origin = props.indexUrl.startsWith('http')
    ? new URL(props.indexUrl).origin
    : window.location.origin

  return `${origin}${basePath.startsWith('/') ? basePath : '/' + basePath}`
}

function mapDisplay(source: TestResult[], tests: Array<{ id: string; title: string }>) {
  const byId = new Map(source.map((item) => [item.id, item]))
  return tests.map((item) => {
    const result = byId.get(item.id)
    return {
      id: item.id,
      title: item.title,
      status: result === undefined ? 'todo' : result.passed ? 'success' : 'fail',
      error: result && !result.passed ? result.error : undefined
    }
  })
}

const endpointsDisplay = computed(() => {
  const byId = new Map(endpointsResults.value.map((item) => [item.id, item]))
  return ENDPOINTS_ROUTES.map((route) => {
    const result = byId.get(route.id)
    return {
      id: route.id,
      title: route.title,
      status: result === undefined ? 'todo' : result.passed ? 'success' : 'fail',
      error: result && !result.passed ? result.error : undefined
    }
  })
})

const settingsDisplay = computed(() => mapDisplay(settingsResults.value, SETTINGS_LIB_TESTS))
const settingsRepoDisplay = computed(() => mapDisplay(settingsRepoResults.value, SETTINGS_REPO_TESTS))
const loggerLibDisplay = computed(() => mapDisplay(loggerLibResults.value, LOGGER_LIB_TESTS))
const logsRepoDisplay = computed(() => mapDisplay(logsRepoResults.value, LOGS_REPO_TESTS))
const dashboardLibDisplay = computed(() => mapDisplay(dashboardLibResults.value, DASHBOARD_LIB_TESTS))

function statusLabel(status: string): string {
  if (status === 'success') return t('tests.statusSuccess')
  if (status === 'fail') return t('tests.statusFail')
  return t('tests.statusTodo')
}

function formatLogTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function formatLogMessage(entry: LogEntry): string {
  return entry.args.map((arg) => (typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg))).join(' ')
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

function trimOldLogs(): void {
  if (logEntries.value.length > MAX_LOG_ENTRIES) {
    const sorted = [...logEntries.value].sort((a, b) => b.timestamp - a.timestamp)
    logEntries.value = sorted.slice(0, MAX_LOG_ENTRIES)
  }
}

const displayedLogs = computed<LogDisplayItem[]>(() => {
  const filtered = logEntries.value.filter((entry) => {
    if (entry.severity <= 3 && logFilters.value.error) return true
    if (entry.severity === 4 && logFilters.value.warn) return true
    if (entry.severity >= 5 && logFilters.value.info) return true
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

function toggleLogFilter(level: 'info' | 'warn' | 'error'): void {
  logFilters.value[level] = !logFilters.value[level]
}

async function loadRecentLogs(): Promise<void> {
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
      logsError.value = data?.error || t('common.error')
    }
  } catch (error) {
    logsError.value = (error as Error)?.message || t('common.error')
  } finally {
    logsLoading.value = false
  }
}

async function loadMoreLogs(): Promise<void> {
  if (!oldestLogTimestamp.value) return

  logsLoading.value = true
  logsError.value = ''

  try {
    const res = await getLogsBeforeRoute.query({ beforeTimestamp: String(oldestLogTimestamp.value), limit: 50 }).run(ctx)
    const data = res as { success?: boolean; entries?: Array<LogEntry & { id: string }>; hasMore?: boolean; error?: string }

    if (data?.success && Array.isArray(data.entries)) {
      logEntries.value = [...logEntries.value, ...data.entries]
      if (data.entries.length > 0) {
        const sorted = [...data.entries].sort((a, b) => a.timestamp - b.timestamp)
        oldestLogTimestamp.value = sorted[0].timestamp
      }
      logsHasMore.value = data.hasMore ?? data.entries.length === 50
    } else {
      logsError.value = data?.error || t('common.error')
    }
  } catch (error) {
    logsError.value = (error as Error)?.message || t('common.error')
  } finally {
    logsLoading.value = false
  }
}

function clearLogs(): void {
  logEntries.value = []
  oldestLogTimestamp.value = Date.now()
  logsHasMore.value = true
  logsError.value = ''
}

async function runEndpointsTests(): Promise<void> {
  endpointsLoading.value = true
  endpointsResults.value = []

  const baseUrl = getApiBaseUrl().replace(/\/$/, '')

  try {
    const results: TestResult[] = []
    for (const route of ENDPOINTS_ROUTES) {
      const url = `${baseUrl}${route.path === '/' ? '' : route.path}`
      try {
        const response = await fetch(url, { method: 'GET', credentials: 'include' })
        results.push({
          id: route.id,
          title: route.title,
          passed: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`
        })
      } catch (error) {
        results.push({
          id: route.id,
          title: route.title,
          passed: false,
          error: (error as Error)?.message ?? String(error)
        })
      }
    }

    endpointsResults.value = results
    endpointsLastRunAt.value = new Date().toLocaleString('ru-RU')
  } finally {
    endpointsLoading.value = false
  }
}

async function runRouteTests(
  endpoint: string,
  target: { value: TestResult[] },
  fallbackTests: Array<{ id: string; title: string }>,
  loading: { value: boolean },
  lastRun: { value: string | null }
): Promise<void> {
  loading.value = true
  target.value = []

  const baseUrl = getApiBaseUrl().replace(/\/$/, '')

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, { method: 'GET', credentials: 'include' })
    const data = (await response.json().catch(() => null)) as { success?: boolean; results?: TestResult[] }

    if (response.ok && data?.success && Array.isArray(data.results)) {
      target.value = data.results
    } else {
      target.value = fallbackTests.map((test) => ({
        id: test.id,
        title: test.title,
        passed: false,
        error: t('common.error')
      }))
    }

    lastRun.value = new Date().toLocaleString('ru-RU')
  } finally {
    loading.value = false
  }
}

const runSettingsTests = () => runRouteTests('/api/tests/endpoints-check/settings-lib', settingsResults, SETTINGS_LIB_TESTS, settingsLoading, settingsLastRunAt)
const runSettingsRepoTests = () => runRouteTests('/api/tests/endpoints-check/settings-repo', settingsRepoResults, SETTINGS_REPO_TESTS, settingsRepoLoading, settingsRepoLastRunAt)
const runLoggerLibTests = () => runRouteTests('/api/tests/endpoints-check/logger-lib', loggerLibResults, LOGGER_LIB_TESTS, loggerLibLoading, loggerLibLastRunAt)
const runLogsRepoTests = () => runRouteTests('/api/tests/endpoints-check/logs-repo', logsRepoResults, LOGS_REPO_TESTS, logsRepoLoading, logsRepoLastRunAt)
const runDashboardLibTests = () => runRouteTests('/api/tests/endpoints-check/dashboard-lib', dashboardLibResults, DASHBOARD_LIB_TESTS, dashboardLibLoading, dashboardLibLastRunAt)

async function runAllTests(): Promise<void> {
  runAllTestsLoading.value = true

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

    const passed = all.filter((item) => item.passed).length
    const failed = all.filter((item) => !item.passed).length

    testMetrics.value = {
      total: all.length,
      passed,
      failed,
      skipped: 0,
      lastRunAt: new Date().toLocaleString('ru-RU')
    }
  } finally {
    runAllTestsLoading.value = false
  }
}

function startAnimations(): void {
  bootLoaderDone.value = true
}

function openChatiumLink(): void {
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}

onMounted(() => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  if (props.encodedLogsSocketId) {
    setLogSink((entry: LogEntry) => {
      logEntries.value.push(entry)
      trimOldLogs()
    })

    void getOrCreateBrowserSocketClient()
      .then((socketClient) => {
        logsSocketSubscription = socketClient.subscribeToData(props.encodedLogsSocketId!)
        logsSocketSubscription?.listen?.((payload: unknown) => {
          const data = payload as { type?: string; data?: LogEntry }
          if (data?.type === 'new-log' && data.data) {
            logEntries.value.push(data.data)
            trimOldLogs()
          }
        })
      })
      .catch((error) => log.error('Failed to subscribe to logs socket', error))

    void loadRecentLogs()
  }
})

onBeforeUnmount(() => {
  if (logsSocketSubscription?.unsubscribe) {
    logsSocketSubscription.unsubscribe()
    logsSocketSubscription = null
  }
})

onUnmounted(() => {
  setLogSink(null)
  window.removeEventListener('bootloader-complete', startAnimations)
})
</script>

<template>
  <div class="app-layout crm-app">
    <GlobalGlitch />

    <Header
      v-if="bootLoaderDone"
      :projectTitle="props.projectTitle"
      :indexUrl="props.indexUrl"
      :profileUrl="props.profileUrl"
      :loginUrl="props.loginUrl"
      :isAuthenticated="props.isAuthenticated"
      :isAdmin="props.isAdmin"
      :adminUrl="props.adminUrl"
      :testsUrl="props.testsUrl"
      :initialLocale="props.initialLocale"
    />

    <main class="content-wrapper">
      <div class="crm-page crm-reveal">
        <section class="crm-surface-raised crm-card">
          <h1 class="tests-title">{{ t('tests.title') }}</h1>
          <p>{{ t('tests.subtitle') }}</p>
        </section>

        <section class="crm-grid crm-grid-4">
          <CrmStatCard :label="t('tests.total')" :value="testMetrics.total" icon="fas fa-bars-progress" status="info" />
          <CrmStatCard :label="t('tests.passed')" :value="testMetrics.passed" icon="fas fa-circle-check" status="success" />
          <CrmStatCard :label="t('tests.failed')" :value="testMetrics.failed" icon="fas fa-triangle-exclamation" status="danger" />
          <CrmStatCard :label="t('tests.skipped')" :value="testMetrics.skipped" icon="fas fa-forward" status="warning" />
        </section>

        <section class="crm-surface crm-card">
          <header class="crm-card-title">
            <h2>{{ t('tests.metrics') }}</h2>
            <button type="button" class="crm-btn crm-btn-primary" :disabled="runAllTestsLoading" @click="runAllTests">
              <i class="fas" :class="runAllTestsLoading ? 'fa-spinner fa-spin' : 'fa-play'"></i>
              {{ runAllTestsLoading ? t('tests.runAllLoading') : t('tests.runAll') }}
            </button>
          </header>
          <p v-if="testMetrics.lastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: testMetrics.lastRunAt }) }}</p>
        </section>

        <section v-if="props.encodedLogsSocketId" class="crm-surface crm-card">
          <header class="crm-card-title">
            <h2>{{ t('tests.logs') }}</h2>
          </header>

          <div class="crm-row">
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'tests-filter-active': logFilters.info }" @click="toggleLogFilter('info')">Info</button>
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'tests-filter-active': logFilters.warn }" @click="toggleLogFilter('warn')">Warn</button>
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'tests-filter-active': logFilters.error }" @click="toggleLogFilter('error')">Error</button>
          </div>

          <div class="tests-logs crm-scroll">
            <div v-if="displayedLogs.length === 0" class="crm-muted">{{ t('tests.logsEmpty') }}</div>
            <div v-for="(item, index) in displayedLogs" :key="index" class="tests-log-item">
              <div v-if="item.type === 'divider'" class="tests-log-divider">--- {{ item.date }} ---</div>
              <div v-else class="tests-log-entry">
                <span class="tests-log-time">{{ item.formattedTime }}</span>
                <span class="tests-log-level" :class="`tests-log-level-${item.entry.level}`">[{{ item.entry.level.toUpperCase() }}]</span>
                <span class="tests-log-message">{{ item.formattedMessage }}</span>
              </div>
            </div>
          </div>

          <div class="crm-row tests-logs-actions">
            <p v-if="logsLoading" class="crm-muted">{{ t('tests.logsLoading') }}</p>
            <p v-if="logsError" class="crm-status-danger">{{ logsError }}</p>
            <button v-if="!logsLoading" type="button" class="crm-btn crm-btn-ghost" :disabled="!logsHasMore" @click="loadMoreLogs">
              <i class="fas fa-arrow-down"></i>
              {{ t('tests.logsLoadMore') }}
            </button>
            <button type="button" class="crm-btn crm-btn-danger" @click="clearLogs">
              <i class="fas fa-trash-alt"></i>
              {{ t('common.clear') }}
            </button>
          </div>
        </section>

        <section class="crm-grid crm-grid-2">
          <article class="crm-surface crm-card">
            <header class="crm-card-title">
              <h2>{{ t('tests.endpoints') }}</h2>
              <button type="button" class="crm-btn crm-btn-ghost" :disabled="endpointsLoading" @click="runEndpointsTests">
                <i class="fas" :class="endpointsLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ endpointsLoading ? t('tests.runGroupLoading') : t('tests.runGroup') }}
              </button>
            </header>
            <p>{{ t('tests.endpointsDesc') }}</p>
            <p v-if="endpointsLastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: endpointsLastRunAt }) }}</p>
            <ul class="tests-list" role="list">
              <li v-for="item in endpointsDisplay" :key="item.id" :class="`is-${item.status}`">
                <span class="tests-badge">{{ statusLabel(item.status) }}</span>
                <span>{{ item.title }}</span>
                <span v-if="item.error" class="crm-status-danger">{{ item.error }}</span>
              </li>
            </ul>
          </article>

          <article class="crm-surface crm-card">
            <header class="crm-card-title">
              <h2>{{ t('tests.settingsLib') }}</h2>
              <button type="button" class="crm-btn crm-btn-ghost" :disabled="settingsLoading" @click="runSettingsTests">
                <i class="fas" :class="settingsLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ settingsLoading ? t('tests.runGroupLoading') : t('tests.runGroup') }}
              </button>
            </header>
            <p>{{ t('tests.settingsLibDesc') }}</p>
            <p v-if="settingsLastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: settingsLastRunAt }) }}</p>
            <ul class="tests-list" role="list">
              <li v-for="item in settingsDisplay" :key="item.id" :class="`is-${item.status}`">
                <span class="tests-badge">{{ statusLabel(item.status) }}</span>
                <span>{{ item.title }}</span>
                <span v-if="item.error" class="crm-status-danger">{{ item.error }}</span>
              </li>
            </ul>
          </article>

          <article class="crm-surface crm-card">
            <header class="crm-card-title">
              <h2>{{ t('tests.settingsRepo') }}</h2>
              <button type="button" class="crm-btn crm-btn-ghost" :disabled="settingsRepoLoading" @click="runSettingsRepoTests">
                <i class="fas" :class="settingsRepoLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ settingsRepoLoading ? t('tests.runGroupLoading') : t('tests.runGroup') }}
              </button>
            </header>
            <p>{{ t('tests.settingsRepoDesc') }}</p>
            <p v-if="settingsRepoLastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: settingsRepoLastRunAt }) }}</p>
            <ul class="tests-list" role="list">
              <li v-for="item in settingsRepoDisplay" :key="item.id" :class="`is-${item.status}`">
                <span class="tests-badge">{{ statusLabel(item.status) }}</span>
                <span>{{ item.title }}</span>
                <span v-if="item.error" class="crm-status-danger">{{ item.error }}</span>
              </li>
            </ul>
          </article>

          <article class="crm-surface crm-card">
            <header class="crm-card-title">
              <h2>{{ t('tests.loggerLib') }}</h2>
              <button type="button" class="crm-btn crm-btn-ghost" :disabled="loggerLibLoading" @click="runLoggerLibTests">
                <i class="fas" :class="loggerLibLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ loggerLibLoading ? t('tests.runGroupLoading') : t('tests.runGroup') }}
              </button>
            </header>
            <p>{{ t('tests.loggerLibDesc') }}</p>
            <p v-if="loggerLibLastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: loggerLibLastRunAt }) }}</p>
            <ul class="tests-list" role="list">
              <li v-for="item in loggerLibDisplay" :key="item.id" :class="`is-${item.status}`">
                <span class="tests-badge">{{ statusLabel(item.status) }}</span>
                <span>{{ item.title }}</span>
                <span v-if="item.error" class="crm-status-danger">{{ item.error }}</span>
              </li>
            </ul>
          </article>

          <article class="crm-surface crm-card">
            <header class="crm-card-title">
              <h2>{{ t('tests.logsRepo') }}</h2>
              <button type="button" class="crm-btn crm-btn-ghost" :disabled="logsRepoLoading" @click="runLogsRepoTests">
                <i class="fas" :class="logsRepoLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ logsRepoLoading ? t('tests.runGroupLoading') : t('tests.runGroup') }}
              </button>
            </header>
            <p>{{ t('tests.logsRepoDesc') }}</p>
            <p v-if="logsRepoLastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: logsRepoLastRunAt }) }}</p>
            <ul class="tests-list" role="list">
              <li v-for="item in logsRepoDisplay" :key="item.id" :class="`is-${item.status}`">
                <span class="tests-badge">{{ statusLabel(item.status) }}</span>
                <span>{{ item.title }}</span>
                <span v-if="item.error" class="crm-status-danger">{{ item.error }}</span>
              </li>
            </ul>
          </article>

          <article class="crm-surface crm-card">
            <header class="crm-card-title">
              <h2>{{ t('tests.dashboardLib') }}</h2>
              <button type="button" class="crm-btn crm-btn-ghost" :disabled="dashboardLibLoading" @click="runDashboardLibTests">
                <i class="fas" :class="dashboardLibLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ dashboardLibLoading ? t('tests.runGroupLoading') : t('tests.runGroup') }}
              </button>
            </header>
            <p>{{ t('tests.dashboardLibDesc') }}</p>
            <p v-if="dashboardLibLastRunAt" class="crm-muted">{{ t('tests.lastRun', { value: dashboardLibLastRunAt }) }}</p>
            <ul class="tests-list" role="list">
              <li v-for="item in dashboardLibDisplay" :key="item.id" :class="`is-${item.status}`">
                <span class="tests-badge">{{ statusLabel(item.status) }}</span>
                <span>{{ item.title }}</span>
                <span v-if="item.error" class="crm-status-danger">{{ item.error }}</span>
              </li>
            </ul>
          </article>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  min-height: 0;
}

.tests-title {
  font-size: clamp(1.2rem, 2.2vw, 1.8rem);
}

.tests-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.tests-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 68%, transparent);
  border-radius: var(--crm-radius-sm);
  padding: 0.5rem 0.6rem;
  font-family: var(--crm-font-tables);
  font-size: 0.77rem;
}

.tests-list li.is-success {
  border-color: color-mix(in srgb, var(--crm-success) 65%, transparent);
}

.tests-list li.is-fail {
  border-color: color-mix(in srgb, var(--crm-danger) 65%, transparent);
}

.tests-badge {
  font-weight: 600;
  color: var(--crm-textDim);
}

.tests-filter-active {
  border-color: color-mix(in srgb, var(--crm-accent) 70%, transparent) !important;
  background: color-mix(in srgb, var(--crm-accentSoft) 34%, transparent) !important;
  color: var(--crm-text) !important;
}

.tests-logs {
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 70%, transparent);
  border-radius: var(--crm-radius-md);
  background: color-mix(in srgb, var(--crm-surfaceRaised) 84%, transparent);
  min-height: 220px;
  max-height: 380px;
  overflow: auto;
  padding: 0.8rem;
  font-family: var(--crm-font-tables);
  font-size: 0.76rem;
}

.tests-log-item {
  margin: 0;
}

.tests-log-divider {
  text-align: center;
  color: var(--crm-textDim);
  font-size: 0.68rem;
  padding: 0.4rem 0;
}

.tests-log-entry {
  display: flex;
  gap: 0.4rem;
  line-height: 1.5;
}

.tests-log-time {
  color: var(--crm-textDim);
}

.tests-log-level {
  font-weight: 600;
}

.tests-log-level-debug { color: #a78bfa; }
.tests-log-level-info { color: var(--crm-info); }
.tests-log-level-notice { color: var(--crm-success); }
.tests-log-level-warning { color: var(--crm-warning); }
.tests-log-level-error { color: var(--crm-danger); }
.tests-log-level-critical { color: color-mix(in srgb, var(--crm-danger) 74%, black); }
.tests-log-level-alert { color: color-mix(in srgb, var(--crm-warning) 86%, black); }
.tests-log-level-emergency { color: color-mix(in srgb, var(--crm-danger) 90%, black); }

.tests-log-message {
  color: var(--crm-textMuted);
  word-break: break-word;
}

.tests-logs-actions {
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .tests-list li {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
