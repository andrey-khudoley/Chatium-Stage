import { runWithExclusiveLock } from '@app/sync'
import * as pomodoroRepo from '../repos/pomodoro.repo'
import * as tasksRepo from '../repos/tasks.repo'
import type { PomodoroSettingsInput, PomodoroStateDto } from './pomodoro-types'

function phaseDurationSec(state: Pick<PomodoroStateDto, 'phase' | 'workMinutes' | 'restMinutes' | 'longRestMinutes'>): number {
  if (state.phase === 'work') return state.workMinutes * 60
  if (state.phase === 'rest') return state.restMinutes * 60
  return state.longRestMinutes * 60
}

function lockKey(userId: string): string {
  return `assistant:pomodoro:${userId}`
}

async function tick(ctx: app.Ctx, userId: string, nowMs: number): Promise<PomodoroStateDto> {
  let state = await pomodoroRepo.getOrCreateState(ctx, userId)
  if (state.status !== 'running') return state
  let elapsedSec = Math.max(0, Math.floor((nowMs - state.updatedAtMs) / 1000))
  if (elapsedSec <= 0) return state
  while (elapsedSec > 0 && state.status === 'running') {
    const currentRemaining = Math.max(0, Math.floor((state.phaseEndsAtMs - state.updatedAtMs) / 1000))
    const spent = Math.min(elapsedSec, currentRemaining)
    const addWork = state.phase === 'work' ? spent : 0
    const addRest = state.phase === 'work' ? 0 : spent
    if (state.currentTaskId && spent > 0) {
      await tasksRepo.addPomodoroSecondsToTask(ctx, userId, state.currentTaskId, addWork, addRest)
    }
    state = await pomodoroRepo.updateState(ctx, userId, {
      totalWorkSec: state.totalWorkSec + addWork,
      totalRestSec: state.totalRestSec + addRest,
      phaseRemainingSec: Math.max(0, currentRemaining - spent)
    })
    elapsedSec -= spent
    if (state.phaseRemainingSec > 0) break

    if (state.phase === 'work') {
      const nextCycles = state.cyclesCompleted + 1
      const longBreak = nextCycles % state.cyclesUntilLongRest === 0
      const nextPhase = longBreak ? 'long_rest' : 'rest'
      const pauseAfter = state.pauseAfterWork && !state.autoStartRest
      const nextRemainingSec = longBreak ? state.longRestMinutes * 60 : state.restMinutes * 60
      state = await pomodoroRepo.updateState(ctx, userId, {
        cyclesCompleted: nextCycles,
        phase: nextPhase,
        status: pauseAfter ? 'paused' : 'running',
        phaseRemainingSec: nextRemainingSec,
        phaseEndsAtMs: pauseAfter ? 0 : state.updatedAtMs + nextRemainingSec * 1000,
        tasksCompletedToday: state.tasksCompletedToday + 1
      })
      if (pauseAfter) break
      continue
    }

    const finishedLongRest = state.phase === 'long_rest'
    const shouldStop = finishedLongRest && state.afterLongRest === 'stop'
    const pauseAfter = finishedLongRest
      ? state.afterLongRest === 'pause'
      : state.pauseAfterRest && !state.autoStartNextCycle
    const nextRemainingSec = state.workMinutes * 60
    state = await pomodoroRepo.updateState(ctx, userId, {
      phase: 'work',
      status: shouldStop ? 'stopped' : pauseAfter ? 'paused' : 'running',
      phaseRemainingSec: nextRemainingSec,
      phaseEndsAtMs: shouldStop || pauseAfter ? 0 : state.updatedAtMs + nextRemainingSec * 1000
    })
    if (shouldStop || pauseAfter) break
  }
  return state
}

export async function getState(ctx: app.Ctx, userId: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), () => tick(ctx, userId, Date.now()))
}

export async function saveSettings(ctx: app.Ctx, userId: string, input: PomodoroSettingsInput): Promise<PomodoroStateDto> {
  const workMinutes = Math.max(1, Math.min(180, Math.floor(input.workMinutes)))
  const restMinutes = Math.max(1, Math.min(180, Math.floor(input.restMinutes)))
  const longRestMinutes = Math.max(1, Math.min(180, Math.floor(input.longRestMinutes)))
  const cyclesUntilLongRest = Math.max(1, Math.min(12, Math.floor(input.cyclesUntilLongRest)))
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const state = await tick(ctx, userId, Date.now())
    return pomodoroRepo.updateState(ctx, userId, {
      workMinutes,
      restMinutes,
      longRestMinutes,
      cyclesUntilLongRest,
      pauseAfterWork: input.pauseAfterWork,
      pauseAfterRest: input.pauseAfterRest,
      afterLongRest: input.afterLongRest,
      autoStartRest: input.autoStartRest,
      autoStartNextCycle: input.autoStartNextCycle,
      phaseRemainingSec: state.status === 'stopped' ? workMinutes * 60 : state.phaseRemainingSec
    })
  })
}

export async function start(ctx: app.Ctx, userId: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const state = await tick(ctx, userId, Date.now())
    const remaining = state.workMinutes * 60
    return pomodoroRepo.updateState(ctx, userId, {
      phase: 'work',
      status: 'running',
      phaseRemainingSec: remaining,
      phaseEndsAtMs: Date.now() + remaining * 1000
    })
  })
}

export async function resume(ctx: app.Ctx, userId: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const state = await tick(ctx, userId, Date.now())
    if (state.status !== 'paused') return state
    const remaining = Math.max(1, state.phaseRemainingSec)
    return pomodoroRepo.updateState(ctx, userId, {
      status: 'running',
      phaseRemainingSec: remaining,
      phaseEndsAtMs: Date.now() + remaining * 1000
    })
  })
}

export async function pause(ctx: app.Ctx, userId: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const state = await tick(ctx, userId, Date.now())
    if (state.status !== 'running') return state
    const remaining = Math.max(0, Math.floor((state.phaseEndsAtMs - Date.now()) / 1000))
    return pomodoroRepo.updateState(ctx, userId, {
      status: 'paused',
      phaseRemainingSec: remaining,
      phaseEndsAtMs: 0
    })
  })
}

export async function stop(ctx: app.Ctx, userId: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const state = await tick(ctx, userId, Date.now())
    return pomodoroRepo.updateState(ctx, userId, {
      status: 'stopped',
      phase: 'work',
      phaseRemainingSec: state.workMinutes * 60,
      phaseEndsAtMs: 0,
      currentTaskId: null
    })
  })
}

export async function assignTask(ctx: app.Ctx, userId: string, taskId: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    if (taskId) {
      const task = await tasksRepo.findTaskByIdForUser(ctx, userId, taskId)
      if (!task) throw new Error('Task not found')
    }
    const state = await tick(ctx, userId, Date.now())
    return pomodoroRepo.updateState(ctx, userId, { currentTaskId: taskId || null, phaseRemainingSec: state.phaseRemainingSec })
  })
}
