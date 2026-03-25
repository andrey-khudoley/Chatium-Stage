<template>
  <LogoutModal
    :visible="showLogoutModal"
    @confirm="confirmLogout"
    @cancel="cancelLogout"
  />
  <header class="header" :class="{ 'header-hidden': showLogoutModal }">
    <div class="container mx-auto px-4 max-w-6xl header-content">
      <div class="header-title-section">
        <a :href="props.indexUrl" class="header-logo-and-title">
          <div class="header-logo-link">
            <img 
              src="https://fs-thb03.getcourse.ru/fileservice/file/thumbnail/h/246c9167ba22ef571b50a2a795ee1186.png/s/300x/a/565681/sc/95" 
              alt="Логотип" 
              class="header-logo"
            />
          </div>
          <h1 class="header-title">{{ projectTitle }}</h1>
        </a>
      </div>
      <div class="header-right">
        <div class="header-clock-tools">
          <span
            ref="clockTriggerRef"
            class="header-clock"
            :class="{ 'header-clock--interactive': isToolClockWidgetEnabled && widgetMode !== 'clock' }"
            @click="onClockClick"
          >
            <i :class="clockIconClass"></i>
            <span class="clock-time">{{ headerClockDisplay }}</span>
            <template v-if="isToolClockWidgetEnabled && widgetMode !== 'clock'">
              <button type="button" class="header-tool-btn" :disabled="clockActionPending" @click.stop="handleToolStartPause">
                {{ startPauseLabel }}
              </button>
              <button type="button" class="header-tool-btn header-tool-btn--danger" :disabled="clockActionPending" @click.stop="handleToolReset">
                Сброс
              </button>
            </template>
          </span>
          <div v-if="isToolClockWidgetEnabled && showToolPicker" ref="toolPickerRef" class="header-tool-picker" role="group" aria-label="Выбор инструмента">
            <button
              type="button"
              class="header-tool-picker-btn"
              :class="{ 'header-tool-picker-btn--active': widgetMode === 'clock' }"
              :aria-pressed="widgetMode === 'clock'"
              title="Показать часы"
              @click="selectWidgetMode('clock')"
            >
              <i class="fas fa-clock" aria-hidden="true"></i>
              <span>Часы</span>
            </button>
            <button
              type="button"
              class="header-tool-picker-btn"
              :class="{ 'header-tool-picker-btn--active': widgetMode === 'pomodoro' }"
              :aria-pressed="widgetMode === 'pomodoro'"
              title="Показать помидор"
              @click="selectWidgetMode('pomodoro')"
            >
              <i class="fas fa-hourglass-half" aria-hidden="true"></i>
              <span>Помидор</span>
            </button>
            <button
              type="button"
              class="header-tool-picker-btn"
              :class="{ 'header-tool-picker-btn--active': widgetMode === 'timer' }"
              :aria-pressed="widgetMode === 'timer'"
              title="Показать таймер"
              @click="selectWidgetMode('timer')"
            >
              <i class="fas fa-stopwatch-20" aria-hidden="true"></i>
              <span>Таймер</span>
            </button>
            <button
              type="button"
              class="header-tool-picker-btn"
              :class="{ 'header-tool-picker-btn--active': widgetMode === 'stopwatch' }"
              :aria-pressed="widgetMode === 'stopwatch'"
              title="Показать секундомер"
              @click="selectWidgetMode('stopwatch')"
            >
              <i class="fas fa-stopwatch" aria-hidden="true"></i>
              <span>Секундомер</span>
            </button>
          </div>
        </div>
        <div class="header-actions">
        <a 
          v-if="props.isAdmin && props.adminUrl"
          :href="props.adminUrl" 
          class="header-action-btn"
          title="Настройки админа"
        >
          <i class="fas fa-cog"></i>
        </a>
        <a 
          v-if="props.testsUrl"
          :href="props.testsUrl" 
          class="header-action-btn"
          title="Тесты"
        >
          <i class="fas fa-flask"></i>
        </a>
        <button 
          @click="triggerGlitch"
          class="header-action-btn"
        >
          <i class="fas fa-window-minimize"></i>
        </button>
        <a 
          v-if="props.isAuthenticated"
          :href="props.profileUrl" 
          class="header-action-btn"
          title="Профиль пользователя"
        >
          <i class="fas fa-window-maximize"></i>
        </a>
        <a 
          v-else
          :href="props.loginUrl" 
          class="header-action-btn"
          title="Войти в систему"
        >
          <i class="fas fa-window-maximize"></i>
        </a>
        <button 
          @click="handleCloseClick"
          class="header-action-btn"
          title="Закрыть"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import LogoutModal from './LogoutModal.vue'
