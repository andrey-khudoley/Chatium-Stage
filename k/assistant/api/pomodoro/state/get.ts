// @shared-route
import { requireRealUser } from '@app/auth'
import * as pomodoroLib from '../../../lib/pomodoro.lib'

export const getPomodoroStateRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  try {
    const raw = req.query.statsDayKey
    const statsDayKey = typeof raw === 'string' ? raw : undefined
    const state = await pomodoroLib.getState(ctx, user.id, statsDayKey)
    return { success: true, state, serverNowMs: Date.now() }
  } catch (error) {
    ctx.account.log(`pomodoro.state.get error`, {
      level: 'error',
      json: { userId: user.id, error: String(error) }
    })
    return { success: false, error: 'Не удалось получить состояние pomodoro' }
  }
})
