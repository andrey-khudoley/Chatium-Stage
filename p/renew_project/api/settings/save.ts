// @shared-route
import { requireAccountRole } from '@app/auth'
import * as settingsLib from '../../lib/settings.lib'

/**
 * POST /api/settings/save — сохранить настройку.
 * Body: { key: string, value: unknown }
 * Только Admin.
 */
export const saveSettingRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const body = req.body as { key?: unknown; value?: unknown }
  const key = typeof body?.key === 'string' ? body.key.trim() : ''
  const value = body?.value

  if (!key) {
    return { success: false, error: 'Поле key обязательно' }
  }

  try {
    await settingsLib.setSetting(ctx, key, value)
    const saved = await settingsLib.getSetting(ctx, key)
    return { success: true, key, value: saved }
  } catch (error) {
    ctx.account.log('Error saving setting', {
      level: 'error',
      json: { key, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})