import { createComponentLogger } from '../shared/logger'
import { formatPomodoroSecondsDisplay } from '../lib/pomodoro-types'
import { computePomodoroStatsDayKeyLocal } from '../lib/pomodoro-stats-day'

const log = createComponentLogger('Header')
type HeaderTool = 'pomodoro' | 'timer' | 'stopwatch'
type HeaderWidgetMode = 'clock' | HeaderTool
type LocalClockStatus = 'stopped' | 'running' | 'paused'

const props = defineProps<{
  projectTitle: string
  pageName?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  enableToolClockWidget?: boolean
  pomodoroStateGetUrl?: string
  pomodoroControlUrl?: string
}>()

const isGlitching = ref(false)
const showLogoutModal = ref(false)
const currentTime = ref('')
const pomodoroStatus = ref<'stopped' | 'running' | 'paused' | 'awaiting_continue'>('stopped')
const pomodoroEndsAtMs = ref(0)
const pomodoroRemainingSec = ref(0)
const nowTick = ref(Date.now())
const widgetMode = ref<HeaderWidgetMode>('clock')
const showToolPicker = ref(false)
const clockActionPending = ref(false)
const timerStatus = ref<LocalClockStatus>('stopped')
const timerRemainingSec = ref(0)
const timerEndsAtMs = ref(0)
const stopwatchStatus = ref<LocalClockStatus>('stopped')
const stopwatchElapsedSec = ref(0)
const stopwatchStartedAtMs = ref(0)
const TIMER_SETTINGS_STORAGE_KEY = 'assistant:focus-clock-settings:timer'
const HEADER_WIDGET_STORAGE_KEY = 'assistant:header-clock-widget:v1'
const HEADER_WIDGET_STORAGE_VERSION = 1
const isInitialAutoModeResolved = ref(false)

type PersistedHeaderWidgetState = {
  version: number
  mode: HeaderWidgetMode
  timer: { status: LocalClockStatus; remainingSec: number; endsAtMs: number }
  stopwatch: { status: LocalClockStatus; elapsedSec: number; startedAtMs: number }
}
const pomodoroDisplaySec = computed(() => {
  if (pomodoroStatus.value === 'running') {
    return Math.max(0, Math.floor((pomodoroEndsAtMs.value - nowTick.value) / 1000))
  }
  if (pomodoroStatus.value === 'awaiting_continue') {
    return Math.max(0, Math.floor((nowTick.value - pomodoroEndsAtMs.value) / 1000))
  }
  return Math.max(0, pomodoroRemainingSec.value)
})
const pomodoroDisplay = computed(() => {
  const sec = pomodoroDisplaySec.value
  const s = formatPomodoroSecondsDisplay(sec)
  if (pomodoroStatus.value === 'awaiting_continue') return `+${s}`
  return s
})
const timerDisplaySec = computed(() => {
  if (timerStatus.value === 'running') {
    return Math.max(0, Math.floor((timerEndsAtMs.value - nowTick.value) / 1000))
  }
  return Math.max(0, timerRemainingSec.value)
})
const stopwatchDisplaySec = computed(() => {
  if (stopwatchStatus.value === 'running') {
    return Math.max(0, stopwatchElapsedSec.value + Math.floor((nowTick.value - stopwatchStartedAtMs.value) / 1000))
  }
  return Math.max(0, stopwatchElapsedSec.value)
})
const headerClockDisplay = computed(() => {
  if (widgetMode.value === 'clock') return currentTime.value
  if (widgetMode.value === 'pomodoro') return pomodoroDisplay.value
  if (widgetMode.value === 'timer') return formatPomodoroSecondsDisplay(timerDisplaySec.value)
  return formatPomodoroSecondsDisplay(stopwatchDisplaySec.value)
})
const clockIconClass = computed(() => {
  if (widgetMode.value === 'clock') return 'fas fa-clock'
  if (widgetMode.value === 'pomodoro') return 'fas fa-hourglass-half'
  if (widgetMode.value === 'timer') return 'fas fa-stopwatch-20'
  return 'fas fa-stopwatch'
})
const startPauseLabel = computed(() => {
  if (widgetMode.value === 'pomodoro') return pomodoroStatus.value === 'running' ? 'Пауза' : 'Запуск'
  if (widgetMode.value === 'timer') return timerStatus.value === 'running' ? 'Пауза' : 'Запуск'
  if (widgetMode.value === 'stopwatch') return stopwatchStatus.value === 'running' ? 'Пауза' : 'Запуск'
  return 'Запуск'
})
const isToolClockWidgetEnabled = computed(() => !!props.enableToolClockWidget)

