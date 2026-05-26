<script setup lang="ts">
import { onMounted, onBeforeUnmount, onUnmounted, ref, computed, watch } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import LogStreamPanel from '../components/LogStreamPanel.vue'
import { getSettingRoute } from '../api/settings/get'
import { saveSettingRoute } from '../api/settings/save'
import { createComponentLogger, setLogSink, type LogEntry } from '../shared/logger'
import { createBrowserRemoteLogger } from '../shared/browserRemoteLogger'
import { postBrowserLogsRoute } from '../api/logger/browser'
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
  panelUrl?: string
  encodedLogsSocketId?: string
  initialSettings?: {
    lp_apikey: string
    lp_login: string
    lp_webhook_token: string
    gateway_base_url: string
  }
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

// ── Настройки LifePay (перенесены с главной панели; страница admin-only) ──
// Источник истины при загрузке — SSR-проп initialSettings; редактируемые поля
// и снимок сохранённых значений для индикатора «не сохранено».
const LP_SETTINGS_KEYS = ['lp_apikey', 'lp_login', 'lp_webhook_token', 'gateway_base_url'] as const
type LpSettingKey = (typeof LP_SETTINGS_KEYS)[number]

const lpSettings = ref<Record<LpSettingKey, string>>({
  lp_apikey: props.initialSettings?.lp_apikey ?? '',
  lp_login: props.initialSettings?.lp_login ?? '',
  lp_webhook_token: props.initialSettings?.lp_webhook_token ?? '',
  gateway_base_url: props.initialSettings?.gateway_base_url ?? ''
})
const savedLpSettings = ref<Record<LpSettingKey, string>>({ ...lpSettings.value })
const lpSettingsMessage = ref('')
const lpSettingsError = ref(false)
const lpSettingsSaving = ref(false)

const hasUnsavedLpSettings = computed(() =>
  LP_SETTINGS_KEYS.some((k) => (lpSettings.value[k] || '') !== (savedLpSettings.value[k] || ''))
)

