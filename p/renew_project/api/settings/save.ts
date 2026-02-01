// @shared-route
import { requireAccountRole } from '@app/auth'
import * as settingsLib from '../../lib/settings.lib'

/** Маппинг числовых уровней: -1 = логи выключены, 0 = Disable, 1 = Info, 2 = Warn, 3 = Error, 4 = Debug. */
const LOG_LEVEL_BY_NUMBER: Record<number, string> = {
  [-1]: 'Disable',
  0: 'Disable',
  1: 'Info',
  2: 'Warn',
  3: 'Error',
  4: 'Debug'
}

/** Нормализация значения уровня логирования для lib (Debug | Info | Warn | Error | Disable). Числа -1–4 и строки. */
function normalizeLogLevelValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value) && value in LOG_LEVEL_BY_NUMBER) {
    return LOG_LEVEL_BY_NUMBER[value]
  }
  const s = typeof value === 'string' ? value.trim().toLowerCase() : String(value).toLowerCase()
  if (!s) return 'Info'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * POST /api/settings/save — сохранить настройку.
 * Body: { key: string, value: unknown }
 * Только Admin.
 */
export const saveSettingRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const body = req.body as { key?: unknown; value?: unknown }
  const key = typeof body?.key === 'string' ? body.key.trim() : ''
  let value = body?.value

  if (!key) {
    return { success: false, error: 'Поле key обязательно' }
  }

  if (key === settingsLib.SETTING_KEYS.LOG_LEVEL && value !== undefined && value !== null) {
    value = normalizeLogLevelValue(value)
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
