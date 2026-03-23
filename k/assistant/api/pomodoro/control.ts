// @shared-route
import { requireRealUser } from '@app/auth'
import * as pomodoroLib from '../../lib/pomodoro.lib'

export const pomodoroControlRoute = app
  .body((s) => ({
    action: s.string()
  }))
  .post('/', async (ctx, req) => {
    const user = requireRealUser(ctx)
    const action = req.body.action.trim()
    if (action !== 'start' && action !== 'resume' && action !== 'pause' && action !== 'stop' && action !== 'skip' && action !== 'reset') {
      return { success: false, error: 'Unknown action' }
    }
    try {
      if (action === 'start') {
        return { success: true, state: await pomodoroLib.start(ctx, user.id), serverNowMs: Date.now() }
      }
      if (action === 'resume') {
        return { success: true, state: await pomodoroLib.resume(ctx, user.id), serverNowMs: Date.now() }
      }
      if (action === 'pause') {
        return { success: true, state: await pomodoroLib.pause(ctx, user.id), serverNowMs: Date.now() }
      }
      if (action === 'skip') {
        return { success: true, state: await pomodoroLib.skipPhase(ctx, user.id), serverNowMs: Date.now() }
      }
      if (action === 'reset') {
        return { success: true, state: await pomodoroLib.reset(ctx, user.id), serverNowMs: Date.now() }
      }
      return { success: true, state: await pomodoroLib.stop(ctx, user.id), serverNowMs: Date.now() }
    } catch (error) {
      ctx.account.log(`pomodoro.control error`, {
        level: 'error',
        json: { userId: user.id, action, error: String(error) }
      })
      return { success: false, error: 'Не удалось выполнить действие pomodoro' }
    }
  })
