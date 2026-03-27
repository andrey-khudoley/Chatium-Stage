<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import PomodoroToolsWorkspace from '../components/pomodoro/PomodoroToolsWorkspace.vue'
import { playPomodoroPhaseChangeSound } from '../lib/pomodoro-phase-sounds'
import { formatPomodoroSecondsDisplay as fmt } from '../lib/pomodoro-types'
import { computePomodoroStatsDayKeyLocal } from '../lib/pomodoro-stats-day'

type PomodoroState = {
  status: 'stopped' | 'running' | 'paused' | 'awaiting_continue'
  phase: 'work' | 'rest' | 'long_rest'
  currentTaskId: string
  phaseRemainingSec: number
  phaseEndsAtMs: number
  cyclesCompleted: number
  totalWorkSec: number
  totalRestSec: number
  totalSec: number
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
  cyclesUntilLongRest: number
  pauseAfterWork: boolean
  pauseAfterRest: boolean
  afterLongRest: 'auto' | 'pause' | 'overtime' | 'stop'
  autoStartRest: boolean
  autoStartNextCycle: boolean
  phaseChangeSound: number
  tasksCompletedToday: number
  updatedAtMs: number
}
type PersistedFocusTaskState = {
  version: 1
  taskId: string
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  /** Состояние с SSR (`web/timers/index.tsx`), чтобы не зависеть от первого клиентского fetch */
  initialPomodoroState?: PomodoroState | null
  initialServerNowMs?: number
  stateGetUrl: string
  controlUrl: string
  settingsSaveUrl: string
  assignTaskUrl: string
  getTasksUrl: string
  toolsFocusLogUrl: string
}>()

const state = ref<PomodoroState | null>(props.initialPomodoroState ?? null)
const localTick = ref(Date.now())
const saving = ref(false)
const pageError = ref('')
const settingsOpen = ref(false)
const actionPending = ref(false)
const latestAppliedServerNowMs = ref(0)
const actionSeq = ref(0)
const originalTitle = ref('')
const notificationPermission = ref<NotificationPermission>('default')
const hasVibration = ref(false)
const previousPhase = ref<'work' | 'rest' | 'long_rest' | null>(null)
const activeTool = ref<'pomodoro' | 'timer' | 'stopwatch'>('pomodoro')
const sharedSelectedTaskId = ref('')
const FOCUS_TASK_STORAGE_KEY = 'assistant:focus-clock-selected-task:v1'

const phaseLabels: Record<PomodoroState['phase'], string> = {
  work: 'Работа',
  rest: 'Отдых',
  long_rest: 'Длинный отдых'
}

const phaseEmoji = {
  work: '⚡',
  rest: '🌿',
  long_rest: '🌙'
}

async function readApiJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Сервер вернул не-JSON ответ')
  }
  return response.json() as Promise<T>
}

function formatFetchError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  if (msg.includes('Failed to fetch') || (error instanceof TypeError && msg === 'Failed to fetch')) {
    return 'Нет соединения с сервером. Проверьте сеть, VPN и блокировщики расширений.'
  }
  return msg
}

function pomodoroStatsDayKeyNow(): string {
  return computePomodoroStatsDayKeyLocal(localTick.value)
}

function pomodoroStateGetUrlWithDay(): string {
  const key = encodeURIComponent(pomodoroStatsDayKeyNow())
  return props.stateGetUrl.includes('?')
    ? `${props.stateGetUrl}&statsDayKey=${key}`
    : `${props.stateGetUrl}?statsDayKey=${key}`
}

