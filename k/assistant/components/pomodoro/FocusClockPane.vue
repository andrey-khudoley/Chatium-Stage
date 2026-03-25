<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import PomodoroTimerDial from './PomodoroTimerDial.vue'
import PomodoroTaskSelectDropdown from './PomodoroTaskSelectDropdown.vue'
import { formatPomodoroSecondsDisplay as fmt } from '../../lib/pomodoro-types'
import {
  buildFocusClockStatsPayload,
  readFocusClockStatsFromStorage,
  writeFocusClockStatsToStorage
} from '../../lib/focus-clock-local-stats'
import { computePomodoroStatsDayKeyLocal } from '../../lib/pomodoro-stats-day'

type FocusMode = 'timer' | 'stopwatch'
type ClockStatus = 'stopped' | 'running' | 'paused'
type TaskItem = {
  id: string
  title: string
  projectId: string
  projectName?: string
  clientName?: string
}

const props = defineProps<{
  mode: FocusMode
  focusLogUrl: string
  getTasksUrl: string
  selectedTaskId?: string
}>()
const emit = defineEmits<{
  (event: 'taskSelected', taskId: string): void
}>()

const nowMs = ref(Date.now())
const status = ref<ClockStatus>('stopped')
const selectedTaskId = ref('')
const focusEnabled = ref(true)
const pageError = ref('')
const settingsOpen = ref(false)
const tasks = ref<TaskItem[]>([])
const tasksLoading = ref(false)
const totalFocusSec = ref(0)
const totalSec = ref(0)
const sessionsCount = ref(0)
const segmentStartAtMs = ref(0)

const timerMin = ref(25)
const timerSec = ref(0)
const timerRemainingSec = ref(25 * 60)
const timerRunDurationSec = ref(25 * 60)
const timerEndsAtMs = ref(0)
const stopwatchElapsedSec = ref(0)
const stopwatchStartedAtMs = ref(0)
const statsDayKey = ref(computePomodoroStatsDayKeyLocal(Date.now()))

const TIMER_SETTINGS_STORAGE_VERSION = 1
const TIMER_SETTINGS_STORAGE_KEY = 'assistant:focus-clock-settings:timer'
const HEADER_WIDGET_STORAGE_KEY = 'assistant:header-clock-widget:v1'
const HEADER_WIDGET_STORAGE_VERSION = 1
const FOCUS_TASK_STORAGE_KEY = 'assistant:focus-clock-selected-task:v1'

type PersistedTimerSettings = {
  version: number
  minutes: number
  seconds: number
}

type PersistedHeaderWidgetState = {
  version: number
  mode: 'clock' | 'pomodoro' | 'timer' | 'stopwatch'
  timer?: { status?: ClockStatus; remainingSec?: number; endsAtMs?: number }
  stopwatch?: { status?: ClockStatus; elapsedSec?: number; startedAtMs?: number }
}
type PersistedFocusTaskState = {
  version: 1
  taskId: string
}

function loadPersistedStats(mode: FocusMode, dayKey: string): void {
  const parsed = readFocusClockStatsFromStorage(mode, dayKey)
  if (!parsed) return
  sessionsCount.value = Math.max(0, Math.floor(parsed.sessionsCount))
  totalFocusSec.value = Math.max(0, Math.floor(parsed.totalFocusSec))
  totalSec.value = Math.max(0, Math.floor(parsed.totalSec))
}

function restoreStatsForMode(mode: FocusMode): void {
  const dayKey = computePomodoroStatsDayKeyLocal(Date.now())
  statsDayKey.value = dayKey
  resetStats()
  loadPersistedStats(mode, dayKey)
  persistStats(mode, dayKey)
}

function persistStats(mode: FocusMode, dayKey: string): void {
  const payload = buildFocusClockStatsPayload(
    mode,
    dayKey,
    sessionsCount.value,
    totalFocusSec.value,
    totalSec.value
  )
  writeFocusClockStatsToStorage(mode, payload)
}

