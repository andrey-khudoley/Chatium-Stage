<script setup lang="ts">
import { computed } from 'vue'
import PomodoroTimerDial from './PomodoroTimerDial.vue'
import PomodoroSettingsModal from './PomodoroSettingsModal.vue'
import PomodoroTaskSelector from './PomodoroTaskSelector.vue'
import FocusClockPane from './FocusClockPane.vue'
import PomodoroToolStatsRow from './PomodoroToolStatsRow.vue'
import { readFocusClockStatsFromStorage } from '../../lib/focus-clock-local-stats'
import { formatPomodoroSecondsDisplay as fmt } from '../../lib/pomodoro-types'
import { computePomodoroStatsDayKeyLocal } from '../../lib/pomodoro-stats-day'
import type { PomodoroPhaseCompleteAction, PomodoroAfterLongRest } from '../../lib/pomodoro-types'

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

type SettingsDraft = {
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
  cyclesUntilLongRest: number
  pauseAfterWork: boolean
  pauseAfterRest: boolean
  afterLongRest: PomodoroAfterLongRest
  autoStartRest: boolean
  autoStartNextCycle: boolean
  phaseChangeSound: number
  afterWorkAction: PomodoroPhaseCompleteAction
  afterRestAction: PomodoroPhaseCompleteAction
}

const props = defineProps<{
  state: PomodoroState
  localTickMs: number
  sharedSelectedTaskId: string
  settingsModel: SettingsDraft
  saving: boolean
  actionPending: boolean
  assignTaskUrl: string
  getTasksUrl: string
  toolsFocusLogUrl: string
  activeTool: 'pomodoro' | 'timer' | 'stopwatch'
  settingsOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:activeTool', v: 'pomodoro' | 'timer' | 'stopwatch'): void
  (e: 'update:settingsOpen', v: boolean): void
  (e: 'control', action: 'start' | 'resume' | 'pause' | 'stop' | 'skip' | 'reset'): void
  (e: 'save-settings', draft: SettingsDraft): void
  (e: 'pomodoro-task-assigned', taskId: string): void
  (e: 'shared-task-selected', taskId: string): void
}>()

const phaseLabels: Record<PomodoroState['phase'], string> = {
  work: 'Работа',
  rest: 'Отдых',
  long_rest: 'Длинный отдых'
}

function statsDayKey(): string {
  return computePomodoroStatsDayKeyLocal(props.localTickMs)
}

const overtimeSec = computed(() => {
  if (props.state.status !== 'awaiting_continue') return 0
  return Math.max(0, Math.floor((props.localTickMs - props.state.phaseEndsAtMs) / 1000))
})

const remainSec = computed(() => {
  if (props.state.status === 'awaiting_continue') return 0
  if (props.state.status !== 'running') return props.state.phaseRemainingSec
  return Math.max(0, Math.floor((props.state.phaseEndsAtMs - props.localTickMs) / 1000))
})

const displayTimeLabel = computed(() => {
  if (props.state.status === 'awaiting_continue') return `+${fmt(overtimeSec.value)}`
  return fmt(remainSec.value)
})

const phaseDurationSec = computed(() => {
  if (props.state.phase === 'work') return props.state.workMinutes * 60
  if (props.state.phase === 'rest') return props.state.restMinutes * 60
  return props.state.longRestMinutes * 60
})

const statusLabel = computed(() => {
  if (props.state.status === 'running') return 'Идёт'
  if (props.state.status === 'awaiting_continue') return 'Овертайм'
  if (props.state.status === 'paused') return 'Пауза'
  return 'Остановлен'
})

const cycleDotsTotal = computed(() => props.state.cyclesUntilLongRest ?? 4)
const cycleDotsCompleted = computed(() => props.state.cyclesCompleted ?? 0)

const pomodoroActionPanelLayout = computed(() => {
  const s = props.state.status
  if (s === 'stopped') return 'pomodoro-actions__panel--n1'
  return 'pomodoro-actions__panel--n2'
})

const unifiedSessionsCount = computed(() => {
  const dayKey = statsDayKey()
  const t = readFocusClockStatsFromStorage('timer', dayKey)?.sessionsCount ?? 0
  const s = readFocusClockStatsFromStorage('stopwatch', dayKey)?.sessionsCount ?? 0
  return props.state.tasksCompletedToday + t + s
})

const unifiedWorkFocusSec = computed(() => {
  const dayKey = statsDayKey()
  const t = readFocusClockStatsFromStorage('timer', dayKey)?.totalFocusSec ?? 0
  const sw = readFocusClockStatsFromStorage('stopwatch', dayKey)?.totalFocusSec ?? 0
  return props.state.totalWorkSec + t + sw
})

const unifiedTotalAllSec = computed(() => {
  const dayKey = statsDayKey()
  const t = readFocusClockStatsFromStorage('timer', dayKey)?.totalSec ?? 0
  const sw = readFocusClockStatsFromStorage('stopwatch', dayKey)?.totalSec ?? 0
  return props.state.totalWorkSec + props.state.totalRestSec + t + sw
})
</script>

