<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUnmounted, ref, computed, watch } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import AppShell from '../components/layout/AppShell.vue'
import CrmKpiBlock from '../components/layout/CrmKpiBlock.vue'
import CrmSection from '../components/layout/CrmSection.vue'
import CrmButton from '../components/base/CrmButton.vue'
import CrmInput from '../components/base/CrmInput.vue'
import CrmBadge from '../components/base/CrmBadge.vue'
import CrmStatCard from '../components/base/CrmStatCard.vue'
import CrmLogFeed from '../components/data-display/CrmLogFeed.vue'
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
  initialLocale?: string
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
const LOG_LEVEL_OPTIONS = [
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
  { value: 'disable', label: 'Disable' }
] as const

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

const logFeedItems = computed(() =>
  displayedLogs.value.map((item) =>
    item.type === 'divider'
      ? {
          type: 'divider' as const,
          date: item.date
        }
      : {
          type: 'log' as const,
          level: item.entry.level,
          formattedTime: item.formattedTime,
          formattedMessage: item.formattedMessage
        }
  )
)

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
    class="admin-page-shell"
    :pageTitle="'Админка'"
    :pageSubtitle="projectName"
    :navItems="navItems"
    activeSection="admin"
  >
    <template #headerActions>
      <CrmButton class="admin-header-btn" size="sm" variant="ghost" icon="fas fa-arrows-rotate" @click="resetDashboard">
        Сброс
      </CrmButton>
      <CrmButton class="admin-header-btn" size="sm" variant="ghost" icon="fas fa-terminal" @click="loadRecentLogs">
        Обновить
      </CrmButton>
      <CrmButton class="admin-header-btn" size="sm" variant="danger" icon="fas fa-trash-alt" @click="clearLogs">
        Очистить
      </CrmButton>
    </template>

    <div class="admin-stack" :class="{ 'is-ready': bootLoaderDone }">
      <CrmSection
        title="Панель управления"
        subtitle="Настройки проекта, контроль логирования и мониторинг ошибок."
        variant="raised"
      >
        <template #actions>
          <CrmBadge variant="info" icon="fas fa-shield-halved">Администрирование</CrmBadge>
        </template>

        <div class="admin-overview-grid">
          <CrmStatCard
            label="Ошибок"
            :value="errorCount"
            icon="fas fa-exclamation-circle"
            status="danger"
          />
          <CrmStatCard
            label="Предупреждений"
            :value="warnCount"
            icon="fas fa-exclamation-triangle"
            status="warning"
          />
          <CrmKpiBlock class="admin-overview-actions" title="Быстрые действия">
            <div class="crm-row">
              <CrmButton size="sm" variant="primary" icon="fas fa-rotate" @click="resetDashboard">
                Сбросить метрики
              </CrmButton>
              <CrmButton size="sm" variant="ghost" icon="fas fa-terminal" @click="loadRecentLogs">
                Обновить логи
              </CrmButton>
            </div>
          </CrmKpiBlock>
        </div>
      </CrmSection>

      <CrmSection
        title="Фильтры логов"
        subtitle="Управление видимостью уровней в ленте."
      >
        <div class="crm-row">
          <CrmButton
            size="sm"
            variant="ghost"
            icon="fas fa-info-circle"
            :class="{ 'admin-filter-active': logFilters.info }"
            @click="toggleLogFilter('info')"
          >
            Info
          </CrmButton>
          <CrmButton
            size="sm"
            variant="ghost"
            icon="fas fa-exclamation-triangle"
            :class="{ 'admin-filter-active': logFilters.warn }"
            @click="toggleLogFilter('warn')"
          >
            Warn
          </CrmButton>
          <CrmButton
            size="sm"
            :variant="logFilters.error ? 'danger' : 'ghost'"
            icon="fas fa-exclamation-circle"
            :class="{ 'admin-filter-active': logFilters.error }"
            @click="toggleLogFilter('error')"
          >
            Error
          </CrmButton>
        </div>
      </CrmSection>

      <CrmSection
        title="Настройки"
        subtitle="Параметры проекта и режим логирования."
      >
        <div class="admin-settings-grid">
          <div class="admin-settings-block">
            <CrmInput
              v-model="projectName"
              label="Название проекта"
              placeholder="Название проекта"
              :disabled="projectNameLoading"
            />
            <div class="admin-inline-status">
              <CrmBadge
                v-if="projectNameSaveStatus === 'saved'"
                variant="success"
                icon="fas fa-check"
              >
                Сохранено
              </CrmBadge>
              <CrmBadge
                v-if="projectNameSaveStatus === 'error'"
                variant="danger"
                icon="fas fa-triangle-exclamation"
              >
                Ошибка
              </CrmBadge>
            </div>
            <p v-if="projectNameError" class="crm-status-danger admin-error">{{ projectNameError }}</p>
          </div>

          <div class="admin-settings-block">
            <span class="crm-field-label">Уровень логирования</span>
            <div class="crm-row">
              <CrmButton
                v-for="option in LOG_LEVEL_OPTIONS"
                :key="option.value"
                size="sm"
                :variant="logLevel === option.value ? 'primary' : 'ghost'"
                @click="setLogLevel(option.value)"
              >
                {{ option.label }}
              </CrmButton>
            </div>
            <div class="admin-inline-status">
              <CrmBadge
                v-if="logLevelSaveStatus === 'saved'"
                variant="success"
                icon="fas fa-check"
              >
                Сохранено
              </CrmBadge>
              <CrmBadge
                v-if="logLevelSaveStatus === 'error'"
                variant="danger"
                icon="fas fa-triangle-exclamation"
              >
                Ошибка
              </CrmBadge>
            </div>
            <p v-if="logLevelError" class="crm-status-danger admin-error">{{ logLevelError }}</p>
          </div>
        </div>
      </CrmSection>

      <CrmSection
        title="Логи"
        subtitle="Поток системных сообщений в реальном времени."
      >
        <CrmLogFeed
          :items="logFeedItems"
          :loading="logsLoading"
          :error="logsError"
          :hasMore="logsHasMore"
          emptyText="Логи появятся здесь..."
          loadingText="Загрузка логов..."
          loadMoreLabel="Загрузить ещё 50"
          clearLabel="Очистить"
          @load-more="loadMoreLogs"
          @clear="clearLogs"
        />
      </CrmSection>
    </div>
  </AppShell>