async function refresh(opts?: { maxAttempts?: number }): Promise<void> {
  const maxAttempts = opts?.maxAttempts ?? 1
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 350 * attempt))
      }
      const r = await fetch(pomodoroStateGetUrlWithDay(), { credentials: 'include' })
      const j = await readApiJson<{ success?: boolean; state?: PomodoroState; serverNowMs?: number; error?: string }>(r)
      if (j.success && j.state) {
        applyIncomingState(j.state, j.serverNowMs ?? 0, 'poll', 0)
        pageError.value = ''
        return
      }
      pageError.value = j.error ?? 'Не удалось обновить состояние pomodoro'
      return
    } catch (error) {
      lastError = error
    }
  }
  if (state.value) {
    pageError.value = 'Не удалось синхронизировать с сервером. Показаны последние данные.'
  } else {
    pageError.value = formatFetchError(lastError)
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

function restoreSelectedTaskFromStorage(): void {
  try {
    const raw = window.localStorage.getItem(FOCUS_TASK_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedFocusTaskState
    if (parsed.version !== 1) return
    if (!parsed.taskId) return
    sharedSelectedTaskId.value = parsed.taskId
  } catch {
    // ignore broken localStorage data
  }
}

async function assignTaskToPomodoro(taskId: string): Promise<void> {
  const r = await fetch(props.assignTaskUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, statsDayKey: pomodoroStatsDayKeyNow() })
  })
  const j = await readApiJson<{ success?: boolean; error?: string }>(r)
  if (!j.success) throw new Error(j.error ?? 'Не удалось привязать задачу к Pomodoro')
}

async function onSharedTaskSelected(taskId: string): Promise<void> {
  if (!taskId) return
  sharedSelectedTaskId.value = taskId
  persistSelectedTaskToStorage(taskId)
  try {
    await assignTaskToPomodoro(taskId)
    await refresh({ maxAttempts: 2 })
  } catch (error) {
    pageError.value = formatFetchError(error)
  }
}

function onPomodoroTaskAssigned(taskId: string): void {
  sharedSelectedTaskId.value = taskId
  persistSelectedTaskToStorage(taskId)
  void refresh({ maxAttempts: 1 })
}

function applyIncomingState(nextState: PomodoroState, serverNowMs: number, source: 'poll' | 'action', incomingActionSeq: number): void {
  if (serverNowMs < latestAppliedServerNowMs.value) return
  if (serverNowMs === latestAppliedServerNowMs.value && source === 'poll' && incomingActionSeq <= actionSeq.value) return
  
  const oldPhase = state.value?.phase
  latestAppliedServerNowMs.value = serverNowMs
  if (source === 'action') actionSeq.value = Math.max(actionSeq.value, incomingActionSeq)
  state.value = nextState
  
  if (oldPhase && oldPhase !== nextState.phase) {
    previousPhase.value = oldPhase
    onPhaseChange(nextState.phase)
  }
}

async function control(action: 'start' | 'resume' | 'pause' | 'stop' | 'skip' | 'reset') {
  if (actionPending.value) return
  actionPending.value = true
  const localActionSeq = actionSeq.value + 1
  try {
    const r = await fetch(props.controlUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, statsDayKey: pomodoroStatsDayKeyNow() }),
    })
    const j = await readApiJson<{ success?: boolean; state?: PomodoroState; serverNowMs?: number; error?: string }>(r)
    if (j.success && j.state) {
      applyIncomingState(j.state, j.serverNowMs ?? 0, 'action', localActionSeq)
      pageError.value = ''
    } else {
      pageError.value = j.error ?? 'Не удалось выполнить действие'
    }
  } catch (error) {
    pageError.value = formatFetchError(error)
  } finally {
    actionPending.value = false
    await refresh({ maxAttempts: 1 })
  }
}

type PomodoroSettingsDraft = {
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
  cyclesUntilLongRest: number
  pauseAfterWork: boolean
  pauseAfterRest: boolean
  afterLongRest: 'auto' | 'pause' | 'overtime' | 'stop'
  autoStartRest: boolean
  autoStartNextCycle: boolean
  phaseChangeSound: number
  afterWorkAction: 'auto' | 'pause' | 'overtime'
  afterRestAction: 'auto' | 'pause' | 'overtime'
}

async function saveSettings(draft: PomodoroSettingsDraft) {
  saving.value = true
  try {
    const r = await fetch(props.settingsSaveUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workMinutes: draft.workMinutes,
        restMinutes: draft.restMinutes,
        longRestMinutes: draft.longRestMinutes,
        cyclesUntilLongRest: draft.cyclesUntilLongRest,
        pauseAfterWork: draft.pauseAfterWork,
        pauseAfterRest: draft.pauseAfterRest,
        afterLongRest: draft.afterLongRest,
        autoStartRest: draft.autoStartRest,
        autoStartNextCycle: draft.autoStartNextCycle,
        phaseChangeSound: draft.phaseChangeSound,
        statsDayKey: pomodoroStatsDayKeyNow()
      })
    })
    const j = await readApiJson<{ success?: boolean; state?: PomodoroState; serverNowMs?: number; error?: string }>(r)
    if (j.success && j.state) {
      applyIncomingState(j.state, j.serverNowMs ?? 0, 'action', actionSeq.value + 1)
      pageError.value = ''
      settingsOpen.value = false
      return
    }
    pageError.value = j.error ?? 'Не удалось сохранить настройки'
  } catch (error) {
    pageError.value = formatFetchError(error)
  } finally {
    saving.value = false
  }
}

