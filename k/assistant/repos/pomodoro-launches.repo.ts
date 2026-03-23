import PomodoroLaunches from '../tables/pomodoro-launches.table'
import type { PomodoroStateDto } from '../lib/pomodoro-types'
import type { PomodoroLaunchEndReason, PomodoroLaunchSource } from '../tables/pomodoro-launches.table'

type StartLaunchInput = {
  userId: string
  state: Pick<PomodoroStateDto, 'phase' | 'currentTaskId' | 'cyclesCompleted'>
  source: PomodoroLaunchSource
  startedAtMs: number
}

export async function findOpenLaunchByUser(ctx: app.Ctx, userId: string): Promise<typeof PomodoroLaunches.T | null> {
  const rows = await PomodoroLaunches.findAll(ctx, {
    where: { userId, endedAtMs: null },
    order: [{ startedAtMs: 'desc' }],
    limit: 1
  })
  return rows[0] ?? null
}

export async function startLaunch(ctx: app.Ctx, input: StartLaunchInput): Promise<typeof PomodoroLaunches.T> {
  return PomodoroLaunches.create(ctx, {
    userId: input.userId,
    startedAtMs: input.startedAtMs,
    phase: input.state.phase,
    taskId: input.state.currentTaskId || null,
    cyclesCompletedAtStart: Math.max(0, Math.floor(input.state.cyclesCompleted)),
    source: input.source
  })
}

export async function closeLaunch(
  ctx: app.Ctx,
  launchId: string,
  endedAtMs: number,
  endReason: PomodoroLaunchEndReason
): Promise<typeof PomodoroLaunches.T> {
  const launch = await PomodoroLaunches.findById(ctx, launchId)
  if (!launch) throw new Error('Pomodoro launch not found')
  if (launch.endedAtMs) return launch
  const safeEndedAt = Math.max(launch.startedAtMs, Math.floor(endedAtMs))
  const durationSec = Math.max(0, Math.floor((safeEndedAt - launch.startedAtMs) / 1000))
  return PomodoroLaunches.update(ctx, {
    id: launch.id,
    endedAtMs: safeEndedAt,
    durationSec,
    endReason
  })
}

export async function closeOpenLaunchByUser(
  ctx: app.Ctx,
  userId: string,
  endedAtMs: number,
  endReason: PomodoroLaunchEndReason
): Promise<typeof PomodoroLaunches.T | null> {
  const openLaunch = await findOpenLaunchByUser(ctx, userId)
  if (!openLaunch) return null
  return closeLaunch(ctx, openLaunch.id, endedAtMs, endReason)
}
