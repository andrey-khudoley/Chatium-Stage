import { runWithExclusiveLock } from '@app/sync'
import * as pomodoroRepo from '../repos/pomodoro.repo'
import * as pomodoroLaunchesRepo from '../repos/pomodoro-launches.repo'
import * as tasksRepo from '../repos/tasks.repo'
import type { PomodoroSettingsInput, PomodoroStateDto } from './pomodoro-types'
import { normalizePhaseChangeSoundId } from './pomodoro-types'
import type { PomodoroLaunchEndReason, PomodoroLaunchSource } from '../tables/pomodoro-launches.table'
import type { PomodoroPhaseCompleteAction } from './pomodoro-types'

function lockKey(userId: string): string {
  return `assistant:pomodoro:${userId}`
}

function getPhaseCompletionAction(state: PomodoroStateDto, phase: 'work' | 'rest' | 'long_rest'): PomodoroPhaseCompleteAction {
  if (phase === 'work') {
    if (state.autoStartRest) return 'auto'
    if (state.pauseAfterWork) return 'pause'
    return 'overtime'
  }
  if (phase === 'rest') {
    if (state.autoStartNextCycle) return 'auto'
    if (state.pauseAfterRest) return 'pause'
    return 'overtime'
  }
  if (state.afterLongRest === 'auto') return 'auto'
  if (state.afterLongRest === 'overtime') return 'overtime'
  return 'pause'
}

async function moveToNextPhase(
  ctx: app.Ctx,
  userId: string,
  state: PomodoroStateDto,
  nowMs: number,
  source: PomodoroLaunchSource
): Promise<PomodoroStateDto> {
  if (state.phase === 'work') {
    const nextCycles = state.cyclesCompleted + 1
    const longBreak = nextCycles % state.cyclesUntilLongRest === 0
    const nextPhase = longBreak ? 'long_rest' : 'rest'
    const nextRemainingSec = longBreak ? state.longRestMinutes * 60 : state.restMinutes * 60
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      cyclesCompleted: nextCycles,
      tasksCompletedToday: state.tasksCompletedToday + 1,
      phase: nextPhase,
      status: 'running',
      phaseRemainingSec: nextRemainingSec,
      phaseEndsAtMs: nowMs + nextRemainingSec * 1000
    })
    await startLaunchSegment(ctx, userId, nextState, source, nowMs)
    return nextState
  }

  const nextRemainingSec = state.workMinutes * 60
  const nextState = await pomodoroRepo.updateState(ctx, userId, {
    phase: 'work',
    status: 'running',
    phaseRemainingSec: nextRemainingSec,
    phaseEndsAtMs: nowMs + nextRemainingSec * 1000
  })
  await startLaunchSegment(ctx, userId, nextState, source, nowMs)
  return nextState
}

async function startLaunchSegment(
  ctx: app.Ctx,
  userId: string,
  state: PomodoroStateDto,
  source: PomodoroLaunchSource,
  nowMs: number
): Promise<void> {
  if (state.status !== 'running') return
  await pomodoroLaunchesRepo.startLaunch(ctx, {
    userId,
    source,
    startedAtMs: nowMs,
    state
  })
}

async function closeLaunchSegment(
  ctx: app.Ctx,
  userId: string,
  nowMs: number,
  endReason: PomodoroLaunchEndReason
): Promise<void> {
  await pomodoroLaunchesRepo.closeOpenLaunchByUser(ctx, userId, nowMs, endReason)
}

/** После овертайма или при skip из awaiting_continue — следующая фаза. */
async function advanceToNextPhaseAfterOvertime(
  ctx: app.Ctx,
  userId: string,
  state: PomodoroStateDto,
  nowMs: number,
  source: PomodoroLaunchSource
): Promise<PomodoroStateDto> {
  if (state.phase === 'long_rest' && state.afterLongRest === 'stop') {
    return pomodoroRepo.updateState(ctx, userId, {
      status: 'stopped',
      phase: 'work',
      phaseRemainingSec: state.workMinutes * 60,
      phaseEndsAtMs: 0,
      currentTaskId: null
    })
  }
  return moveToNextPhase(ctx, userId, state, nowMs, source)
}

