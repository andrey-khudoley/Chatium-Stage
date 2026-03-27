// @shared-route
import { requireRealUser } from '@app/auth'
import * as pomodoroLaunchesRepo from '../../repos/pomodoro-launches.repo'

type FocusTool = 'timer' | 'stopwatch'

function isFocusTool(value: unknown): value is FocusTool {
  return value === 'timer' || value === 'stopwatch'
}

export const toolsFocusLogRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as {
    tool?: unknown
    startedAtMs?: unknown
    endedAtMs?: unknown
    taskId?: unknown
  }

  if (!isFocusTool(body.tool)) {
    return { success: false, error: 'Некорректный tool' }
  }
  const startedAtMs = Number(body.startedAtMs)
  const endedAtMs = Number(body.endedAtMs)
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs)) {
    return { success: false, error: 'Некорректные startedAtMs/endedAtMs' }
  }
  if (endedAtMs <= startedAtMs) {
    return { success: false, error: 'endedAtMs должен быть больше startedAtMs' }
  }

  const source = body.tool === 'timer' ? 'tools_timer' : 'tools_stopwatch'
  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : ''
  await pomodoroLaunchesRepo.appendFocusLaunchSegment(ctx, {
    userId: user.id,
    startedAtMs,
    endedAtMs,
    source,
    taskId: taskId || null
  })
  return { success: true }
})

export default toolsFocusLogRoute