function resetStats(): void {
  sessionsCount.value = 0
  totalFocusSec.value = 0
  totalSec.value = 0
}

const isTimer = computed(() => props.mode === 'timer')
const modeTitle = computed(() => (props.mode === 'timer' ? 'Таймер' : 'Секундомер'))

const dialStatus = computed<'stopped' | 'running' | 'paused' | 'awaiting_continue'>(() => status.value)
const timerPhaseDurationSec = computed(() => Math.max(1, timerRunDurationSec.value))
const stopwatchDialRemainingSec = computed(() => 3600)
const stopwatchDialPhaseDurationSec = computed(() => 3600)
const displaySec = computed(() => {
  if (isTimer.value) {
    if (status.value === 'running') return Math.max(0, Math.floor((timerEndsAtMs.value - nowMs.value) / 1000))
    return Math.max(0, timerRemainingSec.value)
  }
  if (status.value === 'running') {
    return Math.max(0, stopwatchElapsedSec.value + Math.floor((nowMs.value - stopwatchStartedAtMs.value) / 1000))
  }
  return Math.max(0, stopwatchElapsedSec.value)
})
const statusLabel = computed(() => (status.value === 'running' ? 'Идёт' : status.value === 'paused' ? 'Пауза' : 'Остановлен'))
function normalizeTimerDuration(): number {
  const m = Math.max(0, Math.min(999, Math.floor(timerMin.value || 0)))
  const s = Math.max(0, Math.min(59, Math.floor(timerSec.value || 0)))
  timerMin.value = m
  timerSec.value = s
  return Math.max(1, m * 60 + s)
}

function resetDurationFromInputs(): void {
  timerRemainingSec.value = normalizeTimerDuration()
}

