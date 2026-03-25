<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import PomodoroTimerDial from '../components/pomodoro/PomodoroTimerDial.vue'
import PomodoroSettingsModal from '../components/pomodoro/PomodoroSettingsModal.vue'
import PomodoroTaskSelector from '../components/pomodoro/PomodoroTaskSelector.vue'
import FocusClockPane from '../components/pomodoro/FocusClockPane.vue'
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

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  stateGetUrl: string
  controlUrl: string
  settingsSaveUrl: string
  assignTaskUrl: string
  getTasksUrl: string
  toolsFocusLogUrl: string
}>()

const state = ref<PomodoroState | null>(null)
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

function pomodoroStatsDayKeyNow(): string {
  return computePomodoroStatsDayKeyLocal(localTick.value)
}

function pomodoroStateGetUrlWithDay(): string {
  const key = encodeURIComponent(pomodoroStatsDayKeyNow())
  return props.stateGetUrl.includes('?')
    ? `${props.stateGetUrl}&statsDayKey=${key}`
    : `${props.stateGetUrl}?statsDayKey=${key}`
}

async function refresh() {
  try {
    const r = await fetch(pomodoroStateGetUrlWithDay(), { credentials: 'include' })
    const j = await readApiJson<{ success?: boolean; state?: PomodoroState; serverNowMs?: number; error?: string }>(r)
    if (j.success && j.state) {
      applyIncomingState(j.state, j.serverNowMs ?? 0, 'poll', 0)
      pageError.value = ''
      return
    }
    pageError.value = j.error ?? 'Не удалось обновить состояние pomodoro'
  } catch (error) {
    pageError.value = String(error)
  }
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
    pageError.value = String(error)
  } finally {
    actionPending.value = false
    await refresh()
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
    pageError.value = String(error)
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
  if (document.visibilityState === 'visible') void refresh()
}