// Функция для форматирования времени
const updateTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

let timeInterval: number | null = null
let pomodoroPollInterval: number | null = null
let nowTickInterval: number | null = null
let escHandler: ((e: KeyboardEvent) => void) | null = null
let outsideToolPickerClickHandler: ((e: MouseEvent) => void) | null = null
const toolPickerRef = ref<HTMLElement | null>(null)
const clockTriggerRef = ref<HTMLElement | null>(null)

const readApiJson = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Non-JSON response')
  }
  return response.json() as Promise<T>
}

function pomodoroStateGetUrlWithDay(base: string): string {
  const key = encodeURIComponent(computePomodoroStatsDayKeyLocal(Date.now()))
  return base.includes('?') ? `${base}&statsDayKey=${key}` : `${base}?statsDayKey=${key}`
}

const syncPomodoro = async () => {
  if (!props.pomodoroStateGetUrl) return
  try {
    const r = await fetch(pomodoroStateGetUrlWithDay(props.pomodoroStateGetUrl), { credentials: 'include' })
    const j = await readApiJson<{ success?: boolean; state?: { status: 'stopped' | 'running' | 'paused' | 'awaiting_continue'; phaseEndsAtMs: number; phaseRemainingSec: number } }>(r)
    if (!j.success || !j.state) return
    pomodoroStatus.value = j.state.status
    pomodoroEndsAtMs.value = j.state.phaseEndsAtMs
    pomodoroRemainingSec.value = j.state.phaseRemainingSec
    resolveInitialAutoMode()
  } catch (error) {
    log.warning('Pomodoro sync failed', { error: String(error) })
  } finally {
    if (!isInitialAutoModeResolved.value) {
      resolveInitialAutoMode()
      if (!isInitialAutoModeResolved.value) isInitialAutoModeResolved.value = true
    }
  }
}

function readTimerSettingsDurationSec(): number {
  try {
    const raw = window.localStorage.getItem(TIMER_SETTINGS_STORAGE_KEY)
    if (!raw) return 25 * 60
    const parsed = JSON.parse(raw) as { version?: number; minutes?: number; seconds?: number }
    const minutes = Math.max(0, Math.min(999, Math.floor(parsed.minutes ?? 25)))
    const seconds = Math.max(0, Math.min(59, Math.floor(parsed.seconds ?? 0)))
    return Math.max(1, minutes * 60 + seconds)
  } catch {
    return 25 * 60
  }
}

function onClockClick(): void {
  if (!isToolClockWidgetEnabled.value) return
  showToolPicker.value = !showToolPicker.value
}

function normalizeLocalClockStatus(raw: unknown): LocalClockStatus {
  if (raw === 'running' || raw === 'paused' || raw === 'stopped') return raw
  return 'stopped'
}