function persistTimerSettings(): void {
  if (!isTimer.value) return
  const payload: PersistedTimerSettings = {
    version: TIMER_SETTINGS_STORAGE_VERSION,
    minutes: Math.max(0, Math.min(999, Math.floor(timerMin.value || 0))),
    seconds: Math.max(0, Math.min(59, Math.floor(timerSec.value || 0)))
  }
  try {
    window.localStorage.setItem(TIMER_SETTINGS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage write errors
  }
}

function restoreTimerSettings(): void {
  if (!isTimer.value) return
  try {
    const raw = window.localStorage.getItem(TIMER_SETTINGS_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedTimerSettings
    if (parsed.version !== TIMER_SETTINGS_STORAGE_VERSION) return
    timerMin.value = Math.max(0, Math.min(999, Math.floor(parsed.minutes || 0)))
    timerSec.value = Math.max(0, Math.min(59, Math.floor(parsed.seconds || 0)))
  } catch {
    // ignore broken localStorage data
  }
}

function syncClockStateFromHeaderWidget(): void {
  try {
    const raw = window.localStorage.getItem(HEADER_WIDGET_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedHeaderWidgetState
    if (parsed.version !== HEADER_WIDGET_STORAGE_VERSION) return

    const now = Date.now()
    if (props.mode === 'timer') {
      const timer = parsed.timer
      if (!timer) return
      const headerStatus = timer.status
      if (headerStatus !== 'running' && headerStatus !== 'paused' && headerStatus !== 'stopped') return

      status.value = headerStatus
      timerRemainingSec.value = Math.max(0, Math.floor(timer.remainingSec ?? 0))
      timerEndsAtMs.value = Math.max(0, Math.floor(timer.endsAtMs ?? 0))

      if (status.value === 'running') {
        const remain = Math.max(0, Math.floor((timerEndsAtMs.value - now) / 1000))
        if (remain <= 0) {
          status.value = 'stopped'
          timerRemainingSec.value = 0
          timerEndsAtMs.value = 0
        } else {
          timerRemainingSec.value = remain
        }
      }
      if (status.value === 'stopped' && timerRemainingSec.value <= 0) {
        resetDurationFromInputs()
      }
      return
    }

    const stopwatch = parsed.stopwatch
    if (!stopwatch) return
    const headerStatus = stopwatch.status
    if (headerStatus !== 'running' && headerStatus !== 'paused' && headerStatus !== 'stopped') return

    status.value = headerStatus
    stopwatchElapsedSec.value = Math.max(0, Math.floor(stopwatch.elapsedSec ?? 0))
    stopwatchStartedAtMs.value = Math.max(0, Math.floor(stopwatch.startedAtMs ?? 0))
    if (status.value !== 'running') stopwatchStartedAtMs.value = 0
  } catch {
    // ignore broken localStorage data
  }
}

function persistClockStateToHeaderWidget(): void {
  try {
    const raw = window.localStorage.getItem(HEADER_WIDGET_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as PersistedHeaderWidgetState) : null
    const payload: PersistedHeaderWidgetState = {
      version: HEADER_WIDGET_STORAGE_VERSION,
      mode: props.mode,
      timer: {
        status: parsed?.timer?.status ?? 'stopped',
        remainingSec: Math.max(0, Math.floor(parsed?.timer?.remainingSec ?? 0)),
        endsAtMs: Math.max(0, Math.floor(parsed?.timer?.endsAtMs ?? 0))
      },
      stopwatch: {
        status: parsed?.stopwatch?.status ?? 'stopped',
        elapsedSec: Math.max(0, Math.floor(parsed?.stopwatch?.elapsedSec ?? 0)),
        startedAtMs: Math.max(0, Math.floor(parsed?.stopwatch?.startedAtMs ?? 0))
      }
    }

    if (props.mode === 'timer') {
      payload.timer = {
        status: status.value,
        remainingSec: Math.max(0, Math.floor(timerRemainingSec.value)),
        endsAtMs: Math.max(0, Math.floor(timerEndsAtMs.value))
      }
    } else {
      payload.stopwatch = {
        status: status.value,
        elapsedSec: Math.max(0, Math.floor(stopwatchElapsedSec.value)),
        startedAtMs: Math.max(0, Math.floor(stopwatchStartedAtMs.value))
      }
    }

    window.localStorage.setItem(HEADER_WIDGET_STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('assistant:header-clock-state-changed'))
  } catch {
    // ignore broken localStorage data
  }
}

function restoreSelectedTaskFromStorage(): void {
  try {
    const raw = window.localStorage.getItem(FOCUS_TASK_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedFocusTaskState
    if (parsed.version !== 1) return
    if (!parsed.taskId) return
    selectedTaskId.value = parsed.taskId
  } catch {
    // ignore broken localStorage data
  }
}

function persistSelectedTaskToStorage(taskId: string): void {
  if (!taskId) return
  const payload: PersistedFocusTaskState = { version: 1, taskId }
  try {
    window.localStorage.setItem(FOCUS_TASK_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage write errors
  }
}

function clearSelectedTaskStorage(): void {
  try {
    window.localStorage.removeItem(FOCUS_TASK_STORAGE_KEY)
  } catch {
    // ignore storage write errors
  }
}

function onTaskSelected(taskId: string): void {
  selectedTaskId.value = taskId
  persistSelectedTaskToStorage(taskId)
  emit('taskSelected', taskId)
}

async function readApiJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) throw new Error('Сервер вернул не-JSON ответ')
  return response.json() as Promise<T>
}

async function loadTasks(): Promise<void> {
  tasksLoading.value = true
  try {
    const response = await fetch(props.getTasksUrl, { credentials: 'include' })
    const json = await readApiJson<{ success?: boolean; tasks?: TaskItem[] }>(response)
    if (json.success && Array.isArray(json.tasks)) tasks.value = json.tasks
  } catch (error) {
    pageError.value = String(error)
  } finally {
    tasksLoading.value = false
  }
}

async function closeFocusSegment(endedAtMs: number): Promise<void> {
  if (!focusEnabled.value || segmentStartAtMs.value <= 0) return
  const startedAtMs = segmentStartAtMs.value
  segmentStartAtMs.value = 0
  if (endedAtMs <= startedAtMs) return
  const durationSec = Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000))
  if (durationSec <= 0) return
  const response = await fetch(props.focusLogUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: props.mode,
      startedAtMs,
      endedAtMs,
      taskId: selectedTaskId.value || null
    })
  })
  const json = await readApiJson<{ success?: boolean; error?: string }>(response)
  if (!json.success) throw new Error(json.error ?? 'Не удалось сохранить фокус')
  totalFocusSec.value += durationSec
}

