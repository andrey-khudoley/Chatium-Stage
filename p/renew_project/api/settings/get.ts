// @shared-route
import { requireAccountRole } from '@app/auth'
import * as settingsLib from '../../lib/settings.lib'

/**
 * GET /api/settings/get?key= — получить одну настройку.
 * Только Admin.
 */
export const getSettingRoute = app.get('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const key = req.query.key as string
  if (!key || typeof key !== 'string' || !key.trim()) {
    return { success: false, error: 'Параметр key обязателен' }
  }

  try {
    const value = await settingsLib.getSetting(ctx, key.trim())
    return { success: true, key: key.trim(), value }
  } catch (error) {
    ctx.account.log('Error getting setting', {
      level: 'error',
      json: { key, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})
