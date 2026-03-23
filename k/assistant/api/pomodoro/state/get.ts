// @shared-route
import { requireRealUser } from '@app/auth'
import * as pomodoroLib from '../../../lib/pomodoro.lib'

export const getPomodoroStateRoute = app.get('/', async (ctx) => {
  const user = requireRealUser(ctx)
  try {
    const state = await pomodoroLib.getState(ctx, user.id)
    return { success: true, state, serverNowMs: Date.now() }
  } catch (error) {
    ctx.account.log(`pomodoro.state.get error`, {
      level: 'error',
      json: { userId: user.id, error: String(error) }
    })
    return { success: false, error: 'Не удалось получить состояние pomodoro' }
  }
})
