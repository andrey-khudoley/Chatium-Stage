// @shared-route
/**
 * `POST /api/settings/save-operational` — сохранение operational-настроек
 * с уровнем доступа «сотрудник» (panel_access) или Admin.
 *
 * Whitelist допускает только operational-ключи, которые редактируются на
 * вкладке «Настройки» главной панели (`HomeSettingsTab`):
 *   - `gc_enabled` — флаг активации GC-интеграции.
 *
 * Виджет-настройки сохраняются отдельным эндпоинтом
 * `api/widgets/settings-save.ts` (тоже под `guardInternalApi`).
 *
 * Иные ключи отклоняются с `OPERATIONAL_KEY_NOT_ALLOWED`. Это второй слой
 * защиты помимо общей валидации в `lib/settings.mutations.ts` — сужает
 * безопасную поверхность операционных правок (секреты/URL/инфра остаются
 * за `api/settings/save.ts` с Admin-only).
 */

import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'
import { guardInternalApi } from '../../lib/access/apiGuard'

const LOG_PATH = 'api/settings/save-operational'

const ALLOWED_OPERATIONAL_KEYS: ReadonlySet<string> = new Set([
  settingsLib.SETTING_KEYS.GC_ENABLED
])

export const saveOperationalSettingRoute = app.post('/', async (ctx, req) => {
  const denied = await guardInternalApi(ctx)
  if (denied) return denied

  const body = req.body as { key?: unknown; value?: unknown }
  const key = typeof body?.key === 'string' ? body.key.trim() : ''
  const value = body?.value

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { key, valueType: typeof value }
  })

  if (!key) {
    return { success: false, error: 'OPERATIONAL_KEY_MISSING' }
  }

  if (!ALLOWED_OPERATIONAL_KEYS.has(key)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] key_not_allowed`,
      payload: { key }
    })
    return { success: false, error: 'OPERATIONAL_KEY_NOT_ALLOWED' }
  }

  try {
    await settingsLib.setSetting(ctx, key, value)
    const saved = await settingsLib.getSetting(ctx, key)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] saved`,
      payload: { key, value: saved }
    })
    return { success: true, key, value: saved }
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] error`,
      payload: { key, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

export default saveOperationalSettingRoute