function vibrate() {
  if (hasVibration.value && navigator.vibrate) {
    navigator.vibrate([200, 100, 200])
  }
}

function showNotification(title: string, body: string) {
  if (notificationPermission.value === 'granted' && 'Notification' in window) {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro'
    })
  }
}

function onPhaseChange(newPhase: 'work' | 'rest' | 'long_rest') {
  playPomodoroPhaseChangeSound(state.value?.phaseChangeSound ?? 3)
  vibrate()
  
  const phaseLabel = phaseLabels[newPhase]
  showNotification(`Pomodoro: ${phaseLabel}`, `Начинается фаза "${phaseLabel}"`)
}

function updateDocumentTitle() {
  if (!state.value) {
    document.title = originalTitle.value
    return
  }
  
  if (state.value.status === 'stopped') {
    document.title = originalTitle.value
    return
  }
  
  const phaseLabel = phaseLabels[state.value.phase]
  const emoji = phaseEmoji[state.value.phase]
  if (state.value.status === 'awaiting_continue') {
    document.title = `(+${fmt(overtimeSec.value)}) ${emoji} ${phaseLabel}`
    return
  }
  const time = fmt(remainSec.value)
  document.title = state.value.status === 'paused' ? `(Пауза) ${phaseLabel}` : `(${time}) ${emoji} ${phaseLabel}`
}

async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    notificationPermission.value = permission
  }
}

let timer: number | null = null
let poll: number | null = null
let focusHandler: (() => void) | null = null

function onVisibilityBack(): void {
  if (document.visibilityState === 'visible') void refresh({ maxAttempts: 1 })
}

onMounted(() => {
  originalTitle.value = document.title
  notificationPermission.value = 'Notification' in window ? Notification.permission : 'denied'
  hasVibration.value = 'vibrate' in navigator
  restoreSelectedTaskFromStorage()

  if (
    props.initialPomodoroState != null &&
    props.initialServerNowMs != null &&
    props.initialServerNowMs > 0
  ) {
    applyIncomingState(props.initialPomodoroState, props.initialServerNowMs, 'poll', 0)
    pageError.value = ''
  }

  void refresh({ maxAttempts: 3 })
  timer = window.setInterval(() => (localTick.value = Date.now()), 1000)
  poll = window.setInterval(() => void refresh({ maxAttempts: 1 }), 7000)
  focusHandler = () => void refresh({ maxAttempts: 1 })
  window.addEventListener('focus', focusHandler)
  document.addEventListener('visibilitychange', onVisibilityBack)
  
  void requestNotificationPermission()
})

onUnmounted(() => {
  document.title = originalTitle.value
  if (timer) clearInterval(timer)
  if (poll) clearInterval(poll)
  if (focusHandler) window.removeEventListener('focus', focusHandler)
  document.removeEventListener('visibilitychange', onVisibilityBack)
})

const overtimeSec = computed(() => {
  if (!state.value || state.value.status !== 'awaiting_continue') return 0
  return Math.max(0, Math.floor((localTick.value - state.value.phaseEndsAtMs) / 1000))
})

const remainSec = computed(() => {
  if (!state.value) return 0
  if (state.value.status === 'awaiting_continue') return 0
  if (state.value.status !== 'running') return state.value.phaseRemainingSec
  return Math.max(0, Math.floor((state.value.phaseEndsAtMs - localTick.value) / 1000))
})

watch([() => state.value?.status, () => state.value?.phase, remainSec, overtimeSec], () => {
  nextTick(() => updateDocumentTitle())
})

watch(
  () => state.value?.currentTaskId,
  (taskId) => {
    if (typeof taskId !== 'string') return
    sharedSelectedTaskId.value = taskId
    if (taskId) {
      persistSelectedTaskToStorage(taskId)
      return
    }
    clearSelectedTaskStorage()
  },
  { immediate: true }
)