const generateWebhookToken = () => {
  const chars = 'abcdef0123456789'
  let t = ''
  for (let i = 0; i < 64; i++) {
    t += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  lpSettings.value.lp_webhook_token = t
  log.notice('Сгенерирован webhook-токен', { length: t.length })
}

const saveLpSettings = async () => {
  log.info('saveLpSettings entry')
  lpSettingsMessage.value = ''
  lpSettingsError.value = false
  lpSettingsSaving.value = true
  try {
    for (const key of LP_SETTINGS_KEYS) {
      const value = lpSettings.value[key] || ''
      // Пустые значения не отправляем — валидация lib отвергнет пустые секреты.
      if (!value) continue
      const res = await saveSettingRoute.run(ctx, { key, value })
      const data = res as { success?: boolean; error?: string }
      if (data?.success === false) {
        throw new Error(`${key}: ${data.error || 'ошибка'}`)
      }
    }
    savedLpSettings.value = { ...lpSettings.value }
    lpSettingsMessage.value = 'Сохранено.'
    log.notice('Настройки LifePay сохранены')
  } catch (e) {
    lpSettingsMessage.value = (e as Error)?.message || String(e)
    lpSettingsError.value = true
    log.error('Ошибка сохранения настроек LifePay', lpSettingsMessage.value)
  } finally {
    lpSettingsSaving.value = false
    log.info('saveLpSettings exit')
  }
}

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

let browserRemoteLogger: ReturnType<typeof createBrowserRemoteLogger> | null = null

// Визуальная лог-панель (список/фильтры/загрузка/разворачивание) вынесена в общий компонент.
const logPanel = ref<InstanceType<typeof LogStreamPanel> | null>(null)
// Состояние загрузки истории логов внутри панели — для индикатора в статус-пилле.
const logsLoading = computed(() => logPanel.value?.logsLoading ?? false)

// `DataSocketSubscription.listen()` возвращает функцию отписки — её и храним для очистки.
let logsSocketUnsubscribe: (() => void) | null = null
let logsSocketLifecycleCleanup: (() => void) | null = null

/** Поток логов по WebSocket: подключён / нет канала / офлайн (ошибка, сеть или разрыв сокета). */
const logsWsConnected = ref(false)
/** Первая попытка подписки завершилась — до этого не показываем OFFLINE, чтобы не мигать при загрузке. */
const logsWsInitialized = ref(false)

const encodedLogsSocketOk = computed(() => Boolean(props.encodedLogsSocketId))

const streamPillLabel = computed(() => {
  if (!encodedLogsSocketOk.value) return 'LOGS'
  if (!logsWsInitialized.value) return '···'
  return logsWsConnected.value ? 'LIVE' : 'OFFLINE'
})

const streamPillAriaLabel = computed(() => {
  if (!encodedLogsSocketOk.value) return 'Поток логов без канала WebSocket'
  if (!logsWsInitialized.value) return 'Подключение WebSocket для логов'
  return logsWsConnected.value
    ? 'Поток логов в реальном времени, WebSocket подключён'
    : 'WebSocket для логов недоступен'
})

const startAnimations = () => {
  bootLoaderDone.value = true
}

const LOG_LEVEL_VALUES = ['debug', 'info', 'warn', 'error', 'disable'] as const

const loadProjectName = async () => {
  log.info('loadProjectName entry')
  try {
    const res = await getSettingRoute.query({ key: 'project_name' }).run(ctx)
    const data = res as { success?: boolean; value?: unknown }
    if (data?.success && typeof data.value === 'string') {
      const loaded = data.value
      projectName.value = loaded
      lastSavedProjectName.value = loaded
      log.info('loadProjectName loaded')
      log.debug('loadProjectName loaded', { value: loaded })
    } else {
      log.info('loadProjectName no value')
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
  log.info('saveProjectName entry')
  log.debug('saveProjectName entry', { name: projectName.value })
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
    log.info('saveProjectName exit')
  }
}

onMounted(() => {
  log.info('Компонент смонтирован', {
    projectTitle: props.projectTitle,
    isAuthenticated: props.isAuthenticated,
    isAdmin: props.isAdmin,
    indexUrl: props.indexUrl,
    profileUrl: props.profileUrl,
    loginUrl: props.loginUrl,
    adminUrl: props.adminUrl,
    panelUrl: props.panelUrl,
    hasEncodedLogsSocketId: !!props.encodedLogsSocketId
  })

  browserRemoteLogger = createBrowserRemoteLogger({
    post: (payload) => postBrowserLogsRoute.run(ctx, payload)
  })
  browserRemoteLogger.installConsoleAndGlobalHandlers()
  log.debug('Browser remote logger initialized')

  loadProjectName()
  loadDashboardCounts()
  if (window.hideAppLoader) {
    window.hideAppLoader()
    log.debug('hideAppLoader called')
  }
  const bootReady = !!window.bootLoaderComplete
  log.debug('Boot loader state on mount', { bootLoaderComplete: bootReady })
  if (bootReady) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
  const bootLevel = (window as Window & { __BOOT__?: { logLevel?: string } }).__BOOT__?.logLevel
  log.debug('Boot logLevel from SSR', { bootLevel })
  if (typeof bootLevel === 'string') {
    const normalized = bootLevel.toLowerCase()
    if (LOG_LEVEL_VALUES.includes(normalized as (typeof LOG_LEVEL_VALUES)[number])) {
      logLevel.value = normalized as (typeof LOG_LEVEL_VALUES)[number]
    }
  }
  setLogSink((entry: LogEntry) => {
    if (entry.timestamp >= dashboardResetAt.value) {
      if (entry.severity <= 3) errorCount.value += 1
      else if (entry.severity === 4) warnCount.value += 1
    }
    logPanel.value?.pushEntry(entry)
    browserRemoteLogger!.pushSinkEntry(entry)
  })
  void setupLogsWebSocket()

  window.addEventListener('offline', onBrowserOffline)
  window.addEventListener('online', onBrowserOnline)
  document.addEventListener('visibilitychange', onVisibilityForLogsSocket)

  logPanel.value?.loadRecent()
})

onBeforeUnmount(() => {
  log.info('onBeforeUnmount: cleaning up listeners and timers')
  window.removeEventListener('offline', onBrowserOffline)
  window.removeEventListener('online', onBrowserOnline)
  document.removeEventListener('visibilitychange', onVisibilityForLogsSocket)
  detachLogsSocketLifecycle()
  if (logsSocketUnsubscribe) {
    logsSocketUnsubscribe()
    logsSocketUnsubscribe = null
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
  if (browserRemoteLogger) {
    browserRemoteLogger.teardown()
    browserRemoteLogger = null
  }
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
    const data = res as {
      success?: boolean
      errorCount?: number
      warnCount?: number
      resetAt?: number
      error?: string
    }
    if (
      data?.success &&
      typeof data.errorCount === 'number' &&
      typeof data.warnCount === 'number' &&
      typeof data.resetAt === 'number'
    ) {
      errorCount.value = data.errorCount
      warnCount.value = data.warnCount
      dashboardResetAt.value = data.resetAt
      log.debug('Счётчики дашборда загружены', {
        errorCount: data.errorCount,
        warnCount: data.warnCount,
        resetAt: data.resetAt
      })
    }
  } catch (e) {
    log.warning('Не удалось загрузить счётчики дашборда', e)
  }
}

const resetDashboard = async () => {
  try {
    const res = await resetDashboardRoute.run(ctx)
    const data = res as {
      success?: boolean
      errorCount?: number
      warnCount?: number
      resetAt?: number
      error?: string
    }
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

const openChatiumLink = () => {
  log.notice('Открытие ссылки Chatium')
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}

function detachLogsSocketLifecycle() {
  if (logsSocketLifecycleCleanup) {
    try {
      logsSocketLifecycleCleanup()
    } catch {
      /* ignore */
    }
    logsSocketLifecycleCleanup = null
  }
}

/**
 * Подписка на события жизненного цоля сокета (если платформа их отдаёт).
 * Без колбэков показываем OFFLINE только по offline/ошибке подключения и при ручном переподключении.
 */
function attachLogsSocketLifecycle(
  socketClient: unknown,
  subscription: unknown,
  onDisconnect: () => void
): (() => void) | null {
  const cleanups: Array<() => void> = []
  try {
    const sc = socketClient as Record<string, unknown>
    if (typeof sc.addConnectionListener === 'function') {
      const unsub = (sc.addConnectionListener as (fn: (connected: boolean) => void) => () => void)(
        (connected) => {
          if (!connected) onDisconnect()
        }
      )
      if (typeof unsub === 'function') cleanups.push(unsub)
    }
    const sub = subscription as Record<string, unknown>
    if (typeof sub.on === 'function') {
      const subOn = sub.on as (ev: string, fn: () => void) => void
      const handler = () => onDisconnect()
      for (const ev of ['disconnect', 'close'] as const) {
        try {
          subOn(ev, handler)
          if (typeof sub.off === 'function') {
            const subOff = sub.off as (ev: string, fn: () => void) => void
            cleanups.push(() => {
              try {
                subOff(ev, handler)
              } catch {
                /* ignore */
              }
            })
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  if (!cleanups.length) return null
  return () => {
    cleanups.forEach((fn) => {
      try {
        fn()
      } catch {
        /* ignore */
      }
    })
  }
}

async function setupLogsWebSocket() {
  log.info('setupLogsWebSocket entry')
  if (!props.encodedLogsSocketId) {
    logsWsConnected.value = false
    logsWsInitialized.value = true
    return
  }
  if (logsSocketUnsubscribe) {
    try {
      logsSocketUnsubscribe()
    } catch {
      /* ignore */
    }
    logsSocketUnsubscribe = null
  }
  detachLogsSocketLifecycle()
  try {
    const socketClient = await getOrCreateBrowserSocketClient()
    const logsSocketSubscription = socketClient.subscribeToData(props.encodedLogsSocketId)
    logsSocketLifecycleCleanup = attachLogsSocketLifecycle(
      socketClient,
      logsSocketSubscription,
      () => {
        logsWsConnected.value = false
      }
    )
    logsSocketUnsubscribe = logsSocketSubscription.listen(
      (data: { type?: string; data?: LogEntry }) => {
        if (data?.type === 'new-log' && data.data) {
          const entry = data.data as LogEntry
          if (entry.timestamp >= dashboardResetAt.value) {
            if (entry.severity <= 3) errorCount.value += 1
            else if (entry.severity === 4) warnCount.value += 1
          }
          logPanel.value?.pushEntry(entry)
        }
      }
    )
    logsWsConnected.value = true
  } catch (err) {
    logsWsConnected.value = false
    log.error('Не удалось подписаться на логи по WebSocket', err)
  } finally {
    logsWsInitialized.value = true
  }
}

function onBrowserOffline() {
  log.info('onBrowserOffline: WebSocket marked disconnected')
  logsWsConnected.value = false
}

function onBrowserOnline() {
  log.info('onBrowserOnline: reconnecting WebSocket')
  void setupLogsWebSocket()
}

function onVisibilityForLogsSocket() {
  if (document.visibilityState !== 'visible' || !props.encodedLogsSocketId) return
  if (!logsWsConnected.value) {
    log.info('onVisibilityForLogsSocket: tab visible, reconnecting')
    void setupLogsWebSocket()
  }
}
</script>

<template>
  <div class="app-layout flex flex-col w-full min-w-0">
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
      :panelUrl="props.panelUrl"
    />

    <main class="ap-wrap flex flex-col flex-1 relative z-10 min-h-0 w-full min-w-0 overflow-hidden">
      <div class="ap" :class="{ ready: bootLoaderDone }">
        <div class="ap-status">
          <div class="ap-status-left">
            <i class="fas fa-terminal ap-icon-muted"></i>
            <span class="ap-path">/web/admin</span>
            <span class="ap-separator">&#xB7;</span>
            <span class="ap-project-label">{{ projectName || '—' }}</span>
          </div>
          <div class="ap-status-right">
            <span class="ap-status-tag"
              ><i class="fas fa-layer-group ap-icon-muted"></i> LOG:
              {{ logLevel.toUpperCase() }}</span
            >
            <span
              class="ap-stream-pill"
              :class="{
                'ap-stream-pill--live': encodedLogsSocketOk && logsWsInitialized && logsWsConnected,
                'ap-stream-pill--offline':
                  encodedLogsSocketOk && logsWsInitialized && !logsWsConnected,
                'ap-stream-pill--pending': encodedLogsSocketOk && !logsWsInitialized,
                'ap-stream-pill--nosocket': !encodedLogsSocketOk,
                'ap-stream-pill--syncing': logsLoading
              }"
              role="status"
              :aria-label="streamPillAriaLabel"
            >
              <span class="ap-stream-pill__dot" aria-hidden="true"></span>
              <span class="ap-stream-pill__label">{{ streamPillLabel }}</span>
              <span v-if="logsLoading" class="ap-stream-pill__sync" title="Загрузка истории логов">
                <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
              </span>
            </span>
          </div>
          <div class="ap-status-sweep"></div>
        </div>

        <div class="ap-grid">
          <div class="ap-main content-wrapper">
            <section class="ap-card ap-card--stagger-1">
              <div class="ap-card-hd">
                <h2><i class="fas fa-chart-bar ap-icon-hd"></i> Счётчики</h2>
                <button type="button" class="ap-btn ap-btn--sm" @click="resetDashboard">
                  <i class="fas fa-redo-alt"></i> Сброс
                </button>
              </div>
              <div class="ap-meters">
                <div class="ap-meter ap-meter--err">
                  <div class="ap-meter-accent"></div>
                  <div class="ap-meter-body">
                    <strong>{{ errorCount }}</strong>
                    <span><i class="fas fa-times-circle"></i> Ошибки</span>
                  </div>
                </div>
                <div class="ap-meter ap-meter--wrn">
                  <div class="ap-meter-accent"></div>
                  <div class="ap-meter-body">
                    <strong>{{ warnCount }}</strong>
                    <span><i class="fas fa-exclamation-triangle"></i> Предупреждения</span>
                  </div>
                </div>
              </div>
            </section>

            <div class="ap-cfg-row">
              <section class="ap-card ap-card--stagger-2">
                <div class="ap-card-hd">
                  <h2><i class="fas fa-pen ap-icon-hd"></i> Название проекта</h2>
                  <span
                    v-if="projectNameSaveStatus"
                    class="ap-badge"
                    :class="projectNameSaveStatus === 'saved' ? 'ap-badge--ok' : 'ap-badge--err'"
                  >
                    <i
                      :class="projectNameSaveStatus === 'saved' ? 'fas fa-check' : 'fas fa-times'"
                    ></i>
                    {{ projectNameSaveStatus === 'saved' ? 'OK' : 'ERR' }}
                  </span>
                </div>
                <input
                  v-model="projectName"
                  type="text"
                  class="ap-input"
                  placeholder="Имя проекта"
                />
                <p v-if="projectNameError" class="ap-err">
                  <i class="fas fa-exclamation-circle"></i> {{ projectNameError }}
                </p>
              </section>

              <section class="ap-card ap-card--stagger-3">
                <div class="ap-card-hd">
                  <h2><i class="fas fa-sliders-h ap-icon-hd"></i> Уровень логирования</h2>
                  <span
                    v-if="logLevelSaveStatus"
                    class="ap-badge"
                    :class="logLevelSaveStatus === 'saved' ? 'ap-badge--ok' : 'ap-badge--err'"
                  >
                    <i
                      :class="logLevelSaveStatus === 'saved' ? 'fas fa-check' : 'fas fa-times'"
                    ></i>
                    {{ logLevelSaveStatus === 'saved' ? 'OK' : 'ERR' }}
                  </span>
                </div>
                <div class="ap-lvls">
                  <button
                    v-for="lvl in LOG_LEVEL_VALUES"
                    :key="lvl"
                    type="button"
                    class="ap-lvl"
                    :class="{ active: logLevel === lvl }"
                    @click="setLogLevel(lvl)"
                  >
                    {{ lvl.toUpperCase() }}
                  </button>
                </div>
                <p v-if="logLevelError" class="ap-err">
                  <i class="fas fa-exclamation-circle"></i> {{ logLevelError }}
                </p>
              </section>
            </div>

            <section class="ap-card ap-card--stagger-3 ap-settings">
              <div class="ap-card-hd">
                <h2><i class="fas fa-plug ap-icon-hd"></i> Настройки LifePay</h2>
                <span
                  v-if="lpSettingsMessage"
                  class="ap-badge"
                  :class="lpSettingsError ? 'ap-badge--err' : 'ap-badge--ok'"
                >
                  <i :class="lpSettingsError ? 'fas fa-times' : 'fas fa-check'"></i>
                  {{ lpSettingsError ? 'ERR' : 'OK' }}
                </span>
              </div>

              <form class="ap-set-form" @submit.prevent="saveLpSettings">
                <fieldset class="ap-set-grp">
                  <legend class="ap-set-legend"><i class="fas fa-key"></i> Авторизация</legend>
                  <p class="ap-hint">Учётные данные магазина для подписи API-вызовов к gateway.</p>
                  <div class="ap-set-fields">
                    <label class="ap-field">
                      <span class="ap-field-label">lp_apikey (API-ключ магазина)</span>
                      <input
                        v-model="lpSettings.lp_apikey"
                        type="password"
                        autocomplete="off"
                        class="ap-input"
                      />
                      <span class="ap-field-hint"
                        >Передаётся в заголовке <code>X-Lp-Apikey</code>.</span
                      >
                    </label>
                    <label class="ap-field">
                      <span class="ap-field-label">lp_login (телефон, 11 цифр, первая 7)</span>
                      <input
                        v-model="lpSettings.lp_login"
                        type="text"
                        placeholder="79991234567"
                        class="ap-input"
                      />
                      <span class="ap-field-hint"
                        >Передаётся в заголовке <code>X-Lp-Login</code>.</span
                      >
                    </label>
                  </div>
                </fieldset>

                <fieldset class="ap-set-grp">
                  <legend class="ap-set-legend"><i class="fas fa-bell"></i> Webhook</legend>
                  <p class="ap-hint">
                    Токен для аутентификации входящего webhook от LifePay (query
                    <code>?token=…</code>). Минимум 32 символа.
                  </p>
                  <div class="ap-set-fields">
                    <label class="ap-field ap-field-full">
                      <span class="ap-field-label">lp_webhook_token</span>
                      <div class="ap-field-row">
                        <input
                          v-model="lpSettings.lp_webhook_token"
                          type="password"
                          autocomplete="off"
                          class="ap-input"
                        />
                        <button type="button" class="ap-btn" @click="generateWebhookToken">
                          <i class="fas fa-bolt"></i> Сгенерировать
                        </button>
                      </div>
                    </label>
                  </div>
                </fieldset>

                <fieldset class="ap-set-grp">
                  <legend class="ap-set-legend"><i class="fas fa-server"></i> Gateway</legend>
                  <p class="ap-hint">
                    Публичный URL payments-gateway, через который выполняются все вызовы LifePay
                    API.
                  </p>
                  <div class="ap-set-fields">
                    <label class="ap-field ap-field-full">
                      <span class="ap-field-label">gateway_base_url</span>
                      <input
                        v-model="lpSettings.gateway_base_url"
                        type="text"
                        placeholder="https://.../p/saas/gw/lifepay"
                        class="ap-input"
                      />
                    </label>
                  </div>
                </fieldset>

                <div class="ap-save-bar">
                  <button
                    type="submit"
                    class="ap-btn ap-btn--primary"
                    :disabled="!hasUnsavedLpSettings || lpSettingsSaving"
                  >
                    <i class="fas fa-save"></i> {{ lpSettingsSaving ? 'Сохранение…' : 'Сохранить' }}
                  </button>
                  <span
                    v-if="hasUnsavedLpSettings"
                    class="ap-unsaved"
                    title="Есть несохранённые изменения"
                  >
                    <i class="fas fa-circle"></i> Не сохранено
                  </span>
                  <p
                    v-if="lpSettingsMessage"
                    class="ap-msg"
                    :class="lpSettingsError ? 'ap-msg--err' : 'ap-msg--ok'"
                  >
                    <i
                      class="fas"
                      :class="lpSettingsError ? 'fa-exclamation-circle' : 'fa-check-circle'"
                    ></i>
                    {{ lpSettingsMessage }}
                  </p>
                </div>
              </form>
            </section>
          </div>

          <aside class="ap-side">
            <LogStreamPanel ref="logPanel" :enable-expand-all="false" />
          </aside>
        </div>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
/* Высота окна: хедер и футер фиксированы; <main> без вертикального скролла — крутится левая колонка, правая (логи) по высоте ряда = окно минус хедер/футер/тулбар. */
.app-layout {
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  overflow: hidden;
  position: relative;
  width: 100%;
}

/* main: колонка на всю доступную высоту между шапкой и футером, без собственного scroll */
.ap-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.ap {
  --c-bg: rgba(12, 11, 14, 0.97);
  --c-bg2: rgba(16, 15, 19, 0.96);
  --c-bg-deep: rgba(8, 7, 10, 0.98);
  --c-bdr: rgba(50, 44, 54, 0.55);
  --c-bdr-hi: rgba(75, 62, 78, 0.6);
  --c-tx: #e0dcdf;
  --c-tx2: #a39da0;
  --c-tx3: #7e777b;
  --c-red: #c4213f;
  --c-red-s: #d95672;
  --c-red-glow: rgba(217, 86, 114, 0.35);
  --c-warn: #c9a660;
  --c-alert: #d97a8a;
  --c-ok: #6aaf7e;

  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0.75rem 1rem 1.5rem;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: 'Share Tech Mono', 'Courier New', monospace;
}

.ap.ready {
  opacity: 1;
  transform: none;
}
.ap,
.ap :deep(*) {
  box-sizing: border-box;
  border-radius: 0 !important;
  line-height: 1.45;
}

.ap-icon-muted {
  font-size: 0.65rem;
  opacity: 0.55;
}
.ap-icon-hd {
  font-size: 0.68rem;
  opacity: 0.6;
  margin-right: 0.15rem;
}

/* ── STATUS BAR ── */
.ap-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  margin-bottom: 0.85rem;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  font-size: 0.78rem;
  color: var(--c-tx2);
  position: relative;
  overflow: hidden;
}
.ap-status::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-red), transparent);
  opacity: 0.3;
}
.ap-status-sweep {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(217, 86, 114, 0.03), transparent);
  animation: ap-sweep 8s linear infinite;
  pointer-events: none;
}
@keyframes ap-sweep {
  0% {
    left: -50%;
  }
  100% {
    left: 150%;
  }
}
.ap-status-left,
.ap-status-right {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  position: relative;
  z-index: 1;
}
.ap-path {
  color: var(--c-red-s);
  letter-spacing: 0.04em;
  font-weight: 600;
}
.ap-separator {
  color: var(--c-tx3);
  opacity: 0.4;
}
.ap-project-label {
  color: var(--c-tx);
  letter-spacing: 0.02em;
}
.ap-status-tag {
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--c-bdr);
  background: rgba(16, 15, 19, 0.7);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--c-tx2);
}
/* Поток логов: фиксированная ширина подписи, отдельный индикатор загрузки — без скачков вёрстки */
.ap-stream-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 7.25rem;
  padding: 0.28rem 0.5rem 0.28rem 0.4rem;
  border: 1px solid var(--c-bdr);
  background: rgba(10, 9, 12, 0.85);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  flex-shrink: 0;
  box-sizing: border-box;
}
.ap-stream-pill__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  align-self: center;
  background: var(--c-tx3);
  box-shadow: none;
}
.ap-stream-pill__label {
  flex: 1 1 auto;
  min-width: 4.25rem;
  text-align: left;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  padding-top: 0.06em;
}
.ap-stream-pill__sync {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.85rem;
  font-size: 0.62rem;
  opacity: 0.85;
  color: var(--c-tx2);
}
.ap-stream-pill--live {
  color: var(--c-red-s);
  border-color: rgba(217, 86, 114, 0.35);
}
.ap-stream-pill--live .ap-stream-pill__dot {
  background: var(--c-red-s);
  box-shadow: 0 0 6px var(--c-red-glow);
  animation: ap-stream-dot-pulse 2.2s ease-in-out infinite;
}
.ap-stream-pill--offline {
  color: var(--c-tx3);
  border-color: rgba(80, 75, 82, 0.55);
}
.ap-stream-pill--offline .ap-stream-pill__dot {
  background: var(--c-tx3);
  animation: none;
}
.ap-stream-pill--nosocket {
  color: var(--c-tx3);
  border-color: var(--c-bdr);
}
.ap-stream-pill--nosocket .ap-stream-pill__dot {
  background: var(--c-tx3);
  opacity: 0.5;
  animation: none;
}
.ap-stream-pill--pending {
  color: var(--c-tx2);
  border-color: rgba(90, 82, 88, 0.45);
}
.ap-stream-pill--pending .ap-stream-pill__dot {
  background: rgba(217, 86, 114, 0.55);
  opacity: 1;
  animation: ap-stream-dot-pulse 1.4s ease-in-out infinite;
}
.ap-stream-pill--syncing.ap-stream-pill--live {
  border-color: rgba(217, 86, 114, 0.45);
}
@keyframes ap-stream-dot-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 6px var(--c-red-glow);
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    box-shadow: 0 0 2px rgba(217, 86, 114, 0.25);
    transform: scale(0.92);
  }
}