</template>

<style scoped>
.admin-page-shell :deep(.app-shell-content) {
  display: flex;
  flex-direction: column;
  gap: var(--crm-space-4);
}

.admin-page-shell :deep(.app-shell-actions) {
  flex-wrap: wrap;
}

.admin-stack {
  display: flex;
  flex-direction: column;
  gap: var(--crm-space-4);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.admin-stack.is-ready {
  opacity: 1;
  transform: translateY(0);
}

.admin-header-btn {
  min-width: 6.8rem;
}

.admin-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--crm-space-3);
}

.admin-overview-actions {
  justify-content: space-between;
}

.admin-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--crm-space-3);
}

.admin-settings-block {
  display: flex;
  flex-direction: column;
  gap: var(--crm-space-2);
}

.admin-inline-status {
  min-height: 1.7rem;
  display: flex;
  align-items: center;
  gap: var(--crm-space-2);
}

.admin-error {
  margin: 0;
  font-size: 0.82rem;
}

.admin-filter-active {
  border-color: var(--crm-accent) !important;
  background: var(--crm-accentSoft) !important;
  color: var(--crm-text) !important;
}

@media (max-width: 1100px) {
  .admin-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-overview-actions {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .admin-settings-grid,
  .admin-overview-grid {
    grid-template-columns: 1fr;
  }

  .admin-overview-actions {
    grid-column: span 1;
  }
}
</style>
