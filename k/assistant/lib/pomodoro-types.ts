export type PomodoroAfterLongRest = 'stop' | 'pause'
export type PomodoroPhase = 'work' | 'rest' | 'long_rest'
/** awaiting_continue — фаза закончилась по таймеру, идёт «овертайм» до нажатия «Продолжить» */
export type PomodoroStatus = 'stopped' | 'running' | 'paused' | 'awaiting_continue'

export type PomodoroStateDto = {
  status: PomodoroStatus
  phase: PomodoroPhase
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
  afterLongRest: PomodoroAfterLongRest
  autoStartRest: boolean
  autoStartNextCycle: boolean
  tasksCompletedToday: number
  updatedAtMs: number
}

export type PomodoroSettingsInput = {
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
  cyclesUntilLongRest: number
  pauseAfterWork: boolean
  pauseAfterRest: boolean
  afterLongRest: PomodoroAfterLongRest
  autoStartRest: boolean
  autoStartNextCycle: boolean
}
