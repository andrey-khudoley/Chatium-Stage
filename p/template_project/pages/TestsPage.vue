<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUnmounted, ref, computed } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { createComponentLogger, setLogSink, type LogEntry } from '../shared/logger'
import { getRecentLogsRoute } from '../api/admin/logs/recent'
import { getLogsBeforeRoute } from '../api/admin/logs/before'

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
}>()

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

const openChatiumLink = () => {
  log.notice('Opening Chatium link')
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}

/* Дашборд тестов */
const testMetrics = ref({
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  lastRunAt: null as string | null
})
const runAllTestsLoading = ref(false)

const runAllTests = async () => {
  runAllTestsLoading.value = true
  log.info('Запуск всех тестов')
  try {
    // TODO: вызов API запуска всех тестов
    await new Promise((r) => setTimeout(r, 800))
    testMetrics.value = {
      total: 12,
      passed: 10,
      failed: 1,
      skipped: 1,
      lastRunAt: new Date().toLocaleString('ru-RU')
    }
    log.info('Тесты завершены', testMetrics.value)
  } finally {
    runAllTestsLoading.value = false
  }
}

/* Проверка эндпоинтов */
const runGroupTestsLoading = ref(false)

const runGroupTests = async () => {
  runGroupTestsLoading.value = true
  log.info('Запуск тестов группы «Проверка эндпоинтов»')
  try {
    // TODO: вызов API запуска тестов группы
    await new Promise((r) => setTimeout(r, 600))
    log.info('Тесты группы завершены')
  } finally {
    runGroupTestsLoading.value = false
  }
}
</script>

<template>
  <div class="app-layout bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
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
    />

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

          <!-- Проверка эндпоинтов -->
          <div v-if="showContent" class="tests-card tests-endpoints-card">
            <div class="tests-endpoints-header">
              <i class="fas fa-plug tests-endpoints-icon"></i>
              <h2 class="tests-endpoints-title">Проверка эндпоинтов</h2>
            </div>
            <p class="tests-endpoints-desc text-[var(--color-text-secondary)]">
              Запуск тестов группы для проверки HTTP-эндпоинтов.
            </p>
            <div class="tests-endpoints-actions">
              <button
                type="button"
                class="tests-run-group-btn"
                :disabled="runGroupTestsLoading"
                @click="runGroupTests"
              >
                <i class="fas" :class="runGroupTestsLoading ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
                {{ runGroupTestsLoading ? 'Запуск...' : 'Запустить тесты группы' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  position: relative;
  margin: 0;
  padding-top: 0;
}

.content-wrapper {
  position: relative;
  z-index: 10;
}

.content-inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .content-inner {
    padding: 1.5rem 1rem;
  }
}

.tests-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.tests-section.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.tests-header {
  text-align: center;
  margin-bottom: 3rem;
}

.tests-icon-wrapper {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  border-radius: 0;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 24px rgba(211, 35, 75, 0.4),
    0 4px 12px rgba(211, 35, 75, 0.3),
    0 0 30px rgba(211, 35, 75, 0.2),
    inset 0 0 0 2px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.tests-icon {
  font-size: 2rem;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.35);
  position: relative;
  z-index: 3;
}

.tests-heading {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  position: relative;
  display: inline-block;
}

.tests-heading.show-underline::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: var(--color-accent);
  box-shadow: 0 0 10px var(--color-accent);
}

.tests-description {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
  min-height: 1.5rem;
}

.typing-cursor {
  display: inline-block;
  color: var(--color-accent);
  animation: cursor-blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.tests-card {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.tests-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
}

.tests-card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tests-placeholder {
  margin: 0;
  font-size: 1rem;
}

/* Дашборд метрик тестов */
.tests-dashboard {
  margin-bottom: 2rem;
}

.tests-dashboard-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.tests-dashboard-icon {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.tests-dashboard-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.tests-dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 600px) {
  .tests-dashboard-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tests-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  gap: 0.25rem;
}

.tests-metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.tests-metric-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: lowercase;
}