watch(
  () => state.value?.status,
  (next, prev) => {
    if (prev === 'running' && next === 'awaiting_continue') {
      playPomodoroPhaseChangeSound(state.value?.phaseChangeSound ?? 3)
      vibrate()
      showNotification('Фаза завершена', 'Секундомер овертайма. Нажмите «Продолжить» для следующего этапа.')
    }
  }
)

const settingsModel = computed(() => {
  const fallback: PomodoroState = {
    status: 'stopped',
    phase: 'work',
    currentTaskId: '',
    phaseRemainingSec: 1500,
    phaseEndsAtMs: 0,
    cyclesCompleted: 0,
    totalWorkSec: 0,
    totalRestSec: 0,
    totalSec: 0,
    workMinutes: 25,
    restMinutes: 5,
    longRestMinutes: 20,
    cyclesUntilLongRest: 4,
    pauseAfterWork: false,
    pauseAfterRest: false,
    afterLongRest: 'pause',
    autoStartRest: false,
    autoStartNextCycle: false,
    phaseChangeSound: 3,
    tasksCompletedToday: 0,
    updatedAtMs: 0
  }
  const current = state.value ?? fallback
  return {
    workMinutes: current.workMinutes,
    restMinutes: current.restMinutes,
    longRestMinutes: current.longRestMinutes,
    cyclesUntilLongRest: current.cyclesUntilLongRest,
    pauseAfterWork: current.pauseAfterWork,
    pauseAfterRest: current.pauseAfterRest,
    afterLongRest: current.afterLongRest === 'stop' ? 'pause' : current.afterLongRest,
    autoStartRest: current.autoStartRest,
    autoStartNextCycle: current.autoStartNextCycle,
    phaseChangeSound: current.phaseChangeSound,
    afterWorkAction: current.autoStartRest ? 'auto' : current.pauseAfterWork ? 'pause' : 'overtime',
    afterRestAction: current.autoStartNextCycle ? 'auto' : current.pauseAfterRest ? 'pause' : 'overtime'
  }
})

const phaseTheme = computed(() => {
  if (!state.value) return 'default'
  return state.value.phase
})

</script>

<template>
  <div class="app-layout bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col" :class="`theme-${phaseTheme}`">
    <GlobalGlitch />
    <Header
      :projectTitle="props.projectTitle"
      :indexUrl="props.indexUrl"
      :profileUrl="props.profileUrl"
      :loginUrl="props.loginUrl"
      :isAuthenticated="props.isAuthenticated"
      :isAdmin="props.isAdmin"
      :adminUrl="props.adminUrl"
      :testsUrl="props.testsUrl"
      :enableToolClockWidget="true"
      :pomodoroStateGetUrl="props.stateGetUrl"
      :pomodoroControlUrl="props.controlUrl"
    />
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div v-if="state" class="content-inner pomodoro-shell">
        <p v-if="pageError" class="pomodoro-error">
          <i class="fa-solid fa-triangle-exclamation" /> {{ pageError }}
        </p>

        <PomodoroToolsWorkspace
          v-model:active-tool="activeTool"
          v-model:settings-open="settingsOpen"
          :state="state"
          :local-tick-ms="localTick"
          :shared-selected-task-id="sharedSelectedTaskId"
          :settings-model="settingsModel"
          :saving="saving"
          :action-pending="actionPending"
          :assign-task-url="props.assignTaskUrl"
          :get-tasks-url="props.getTasksUrl"
          :tools-focus-log-url="props.toolsFocusLogUrl"
          @control="control"
          @save-settings="saveSettings"
          @pomodoro-task-assigned="onPomodoroTaskAssigned"
          @shared-task-selected="onSharedTaskSelected"
        />
      </div>
      <div v-else class="content-inner pomodoro-shell">
        <div class="pomodoro-loading">
          <span class="loading-cursor">▮</span> Инициализация Pomodoro...
        </div>
        <p v-if="pageError" class="pomodoro-error">
          <i class="fa-solid fa-triangle-exclamation" /> {{ pageError }}
        </p>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  transition: background-color 0.6s ease, color 0.6s ease;
  background: transparent;
}