/* ── GRID: ровно оставшаяся высота main; левая колонка скроллится, правая (логи) тянется по высоте ряда и не уезжает при скролле слева ── */
.ap-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(360px, 440px);
  grid-template-rows: minmax(0, 1fr);
  gap: 0.85rem;
  align-items: stretch;
}
.ap-main {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

/* ── CARDS ── */
.ap-card {
  border: 1px solid var(--c-bdr);
  background: linear-gradient(175deg, var(--c-bg), var(--c-bg2));
  padding: 0.85rem 1rem;
  position: relative;
  transition: border-color 0.25s ease;
}
.ap-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 10%, var(--c-red) 50%, transparent 90%);
  opacity: 0.2;
}
.ap-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.012) 0px,
    rgba(0, 0, 0, 0.012) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  opacity: 0.4;
}
.ap-card:hover {
  border-color: var(--c-bdr-hi);
}
.ap-card--stagger-1 {
  animation: ap-card-enter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s both;
}
.ap-card--stagger-2 {
  animation: ap-card-enter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both;
}
.ap-card--stagger-3 {
  animation: ap-card-enter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both;
}
@keyframes ap-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.ap-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
  position: relative;
  z-index: 1;
}
.ap-card-hd h2 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-tx2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── METERS ── */
.ap-meters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  position: relative;
  z-index: 1;
}
.ap-meter {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  transition: border-color 0.25s ease;
}
.ap-meter-accent {
  width: 3px;
  flex-shrink: 0;
}
.ap-meter-body {
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.ap-meter strong {
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}
.ap-meter span {
  font-size: 0.66rem;
  color: var(--c-tx3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ap-meter span i {
  margin-right: 0.2rem;
}

.ap-meter--err .ap-meter-accent {
  background: var(--c-alert);
}
.ap-meter--err strong {
  color: var(--c-alert);
}
.ap-meter--err {
  border-color: rgba(217, 122, 138, 0.25);
}
.ap-meter--err:hover {
  border-color: rgba(217, 122, 138, 0.45);
}

.ap-meter--wrn .ap-meter-accent {
  background: var(--c-warn);
}
.ap-meter--wrn strong {
  color: var(--c-warn);
}
.ap-meter--wrn {
  border-color: rgba(201, 166, 96, 0.25);
}
.ap-meter--wrn:hover {
  border-color: rgba(201, 166, 96, 0.45);
}

/* ── CONFIG ── */
.ap-cfg-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.ap-input {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  color: var(--c-tx);
  font-family: inherit;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  z-index: 1;
}
.ap-input:focus {
  outline: none;
  border-color: var(--c-red-s);
  box-shadow: 0 0 0 1px rgba(217, 86, 114, 0.2);
}
.ap-input::placeholder {
  color: var(--c-tx3);
}

.ap-lvls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  position: relative;
  z-index: 1;
}
.ap-lvl {
  padding: 0.42rem;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  color: var(--c-tx2);
  font-family: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 2px,
    2px 2px,
    2px 0,
    calc(100% - 2px) 0,
    calc(100% - 2px) 2px,
    100% 2px,
    100% calc(100% - 2px),
    calc(100% - 2px) calc(100% - 2px),
    calc(100% - 2px) 100%,
    2px 100%,
    2px calc(100% - 2px),
    0 calc(100% - 2px)
  );
}
.ap-lvl::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--c-red);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}
.ap-lvl:hover {
  border-color: var(--c-bdr-hi);
  background: rgba(22, 20, 26, 0.98);
  color: var(--c-tx);
}
.ap-lvl:hover::after {
  transform: scaleX(1);
}
.ap-lvl.active {
  border-color: var(--c-red-s);
  background: rgba(196, 33, 63, 0.14);
  color: #fff;
}
.ap-lvl.active::after {
  transform: scaleX(1);
}

