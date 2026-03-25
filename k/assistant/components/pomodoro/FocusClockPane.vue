<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import PomodoroTimerDial from './PomodoroTimerDial.vue'
import PomodoroTaskSelectDropdown from './PomodoroTaskSelectDropdown.vue'
import { formatPomodoroSecondsDisplay as fmt } from '../../lib/pomodoro-types'

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

let tickInterval: number | null = null
onMounted(() => {
  if (isTimer.value) resetDurationFromInputs()
  void loadTasks()
  tickInterval = window.setInterval(() => {
    nowMs.value = Date.now()
    if (status.value === 'running') totalSec.value += 1
    void finalizeTimerByEnd()
  }, 1000)
})

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval)
})
</script>

<template>
  <div class="focus-clock-shell">
    <p v-if="pageError" class="clock-error"><i class="fa-solid fa-triangle-exclamation" /> {{ pageError }}</p>

    <div class="clock-phase-bar">
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
      @select="selectedTaskId = $event"
    />

    <div class="clock-actions">
      <div class="clock-actions__panel" :class="status === 'stopped' ? 'clock-actions__panel--n1' : 'clock-actions__panel--n2'">
        <button v-if="status === 'stopped'" type="button" class="clock-btn clock-btn--primary" @click="startClock">
          <i class="fa-solid fa-play clock-btn__icon" aria-hidden="true" />
          <span class="clock-btn__label">Старт</span>
        </button>
        <template v-else-if="status === 'running'">
          <button type="button" class="clock-btn clock-btn--secondary" @click="pauseClock">
            <i class="fa-solid fa-pause clock-btn__icon" aria-hidden="true" />
            <span class="clock-btn__label">Пауза</span>
          </button>
          <button type="button" class="clock-btn clock-btn--danger" @click="resetClock">
            <i class="fa-solid fa-rotate-left clock-btn__icon" aria-hidden="true" />
            <span class="clock-btn__label">Сброс</span>
          </button>
        </template>
        <template v-else>
          <button type="button" class="clock-btn clock-btn--primary" @click="resumeClock">
            <i class="fa-solid fa-play clock-btn__icon" aria-hidden="true" />
            <span class="clock-btn__label">Продолжить</span>
          </button>
          <button type="button" class="clock-btn clock-btn--danger" @click="resetClock">
            <i class="fa-solid fa-rotate-left clock-btn__icon" aria-hidden="true" />
            <span class="clock-btn__label">Сброс</span>
          </button>
        </template>
      </div>
    </div>

    <div class="clock-stats">
      <div class="stat-cell">
        <span class="stat-cell__value">{{ sessionsCount }}</span>
        <span class="stat-cell__label"><i class="fa-solid fa-flag-checkered" /> Сессий</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell__value">{{ fmt(totalFocusSec) }}</span>
        <span class="stat-cell__label"><i class="fa-solid fa-bullseye" /> Фокус</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell__value">{{ fmt(totalSec) }}</span>
        <span class="stat-cell__label"><i class="fa-solid fa-clock" /> Всего</span>
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
        <button class="clock-btn" @click="settingsOpen = false">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus-clock-shell { width: 100%; max-width: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
.clock-error { margin: 0; padding: .5rem .75rem; color: #ff6b6b; font-size: .78rem; background: rgba(255,107,107,.06); border: 1px solid rgba(255,107,107,.15); }
.clock-phase-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: .75rem;
  padding: .5rem .75rem;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--color-border);
  clip-path: polygon(0 3px, 3px 3px, 3px 0, calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px));
}
.phase-indicator { display: flex; align-items: center; gap: .45rem; font-size: .78rem; text-transform: uppercase; letter-spacing: .1em; color: var(--color-text); white-space: nowrap; justify-self: start; }
.phase-dot {
  width: 8px;
  height: 8px;
  background: var(--pomodoro-phase-color, var(--color-accent));
  box-shadow: 0 0 6px var(--pomodoro-phase-glow-strong, var(--color-accent-light));
  animation: dot-pulse 2s ease-in-out infinite;
}
.cycle-dots { display: flex; align-items: center; gap: 5px; justify-content: center; justify-self: center; pointer-events: none; }
.cycle-dot { width: 6px; height: 6px; border: 1px solid var(--color-border-light); background: transparent; transition: all .3s ease; }
@keyframes dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--pomodoro-phase-glow-strong, var(--color-accent-light)); }
  50% { opacity: .7; box-shadow: 0 0 12px var(--pomodoro-phase-glow-strong, var(--color-accent-light)); }
}
.settings-trigger {
  width: 28px; height: 28px; border: 1px solid var(--color-border); background: rgba(255,255,255,.02); color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: .75rem; transition: all .2s ease;
  clip-path: polygon(0 2px, 2px 2px, 2px 0, calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px));
}
.settings-trigger:hover:not(:disabled) {
  border-color: var(--pomodoro-phase-color, var(--color-accent));
  color: var(--color-text);
  box-shadow: 0 0 8px var(--pomodoro-phase-glow, var(--color-accent-light));
}
.settings-trigger { justify-self: end; }
.stopwatch-dial-shell :deep(.dial-progress) { stroke-dashoffset: 565.4866776461628 !important; opacity: .45; filter: none; }
.clock-actions { width: 100%; }
.clock-actions__panel {
  display: grid; width: 100%; gap: .45rem; padding: .65rem .7rem; background: rgba(255,255,255,.02); border: 1px solid var(--color-border);
  clip-path: polygon(0 3px, 3px 3px, 3px 0, calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px));
}
.clock-actions__panel--n1 { grid-template-columns: minmax(0, 13rem); justify-content: center; margin-inline: auto; }
.clock-actions__panel--n2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.clock-btn {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: .45rem; width: 100%; min-width: 0; padding: .55rem .65rem; font-size: .7rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; font-family: inherit; line-height: 1.15; border: 1px solid var(--color-border); background: var(--color-bg-secondary); color: var(--color-text); cursor: pointer; transition: border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease; min-height: 44px; box-sizing: border-box; overflow: hidden;
  clip-path: polygon(0 3px, 3px 3px, 3px 0, calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px));
}
.clock-btn::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0px, rgba(0,0,0,.05) 1px, transparent 1px, transparent 4px); pointer-events: none; z-index: 0; opacity: .45; }
.clock-btn::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--color-accent); transform: scaleX(0); transform-origin: left; transition: transform .25s ease; z-index: 2; }
.clock-btn:hover:not(:disabled)::after { transform: scaleX(1); }
.clock-btn:focus { outline: none; }
.clock-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.clock-btn__icon, .clock-btn__label { position: relative; z-index: 1; }
.clock-btn__icon { font-size: .72rem; opacity: .92; }
.clock-btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--color-accent) 55%, var(--color-border)); box-shadow: 0 2px 8px rgba(0,0,0,.2), 0 0 12px var(--color-accent-light); }
.clock-btn:active:not(:disabled) { box-shadow: 0 1px 3px rgba(0,0,0,.28); }
.clock-btn:disabled { opacity: .42; cursor: not-allowed; }
.clock-btn--primary { background: linear-gradient(165deg, color-mix(in srgb, var(--color-accent) 92%, #000), var(--color-accent)); border-color: color-mix(in srgb, var(--color-accent) 70%, transparent); color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,.2); box-shadow: 0 1px 0 rgba(255,255,255,.12) inset, 0 2px 10px var(--color-accent-light); }
.clock-btn--primary::before { opacity: .2; }
.clock-btn--primary:hover:not(:disabled) { box-shadow: 0 1px 0 rgba(255,255,255,.14) inset, 0 4px 18px rgba(0,0,0,.28), 0 0 22px var(--color-accent-light); }
.clock-btn--secondary { border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border)); background: color-mix(in srgb, var(--color-accent) 9%, rgba(255,255,255,.02)); color: var(--color-text); }
.clock-btn--danger { border-color: rgba(255,107,107,.35); background: transparent; color: #e8a0a0; font-weight: 600; }
.clock-btn--danger:hover:not(:disabled) { border-color: rgba(255,120,120,.65); color: #ffc9c9; box-shadow: 0 0 14px rgba(255,107,107,.12); }
.clock-btn--danger::after { background: #ff6b6b; }
.clock-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
.stat-cell {
  border: 1px solid var(--color-border); background: rgba(255,255,255,.02); padding: .6rem .5rem; text-align: center; transition: all .3s ease; position: relative; overflow: hidden;
  clip-path: polygon(0 3px, 3px 3px, 3px 0, calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px));
}
.stat-cell::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, rgba(0,0,0,.04) 0px, rgba(0,0,0,.04) 1px, transparent 1px, transparent 3px); pointer-events: none; }
.stat-cell:hover { border-color: var(--color-border-light); background: rgba(255,255,255,.04); box-shadow: 0 0 8px var(--color-accent-light); }
.stat-cell__value { display: block; font-size: 1.2rem; font-weight: 600; font-family: 'Share Tech Mono', 'Courier New', monospace; color: var(--color-text); line-height: 1; margin-bottom: .35rem; }
.stat-cell__label { display: block; font-size: .65rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .08em; line-height: 1; }
.stat-cell__label i { font-size: .6rem; color: var(--color-accent); opacity: .7; }
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
@media (max-width: 640px) {
  .clock-actions__panel { gap: .4rem; padding: .55rem .55rem; }
  .clock-btn { font-size: .66rem; padding: .5rem .45rem; min-height: 42px; }
}
@media (max-width: 400px) { .clock-stats { grid-template-columns: 1fr; } }
</style>