function persistHeaderWidgetState(): void {
  if (!isToolClockWidgetEnabled.value) return
  const payload: PersistedHeaderWidgetState = {
    version: HEADER_WIDGET_STORAGE_VERSION,
    mode: widgetMode.value,
    timer: {
      status: timerStatus.value,
      remainingSec: Math.max(0, Math.floor(timerRemainingSec.value)),
      endsAtMs: Math.max(0, Math.floor(timerEndsAtMs.value))
    },
    stopwatch: {
      status: stopwatchStatus.value,
      elapsedSec: Math.max(0, Math.floor(stopwatchElapsedSec.value)),
      startedAtMs: Math.max(0, Math.floor(stopwatchStartedAtMs.value))
    }
  }
  try {
    window.localStorage.setItem(HEADER_WIDGET_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage write errors
  }
}

function restoreHeaderWidgetState(): void {
  if (!isToolClockWidgetEnabled.value) return
  try {
    const raw = window.localStorage.getItem(HEADER_WIDGET_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedHeaderWidgetState
    if (parsed.version !== HEADER_WIDGET_STORAGE_VERSION) return
    widgetMode.value = parsed.mode

    timerStatus.value = normalizeLocalClockStatus(parsed.timer?.status)
    timerRemainingSec.value = Math.max(0, Math.floor(parsed.timer?.remainingSec ?? 0))
    timerEndsAtMs.value = Math.max(0, Math.floor(parsed.timer?.endsAtMs ?? 0))

    stopwatchStatus.value = normalizeLocalClockStatus(parsed.stopwatch?.status)
    stopwatchElapsedSec.value = Math.max(0, Math.floor(parsed.stopwatch?.elapsedSec ?? 0))
    stopwatchStartedAtMs.value = Math.max(0, Math.floor(parsed.stopwatch?.startedAtMs ?? 0))

    const ts = Date.now()
    if (timerStatus.value === 'running' && timerEndsAtMs.value > 0) {
      const remain = Math.max(0, Math.floor((timerEndsAtMs.value - ts) / 1000))
      if (remain <= 0) {
        timerStatus.value = 'stopped'
        timerRemainingSec.value = 0
        timerEndsAtMs.value = 0
      } else {
        timerRemainingSec.value = remain
      }
    }
    if (stopwatchStatus.value !== 'running') {
      stopwatchStartedAtMs.value = 0
    }
  } catch {
    // ignore broken localStorage data
  }
}

function resolveInitialAutoMode(): void {
  if (isInitialAutoModeResolved.value || !isToolClockWidgetEnabled.value) return
  if (pomodoroStatus.value === 'running' || pomodoroStatus.value === 'awaiting_continue') {
    widgetMode.value = 'pomodoro'
    isInitialAutoModeResolved.value = true
    persistHeaderWidgetState()
    return
  }
  if (timerStatus.value === 'running') {
    widgetMode.value = 'timer'
    isInitialAutoModeResolved.value = true
    persistHeaderWidgetState()
    return
  }
  if (stopwatchStatus.value === 'running') {
    widgetMode.value = 'stopwatch'
    isInitialAutoModeResolved.value = true
    persistHeaderWidgetState()
    return
  }
  if (!props.pomodoroStateGetUrl || !props.pomodoroControlUrl) {
    isInitialAutoModeResolved.value = true
  }
}

async function pauseOtherRunningTools(target: HeaderWidgetMode): Promise<void> {
  // Local timer
  if (target !== 'timer' && timerStatus.value === 'running') pauseTimer()
  // Local stopwatch
  if (target !== 'stopwatch' && stopwatchStatus.value === 'running') pauseStopwatch()
  // Pomodoro (server)
  if (target !== 'pomodoro' && pomodoroStatus.value === 'running') {
    await controlPomodoro('pause')
  }
}

function selectWidgetMode(mode: HeaderWidgetMode): void {
  if (!isToolClockWidgetEnabled.value) return
  widgetMode.value = mode
  showToolPicker.value = false
  persistHeaderWidgetState()
}

async function controlPomodoro(action: 'start' | 'resume' | 'pause' | 'reset'): Promise<void> {
  if (!props.pomodoroControlUrl) return
  try {
    const r = await fetch(props.pomodoroControlUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, statsDayKey: computePomodoroStatsDayKeyLocal(Date.now()) })
    })
    const j = await readApiJson<{ success?: boolean; state?: { status: 'stopped' | 'running' | 'paused' | 'awaiting_continue'; phaseEndsAtMs: number; phaseRemainingSec: number } }>(r)
    if (j.success && j.state) {
      pomodoroStatus.value = j.state.status
      pomodoroEndsAtMs.value = j.state.phaseEndsAtMs
      pomodoroRemainingSec.value = j.state.phaseRemainingSec
    }
  } catch (error) {
    log.warning('Pomodoro toggle failed', { error: String(error) })
  }
}