/* ── BUTTONS ── */
.ap-btn {
  padding: 0.42rem 0.8rem;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  color: var(--c-tx);
  font-family: inherit;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 2px,
    2px 2px,
    2px 0,
    calc(100% - 2px) 0,
    calc(100% - 2px) 2px,
    100% 2px,
    100% calc(100% - 2px),
    calc(100% - 2px) calc(100% - 2px),
    calc(100% - 2px) 100%,
    2px 100%,
    2px calc(100% - 2px),
    0 calc(100% - 2px)
  );
}
.ap-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04) 0px,
    rgba(0, 0, 0, 0.04) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}
.ap-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--c-red);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}
.ap-btn:hover {
  border-color: var(--c-bdr-hi);
  background: rgba(24, 22, 28, 0.98);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
}
.ap-btn:hover::after {
  transform: scaleX(1);
}
.ap-btn:active {
  transform: translateY(0);
  box-shadow: none;
}
.ap-btn i {
  font-size: 0.62rem;
}
.ap-btn--sm {
  padding: 0.28rem 0.55rem;
  font-size: 0.68rem;
}
.ap-btn--sm i {
  font-size: 0.58rem;
}
.ap-btn--danger {
  border-color: rgba(217, 122, 138, 0.3);
  color: #ecc8cf;
  background: rgba(45, 14, 22, 0.9);
}
.ap-btn--danger::after {
  background: var(--c-alert);
}
.ap-btn--danger:hover {
  border-color: rgba(217, 122, 138, 0.5);
  background: rgba(60, 20, 30, 0.95);
}

