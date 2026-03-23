<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import PomodoroTimerDial from '../components/pomodoro/PomodoroTimerDial.vue'
import PomodoroSettingsModal from '../components/pomodoro/PomodoroSettingsModal.vue'
import PomodoroTaskSelector from '../components/pomodoro/PomodoroTaskSelector.vue'

type PomodoroState = {
  status: 'stopped' | 'running' | 'paused'
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
  afterLongRest: 'stop' | 'pause'
  autoStartRest: boolean
  autoStartNextCycle: boolean
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

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

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

async function refresh() {
  try {
    const r = await fetch(props.stateGetUrl, { credentials: 'include' })
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

async function control(action: 'start' | 'resume' | 'pause' | 'stop') {
  if (actionPending.value) return
  actionPending.value = true
  const localActionSeq = actionSeq.value + 1
  try {
    const r = await fetch(props.controlUrl, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
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
  afterLongRest: 'stop' | 'pause'
  autoStartRest: boolean
  autoStartNextCycle: boolean
}

async function saveSettings(draft: PomodoroSettingsDraft) {
  saving.value = true
  try {
    const r = await fetch(props.settingsSaveUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
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

function playSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.frequency.value = 880
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.5)
  } catch (error) {
    console.error('Не удалось воспроизвести звук:', error)
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
  playSound()
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
  
  const time = fmt(remainSec.value)
  const phaseLabel = phaseLabels[state.value.phase]
  const emoji = phaseEmoji[state.value.phase]
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

const remainSec = computed(() => {
  if (!state.value) return 0
  if (state.value.status !== 'running') return state.value.phaseRemainingSec
  return Math.max(0, Math.floor((state.value.phaseEndsAtMs - localTick.value) / 1000))
})

const phaseDurationSec = computed(() => {
  if (!state.value) return 1
  if (state.value.phase === 'work') return state.value.workMinutes * 60
  if (state.value.phase === 'rest') return state.value.restMinutes * 60
  return state.value.longRestMinutes * 60
})

watch([() => state.value?.status, () => state.value?.phase, remainSec], () => {
  nextTick(() => updateDocumentTitle())
})

const canPause = computed(() => state.value?.status === 'running')
const canResume = computed(() => state.value?.status === 'paused')
const canStop = computed(() => !!state.value && state.value.status !== 'stopped')
const canStartOrRestart = computed(() => !!state.value)
const startLabel = computed(() => (state.value?.status === 'stopped' ? 'Старт' : 'Перезапуск'))
const statusLabel = computed(() => {
  if (!state.value) return 'Загрузка'
  if (state.value.status === 'running') return 'Идёт'
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
    afterLongRest: current.afterLongRest,
    autoStartRest: current.autoStartRest,
    autoStartNextCycle: current.autoStartNextCycle
  }
})

const phaseTheme = computed(() => {
  if (!state.value) return 'default'
  return state.value.phase
})

const cycleDotsTotal = computed(() => state.value?.cyclesUntilLongRest ?? 4)
const cycleDotsCompleted = computed(() => state.value?.cyclesCompleted ?? 0)
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
      :pomodoroStateGetUrl="props.stateGetUrl"
      :pomodoroControlUrl="props.controlUrl"
    />
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div v-if="state" class="content-inner pomodoro-shell">
        <p v-if="pageError" class="pomodoro-error">
          <i class="fa-solid fa-triangle-exclamation" /> {{ pageError }}
        </p>

        <div class="pomodoro-phase-bar">
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

        <transition name="fade" mode="out-in">
          <PomodoroTimerDial
            :key="state.phase"
            :phase="state.phase"
            :remaining-sec="remainSec"
            :phase-duration-sec="phaseDurationSec"
            :status="state.status"
            :phase-label="phaseLabels[state.phase]"
            :status-label="statusLabel"
            :time-label="fmt(remainSec)"
          />
        </transition>

        <PomodoroTaskSelector
          :assign-task-url="props.assignTaskUrl"
          :get-tasks-url="props.getTasksUrl"
          :current-task-id="state.currentTaskId"
          @task-assigned="refresh"
        />

        <div class="pomodoro-actions">
          <button
            v-if="state.status === 'stopped'"
            class="pomo-btn pomo-btn--primary"
            :disabled="actionPending"
            @click="control('start')"
          >
            <i class="fa-solid fa-play pomo-btn__icon" />
            <span class="pomo-btn__label">Старт</span>
          </button>
          <button
            v-else
            class="pomo-btn pomo-btn--ghost"
            :disabled="actionPending"
            @click="control('start')"
          >
            <i class="fa-solid fa-rotate-right pomo-btn__icon" />
            <span class="pomo-btn__label">Рестарт</span>
          </button>

          <button
            v-if="state.status === 'running'"
            class="pomo-btn pomo-btn--secondary"
            :disabled="actionPending"
            @click="control('pause')"
          >
            <i class="fa-solid fa-pause pomo-btn__icon" />
            <span class="pomo-btn__label">Пауза</span>
          </button>

          <button
            v-if="state.status === 'paused'"
            class="pomo-btn pomo-btn--primary"
            :disabled="actionPending"
            @click="control('resume')"
          >
            <i class="fa-solid fa-play pomo-btn__icon" />
            <span class="pomo-btn__label">Продолжить</span>
          </button>

          <button
            v-if="state.status !== 'stopped'"
            class="pomo-btn pomo-btn--danger"
            :disabled="actionPending"
            @click="control('stop')"
          >
            <i class="fa-solid fa-stop pomo-btn__icon" />
            <span class="pomo-btn__label">Стоп</span>
          </button>
        </div>

        <div class="pomodoro-stats">
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
          :is-open="settingsOpen"
          :saving="saving"
          :model-value="settingsModel"
          @close="settingsOpen = false"
          @save="saveSettings"
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

/* ── Phase bar ── */
.pomodoro-phase-bar {
  display: flex;
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
  flex: 1;
  justify-content: center;
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
}

.settings-trigger:hover:not(:disabled) {
  border-color: var(--pomodoro-phase-color);
  color: var(--color-text);
  box-shadow: 0 0 8px var(--pomodoro-phase-glow);
}

/* ── Actions ── */
.pomodoro-actions {
  display: flex;
  gap: .6rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.pomo-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  padding: .6rem 1.1rem;
  font-size: .82rem;
  font-weight: 500;
  font-family: inherit;
  border: 2px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 42px;
  min-width: 90px;
  overflow: hidden;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.pomo-btn::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08) 0px, rgba(0, 0, 0, 0.08) 1px,
    transparent 1px, transparent 3px
  );
  pointer-events: none;
  z-index: 0;
}

.pomo-btn::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 2px;
  background: var(--pomodoro-phase-color);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .3s ease;
  z-index: 2;
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
  font-size: .85rem;
  opacity: .85;
}

.pomo-btn:hover:not(:disabled) {
  border-color: var(--pomodoro-phase-color);
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 16px var(--pomodoro-phase-glow);
}

.pomo-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.pomo-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pomo-btn--primary {
  background: linear-gradient(135deg, var(--pomodoro-phase-color), rgba(211, 35, 75, 0.85));
  border-color: transparent;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px var(--pomodoro-phase-glow);
}

.pomo-btn--primary:hover:not(:disabled) {
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 24px var(--pomodoro-phase-glow-strong);
}

.pomo-btn--secondary {
  border-color: var(--pomodoro-phase-color);
  background: rgba(255, 255, 255, 0.02);
}

.pomo-btn--ghost {
  border-style: solid;
  border-color: var(--color-border);
  background: transparent;
}

.pomo-btn--danger {
  border-color: rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.04);
  color: #ff8a8a;
}

.pomo-btn--danger:hover:not(:disabled) {
  border-color: rgba(255, 107, 107, 0.6);
  box-shadow: 0 0 12px rgba(255, 107, 107, 0.15);
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

  .pomodoro-actions {
    gap: .5rem;
  }

  .pomo-btn {
    min-height: 46px;
    min-width: 80px;
    padding: .7rem 1rem;
    font-size: .85rem;
    flex: 1 1 auto;
    max-width: 140px;
  }
}

@media (max-width: 400px) {
  .pomodoro-stats {
    grid-template-columns: 1fr;
  }

  .pomodoro-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .45rem;
  }

  .pomo-btn {
    max-width: none;
    width: 100%;
  }
}
</style>
