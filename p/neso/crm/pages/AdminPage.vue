<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUnmounted, ref, computed, watch } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import AppShell from '../web/design/components/AppShell.vue'
import { getSettingRoute } from '../api/settings/get'
import { saveSettingRoute } from '../api/settings/save'
import { createComponentLogger, setLogSink, type LogEntry } from '../shared/logger'
import { getRecentLogsRoute } from '../api/admin/logs/recent'
import { getLogsBeforeRoute } from '../api/admin/logs/before'
import { getDashboardCountsRoute } from '../api/admin/dashboard/counts'
import { resetDashboardRoute } from '../api/admin/dashboard/reset'

const log = createComponentLogger('AdminPage')

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
  testsUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  encodedLogsSocketId?: string
}>()

const navItems = computed(() =>
  [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная', href: props.indexUrl },
    { id: 'profile', icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
    { id: 'admin', icon: 'fa-gear', label: 'Админка', href: props.adminUrl },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты', href: props.testsUrl }
  ].filter((item) => item.href)
)

const bootLoaderDone = ref(false)
const projectName = ref(props.projectTitle.split(' / ')[0] || props.projectTitle)
const lastSavedProjectName = ref(props.projectTitle.split(' / ')[0] || props.projectTitle)
const projectNameError = ref('')
const projectNameLoading = ref(false)
const projectNameDebounceTimer = { id: null as ReturnType<typeof setTimeout> | null }
const projectNameSaveStatus = ref<'saved' | 'error' | null>(null)
const projectNameStatusTimeout = { id: null as ReturnType<typeof setTimeout> | null }

const logLevel = ref<'debug' | 'info' | 'warn' | 'error' | 'disable'>('info')
const logLevelError = ref('')
const logLevelSaveStatus = ref<'saved' | 'error' | null>(null)
const logLevelStatusTimeout = { id: null as ReturnType<typeof setTimeout> | null }

const SAVE_STATUS_DURATION_MS = 1500
const INPUT_DEBOUNCE_MS = 300

function showSaveStatus(
  statusRef: { value: 'saved' | 'error' | null },
  timeoutHolder: { id: ReturnType<typeof setTimeout> | null },
  status: 'saved' | 'error'
) {
  if (timeoutHolder.id) clearTimeout(timeoutHolder.id)
  statusRef.value = status
  timeoutHolder.id = setTimeout(() => {
    statusRef.value = null
    timeoutHolder.id = null
  }, SAVE_STATUS_DURATION_MS)
}
const errorCount = ref(0)
const warnCount = ref(0)
const dashboardResetAt = ref(0)

const MAX_LOG_ENTRIES = 500
const logEntries = ref<LogEntry[]>([])
let logsSocketSubscription: any = null
const logsOutputRef = ref<HTMLElement | null>(null)

const logsLoading = ref(false)
const logsError = ref('')
const logsHasMore = ref(false)
const oldestLogTimestamp = ref<number | null>(null)

const logFilters = ref({
  info: true,
  warn: true,
  error: true
})

const toggleLogFilter = (level: 'info' | 'warn' | 'error') => {
  logFilters.value[level] = !logFilters.value[level]
  log.debug('Фильтр логов переключён', level, logFilters.value[level])
}

const startAnimations = () => {
  bootLoaderDone.value = true
}

const LOG_LEVEL_VALUES = ['debug', 'info', 'warn', 'error', 'disable'] as const

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
    log.debug('Обрезаны старые логи', { 
      было: sorted.length, 
      осталось: logEntries.value.length 
    })
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
    
    // Показываем разделитель только если это не первый лог и дата изменилась
    if (i > 0 && dateKey !== lastDateKey) {
      items.push({
        type: 'divider',
        date: formatDateDivider(entry.timestamp)
      })
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

const loadProjectName = async () => {
  try {
    const res = await getSettingRoute.query({ key: 'project_name' }).run(ctx)
    const data = res as { success?: boolean; value?: unknown }
    if (data?.success && typeof data.value === 'string') {
      const loaded = data.value
      projectName.value = loaded
      lastSavedProjectName.value = loaded
    }
  } catch (e) {
    log.warning('Не удалось загрузить имя проекта', e)
  }
}

watch(projectName, () => {
  if (projectNameDebounceTimer.id) clearTimeout(projectNameDebounceTimer.id)
  projectNameDebounceTimer.id = setTimeout(() => {
    projectNameDebounceTimer.id = null
    const trimmed = String(projectName.value ?? '').trim()
    if (trimmed !== lastSavedProjectName.value) {
      saveProjectName()
    }
  }, INPUT_DEBOUNCE_MS)
})

const saveProjectName = async () => {
  projectNameError.value = ''
  projectNameLoading.value = true
  const prev = projectName.value
  try {
    const res = await saveSettingRoute.run(ctx, {
      key: 'project_name',
      value: projectName.value.trim()
    })
    const data = res as { success?: boolean; error?: string }
    if (data?.success === false) {
      projectNameError.value = data.error || 'Ошибка сохранения'
      projectName.value = prev
      showSaveStatus(projectNameSaveStatus, projectNameStatusTimeout, 'error')
    } else {
      lastSavedProjectName.value = projectName.value.trim()
      showSaveStatus(projectNameSaveStatus, projectNameStatusTimeout, 'saved')
    }
  } catch (e) {
    projectNameError.value = (e as Error)?.message || 'Ошибка сохранения'
    projectName.value = prev
    showSaveStatus(projectNameSaveStatus, projectNameStatusTimeout, 'error')
  } finally {
    projectNameLoading.value = false
  }
}

onMounted(() => {
  log.info('Компонент смонтирован')
  loadProjectName()
  loadDashboardCounts()
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
  const bootLevel = (window as Window & { __BOOT__?: { logLevel?: string } }).__BOOT__?.logLevel
  if (typeof bootLevel === 'string') {
    const normalized = bootLevel.toLowerCase()
    if (LOG_LEVEL_VALUES.includes(normalized as (typeof LOG_LEVEL_VALUES)[number])) {
      logLevel.value = normalized as (typeof LOG_LEVEL_VALUES)[number]
    }
  }
  setLogSink((entry: LogEntry) => {
    logEntries.value.push(entry)
    trimOldLogs()
    if (entry.timestamp >= dashboardResetAt.value) {
      if (entry.severity <= 3) errorCount.value += 1
      else if (entry.severity === 4) warnCount.value += 1
    }
  })
  if (props.encodedLogsSocketId) {
    getOrCreateBrowserSocketClient()
      .then((socketClient) => {
        logsSocketSubscription = socketClient.subscribeToData(props.encodedLogsSocketId!)
        logsSocketSubscription.listen((data: { type?: string; data?: LogEntry }) => {
          if (data?.type === 'new-log' && data.data) {
            const entry = data.data as LogEntry
            logEntries.value.push(entry)
            trimOldLogs()
            if (entry.timestamp >= dashboardResetAt.value) {
              if (entry.severity <= 3) errorCount.value += 1
              else if (entry.severity === 4) warnCount.value += 1
            }
          }
        })
      })
      .catch((err) => log.error('Не удалось подписаться на логи по WebSocket', err))
  }

  loadRecentLogs()
})

onBeforeUnmount(() => {
  if (logsSocketSubscription?.unsubscribe) {
    logsSocketSubscription.unsubscribe()
    logsSocketSubscription = null
  }
  if (projectNameStatusTimeout.id) {
    clearTimeout(projectNameStatusTimeout.id)
    projectNameStatusTimeout.id = null
  }
  if (logLevelStatusTimeout.id) {
    clearTimeout(logLevelStatusTimeout.id)
    logLevelStatusTimeout.id = null
  }
  if (projectNameDebounceTimer.id) {
    clearTimeout(projectNameDebounceTimer.id)
    projectNameDebounceTimer.id = null
  }
})

onUnmounted(() => {
  log.info('Компонент размонтирован')
  setLogSink(null)
  window.removeEventListener('bootloader-complete', startAnimations)
})

const setLogLevel = async (level: 'debug' | 'info' | 'warn' | 'error' | 'disable') => {
  const prev = logLevel.value
  logLevel.value = level
  logLevelError.value = ''
  log.notice('Уровень логирования изменён', { from: prev, to: level })
  try {
    const res = await saveSettingRoute.run(ctx, { key: 'log_level', value: level })
    if (res && (res as { success?: boolean }).success === false) {
      logLevel.value = prev
      const errMsg = (res as { error?: string }).error || 'Ошибка сохранения'
      logLevelError.value = errMsg
      showSaveStatus(logLevelSaveStatus, logLevelStatusTimeout, 'error')
      log.error('Не удалось сохранить уровень логирования', errMsg)
    } else {
      showSaveStatus(logLevelSaveStatus, logLevelStatusTimeout, 'saved')
      log.info('Уровень логирования успешно сохранён', level)
    }
  } catch (e) {
    logLevel.value = prev
    const errMsg = (e as Error)?.message || 'Ошибка сохранения'
    logLevelError.value = errMsg
    showSaveStatus(logLevelSaveStatus, logLevelStatusTimeout, 'error')
    log.error('Не удалось сохранить уровень логирования', errMsg)
  }
}

const loadDashboardCounts = async () => {
  try {
    const res = await getDashboardCountsRoute.run(ctx)
    const data = res as { success?: boolean; errorCount?: number; warnCount?: number; resetAt?: number; error?: string }
    if (data?.success && typeof data.errorCount === 'number' && typeof data.warnCount === 'number' && typeof data.resetAt === 'number') {
      errorCount.value = data.errorCount
      warnCount.value = data.warnCount
      dashboardResetAt.value = data.resetAt
      log.debug('Счётчики дашборда загружены', { errorCount: data.errorCount, warnCount: data.warnCount, resetAt: data.resetAt })
    }
  } catch (e) {
    log.warning('Не удалось загрузить счётчики дашборда', e)
  }
}

const resetDashboard = async () => {
  try {
    const res = await resetDashboardRoute.run(ctx)
    const data = res as { success?: boolean; errorCount?: number; warnCount?: number; resetAt?: number; error?: string }
    if (data?.success && typeof data.resetAt === 'number') {
      dashboardResetAt.value = data.resetAt
      errorCount.value = data.errorCount ?? 0
      warnCount.value = data.warnCount ?? 0
      log.notice('Счётчики дашборда сброшены', { resetAt: data.resetAt })
    } else {
      log.error('Ошибка сброса дашборда', data?.error)
    }
  } catch (e) {
    log.error('Ошибка сброса дашборда', e)
  }
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
      log.info('Последние логи загружены', { count: data.entries.length })
    } else {
      logsError.value = data?.error || 'Ошибка загрузки логов'
      log.error('Ошибка загрузки логов', logsError.value)
    }
  } catch (e) {
    logsError.value = (e as Error)?.message || 'Ошибка сети'
    log.error('Ошибка загрузки логов', e)
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
      logsHasMore.value = data.hasMore ?? data.entries.length === 50
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
  log.debug('Логи очищены, таймштамп сдвинут на текущий — «Загрузить ещё 50» восстановит последние')
}
</script>

<template>
  <AppShell
    :pageTitle="'Админка'"
    :pageSubtitle="projectName"
    :navItems="navItems"
    activeSection="admin"
  >
    <template #headerActions>
      <button class="action-btn glass" type="button" @click="resetDashboard">
        <i class="fas fa-sync-alt"></i>
      </button>
      <button class="action-btn glass" type="button" @click="loadRecentLogs">
        <i class="fas fa-terminal"></i>
      </button>
      <button class="action-btn primary" type="button" @click="clearLogs">
        <i class="fas fa-trash-alt"></i>
        <span>Очистить</span>
      </button>
    </template>

    <section class="bento-grid">
      <div class="bento-item hero-card">
        <div class="hero-content">
          <span class="hero-tag">
            <i class="fas fa-shield-halved"></i>
            Администрирование
          </span>
          <h2 class="hero-title">Панель управления</h2>
          <p class="hero-desc">Настройки проекта, контроль логирования и мониторинг ошибок.</p>
          <div class="hero-actions">
            <button class="btn-glow" type="button" @click="resetDashboard">
              <span>Сбросить метрики</span>
              <i class="fas fa-rotate"></i>
            </button>
            <button class="btn-ghost" type="button" @click="loadRecentLogs">Обновить логи</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="floating-card card-1">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="floating-card card-2">
            <i class="fas fa-bug"></i>
          </div>
          <div class="floating-card card-3">
            <i class="fas fa-shield-check"></i>
          </div>
        </div>
      </div>

      <div class="bento-item stat-card">
        <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="stat-content">
          <span class="stat-value">{{ errorCount }}</span>
          <span class="stat-label">Ошибок</span>
        </div>
        <div class="stat-glow"></div>
      </div>

      <div class="bento-item stat-card">
        <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="stat-content">
          <span class="stat-value">{{ warnCount }}</span>
          <span class="stat-label">Предупреждений</span>
        </div>
        <div class="stat-glow"></div>
      </div>

      <div class="bento-item actions-card">
        <h3 class="card-title">Фильтры логов</h3>
        <div class="showcase-content wrap">
          <button
            type="button"
            class="tag"
            :class="logFilters.info ? '' : 'tag-muted'"
            @click="toggleLogFilter('info')"
          >
            <i class="fas fa-info-circle"></i>
            Info
          </button>
          <button
            type="button"
            class="tag"
            :class="logFilters.warn ? 'tag-light' : 'tag-muted'"
            @click="toggleLogFilter('warn')"
          >
            <i class="fas fa-exclamation-triangle"></i>
            Warn
          </button>
          <button
            type="button"
            class="tag"
            :class="logFilters.error ? 'tag-outline' : 'tag-muted'"
            @click="toggleLogFilter('error')"
          >
            <i class="fas fa-exclamation-circle"></i>
            Error
          </button>
        </div>
      </div>
    </section>

    <section class="showcase">
      <h2 class="section-title">Настройки</h2>
      <div class="showcase-grid">
        <div class="showcase-card wide">
          <h4 class="showcase-label">Название проекта</h4>
          <div class="showcase-content column">
            <div class="input-group">
              <i class="fas fa-font"></i>
              <input id="project-name" v-model="projectName" type="text" placeholder="Название проекта" />
            </div>
            <span
              v-if="projectNameSaveStatus"
              class="tag"
              :class="projectNameSaveStatus === 'saved' ? 'tag-light' : 'tag-outline'"
            >
              {{ projectNameSaveStatus === 'saved' ? 'Сохранено' : 'Ошибка' }}
            </span>
            <p v-if="projectNameError" class="helper-error">{{ projectNameError }}</p>
          </div>
        </div>

        <div class="showcase-card">
          <h4 class="showcase-label">Уровень логирования</h4>
          <div class="showcase-content wrap">
            <button type="button" :class="logLevel === 'debug' ? 'btn-glow' : 'btn-glass'" @click="setLogLevel('debug')">Debug</button>
            <button type="button" :class="logLevel === 'info' ? 'btn-glow' : 'btn-glass'" @click="setLogLevel('info')">Info</button>
            <button type="button" :class="logLevel === 'warn' ? 'btn-glow' : 'btn-glass'" @click="setLogLevel('warn')">Warn</button>
            <button type="button" :class="logLevel === 'error' ? 'btn-glow' : 'btn-glass'" @click="setLogLevel('error')">Error</button>
            <button type="button" :class="logLevel === 'disable' ? 'btn-glow' : 'btn-glass'" @click="setLogLevel('disable')">Disable</button>
            <span
              v-if="logLevelSaveStatus"
              class="tag"
              :class="logLevelSaveStatus === 'saved' ? 'tag-light' : 'tag-outline'"
            >
              {{ logLevelSaveStatus === 'saved' ? 'Сохранено' : 'Ошибка' }}
            </span>
            <p v-if="logLevelError" class="helper-error">{{ logLevelError }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="showcase">
      <h2 class="section-title">Логи</h2>
      <div class="showcase-card wide logs-card">
        <div class="logs-output custom-scrollbar" ref="logsOutputRef">
          <div v-if="displayedLogs.length === 0" class="logs-empty">Логи появятся здесь...</div>
          <div v-for="(item, index) in displayedLogs" :key="index" class="log-item">
            <div v-if="item.type === 'divider'" class="log-date-divider">
              --- {{ item.date }} ---
            </div>
            <div v-else class="log-entry">
              <span class="log-time">{{ item.formattedTime }}</span>
              <span class="log-level" :class="`log-level-${item.entry.level}`">
                [{{ item.entry.level.toUpperCase() }}]
              </span>
              <span class="log-message">{{ item.formattedMessage }}</span>
            </div>
          </div>
        </div>
        <div class="logs-actions">
          <div v-if="logsLoading" class="logs-loading">
            <i class="fas fa-spinner fa-spin"></i>
            Загрузка логов...
          </div>
          <p v-if="logsError" class="helper-error">{{ logsError }}</p>
          <div class="logs-action-row">
            <button
              v-if="logsHasMore && !logsLoading"
              type="button"
              class="btn-glass"
              @click="loadMoreLogs"
            >
              <i class="fas fa-arrow-down"></i>
              Загрузить ещё 50
            </button>
            <button type="button" class="btn-outline" @click="clearLogs">
              <i class="fas fa-trash-alt"></i>
              Очистить
            </button>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.helper-error {
  color: var(--accent-primary);
  font-size: 0.85rem;
  margin: 8px 0 0 0;
}

.logs-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logs-output {
  max-height: 320px;
  overflow: auto;
  padding: 12px;
  background: var(--surface-glass);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass-light);
}

.logs-empty {
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

.log-entry {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 6px 0;
  border-bottom: 1px dashed var(--border-glass-light);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

.log-level {
  color: var(--accent-primary);
  font-weight: 600;
}

.log-level-error {
  color: #d9534f;
}

.log-level-warning {
  color: #f0ad4e;
}

.log-level-info {
  color: var(--accent-primary);
}

.log-date-divider {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin: 8px 0;
}

.logs-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.logs-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