/* ── BADGES ── */
.ap-badge {
  font-size: 0.63rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid;
  font-weight: 700;
  letter-spacing: 0.06em;
  position: relative;
  z-index: 1;
  animation: ap-badge-flash 0.4s ease-out;
}
.ap-badge i {
  font-size: 0.55rem;
  margin-right: 0.1rem;
}
@keyframes ap-badge-flash {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  50% {
    transform: scale(1.04);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.ap-badge--ok {
  color: var(--c-ok);
  border-color: rgba(106, 175, 126, 0.4);
}
.ap-badge--err {
  color: var(--c-alert);
  border-color: rgba(217, 122, 138, 0.4);
}

.ap-err {
  margin: 0.4rem 0 0;
  color: var(--c-alert);
  font-size: 0.76rem;
  position: relative;
  z-index: 1;
}
.ap-err i {
  margin-right: 0.2rem;
  font-size: 0.65rem;
}

/* ── SETTINGS (LifePay) ── */
.ap-set-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  position: relative;
  z-index: 1;
}
.ap-set-grp {
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  padding: 0.7rem 0.85rem 0.85rem;
  margin: 0;
}
.ap-set-legend {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--c-tx2);
  padding: 0 0.4rem;
}
.ap-set-legend i {
  color: var(--c-red-s);
  margin-right: 0.3rem;
  font-size: 0.66rem;
}
.ap-hint {
  margin: 0 0 0.7rem;
  font-size: 0.72rem;
  color: var(--c-tx3);
  line-height: 1.5;
}
.ap-set-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem 0.85rem;
}
.ap-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.ap-field-full {
  grid-column: 1 / -1;
}
.ap-field-label {
  font-size: 0.72rem;
  color: var(--c-tx2);
  letter-spacing: 0.02em;
}
.ap-field-hint {
  font-size: 0.68rem;
  color: var(--c-tx3);
  line-height: 1.4;
}
.ap-field-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.ap-field-row .ap-input {
  flex: 1 1 auto;
}
.ap-field-row .ap-btn {
  flex-shrink: 0;
}
.ap-set-grp code,
.ap-field-hint code,
.ap-hint code {
  background: rgba(20, 18, 24, 0.9);
  border: 1px solid var(--c-bdr);
  padding: 0.02rem 0.28rem;
  font-size: 0.92em;
  color: var(--c-tx);
}