function startTimer(): void {
  void pauseOtherRunningTools('timer')
  const durationSec = readTimerSettingsDurationSec()
  timerRemainingSec.value = durationSec
  timerEndsAtMs.value = Date.now() + durationSec * 1000
  timerStatus.value = 'running'
  persistHeaderWidgetState()
}

function pauseTimer(): void {
  timerRemainingSec.value = timerDisplaySec.value
  timerEndsAtMs.value = 0
  timerStatus.value = 'paused'
  persistHeaderWidgetState()
}

function resumeTimer(): void {
  void pauseOtherRunningTools('timer')
  timerEndsAtMs.value = Date.now() + Math.max(1, timerRemainingSec.value) * 1000
  timerStatus.value = 'running'
  persistHeaderWidgetState()
}

function resetTimer(): void {
  timerStatus.value = 'stopped'
  timerEndsAtMs.value = 0
  timerRemainingSec.value = readTimerSettingsDurationSec()
  persistHeaderWidgetState()
}

function startStopwatch(): void {
  void pauseOtherRunningTools('stopwatch')
  stopwatchElapsedSec.value = 0
  stopwatchStartedAtMs.value = Date.now()
  stopwatchStatus.value = 'running'
  persistHeaderWidgetState()
}

function pauseStopwatch(): void {
  stopwatchElapsedSec.value = stopwatchDisplaySec.value
  stopwatchStartedAtMs.value = 0
  stopwatchStatus.value = 'paused'
  persistHeaderWidgetState()
}

function resumeStopwatch(): void {
  void pauseOtherRunningTools('stopwatch')
  stopwatchStartedAtMs.value = Date.now()
  stopwatchStatus.value = 'running'
  persistHeaderWidgetState()
}

function resetStopwatch(): void {
  stopwatchStatus.value = 'stopped'
  stopwatchElapsedSec.value = 0
  stopwatchStartedAtMs.value = 0
  persistHeaderWidgetState()
}

async function handleToolStartPause(): Promise<void> {
  if (clockActionPending.value) return
  if (widgetMode.value === 'pomodoro') {
    clockActionPending.value = true
    try {
      await pauseOtherRunningTools('pomodoro')
      if (pomodoroStatus.value === 'running') await controlPomodoro('pause')
      else if (pomodoroStatus.value === 'paused' || pomodoroStatus.value === 'awaiting_continue') await controlPomodoro('resume')
      else await controlPomodoro('start')
    } finally {
      clockActionPending.value = false
    }
    persistHeaderWidgetState()
    return
  }
  if (widgetMode.value === 'timer') {
    if (timerStatus.value === 'running') pauseTimer()
    else if (timerStatus.value === 'paused') resumeTimer()
    else startTimer()
    return
  }
  if (widgetMode.value === 'stopwatch') {
    if (stopwatchStatus.value === 'running') pauseStopwatch()
    else if (stopwatchStatus.value === 'paused') resumeStopwatch()
    else startStopwatch()
  }
}

async function handleToolReset(): Promise<void> {
  if (clockActionPending.value) return
  if (widgetMode.value === 'pomodoro') {
    clockActionPending.value = true
    try {
      await controlPomodoro('reset')
    } finally {
      clockActionPending.value = false
    }
    persistHeaderWidgetState()
    return
  }
  if (widgetMode.value === 'timer') {
    resetTimer()
    return
  }
  if (widgetMode.value === 'stopwatch') {
    resetStopwatch()
    return
  }
}

onMounted(() => {
  log.info('Component mounted, clock started')
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
  nowTick.value = Date.now()
  timerRemainingSec.value = readTimerSettingsDurationSec()
  restoreHeaderWidgetState()
  resolveInitialAutoMode()
  nowTickInterval = window.setInterval(() => {
    nowTick.value = Date.now()
    if (timerStatus.value === 'running' && timerDisplaySec.value <= 0) {
      timerStatus.value = 'stopped'
      timerRemainingSec.value = 0
      timerEndsAtMs.value = 0
      persistHeaderWidgetState()
    }
  }, 1000)
  if (props.isAuthenticated && props.pomodoroStateGetUrl && props.pomodoroControlUrl) {
    void syncPomodoro()
    pomodoroPollInterval = window.setInterval(() => { void syncPomodoro() }, 7000)
  }

  // Обработчик Esc для закрытия модального окна выхода
  escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showToolPicker.value) {
      showToolPicker.value = false
      return
    }
    if (e.key === 'Escape' && showLogoutModal.value) {
      cancelLogout()
    }
  }

  window.addEventListener('keydown', escHandler)
  outsideToolPickerClickHandler = (e: MouseEvent) => {
    if (!showToolPicker.value) return
    const target = e.target as Node | null
    if (!target) return
    const picker = toolPickerRef.value
    const trigger = clockTriggerRef.value
    if (picker?.contains(target) || trigger?.contains(target)) return
    showToolPicker.value = false
  }
  window.addEventListener('mousedown', outsideToolPickerClickHandler)
})

