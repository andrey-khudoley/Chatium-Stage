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
        <p v-if="pageError" class="pomodoro-error">{{ pageError }}</p>
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
        <div class="pomodoro-topline">
          <p class="pomodoro-phase">Фаза: {{ phaseLabels[state.phase] }}</p>
          <button class="journal-nav-btn" :disabled="saving" @click="settingsOpen = true">
            <i class="fa-solid fa-sliders mr-1" /> Настройки
          </button>
        </div>
        <div class="pomodoro-actions">
          <button
            v-if="state.status === 'stopped'"
            class="pomodoro-btn primary"
            :disabled="actionPending"
            @click="control('start')"
          >
            <i class="fa-solid fa-play btn-icon" />
            Старт
          </button>
          <button
            v-else
            class="pomodoro-btn primary"
            :disabled="actionPending"
            @click="control('start')"
          >
            <i class="fa-solid fa-rotate-right btn-icon" />
            Перезапуск
          </button>

          <button
            v-if="state.status === 'running'"
            class="pomodoro-btn"
            :disabled="actionPending"
            @click="control('pause')"
          >
            <i class="fa-solid fa-pause btn-icon" />
            Пауза
          </button>

          <button
            v-if="state.status === 'paused'"
            class="pomodoro-btn"
            :disabled="actionPending"
            @click="control('resume')"
          >
            <i class="fa-solid fa-play btn-icon" />
            Продолжить
          </button>

          <button
            v-if="state.status !== 'stopped'"
            class="pomodoro-btn secondary"
            :disabled="actionPending"
            @click="control('stop')"
          >
            <i class="fa-solid fa-stop btn-icon" />
            Стоп
          </button>
        </div>
        <div class="pomodoro-stats-grid">
          <div class="stat-card">
            <i class="fa-solid fa-fire stat-icon" />
            <div class="stat-content">
              <p class="stat-value">{{ state.tasksCompletedToday }}</p>
              <p class="stat-label">Помидорок</p>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-clock stat-icon" />
            <div class="stat-content">
              <p class="stat-value">{{ fmt(state.totalWorkSec) }}</p>
              <p class="stat-label">Работа</p>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-solid fa-mug-hot stat-icon" />
            <div class="stat-content">
              <p class="stat-value">{{ fmt(state.totalRestSec) }}</p>
              <p class="stat-label">Отдых</p>
            </div>
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
        <p class="pomodoro-loading">Загрузка Pomodoro...</p>
        <p v-if="pageError" class="pomodoro-error">{{ pageError }}</p>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  transition: background-color 0.6s ease, color 0.6s ease;
}
.app-layout.theme-work {
  --pomodoro-phase-color: #d3234b;
  --pomodoro-phase-glow: rgba(211, 35, 75, 0.2);
  background: linear-gradient(135deg, #0d0d0d 0%, #1a0e0e 100%);
}
.app-layout.theme-rest {
  --pomodoro-phase-color: #2f8f8f;
  --pomodoro-phase-glow: rgba(47, 143, 143, 0.2);
  background: linear-gradient(135deg, #0d0d0d 0%, #0e1a1a 100%);
}
.app-layout.theme-long_rest {
  --pomodoro-phase-color: #8566ff;
  --pomodoro-phase-glow: rgba(133, 102, 255, 0.2);
  background: linear-gradient(135deg, #0d0d0d 0%, #12101a 100%);
}
.content-wrapper { display: flex; }
.content-inner { width: 100%; }
.pomodoro-shell { max-width: 720px; margin: 0 auto; padding: 1rem; display: grid; gap: .75rem; }
.pomodoro-error { margin: 0; color: var(--color-accent-hover); font-size: .8rem; }
.pomodoro-loading { margin: 0; color: var(--color-text-secondary); font-size: .85rem; text-transform: uppercase; letter-spacing: .08em; }
.pomodoro-actions {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: .5rem 0;
}
.pomodoro-actions .pomodoro-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  padding: .65rem 1.25rem;
  font-size: .85rem;
  font-weight: 500;
  border-radius: 10px;
  border: 1px solid var(--pomodoro-phase-color, var(--color-accent));
  background: linear-gradient(135deg, rgba(211, 35, 75, 0.08), rgba(211, 35, 75, 0.02));
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  min-width: 100px;
}
.pomodoro-actions .pomodoro-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(211, 35, 75, 0.15), rgba(211, 35, 75, 0.05));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 20px var(--pomodoro-phase-glow, rgba(211, 35, 75, 0.15));
}
.pomodoro-actions .pomodoro-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--color-bg),
    0 0 0 4px var(--pomodoro-phase-color, var(--color-accent));
}
.pomodoro-actions .pomodoro-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: var(--color-border);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
}
.pomodoro-actions .pomodoro-btn.primary {
  background: linear-gradient(135deg, var(--pomodoro-phase-color, var(--color-accent)), rgba(211, 35, 75, 0.85));
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
.pomodoro-actions .pomodoro-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--pomodoro-phase-color, var(--color-accent)), rgba(211, 35, 75, 0.95));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 24px var(--pomodoro-phase-glow, rgba(211, 35, 75, 0.25));
}
.pomodoro-actions .pomodoro-btn.secondary {
  border-style: dashed;
  background: transparent;
}
.pomodoro-actions .pomodoro-btn .btn-icon {
  font-size: .9rem;
  opacity: .85;
}
.pomodoro-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: .6rem;
  margin-top: .3rem;
}
.stat-card {
  border: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(255, 255, 255, .02), rgba(255, 255, 255, .01));
  border-radius: 12px;
  padding: .75rem;
  display: flex;
  align-items: center;
  gap: .6rem;
  transition: all .3s ease;
}
.stat-card:hover {
  border-color: var(--color-border-light);
  background: linear-gradient(135deg, rgba(255, 255, 255, .04), rgba(255, 255, 255, .02));
  transform: translateY(-2px);
}
.stat-icon {
  font-size: 1.4rem;
  color: var(--pomodoro-phase-color, var(--color-accent));
  opacity: .85;
}
.stat-content {
  flex: 1;
  min-width: 0;
}
.stat-value {
  margin: 0 0 .15rem;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  color: var(--color-text);
  line-height: 1;
}
.stat-label {
  margin: 0;
  font-size: .7rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: .06em;
  line-height: 1;
}
.pomodoro-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .5rem;
}
.pomodoro-phase {
  margin: 0;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: .8rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity .4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 640px) {
  .pomodoro-stats-grid {
    grid-template-columns: 1fr;
  }
  .pomodoro-actions {
    gap: .6rem;
    padding: .5rem var(--app-safe-left, 0) .5rem var(--app-safe-right, 0);
  }
  .pomodoro-actions .pomodoro-btn {
    min-height: 48px;
    min-width: 90px;
    padding: .75rem 1rem;
    font-size: .9rem;
    flex: 1 1 auto;
    max-width: 160px;
  }
  .pomodoro-shell {
    padding: 1rem max(1rem, var(--app-safe-left, 0)) max(1rem, var(--app-safe-bottom, 0)) max(1rem, var(--app-safe-right, 0));
  }
}
@media (max-width: 400px) {
  .pomodoro-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .5rem;
  }
  .pomodoro-actions .pomodoro-btn {
    max-width: none;
    width: 100%;
  }
}
</style>