.ap-btn--primary {
  border-color: var(--c-red-s);
  color: #fff;
  background: rgba(196, 33, 63, 0.16);
}
.ap-btn--primary::after {
  background: var(--c-red-s);
}
.ap-btn--primary:hover {
  border-color: var(--c-red-s);
  background: rgba(196, 33, 63, 0.24);
}
.ap-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.ap-save-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.ap-unsaved {
  font-size: 0.72rem;
  color: var(--c-warn);
  letter-spacing: 0.03em;
}
.ap-unsaved i {
  font-size: 0.45rem;
  margin-right: 0.3rem;
  vertical-align: middle;
}
.ap-msg {
  margin: 0;
  font-size: 0.74rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.ap-msg i {
  font-size: 0.7rem;
}
.ap-msg--ok {
  color: var(--c-ok);
}
.ap-msg--err {
  color: var(--c-alert);
}

@media (max-width: 680px) {
  .ap-set-fields {
    grid-template-columns: 1fr;
  }
}

/* ── LOG MONITOR: высота = ячейка сетки (ровно ряд между шапкой страницы и футером); внутренний скролл — в LogStreamPanel ── */
.ap-side {
  min-width: 0;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 1100px) {
  .ap-wrap {
    overflow-y: auto;
  }
  .ap {
    flex: none;
    min-height: auto;
    overflow: visible;
  }
  .ap-grid {
    flex: none;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    min-height: auto;
    align-items: start;
  }
  .ap-main {
    overflow: visible;
  }
  .ap-side {
    overflow: visible;
  }
  .ap-side :deep(.lsp-card) {
    flex: none;
  }
  .ap-side :deep(.lsp-log-out) {
    min-height: 240px;
    max-height: 420px;
    flex: none;
  }
}
@media (max-width: 680px) {
  .ap {
    padding: 0.5rem 0.625rem 1rem;
  }
  .ap-cfg-row {
    grid-template-columns: 1fr;
  }
  .ap-meters {
    grid-template-columns: 1fr;
  }
  .ap-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }
  .ap-lvls {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