onUnmounted(() => {
  log.info('Component unmounted')
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (pomodoroPollInterval) clearInterval(pomodoroPollInterval)
  if (nowTickInterval) clearInterval(nowTickInterval)
  
  // Удаляем обработчик Esc при размонтировании
  if (escHandler) {
    window.removeEventListener('keydown', escHandler)
  }
  if (outsideToolPickerClickHandler) {
    window.removeEventListener('mousedown', outsideToolPickerClickHandler)
  }
})

const triggerGlitch = () => {
  if (isGlitching.value) return
  log.notice('Header glitch triggered')
  
  isGlitching.value = true
  
  // Добавляем глитч эффект ко всей странице
  const appLayout = document.querySelector('.app-layout')
  if (appLayout) {
    appLayout.classList.add('global-glitch-active')
    
    setTimeout(() => {
      appLayout.classList.remove('global-glitch-active')
      isGlitching.value = false
    }, 500)
  }
}

const handleCloseClick = () => {
  if (props.isAuthenticated) {
    log.notice('Logout modal opened')
    // Показываем модальное окно для авторизованных
    showLogoutModal.value = true
    // Скрываем весь контент страницы
    const appLayout = document.querySelector('.app-layout')
    const contentWrapper = document.querySelector('.content-wrapper')
    const footer = document.querySelector('.app-footer')
    
    if (appLayout) appLayout.classList.add('content-hidden')
    if (contentWrapper) contentWrapper.classList.add('hidden-for-modal')
    if (footer) footer.classList.add('hidden-for-modal')
  } else {
    log.debug('Close button clicked (guest), triggering glitch')
    // Глитч эффект для неавторизованных
    triggerGlitch()
  }
}

const confirmLogout = () => {
  log.critical('User confirmed logout')
  window.location.href = '/s/logout'
}

const cancelLogout = () => {
  log.info('Logout cancelled')
  showLogoutModal.value = false
  // Восстанавливаем видимость контента
  const appLayout = document.querySelector('.app-layout')
  const contentWrapper = document.querySelector('.content-wrapper')
  const footer = document.querySelector('.app-footer')
  
  if (appLayout) appLayout.classList.remove('content-hidden')
  if (contentWrapper) contentWrapper.classList.remove('hidden-for-modal')
  if (footer) footer.classList.remove('hidden-for-modal')
}
</script>

<style scoped>
.header {
  background: transparent;
  padding: 1.25rem 0;
  padding-top: calc(1.25rem + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 200;
  transition: all 0.25s ease;
}

.header-hidden {
  opacity: 0;
  pointer-events: none;
}

/* Скрытие контента при открытии модального окна */
.hidden-for-modal {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}

.content-hidden {
  transition: opacity 0.3s ease;
}

/* Terminal-style corner brackets for header */
.header::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  width: 20px;
  height: 20px;
  border-left: 2px solid rgba(211, 35, 75, 0.3);
  border-top: 2px solid rgba(211, 35, 75, 0.3);
  pointer-events: none;
}

.header::after {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-right: 2px solid rgba(211, 35, 75, 0.3);
  border-top: 2px solid rgba(211, 35, 75, 0.3);
  pointer-events: none;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  position: relative;
}