function openFocusSegment(startedAtMs: number): void {
  if (focusEnabled.value) segmentStartAtMs.value = startedAtMs
}

function startClock(): void {
  pageError.value = ''
  const ts = Date.now()
  status.value = 'running'
  sessionsCount.value += 1
  if (isTimer.value) {
    const duration = normalizeTimerDuration()
    timerRunDurationSec.value = duration
    timerRemainingSec.value = duration
    timerEndsAtMs.value = ts + duration * 1000
  } else {
    stopwatchElapsedSec.value = 0
    stopwatchStartedAtMs.value = ts
  }
  openFocusSegment(ts)
  persistClockStateToHeaderWidget()
}

async function pauseClock(): Promise<void> {
  if (status.value !== 'running') return
  const ts = Date.now()
  if (isTimer.value) {
    timerRemainingSec.value = Math.max(0, Math.floor((timerEndsAtMs.value - ts) / 1000))
    timerEndsAtMs.value = 0
  } else {
    stopwatchElapsedSec.value = displaySec.value
    stopwatchStartedAtMs.value = 0
  }
  status.value = 'paused'
  try {
    await closeFocusSegment(ts)
  } catch (error) {
    pageError.value = String(error)
  }
  persistClockStateToHeaderWidget()
}

function resumeClock(): void {
  if (status.value !== 'paused') return
  const ts = Date.now()
  status.value = 'running'
  if (isTimer.value) {
    timerEndsAtMs.value = ts + Math.max(1, timerRemainingSec.value) * 1000
  } else {
    stopwatchStartedAtMs.value = ts
  }
  openFocusSegment(ts)
  persistClockStateToHeaderWidget()
}

async function resetClock(): Promise<void> {
  const ts = Date.now()
  if (status.value === 'running') {
    try {
      await closeFocusSegment(ts)
    } catch (error) {
      pageError.value = String(error)
    }
  }
  status.value = 'stopped'
  segmentStartAtMs.value = 0
  if (isTimer.value) {
    timerEndsAtMs.value = 0
    resetDurationFromInputs()
  } else {
    stopwatchElapsedSec.value = 0
    stopwatchStartedAtMs.value = 0
  }
  selectedTaskId.value = ''
  clearSelectedTaskStorage()
  persistClockStateToHeaderWidget()
}

async function finalizeTimerByEnd(): Promise<void> {
  if (!isTimer.value || status.value !== 'running') return
  if (displaySec.value > 0) return
  const ts = Date.now()
  status.value = 'stopped'
  timerRemainingSec.value = 0
  timerEndsAtMs.value = 0
  try {
    await closeFocusSegment(ts)
  } catch (error) {
    pageError.value = String(error)
  }
  persistClockStateToHeaderWidget()
}

watch(focusEnabled, async (next) => {
  if (status.value !== 'running') return
  const ts = Date.now()
  if (next) {
    segmentStartAtMs.value = ts
    return
  }
  try {
    await closeFocusSegment(ts)
  } catch (error) {
    pageError.value = String(error)
  }
})

watch(
  [sessionsCount, totalFocusSec, totalSec],
  () => {
    persistStats(props.mode, statsDayKey.value)
  },
  { flush: 'post' }
)

watch(
  () => props.mode,
  (nextMode, prevMode) => {
    if (prevMode) persistStats(prevMode, statsDayKey.value)
    restoreStatsForMode(nextMode)
    if (nextMode === 'timer') {
      restoreTimerSettings()
      resetDurationFromInputs()
    }
    syncClockStateFromHeaderWidget()
  }
)