/** Пропуск текущей фазы во время отсчёта: сразу следующая фаза с полным таймером. */
async function skipFromRunningPhase(ctx: app.Ctx, userId: string, nowMs: number, state: PomodoroStateDto): Promise<PomodoroStateDto> {
  // tick() выше уже перенёс в totalWorkSec/totalRestSec и в задачу фактически прошедшее время.
  // Оставшееся до конца фазы (skipped) в аналитику и в задачи не включаем.
  let next = await pomodoroRepo.updateState(ctx, userId, {
    phaseRemainingSec: 0
  })
  await closeLaunchSegment(ctx, userId, next.updatedAtMs, 'phase_skip')

  if (state.phase === 'work') {
    const nextCycles = state.cyclesCompleted + 1
    const longBreak = nextCycles % state.cyclesUntilLongRest === 0
    const nextPhase = longBreak ? 'long_rest' : 'rest'
    const nextRemainingSec = longBreak ? state.longRestMinutes * 60 : state.restMinutes * 60
    next = await pomodoroRepo.updateState(ctx, userId, {
      cyclesCompleted: nextCycles,
      tasksCompletedToday: state.tasksCompletedToday + 1,
      phase: nextPhase,
      status: 'running',
      phaseRemainingSec: nextRemainingSec,
      phaseEndsAtMs: nowMs + nextRemainingSec * 1000
    })
    await startLaunchSegment(ctx, userId, next, 'skip', nowMs)
    return next
  }

  if (state.phase === 'long_rest' && state.afterLongRest === 'stop') {
    return pomodoroRepo.updateState(ctx, userId, {
      status: 'stopped',
      phase: 'work',
      phaseRemainingSec: state.workMinutes * 60,
      phaseEndsAtMs: 0,
      currentTaskId: null
    })
  }

  const nextRemainingSec = state.workMinutes * 60
  next = await pomodoroRepo.updateState(ctx, userId, {
    phase: 'work',
    status: 'running',
    phaseRemainingSec: nextRemainingSec,
    phaseEndsAtMs: nowMs + nextRemainingSec * 1000
  })
  await startLaunchSegment(ctx, userId, next, 'skip', nowMs)
  return next
}

async function tick(ctx: app.Ctx, userId: string, nowMs: number, statsDayKey?: string): Promise<PomodoroStateDto> {
  let state = await pomodoroRepo.getOrCreateStateWithDailyStats(ctx, userId, statsDayKey, nowMs)
  if (state.status === 'awaiting_continue') {
    return state
  }
  if (state.status !== 'running') {
    await closeLaunchSegment(ctx, userId, nowMs, 'state_recovered')
    return state
  }
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

    const completedPhase = state.phase
    await closeLaunchSegment(ctx, userId, state.updatedAtMs, 'phase_completed')
    const action = getPhaseCompletionAction(state, completedPhase)

    if (action === 'overtime') {
      if (completedPhase === 'work') {
        const nextCycles = state.cyclesCompleted + 1
        state = await pomodoroRepo.updateState(ctx, userId, {
          cyclesCompleted: nextCycles,
          tasksCompletedToday: state.tasksCompletedToday + 1,
          status: 'awaiting_continue',
          phaseRemainingSec: 0,
          phaseEndsAtMs: state.updatedAtMs
        })
      } else {
        state = await pomodoroRepo.updateState(ctx, userId, {
          status: 'awaiting_continue',
          phaseRemainingSec: 0,
          phaseEndsAtMs: state.updatedAtMs
        })
      }
      break
    }

    if (action === 'pause') {
      if (completedPhase === 'long_rest' && state.afterLongRest === 'stop') {
        state = await pomodoroRepo.updateState(ctx, userId, {
          status: 'stopped',
          phase: 'work',
          phaseRemainingSec: state.workMinutes * 60,
          phaseEndsAtMs: 0,
          currentTaskId: null
        })
      } else {
        const moved = await moveToNextPhase(ctx, userId, state, state.updatedAtMs, 'auto_next_phase')
        state = await pomodoroRepo.updateState(ctx, userId, {
          phase: moved.phase,
          status: 'paused',
          phaseRemainingSec: moved.phaseRemainingSec,
          phaseEndsAtMs: 0
        })
        await closeLaunchSegment(ctx, userId, state.updatedAtMs, 'pause')
      }
      break
    }

    state = await moveToNextPhase(ctx, userId, state, state.updatedAtMs, 'auto_next_phase')
  }
  return state
}

export async function getState(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), () => tick(ctx, userId, Date.now(), statsDayKey))
}