.tests-metric-passed .tests-metric-value { color: #2ecc71; }
.tests-metric-failed .tests-metric-value { color: #e74c3c; }
.tests-metric-skipped .tests-metric-value { color: #95a5a6; }

.tests-dashboard-last-run {
  font-size: 0.85rem;
  color: var(--color-text-tertiary);
  margin: 0 0 1rem 0;
}

.tests-dashboard-actions {
  display: flex;
  justify-content: flex-start;
}

.tests-run-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: #fff;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  border: 1px solid var(--color-accent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(211, 35, 75, 0.3);
}

.tests-run-all-btn:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(211, 35, 75, 0.4);
  transform: translateY(-1px);
}

.tests-run-all-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Блок «Проверка эндпоинтов» */
.tests-endpoints-card {
  margin-bottom: 2rem;
}

.tests-endpoints-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tests-endpoints-icon {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.tests-endpoints-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.tests-endpoints-desc {
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.tests-endpoints-actions {
  display: flex;
  justify-content: flex-start;
}

.tests-run-group-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tests-run-group-btn:hover:not(:disabled) {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 0 12px rgba(211, 35, 75, 0.3);
}

.tests-run-group-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Блок логов (выше tests-card) */
.tests-logs-card {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
}

.tests-logs-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
}

.tests-logs-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tests-logs-card-icon {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.tests-logs-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.tests-logs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tests-log-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.04em;
}

.tests-log-filter-chip:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-light);
  background: rgba(255, 255, 255, 0.05);
}

.tests-log-filter-chip.active {
  color: var(--color-text);
}

.tests-log-filter-chip.chip-info.active {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.12);
}

.tests-log-filter-chip.chip-info.active i {
  color: #3498db;
}

.tests-log-filter-chip.chip-warn.active {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.12);
}

.tests-log-filter-chip.chip-warn.active i {
  color: #f39c12;
}

.tests-log-filter-chip.chip-error.active {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.12);
}

.tests-log-filter-chip.chip-error.active i {
  color: #e74c3c;
}

.tests-logs-output {
  background: #080808;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  min-height: 200px;
  max-height: 400px;
  overflow: auto;
  padding: 1rem;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 0.8rem;
}

.tests-logs-empty {
  color: var(--color-text-secondary);
  text-align: center;
  padding: 2rem;
}

.tests-log-item {
  margin-bottom: 0;
}

.tests-log-date-divider {
  text-align: center;
  color: #555;
  font-size: 0.75rem;
  padding: 0.5rem 0;
  margin: 0.5rem 0;
  opacity: 0.7;
  letter-spacing: 0.1em;
}

.tests-log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.15rem 0;
  line-height: 1.4;
}

.tests-log-time {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.tests-log-level {
  flex-shrink: 0;
  font-weight: 600;
}

.tests-log-level-debug { color: #9b59b6; }
.tests-log-level-info { color: #3498db; }
.tests-log-level-notice { color: #1abc9c; }
.tests-log-level-warning { color: #f39c12; }
.tests-log-level-error { color: #e74c3c; }
.tests-log-level-critical { color: #c0392b; }
.tests-log-level-alert { color: #e67e22; }
.tests-log-level-emergency { color: #d35400; }

.tests-log-message {
  color: var(--color-text-secondary);
  word-break: break-word;
  flex: 1;
  min-width: 0;
}

.tests-logs-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.tests-logs-action-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
}

.tests-logs-action-row .tests-load-more-btn {
  flex: 1;
  min-width: 0;
  margin-right: auto;
}

.tests-logs-clear-btn {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tests-logs-clear-btn:hover {
  color: #fff;
  background: #e74c3c;
  border-color: #e74c3c;
  box-shadow: 0 0 12px rgba(231, 76, 60, 0.3);
}

.tests-logs-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  padding: 0.5rem 0;
}

.tests-logs-loading i {
  color: var(--color-accent);
}

.tests-logs-error {
  font-size: 0.85rem;
  color: #e74c3c;
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 4px;
}

.tests-load-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.04em;
}

.tests-load-more-btn:hover:not(:disabled) {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 0 12px rgba(211, 35, 75, 0.3);
}

.tests-load-more-btn:disabled,
.tests-load-more-btn.tests-load-more-btn-disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.7;
}

.tests-load-more-btn:disabled:hover,
.tests-load-more-btn.tests-load-more-btn-disabled:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-border);
  box-shadow: none;
}

.tests-load-more-btn i {
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .tests-heading {
    font-size: 2rem;
  }

  .tests-card {
    padding: 1.5rem;
  }

  .tests-logs-card {
    padding: 1.5rem;
  }
}
</style>
