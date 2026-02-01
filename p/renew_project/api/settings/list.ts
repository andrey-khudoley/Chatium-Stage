// @shared-route
import { requireAccountRole } from '@app/auth'
import * as settingsLib from '../../lib/settings.lib'

/**
 * GET /api/settings/list — список всех настроек (с дефолтами).
 * Только Admin.
 */
export const listSettingsRoute = app.get('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  try {
    const settings = await settingsLib.getAllSettings(ctx)
    return { success: true, settings }
  } catch (error) {
    ctx.account.log('Error listing settings', {
      level: 'error',
      json: { error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})