watch([timerMin, timerSec], () => {
  persistTimerSettings()
})

watch(selectedTaskId, (taskId) => {
  if (!taskId) return
  persistSelectedTaskToStorage(taskId)
})

watch(
  () => props.selectedTaskId,
  (taskId) => {
    if (typeof taskId !== 'string') return
    selectedTaskId.value = taskId
  },
  { immediate: true }
)

let tickInterval: number | null = null
let clearTaskEventHandler: ((e: Event) => void) | null = null
let headerClockStateChangedHandler: ((e: Event) => void) | null = null
onMounted(() => {
  restoreStatsForMode(props.mode)
  if (isTimer.value) {
    restoreTimerSettings()
    resetDurationFromInputs()
  }
  if (props.selectedTaskId) {
    selectedTaskId.value = props.selectedTaskId
  } else {
    restoreSelectedTaskFromStorage()
  }
  syncClockStateFromHeaderWidget()
  void loadTasks()
  tickInterval = window.setInterval(() => {
    const tickNowMs = Date.now()
    nowMs.value = tickNowMs
    const nextDayKey = computePomodoroStatsDayKeyLocal(tickNowMs)
    if (nextDayKey !== statsDayKey.value) {
      statsDayKey.value = nextDayKey
      resetStats()
      persistStats(props.mode, nextDayKey)
    }
    if (status.value === 'running') totalSec.value += 1
    void finalizeTimerByEnd()
  }, 1000)
  clearTaskEventHandler = () => {
    selectedTaskId.value = ''
    clearSelectedTaskStorage()
  }
  window.addEventListener('assistant:focus-task-cleared', clearTaskEventHandler)
  headerClockStateChangedHandler = () => {
    syncClockStateFromHeaderWidget()
  }
  window.addEventListener('assistant:header-clock-state-changed', headerClockStateChangedHandler)
})

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval)
  if (clearTaskEventHandler) {
    window.removeEventListener('assistant:focus-task-cleared', clearTaskEventHandler)
  }
  if (headerClockStateChangedHandler) {
    window.removeEventListener('assistant:header-clock-state-changed', headerClockStateChangedHandler)
  }
  persistClockStateToHeaderWidget()
})
</script>