.header-logo-and-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  text-decoration: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* Анимация срабатывает только при ховере на сами элементы (логотип или заголовок) */
.header-logo-and-title:has(.header-logo:hover) .header-logo,
.header-logo-and-title:has(.header-logo:hover) .header-title,
.header-logo-and-title:has(.header-title:hover) .header-logo,
.header-logo-and-title:has(.header-title:hover) .header-title {
  animation: glitch-text 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

/* Основная анимация глитча с RGB-разделением */
@keyframes glitch-text {
  0%, 100% {
    transform: translate(0);
    filter: none;
  }
  10% {
    transform: translate(-1.5px, 0);
    filter: drop-shadow(1px 0 0 #ff00ff) drop-shadow(-1px 0 0 #00ffff);
  }
  20% {
    transform: translate(1.5px, 0);
    filter: drop-shadow(-1px 0 0 #ff00ff) drop-shadow(1px 0 0 #00ffff);
  }
  30% {
    transform: translate(-1px, 0);
    filter: drop-shadow(1.5px 0 0 #ff00ff) drop-shadow(-1.5px 0 0 #00ffff);
  }
  40% {
    transform: translate(1px, 0);
    filter: drop-shadow(-1.5px 0 0 #ff00ff) drop-shadow(1.5px 0 0 #00ffff);
  }
  50% {
    transform: translate(-1.5px, 0);
    filter: drop-shadow(1px 0 0 #ff00ff) drop-shadow(-1px 0 0 #00ffff);
  }
  60% {
    transform: translate(1.5px, 0);
    filter: drop-shadow(-1px 0 0 #ff00ff) drop-shadow(1px 0 0 #00ffff);
  }
  70% {
    transform: translate(-1px, 0);
    filter: drop-shadow(1px 0 0 #ff00ff) drop-shadow(-1px 0 0 #00ffff);
  }
  80% {
    transform: translate(1px, 0);
    filter: drop-shadow(-1.5px 0 0 #ff00ff) drop-shadow(1.5px 0 0 #00ffff);
  }
  90% {
    transform: translate(-0.5px, 0);
    filter: drop-shadow(0.5px 0 0 #ff00ff) drop-shadow(-0.5px 0 0 #00ffff);
  }
}

.header-logo-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

/* Легкие CRT scanlines для логотипа */
.header-logo-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08) 0px,
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.header-logo-and-title:hover .header-logo-link::before {
  opacity: 1;
  animation: scanline-flicker-subtle 4s linear infinite;
}

@keyframes scanline-flicker-subtle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.4; }
}

.header-logo {
  height: 2.5rem;
  width: auto;
  object-fit: contain;
  filter: brightness(0.98) contrast(1.05) drop-shadow(0 0 3px rgba(211, 35, 75, 0.15));
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.header-logo-and-title:hover .header-logo {
  filter: brightness(1.05) contrast(1.1) drop-shadow(0 0 6px rgba(211, 35, 75, 0.3));
  animation: logo-rgb-glitch 3s ease-in-out infinite;
}

/* Периодический тонкий RGB-глитч для логотипа */
@keyframes logo-rgb-glitch {
  0%, 85%, 100% {
    filter: brightness(1.05) contrast(1.1);
  }
  86% {
    filter: brightness(1.05) contrast(1.1) drop-shadow(1px 0 0 rgba(255, 0, 255, 0.4)) drop-shadow(-1px 0 0 rgba(0, 255, 255, 0.4));
  }
  87% {
    filter: brightness(1.05) contrast(1.1) drop-shadow(-1px 0 0 rgba(255, 0, 255, 0.4)) drop-shadow(1px 0 0 rgba(0, 255, 255, 0.4));
  }
  88% {
    filter: brightness(1.05) contrast(1.1);
  }
  91% {
    filter: brightness(1.05) contrast(1.1) drop-shadow(1px 0 0 rgba(255, 0, 255, 0.3)) drop-shadow(-1px 0 0 rgba(0, 255, 255, 0.3));
  }
  92% {
    filter: brightness(1.05) contrast(1.1);
  }
}

.header-title {
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.08em;
  text-shadow: 
    0 0 8px rgba(232, 232, 232, 0.25),
    0.5px 0 0 rgba(255, 0, 255, 0.08),
    -0.5px 0 0 rgba(0, 255, 255, 0.08);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Мерцающий курсор после текста - появляется при hover на логотип ИЛИ заголовок */
.header-title::after {
  content: '▮';
  margin-left: 0.25rem;
  opacity: 0;
  color: var(--color-accent);
  text-shadow: 0 0 8px rgba(211, 35, 75, 0.5);
  transition: opacity 0.3s ease;
}

.header-logo-and-title:hover .header-title::after {
  opacity: 1;
  animation: terminal-cursor-blink 1s step-end infinite;
}

@keyframes terminal-cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.header-clock {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-shadow: 0 0 4px rgba(160, 160, 160, 0.3);
  position: relative;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: all 0.25s ease;
  cursor: default;
  padding: 0.25rem 0.6rem 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  border-radius: 0;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: grayscale;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.4),
    0 0 6px rgba(160, 160, 160, 0.08);
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
}
.header-clock--interactive { cursor: pointer; }

.header-clock-tools {
  position: relative;
}

.header-clock i {
  font-size: 0.625rem;
  opacity: 0.7;
}

.clock-time {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
}

.header-tool-btn {
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  height: 1.35rem;
  padding: 0 0.38rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.header-tool-btn--danger {
  border-color: rgba(255, 107, 107, 0.35);
  color: #e8a0a0;
}

.header-tool-picker {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 320;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  align-items: stretch;
  width: min(11.5rem, calc(100vw - 1rem));
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  padding: 0.2rem;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.04),
    0 2px 7px rgba(0, 0, 0, 0.35);
}

.header-tool-picker-btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  height: 1.82rem;
  padding: 0 0.5rem;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  justify-content: flex-start;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.header-tool-picker-btn i {
  font-size: 0.64rem;
  opacity: 0.8;
}

.header-tool-picker-btn:hover {
  color: var(--color-text);
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.header-tool-picker-btn:focus-visible {
  outline: none;
  border-color: var(--color-accent);
}

.header-tool-picker-btn--active {
  color: var(--color-text);
  border-color: var(--color-accent);
  background: rgba(211, 35, 75, 0.16);
}

.header-tool-picker-btn--active i {
  opacity: 1;
}

.header-clock:hover {
  color: var(--color-text);
  border-color: var(--color-border-light);
  text-shadow: 0 0 6px rgba(232, 232, 232, 0.5);
  background: rgba(0, 0, 0, 0.4);
}

.header-clock:hover i {
  opacity: 1;
  animation: clock-icon-pulse 2s ease-in-out infinite;
}

@keyframes clock-icon-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}


.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.header-action-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: all 0.25s ease;
  color: var(--color-text);
  text-decoration: none;
  cursor: pointer;
  position: relative;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

/* CRT scanlines для кнопок хедера */
.header-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.12) 0px,
    rgba(0, 0, 0, 0.12) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 0;
}

.header-action-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  z-index: 2;
}

.header-action-btn i {
  transition: all 0.25s ease;
  position: relative;
  z-index: 2;
}

.header-action-btn:hover {
  border-color: var(--color-border-light);
  transform: translateY(-2px);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.header-action-btn:hover::after {
  transform: scaleX(1);
}

.header-action-btn:hover i.fa-times {
  transform: rotate(90deg) scale(1.1);
}

.header-action-btn:hover i.fa-window-maximize {
  transform: scale(1.15);
}

.header-action-btn:hover i.fa-window-minimize {
  transform: translateY(2px) scaleY(0.7);
}

.header-action-btn:hover i.fa-cog {
  transform: rotate(90deg);
}

.header-action-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.header-action-btn:active i {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .header {
    padding: 1rem 0;
    padding-top: calc(1rem + env(safe-area-inset-top, 0px));
  }

  .header-title {
    font-size: 1rem;
  }

  .header-clock {
    font-size: 0.8125rem;
    padding: 0.3rem 0.5rem;
    gap: 0.35rem;
  }

  .header-clock i {
    font-size: 0.6875rem;
  }

  .clock-time {
    font-size: 0.8125rem;
  }

  .header-action-btn {
    width: 1.875rem;
    height: 1.875rem;
    font-size: 0.8125rem;
  }
}

@media (max-width: 480px) {
  .header-clock {
    display: none;
  }
}

@media (max-width: 380px) {
  .header-title {
    white-space: normal;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 100%;
  }

  .header-logo-and-title {
    align-items: flex-start;
    gap: 0.65rem;
  }
}
</style>
