<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUnmounted, ref, computed, watch } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { getSettingRoute } from '../api/settings/get'
import { saveSettingRoute } from '../api/settings/save'
import { createComponentLogger, setLogSink, type LogEntry } from '../shared/logger'

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
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  encodedLogsSocketId?: string
}>()

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

const SAVE_STATUS_DURATION_MS = 3000
const INPUT_DEBOUNCE_MS = 2000

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

const MAX_LOG_ENTRIES = 200
const logEntries = ref<LogEntry[]>([])
let logsSocketSubscription: { unsubscribe?: () => void } | null = null

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

function formatLogEntry(e: LogEntry): string {
  const d = new Date(e.timestamp)
  const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
  const msg = e.args.map((a) =>
    typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)
  ).join(' ')
  return `${t} [${e.level.toUpperCase()}] ${msg}`
}

const displayedLogsText = computed(() => {
  const filtered = logEntries.value.filter((e) => {
    if (e.severity <= 3 && logFilters.value.error) return true
    if (e.severity === 4 && logFilters.value.warn) return true
    if (e.severity >= 5 && logFilters.value.info) return true
    return false
  })
  return filtered.length ? filtered.map(formatLogEntry).join('\n') : 'Логи появятся здесь...'
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
    log.warn('Не удалось загрузить имя проекта', e)
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
    if (logEntries.value.length > MAX_LOG_ENTRIES) {
      logEntries.value = logEntries.value.slice(-MAX_LOG_ENTRIES)
    }
    if (entry.severity <= 3) errorCount.value += 1
    else if (entry.severity === 4) warnCount.value += 1
  })
  if (props.encodedLogsSocketId) {
    getOrCreateBrowserSocketClient()
      .then((socketClient) => {
        logsSocketSubscription = socketClient.subscribeToData(props.encodedLogsSocketId!)
        logsSocketSubscription.listen((data: { type?: string; data?: LogEntry }) => {
          if (data?.type === 'new-log' && data.data) {
            const entry = data.data as LogEntry
            logEntries.value.push(entry)
            if (logEntries.value.length > MAX_LOG_ENTRIES) {
              logEntries.value = logEntries.value.slice(-MAX_LOG_ENTRIES)
            }
            if (entry.severity <= 3) errorCount.value += 1
            else if (entry.severity === 4) warnCount.value += 1
          }
        })
      })
      .catch((err) => log.error('Не удалось подписаться на логи по WebSocket', err))
  }
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

const resetDashboard = () => {
  log.notice('Счётчики дашборда сброшены')
  errorCount.value = 0
  warnCount.value = 0
}

const openChatiumLink = () => {
  log.notice('Открытие ссылки Chatium')
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
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
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner">
        <section class="admin-section" :class="{ 'admin-visible': bootLoaderDone }">
          <div class="admin-header">
            <div class="admin-icon-wrapper">
              <i class="fas fa-cog admin-icon"></i>
            </div>
            <h1 class="admin-heading">Панель администратора</h1>
            <p class="admin-description">Управление логированием и мониторинг системы</p>
          </div>

          <!-- Dashboard -->
          <div class="admin-card">
            <div class="admin-card-header">
              <i class="fas fa-bars admin-card-icon dashboard-card-icon"></i>
              <h2 class="admin-card-title">Дашборд</h2>
              <button
                type="button"
                class="dashboard-reset"
                title="Сбросить счётчики"
                @click="resetDashboard"
              >
                <i class="fas fa-sync-alt dashboard-reset-icon"></i>
                Сбросить
              </button>
            </div>
            <div class="dashboard-stats">
              <div class="dashboard-stat stat-errors">
                <i class="fas fa-exclamation-circle stat-icon"></i>
                <div class="stat-content">
                  <span class="stat-value">{{ errorCount }}</span>
                  <span class="stat-label">Ошибок</span>
                </div>
              </div>
              <div class="dashboard-stat stat-warnings">
                <i class="fas fa-exclamation-triangle stat-icon"></i>
                <div class="stat-content">
                  <span class="stat-value">{{ warnCount }}</span>
                  <span class="stat-label">Предупреждений</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Settings -->
          <div class="admin-card">
            <span
              v-if="projectNameSaveStatus"
              class="admin-card-status"
              :class="projectNameSaveStatus === 'saved' ? 'status-saved' : 'status-error'"
            >
              {{ projectNameSaveStatus === 'saved' ? 'Сохранено' : 'Ошибка' }}
            </span>
            <div class="admin-card-header">
              <i class="fas fa-wrench admin-card-icon"></i>
              <h2 class="admin-card-title">Настройки проекта</h2>
            </div>
            <div class="settings-form">
              <div class="settings-field">
                <label class="settings-label" for="project-name">Название проекта</label>
                <input
                  id="project-name"
                  v-model="projectName"
                  type="text"
                  class="settings-input"
                  :disabled="projectNameLoading"
                />
              </div>
            </div>
            <p v-if="projectNameError" class="admin-card-error">{{ projectNameError }}</p>
          </div>

          <!-- Logging Level -->
          <div class="admin-card">
            <span
              v-if="logLevelSaveStatus"
              class="admin-card-status"
              :class="logLevelSaveStatus === 'saved' ? 'status-saved' : 'status-error'"
            >
              {{ logLevelSaveStatus === 'saved' ? 'Сохранено' : 'Ошибка' }}
            </span>
            <div class="admin-card-header">
              <i class="fas fa-sliders-h admin-card-icon"></i>
              <h2 class="admin-card-title">Уровень логирования</h2>
            </div>
            <div class="log-level-buttons">
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'debug' }"
                @click="setLogLevel('debug')"
              >
                Debug
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'info' }"
                @click="setLogLevel('info')"
              >
                Info
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'warn' }"
                @click="setLogLevel('warn')"
              >
                Warn
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'error' }"
                @click="setLogLevel('error')"
              >
                Error
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'disable' }"
                @click="setLogLevel('disable')"
              >
                Disable
              </button>
            </div>
            <p v-if="logLevelError" class="admin-card-error">{{ logLevelError }}</p>
          </div>

          <!-- Logs Output -->
          <div class="admin-card logs-card">
            <div class="admin-card-header">
              <i class="fas fa-terminal admin-card-icon"></i>
              <h2 class="admin-card-title">Логи</h2>
            </div>
            <div class="logs-filters">
              <button
                type="button"
                class="log-filter-chip chip-info"
                :class="{ active: logFilters.info }"
                @click="toggleLogFilter('info')"
              >
                <i class="fas fa-info-circle"></i>
                Info
              </button>
              <button
                type="button"
                class="log-filter-chip chip-warn"
                :class="{ active: logFilters.warn }"
                @click="toggleLogFilter('warn')"
              >
                <i class="fas fa-exclamation-triangle"></i>
                Warn
              </button>
              <button
                type="button"
                class="log-filter-chip chip-error"
                :class="{ active: logFilters.error }"
                @click="toggleLogFilter('error')"
              >
                <i class="fas fa-exclamation-circle"></i>
                Error
              </button>
            </div>
            <div class="logs-output">
              <pre class="logs-content">{{ displayedLogsText }}</pre>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style>
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
</style>