.app-layout.theme-work {
  --pomodoro-phase-color: #d3234b;
  --pomodoro-phase-glow: rgba(211, 35, 75, 0.2);
  --pomodoro-phase-glow-strong: rgba(211, 35, 75, 0.4);
}
.app-layout.theme-rest {
  --pomodoro-phase-color: #2f8f8f;
  --pomodoro-phase-glow: rgba(47, 143, 143, 0.2);
  --pomodoro-phase-glow-strong: rgba(47, 143, 143, 0.4);
}
.app-layout.theme-long_rest {
  --pomodoro-phase-color: #8566ff;
  --pomodoro-phase-glow: rgba(133, 102, 255, 0.2);
  --pomodoro-phase-glow-strong: rgba(133, 102, 255, 0.4);
}
.app-layout.theme-default {
  --pomodoro-phase-color: var(--color-accent);
  --pomodoro-phase-glow: rgba(211, 35, 75, 0.2);
  --pomodoro-phase-glow-strong: rgba(211, 35, 75, 0.4);
}

.content-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem 0 2rem;
}

.content-inner {
  width: 100%;
}

.pomodoro-shell {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pomodoro-error {
  margin: 0;
  padding: .5rem .75rem;
  color: #ff6b6b;
  font-size: .78rem;
  background: rgba(255, 107, 107, 0.06);
  border: 1px solid rgba(255, 107, 107, 0.15);
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.pomodoro-loading {
  color: var(--color-text-secondary);
  font-size: .85rem;
  text-transform: uppercase;
  letter-spacing: .1em;
  text-align: center;
  padding: 4rem 0;
}

.loading-cursor {
  color: var(--color-accent);
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .pomodoro-shell {
    padding: 1rem max(1rem, var(--app-safe-left, 0)) max(1rem, var(--app-safe-bottom, 0)) max(1rem, var(--app-safe-right, 0));
  }
}

</style>

<style>
/* CRT: phase bar, actions, pomo-btn — правила встроены в SFC: бандлер Chatium не подключает отдельные .css из import в script. */
.pomodoro-tool-error {
  margin: 0;
  padding: 0.5rem 0.75rem;
  color: #ff6b6b;
  font-size: 0.78rem;
  background: rgba(255, 107, 107, 0.06);
  border: 1px solid rgba(255, 107, 107, 0.15);
  clip-path: polygon(
    0 3px,
    3px 3px,
    3px 0,
    calc(100% - 3px) 0,
    calc(100% - 3px) 3px,
    100% 3px,
    100% calc(100% - 3px),
    calc(100% - 3px) calc(100% - 3px),
    calc(100% - 3px) 100%,
    3px 100%,
    3px calc(100% - 3px),
    0 calc(100% - 3px)
  );
}

.pomodoro-phase-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--color-border);
  clip-path: polygon(
    0 3px,
    3px 3px,
    3px 0,
    calc(100% - 3px) 0,
    calc(100% - 3px) 3px,
    100% 3px,
    100% calc(100% - 3px),
    calc(100% - 3px) calc(100% - 3px),
    calc(100% - 3px) 100%,
    3px 100%,
    3px calc(100% - 3px),
    0 calc(100% - 3px)
  );
}

.phase-indicator {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text);
  white-space: nowrap;
  justify-self: start;
}

.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 0;
  background: var(--pomodoro-phase-color);
  box-shadow: 0 0 6px var(--pomodoro-phase-glow-strong);
  animation: pomodoro-tool-dot-pulse 2s ease-in-out infinite;
}

@keyframes pomodoro-tool-dot-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 6px var(--pomodoro-phase-glow-strong);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 12px var(--pomodoro-phase-glow-strong);
  }
}

.cycle-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
  justify-self: center;
}

.cycle-dot {
  width: 6px;
  height: 6px;
  border: 1px solid var(--color-border-light);
  background: transparent;
  transition: all 0.3s ease;
}

.cycle-dot--filled {
  background: var(--pomodoro-phase-color);
  border-color: var(--pomodoro-phase-color);
  box-shadow: 0 0 4px var(--pomodoro-phase-glow);
}

.settings-trigger {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
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
  justify-self: end;
}