<template>
  <div class="focus-clock-shell">
    <p v-if="pageError" class="pomodoro-tool-error"><i class="fa-solid fa-triangle-exclamation" /> {{ pageError }}</p>

    <div class="pomodoro-phase-bar">
      <span class="phase-indicator"><span class="phase-dot"></span>{{ modeTitle }}</span>
      <span class="cycle-dots" aria-hidden="true">
        <span v-for="i in 4" :key="i" class="cycle-dot"></span>
      </span>
      <button class="settings-trigger" @click="settingsOpen = true"><i class="fa-solid fa-sliders" /></button>
    </div>

    <PomodoroTimerDial
      v-if="isTimer"
      phase="work"
      :remaining-sec="displaySec"
      :overtime-sec="0"
      :phase-duration-sec="timerPhaseDurationSec"
      :status="dialStatus"
      phase-label="Работа"
      :status-label="statusLabel"
      :time-label="fmt(displaySec)"
    />
    <div v-else class="stopwatch-dial-shell">
      <PomodoroTimerDial
        phase="work"
        :remaining-sec="stopwatchDialRemainingSec"
        :overtime-sec="0"
        :phase-duration-sec="stopwatchDialPhaseDurationSec"
        :status="dialStatus"
        phase-label="Секундомер"
        :status-label="statusLabel"
        :time-label="fmt(displaySec)"
      />
    </div>

    <PomodoroTaskSelectDropdown
      :tasks="tasks"
      :selected-task-id="selectedTaskId"
      :loading="tasksLoading"
      @select="onTaskSelected"
    />

    <div class="pomodoro-actions">
      <div class="pomodoro-actions__panel" :class="status === 'stopped' ? 'pomodoro-actions__panel--n1' : 'pomodoro-actions__panel--n2'">
        <button v-if="status === 'stopped'" type="button" class="pomo-btn pomo-btn--primary" @click="startClock">
          <i class="fa-solid fa-play pomo-btn__icon" aria-hidden="true" />
          <span class="pomo-btn__label">Старт</span>
        </button>
        <template v-else-if="status === 'running'">
          <button type="button" class="pomo-btn pomo-btn--secondary" @click="pauseClock">
            <i class="fa-solid fa-pause pomo-btn__icon" aria-hidden="true" />
            <span class="pomo-btn__label">Пауза</span>
          </button>
          <button type="button" class="pomo-btn pomo-btn--danger" @click="resetClock">
            <i class="fa-solid fa-rotate-left pomo-btn__icon" aria-hidden="true" />
            <span class="pomo-btn__label">Сброс</span>
          </button>
        </template>
        <template v-else>
          <button type="button" class="pomo-btn pomo-btn--primary" @click="resumeClock">
            <i class="fa-solid fa-play pomo-btn__icon" aria-hidden="true" />
            <span class="pomo-btn__label">Продолжить</span>
          </button>
          <button type="button" class="pomo-btn pomo-btn--danger" @click="resetClock">
            <i class="fa-solid fa-rotate-left pomo-btn__icon" aria-hidden="true" />
            <span class="pomo-btn__label">Сброс</span>
          </button>
        </template>
      </div>
    </div>
  </div>

  <div v-if="settingsOpen" class="clock-settings-backdrop" @click.self="settingsOpen = false">
    <div class="clock-settings-modal">
      <h3 class="clock-settings-title">Настройки / {{ modeTitle }}</h3>
      <div class="clock-settings-row">
        <label class="focus-toggle">
          <input v-model="focusEnabled" type="checkbox" />
          <span>Фокус (писать в рабочее время)</span>
        </label>
      </div>
      <div v-if="isTimer" class="clock-settings-row clock-settings-grid">
        <label>Минуты<input v-model.number="timerMin" type="number" min="0" max="999" :disabled="status !== 'stopped'" /></label>
        <label>Секунды<input v-model.number="timerSec" type="number" min="0" max="59" :disabled="status !== 'stopped'" /></label>
      </div>
      <p class="clock-settings-hint">В режиме фокуса интервалы пишутся в общий журнал фокуса и попадут в аналитику рабочего времени.</p>
      <div class="clock-settings-actions">
        <button type="button" class="pomo-btn" @click="settingsOpen = false">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus-clock-shell { width: 100%; max-width: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
.stopwatch-dial-shell :deep(.dial-progress) { stroke-dashoffset: 565.4866776461628 !important; opacity: .45; filter: none; }
.clock-settings-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; z-index: 300000; padding: 1rem; }
.clock-settings-modal { width: min(30rem, 100%); background: var(--color-bg-secondary); border: 1px solid var(--color-border-light); padding: 1rem; display: flex; flex-direction: column; gap: .8rem; }
.clock-settings-title { margin: 0; font-size: .82rem; text-transform: uppercase; letter-spacing: .1em; color: var(--color-text); }
.clock-settings-row { display: flex; flex-direction: column; gap: .4rem; }
.clock-settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
.clock-settings-grid label { display: flex; flex-direction: column; gap: .2rem; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-secondary); }
.clock-settings-grid input { border: 1px solid var(--color-border); background: var(--color-bg-tertiary); color: var(--color-text); padding: .45rem .5rem; font-family: inherit; }
.focus-toggle { display: inline-flex; align-items: center; gap: .35rem; font-size: .75rem; color: var(--color-text-secondary); }
.clock-settings-hint { margin: 0; font-size: .74rem; color: var(--color-text-secondary); line-height: 1.45; }
.clock-settings-actions { display: flex; justify-content: flex-end; }
</style>