onMounted(() => {
  originalTitle.value = document.title
  notificationPermission.value = 'Notification' in window ? Notification.permission : 'denied'
  hasVibration.value = 'vibrate' in navigator
  
  void refresh()
  timer = window.setInterval(() => (localTick.value = Date.now()), 1000)
  poll = window.setInterval(() => void refresh(), 7000)
  focusHandler = () => void refresh()
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

const displayTimeLabel = computed(() => {
  if (state.value?.status === 'awaiting_continue') return `+${fmt(overtimeSec.value)}`
  return fmt(remainSec.value)
})

const phaseDurationSec = computed(() => {
  if (!state.value) return 1
  if (state.value.phase === 'work') return state.value.workMinutes * 60
  if (state.value.phase === 'rest') return state.value.restMinutes * 60
  return state.value.longRestMinutes * 60
})

watch([() => state.value?.status, () => state.value?.phase, remainSec, overtimeSec], () => {
  nextTick(() => updateDocumentTitle())
})

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

const statusLabel = computed(() => {
  if (!state.value) return 'Загрузка'
  if (state.value.status === 'running') return 'Идёт'
  if (state.value.status === 'awaiting_continue') return 'Овертайм'
  if (state.value.status === 'paused') return 'Пауза'
  return 'Остановлен'
})

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

const cycleDotsTotal = computed(() => state.value?.cyclesUntilLongRest ?? 4)
const cycleDotsCompleted = computed(() => state.value?.cyclesCompleted ?? 0)

/** Сколько кнопок в панели — для ровной сетки без «осиротевших» строк */
const pomodoroActionPanelLayout = computed(() => {
  if (!state.value) return 'pomodoro-actions__panel--n1'
  const s = state.value.status
  if (s === 'stopped') return 'pomodoro-actions__panel--n1'
  return 'pomodoro-actions__panel--n2'
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

        <div class="tool-tabs">
          <button type="button" class="tool-tab-btn" :class="{ 'tool-tab-btn--active': activeTool === 'pomodoro' }" @click="activeTool = 'pomodoro'">Pomodoro</button>
          <button type="button" class="tool-tab-btn" :class="{ 'tool-tab-btn--active': activeTool === 'timer' }" @click="activeTool = 'timer'">Таймер</button>
          <button type="button" class="tool-tab-btn" :class="{ 'tool-tab-btn--active': activeTool === 'stopwatch' }" @click="activeTool = 'stopwatch'">Секундомер</button>
        </div>

        <div v-if="activeTool === 'pomodoro'" class="pomodoro-phase-bar">
          <span class="phase-indicator">
            <span class="phase-dot" :class="`phase-dot--${state.phase}`"></span>
            {{ phaseLabels[state.phase] }}
          </span>
          <span class="cycle-dots">
            <span
              v-for="i in cycleDotsTotal"
              :key="i"
              class="cycle-dot"
              :class="{ 'cycle-dot--filled': i <= cycleDotsCompleted }"
            ></span>
          </span>
          <button class="settings-trigger" :disabled="saving" @click="settingsOpen = true">
            <i class="fa-solid fa-sliders" />
          </button>
        </div>

        <transition v-if="activeTool === 'pomodoro'" name="fade" mode="out-in">
          <PomodoroTimerDial
            :key="state.phase"
            :phase="state.phase"
            :remaining-sec="remainSec"
            :overtime-sec="overtimeSec"
            :phase-duration-sec="phaseDurationSec"
            :status="state.status"
            :phase-label="phaseLabels[state.phase]"
            :status-label="statusLabel"
            :time-label="displayTimeLabel"
          />
        </transition>

        <PomodoroTaskSelector
          v-if="activeTool === 'pomodoro'"
          :assign-task-url="props.assignTaskUrl"
          :get-tasks-url="props.getTasksUrl"
          :current-task-id="state.currentTaskId"
          :stats-day-key="pomodoroStatsDayKeyNow()"
          @task-assigned="refresh"
        />

        <div v-if="activeTool === 'pomodoro'" class="pomodoro-actions">
          <div class="pomodoro-actions__panel" :class="pomodoroActionPanelLayout">
            <button
              v-if="state.status === 'stopped'"
              type="button"
              class="pomo-btn pomo-btn--primary"
              :disabled="actionPending"
              @click="control('start')"
            >
              <i class="fa-solid fa-play pomo-btn__icon" aria-hidden="true" />
              <span class="pomo-btn__label">Старт</span>
            </button>

            <template v-if="state.status === 'running'">
              <button
                type="button"
                class="pomo-btn pomo-btn--secondary"
                :disabled="actionPending"
                @click="control('pause')"
              >
                <i class="fa-solid fa-pause pomo-btn__icon" aria-hidden="true" />
                <span class="pomo-btn__label">Пауза</span>
              </button>
              <button
                type="button"
                class="pomo-btn pomo-btn--ghost"
                :disabled="actionPending"
                @click="control('skip')"
              >
                <i class="fa-solid fa-forward pomo-btn__icon" aria-hidden="true" />
                <span class="pomo-btn__label">Пропустить</span>
              </button>
            </template>

            <template v-if="state.status === 'paused' || state.status === 'awaiting_continue'">
              <button
                type="button"
                class="pomo-btn pomo-btn--primary"
                :disabled="actionPending"
                @click="control('resume')"
              >
                <i class="fa-solid fa-play pomo-btn__icon" aria-hidden="true" />
                <span class="pomo-btn__label">Продолжить</span>
              </button>
              <button
                type="button"
                class="pomo-btn pomo-btn--danger"
                :disabled="actionPending"
                @click="control('reset')"
              >
                <i class="fa-solid fa-rotate-left pomo-btn__icon" aria-hidden="true" />
                <span class="pomo-btn__label">Сбросить</span>
              </button>
            </template>
          </div>
        </div>

        <div v-if="activeTool === 'pomodoro'" class="pomodoro-stats">
          <div class="stat-cell">
            <span class="stat-cell__value">{{ state.tasksCompletedToday }}</span>
            <span class="stat-cell__label">
              <i class="fa-solid fa-fire" /> Помидоров
            </span>
          </div>
          <div class="stat-cell">
            <span class="stat-cell__value">{{ fmt(state.totalWorkSec) }}</span>
            <span class="stat-cell__label">
              <i class="fa-solid fa-clock" /> Работа
            </span>
          </div>
          <div class="stat-cell">
            <span class="stat-cell__value">{{ fmt(state.totalRestSec) }}</span>
            <span class="stat-cell__label">
              <i class="fa-solid fa-mug-hot" /> Отдых
            </span>
          </div>
        </div>

        <PomodoroSettingsModal
          v-if="activeTool === 'pomodoro'"
          :is-open="settingsOpen"
          :saving="saving"
          :model-value="settingsModel"
          @close="settingsOpen = false"
          @save="saveSettings"
        />
        <FocusClockPane
          v-if="activeTool === 'timer' || activeTool === 'stopwatch'"
          :mode="activeTool === 'timer' ? 'timer' : 'stopwatch'"
          :focus-log-url="props.toolsFocusLogUrl"
          :get-tasks-url="props.getTasksUrl"
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

.tool-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .45rem;
}

.tool-tab-btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: .5rem .6rem;
  font-size: .68rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: all .2s ease;
}

.tool-tab-btn:hover { border-color: var(--color-border-light); color: var(--color-text); }
.tool-tab-btn--active {
  border-color: var(--color-accent);
  color: #fff;
  background: linear-gradient(165deg, color-mix(in srgb, var(--color-accent) 92%, #000), var(--color-accent));
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

/* ── Phase bar ── */
.pomodoro-phase-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: .75rem;
  padding: .5rem .75rem;
  background: rgba(255, 255, 255, .02);
  border: 1px solid var(--color-border);
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.phase-indicator {
  display: flex;
  align-items: center;
  gap: .45rem;
  font-size: .78rem;
  text-transform: uppercase;
  letter-spacing: .1em;
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
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--pomodoro-phase-glow-strong); }
  50% { opacity: .7; box-shadow: 0 0 12px var(--pomodoro-phase-glow-strong); }
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
  transition: all .3s ease;
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
  background: rgba(255, 255, 255, .02);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: .75rem;
  transition: all .2s ease;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
  justify-self: end;
}

.settings-trigger:hover:not(:disabled) {
  border-color: var(--pomodoro-phase-color);
  color: var(--color-text);
  box-shadow: 0 0 8px var(--pomodoro-phase-glow);
}

/* ── Actions: сетка n1 / n2 по числу кнопок ── */
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
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

/* 1 кнопка — старт, по центру */
.pomodoro-actions__panel--n1 {
  grid-template-columns: minmax(0, 13rem);
  justify-content: center;
  margin-inline: auto;
}

/* 2 кнопки — пауза/пропустить или продолжить/сбросить */
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
  font-size: 0.7rem;
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
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
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
  font-size: 0.72rem;
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

.pomo-btn--muted {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.pomo-btn--muted:hover:not(:disabled) {
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--pomodoro-phase-color) 35%, var(--color-border));
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

/* ── Stats ── */
.pomodoro-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
}

.stat-cell {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, .02);
  padding: .6rem .5rem;
  text-align: center;
  transition: all .3s ease;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.stat-cell::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04) 0px, rgba(0, 0, 0, 0.04) 1px,
    transparent 1px, transparent 3px
  );
  pointer-events: none;
}

.stat-cell:hover {
  border-color: var(--color-border-light);
  background: rgba(255, 255, 255, .04);
  box-shadow: 0 0 8px var(--pomodoro-phase-glow);
}

.stat-cell__value {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  color: var(--color-text);
  line-height: 1;
  margin-bottom: .35rem;
  text-shadow: 0 0 8px rgba(232, 232, 232, .2);
}

.stat-cell__label {
  display: block;
  font-size: .65rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: .08em;
  line-height: 1;
}

.stat-cell__label i {
  font-size: .6rem;
  color: var(--pomodoro-phase-color);
  opacity: .7;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .pomodoro-shell {
    padding: 1rem max(1rem, var(--app-safe-left, 0)) max(1rem, var(--app-safe-bottom, 0)) max(1rem, var(--app-safe-right, 0));
  }

  .pomodoro-actions__panel {
    gap: 0.4rem;
    padding: 0.55rem 0.55rem;
  }

  .pomo-btn {
    font-size: 0.66rem;
    padding: 0.5rem 0.45rem;
    min-height: 42px;
  }
}

@media (max-width: 400px) {
  .pomodoro-stats {
    grid-template-columns: 1fr;
  }
}
</style>
