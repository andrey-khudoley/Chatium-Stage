// @shared-route
import { requireRealUser } from '@app/auth'
import * as pomodoroLib from '../../lib/pomodoro.lib'

export const pomodoroAssignTaskRoute = app
  .body((s) => ({
    taskId: s.string()
  }))
  .post('/', async (ctx, req) => {
    const user = requireRealUser(ctx)
    try {
      const state = await pomodoroLib.assignTask(ctx, user.id, req.body.taskId)
      return { success: true, state, serverNowMs: Date.now() }
    } catch (error) {
      ctx.account.log(`pomodoro.assign-task error`, { level: 'error', json: { error: String(error) } })
      return { success: false, error: 'Не удалось привязать задачу к pomodoro' }
    }
  })