.settings-trigger:hover:not(:disabled) {
  border-color: var(--pomodoro-phase-color);
  color: var(--color-text);
  box-shadow: 0 0 8px var(--pomodoro-phase-glow);
}

.pomodoro-actions {
  width: 100%;
}

.pomodoro-actions__panel {
  display: grid;
  width: 100%;
  gap: 0.45rem;
  padding: 0.65rem 0.7rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--color-border);
  clip-path: polygon(
    0 3px,
    3px 3px,
    3px 0,
    calc(100% - 3px) 0,
    calc(100% - 3px) 3px,
    100% 3px,
    100% calc(100% - 3px),
    calc(100% - 3px) calc(100% - 3px),
    calc(100% - 3px) 100%,
    3px 100%,
    3px calc(100% - 3px),
    0 calc(100% - 3px)
  );
}

.pomodoro-actions__panel--n1 {
  grid-template-columns: minmax(0, 13rem);
  justify-content: center;
  margin-inline: auto;
}

.pomodoro-actions__panel--n2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pomo-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  min-width: 0;
  padding: 0.55rem 0.65rem;
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: inherit;
  line-height: 1.15;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
  min-height: 44px;
  box-sizing: border-box;
  overflow: hidden;
  clip-path: polygon(
    0 3px,
    3px 3px,
    3px 0,
    calc(100% - 3px) 0,
    calc(100% - 3px) 3px,
    100% 3px,
    100% calc(100% - 3px),
    calc(100% - 3px) calc(100% - 3px),
    calc(100% - 3px) 100%,
    3px 100%,
    3px calc(100% - 3px),
    0 calc(100% - 3px)
  );
}

.pomo-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.05) 0px,
    rgba(0, 0, 0, 0.05) 1px,
    transparent 1px,
    transparent 4px
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}

.pomo-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--pomodoro-phase-color);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
  z-index: 2;
}

.pomo-btn:focus {
  outline: none;
}

.pomo-btn:focus-visible {
  outline: 2px solid var(--pomodoro-phase-color);
  outline-offset: 2px;
}

.pomo-btn:hover:not(:disabled)::after {
  transform: scaleX(1);
}

.pomo-btn__icon,
.pomo-btn__label {
  position: relative;
  z-index: 1;
}

.pomo-btn__icon {
  font-size: 0.88rem;
  opacity: 0.92;
}

.pomo-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--pomodoro-phase-color) 55%, var(--color-border));
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 12px var(--pomodoro-phase-glow);
}

.pomo-btn:active:not(:disabled) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
}

.pomo-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.pomo-btn--primary {
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--pomodoro-phase-color) 92%, #000),
    var(--pomodoro-phase-color)
  );
  border-color: color-mix(in srgb, var(--pomodoro-phase-color) 70%, transparent);
  color: #fff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12) inset,
    0 2px 10px var(--pomodoro-phase-glow);
}

.pomo-btn--primary::before {
  opacity: 0.2;
}

.pomo-btn--primary:hover:not(:disabled) {
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.14) inset,
    0 4px 18px rgba(0, 0, 0, 0.28),
    0 0 22px var(--pomodoro-phase-glow-strong);
}

.pomo-btn--secondary {
  border-color: color-mix(in srgb, var(--pomodoro-phase-color) 45%, var(--color-border));
  background: color-mix(in srgb, var(--pomodoro-phase-color) 9%, rgba(255, 255, 255, 0.02));
  color: var(--color-text);
}

.pomo-btn--ghost {
  border-color: var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.pomo-btn--ghost:hover:not(:disabled) {
  color: var(--color-text);
}

.pomo-btn--danger {
  border-color: rgba(255, 107, 107, 0.35);
  background: transparent;
  color: #e8a0a0;
  font-weight: 600;
}

.pomo-btn--danger:hover:not(:disabled) {
  border-color: rgba(255, 120, 120, 0.65);
  color: #ffc9c9;
  box-shadow: 0 0 14px rgba(255, 107, 107, 0.12);
}

.pomo-btn--danger::after {
  background: #ff6b6b;
}

@media (max-width: 640px) {
  .pomodoro-actions__panel {
    gap: 0.4rem;
    padding: 0.55rem 0.55rem;
  }

  .pomo-btn {
    font-size: 0.82rem;
    padding: 0.5rem 0.45rem;
    min-height: 42px;
  }
}
</style>