export async function saveSettings(
  ctx: app.Ctx,
  userId: string,
  input: PomodoroSettingsInput,
  statsDayKey?: string,
): Promise<PomodoroStateDto> {
  const workMinutes = Math.max(1, Math.min(180, Math.floor(input.workMinutes)))
  const restMinutes = Math.max(1, Math.min(180, Math.floor(input.restMinutes)))
  const longRestMinutes = Math.max(1, Math.min(180, Math.floor(input.longRestMinutes)))
  const cyclesUntilLongRest = Math.max(1, Math.min(12, Math.floor(input.cyclesUntilLongRest)))
  const phaseChangeSound = normalizePhaseChangeSoundId(input.phaseChangeSound)
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const state = await tick(ctx, userId, Date.now(), statsDayKey)
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
      phaseChangeSound,
      phaseRemainingSec: state.status === 'stopped' ? workMinutes * 60 : state.phaseRemainingSec
    })
  })
}

export async function start(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    await closeLaunchSegment(ctx, userId, nowMs, 'restart')
    const remaining = state.workMinutes * 60
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      phase: 'work',
      status: 'running',
      phaseRemainingSec: remaining,
      phaseEndsAtMs: nowMs + remaining * 1000,
      cyclesCompleted: 0
    })
    await startLaunchSegment(ctx, userId, nextState, 'start', nowMs)
    return nextState
  })
}

export async function resume(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    if (state.status === 'awaiting_continue') {
      return advanceToNextPhaseAfterOvertime(ctx, userId, state, nowMs, 'continue')
    }
    if (state.status !== 'paused') return state
    const remaining = Math.max(1, state.phaseRemainingSec)
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      status: 'running',
      phaseRemainingSec: remaining,
      phaseEndsAtMs: nowMs + remaining * 1000
    })
    await startLaunchSegment(ctx, userId, nextState, 'resume', nowMs)
    return nextState
  })
}

export async function skipPhase(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    if (state.status === 'awaiting_continue') {
      return advanceToNextPhaseAfterOvertime(ctx, userId, state, nowMs, 'skip')
    }
    if (state.status !== 'running') return state
    return skipFromRunningPhase(ctx, userId, nowMs, state)
  })
}

export async function pause(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    if (state.status !== 'running') return state
    const remaining = Math.max(0, Math.floor((state.phaseEndsAtMs - nowMs) / 1000))
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      status: 'paused',
      phaseRemainingSec: remaining,
      phaseEndsAtMs: 0
    })
    await closeLaunchSegment(ctx, userId, nowMs, 'pause')
    return nextState
  })
}

export async function stop(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      status: 'stopped',
      phase: 'work',
      phaseRemainingSec: state.workMinutes * 60,
      phaseEndsAtMs: 0,
      currentTaskId: null
    })
    await closeLaunchSegment(ctx, userId, nowMs, 'stop')
    return nextState
  })
}

/** Полная остановка и возврат к началу серии (первый цикл, таймер на полный work, без запуска). */
export async function reset(ctx: app.Ctx, userId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    if (state.status === 'stopped') return state
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      status: 'stopped',
      phase: 'work',
      phaseRemainingSec: state.workMinutes * 60,
      phaseEndsAtMs: 0,
      currentTaskId: null,
      cyclesCompleted: 0
    })
    await closeLaunchSegment(ctx, userId, nowMs, 'stop')
    return nextState
  })
}

export async function assignTask(ctx: app.Ctx, userId: string, taskId: string, statsDayKey?: string): Promise<PomodoroStateDto> {
  return runWithExclusiveLock(ctx, lockKey(userId), async () => {
    if (taskId) {
      const task = await tasksRepo.findTaskByIdForUser(ctx, userId, taskId)
      if (!task) throw new Error('Task not found')
    }
    const nowMs = Date.now()
    const state = await tick(ctx, userId, nowMs, statsDayKey)
    const nextTaskId = taskId || null
    const changedDuringRun = state.status === 'running' && (state.currentTaskId || null) !== nextTaskId
    if (changedDuringRun) {
      await closeLaunchSegment(ctx, userId, nowMs, 'task_changed')
    }
    const nextState = await pomodoroRepo.updateState(ctx, userId, {
      currentTaskId: nextTaskId,
      phaseRemainingSec: state.phaseRemainingSec
    })
    if (changedDuringRun) {
      await startLaunchSegment(ctx, userId, nextState, 'task_changed', nowMs)
    }
    return nextState
  })
}