<template>
  <div class="pomodoro-tools-workspace">
    <div class="tool-tabs">
      <button
        type="button"
        class="tool-tab-btn"
        :class="{ 'tool-tab-btn--active': activeTool === 'pomodoro' }"
        @click="emit('update:activeTool', 'pomodoro')"
      >
        Помидор
      </button>
      <button
        type="button"
        class="tool-tab-btn"
        :class="{ 'tool-tab-btn--active': activeTool === 'timer' }"
        @click="emit('update:activeTool', 'timer')"
      >
        Таймер
      </button>
      <button
        type="button"
        class="tool-tab-btn"
        :class="{ 'tool-tab-btn--active': activeTool === 'stopwatch' }"
        @click="emit('update:activeTool', 'stopwatch')"
      >
        Секундомер
      </button>
    </div>

    <template v-if="activeTool === 'pomodoro'">
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
        <button class="settings-trigger" :disabled="saving" @click="emit('update:settingsOpen', true)">
          <i class="fa-solid fa-sliders" />
        </button>
      </div>

      <transition name="fade" mode="out-in">
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
        :assign-task-url="assignTaskUrl"
        :get-tasks-url="getTasksUrl"
        :current-task-id="state.currentTaskId"
        :stats-day-key="statsDayKey()"
        @task-assigned="emit('pomodoro-task-assigned', $event)"
      />

      <div class="pomodoro-actions">
        <div class="pomodoro-actions__panel" :class="pomodoroActionPanelLayout">
          <button
            v-if="state.status === 'stopped'"
            type="button"
            class="pomo-btn pomo-btn--primary"
            :disabled="actionPending"
            @click="emit('control', 'start')"
          >
            <i class="fa-solid fa-play pomo-btn__icon" aria-hidden="true" />
            <span class="pomo-btn__label">Старт</span>
          </button>

          <template v-if="state.status === 'running'">
            <button type="button" class="pomo-btn pomo-btn--secondary" :disabled="actionPending" @click="emit('control', 'pause')">
              <i class="fa-solid fa-pause pomo-btn__icon" aria-hidden="true" />
              <span class="pomo-btn__label">Пауза</span>
            </button>
            <button type="button" class="pomo-btn pomo-btn--ghost" :disabled="actionPending" @click="emit('control', 'skip')">
              <i class="fa-solid fa-forward pomo-btn__icon" aria-hidden="true" />
              <span class="pomo-btn__label">Пропустить</span>
            </button>
          </template>

          <template v-if="state.status === 'paused' || state.status === 'awaiting_continue'">
            <button type="button" class="pomo-btn pomo-btn--primary" :disabled="actionPending" @click="emit('control', 'resume')">
              <i class="fa-solid fa-play pomo-btn__icon" aria-hidden="true" />
              <span class="pomo-btn__label">Продолжить</span>
            </button>
            <button type="button" class="pomo-btn pomo-btn--danger" :disabled="actionPending" @click="emit('control', 'reset')">
              <i class="fa-solid fa-rotate-left pomo-btn__icon" aria-hidden="true" />
              <span class="pomo-btn__label">Сбросить</span>
            </button>
          </template>
        </div>
      </div>

      <PomodoroSettingsModal
        :is-open="settingsOpen"
        :saving="saving"
        :model-value="settingsModel"
        @close="emit('update:settingsOpen', false)"
        @save="emit('save-settings', $event)"
      />
    </template>

    <FocusClockPane
      v-if="activeTool === 'timer' || activeTool === 'stopwatch'"
      :mode="activeTool === 'timer' ? 'timer' : 'stopwatch'"
      :focus-log-url="toolsFocusLogUrl"
      :get-tasks-url="getTasksUrl"
      :selected-task-id="sharedSelectedTaskId"
      @task-selected="emit('shared-task-selected', $event)"
    />

    <PomodoroToolStatsRow
      :first-text="String(unifiedSessionsCount)"
      :second-text="fmt(unifiedWorkFocusSec)"
      :third-text="fmt(unifiedTotalAllSec)"
      first-label="Сессий"
      second-label="Работа"
      third-label="Всего"
      first-icon="fa-solid fa-layer-group"
      second-icon="fa-solid fa-clock"
      third-icon="fa-solid fa-stopwatch"
    />
  </div>
</template>

<style scoped>
.pomodoro-tools-workspace {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tool-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.tool-tab-btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: 0.5rem 0.6rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-tab-btn:hover {
  border-color: var(--color-border-light);
  color: var(--color-text);
}
.tool-tab-btn--active {
  border-color: var(--color-accent);
  color: #fff;
  background: linear-gradient(165deg, color-mix(in srgb, var(--color-accent) 92%, #000), var(--color-accent));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