<style scoped>
.admin-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.admin-section.admin-visible {
  opacity: 1;
  transform: translateY(0);
}

.admin-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.admin-icon-wrapper {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 20px rgba(211, 35, 75, 0.35),
    0 0 24px rgba(211, 35, 75, 0.15);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.admin-icon {
  font-size: 1.5rem;
  color: #fff;
}

.admin-heading {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
}

.admin-description {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* Admin Cards */
.admin-card {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
}

.admin-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
}

.admin-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.admin-card-icon {
  color: var(--color-accent);
  font-size: 1rem;
}

.admin-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
}

/* Log Level Buttons */
.log-level-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.log-level-btn {
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
}

.log-level-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-light);
  background: rgba(255, 255, 255, 0.05);
}

.log-level-btn.active {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 0 12px rgba(211, 35, 75, 0.3);
}

.admin-card-error {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: #e74c3c;
}

.admin-card-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  animation: statusFadeIn 0.2s ease;
}

.admin-card-status.status-saved {
  color: #27ae60;
}

.admin-card-status.status-error {
  color: #e74c3c;
}

@keyframes statusFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Project Settings */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.settings-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
}

.settings-input {
  padding: 0.6rem 0.9rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: border-color 0.2s ease;
}

.settings-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.settings-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dashboard */
.dashboard-card-icon {
  color: var(--color-accent);
}

.dashboard-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  letter-spacing: 0.04em;
}

.dashboard-reset:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-border);
}

.dashboard-reset-icon {
  font-size: 0.8rem;
  opacity: 0.9;
}

.dashboard-stats {
  display: flex;
  gap: 1rem;
}

.dashboard-stat {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
}

.dashboard-stat .stat-icon {
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.dashboard-stat .stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-stat .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.dashboard-stat .stat-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.2;
}

.stat-icon {
  font-size: 1.25rem;
  opacity: 0.6;
}

.stat-errors .stat-value,
.stat-errors .stat-icon {
  color: #e74c3c;
}

.stat-warnings .stat-value,
.stat-warnings .stat-icon {
  color: #f39c12;
}

/* Logs Output */
.logs-card {
  margin-bottom: 0;
}

.logs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.log-filter-chip {
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

.log-filter-chip:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-light);
  background: rgba(255, 255, 255, 0.05);
}

.log-filter-chip.active {
  color: var(--color-text);
}

.log-filter-chip i {
  font-size: 0.75rem;
  opacity: 0.9;
}

.log-filter-chip.chip-info.active {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.12);
}

.log-filter-chip.chip-info.active i {
  color: #3498db;
}

.log-filter-chip.chip-warn.active {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.12);
}

.log-filter-chip.chip-warn.active i {
  color: #f39c12;
}

.log-filter-chip.chip-error.active {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.12);
}

.log-filter-chip.chip-error.active i {
  color: #e74c3c;
}

.logs-output {
  background: #080808;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  min-height: 200px;
  max-height: 400px;
  overflow: auto;
  padding: 1rem;
}

.logs-content {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .admin-heading {
    font-size: 1.6rem;
  }

  .admin-card {
    padding: 1.25rem;
  }

  .dashboard-stat {
    min-width: 100%;
  }
}
</style>
