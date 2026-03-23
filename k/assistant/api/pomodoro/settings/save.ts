// @shared-route
import { requireRealUser } from '@app/auth'
import * as pomodoroLib from '../../../lib/pomodoro.lib'

export const savePomodoroSettingsRoute = app
  .body((s) => ({
    workMinutes: s.number(),
    restMinutes: s.number(),
    longRestMinutes: s.number(),
    cyclesUntilLongRest: s.number(),
    pauseAfterWork: s.boolean(),
    pauseAfterRest: s.boolean(),
    afterLongRest: s.string(),
    autoStartRest: s.boolean(),
    autoStartNextCycle: s.boolean(),
    phaseChangeSound: s.number(),
    statsDayKey: s.optional(s.string()),
  }))
  .post('/', async (ctx, req) => {
    const user = requireRealUser(ctx)
    if (req.body.afterLongRest !== 'stop' && req.body.afterLongRest !== 'pause') {
      return { success: false, error: 'afterLongRest must be stop or pause' }
    }
    try {
      const state = await pomodoroLib.saveSettings(
        ctx,
        user.id,
        {
          workMinutes: req.body.workMinutes,
          restMinutes: req.body.restMinutes,
          longRestMinutes: req.body.longRestMinutes,
          cyclesUntilLongRest: req.body.cyclesUntilLongRest,
          pauseAfterWork: req.body.pauseAfterWork,
          pauseAfterRest: req.body.pauseAfterRest,
          afterLongRest: req.body.afterLongRest,
          autoStartRest: req.body.autoStartRest,
          autoStartNextCycle: req.body.autoStartNextCycle,
          phaseChangeSound: req.body.phaseChangeSound,
        },
        req.body.statsDayKey,
      )
      return { success: true, state, serverNowMs: Date.now() }
    } catch (error) {
      ctx.account.log(`pomodoro.settings.save error`, {
        level: 'error',
        json: { userId: user.id, error: String(error) }
      })
      return { success: false, error: 'Не удалось сохранить настройки pomodoro' }
    }
  })
