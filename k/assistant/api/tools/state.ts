// @shared-route
import { requireRealUser } from '@app/auth'
import { genSocketId } from '@app/socket'
import * as focusToolsLib from '../../lib/focus-tools.lib'
import { focusToolsSocketId } from '../../shared/focus-tools-types'

export const toolsStateRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  try {
    const raw = req.query.statsDayKey
    const statsDayKey = typeof raw === 'string' ? raw : undefined
    const full = await focusToolsLib.getFullState(ctx, user.id, statsDayKey)
    const encodedSocketId = await genSocketId(ctx, focusToolsSocketId(user.id))
    return { success: true, ...full, encodedSocketId }
  } catch (error) {
    ctx.account.log('tools.state error', {
      level: 'error',
      json: { userId: user.id, error: String(error) },
    })
    return { success: false, error: 'Не удалось получить состояние инструментов' }
  }
})

export default toolsStateRoute
