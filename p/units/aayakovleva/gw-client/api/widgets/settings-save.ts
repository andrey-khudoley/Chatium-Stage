// @shared-route
/**
 * `POST /api/widgets/settings-save` — приватный эндпоинт для панели.
 *
 * Body: `{ key: string, value: unknown }`. Whitelist допускает только 12
 * виджет-ключей из `SETTING_KEYS`. Иные ключи отклоняются с
 * `WIDGET_SETTINGS_KEY_NOT_ALLOWED` — это второй слой защиты помимо валидации
 * в `lib/settings.mutations.ts` (общий `setSetting` принимает и не-виджетные
 * ключи, но этот эндпоинт намеренно сужает доменом виджетов).
 *
 * Доступ — `guardInternalApi` (Admin или сотрудник с активным `panel_access`):
 * виджет-настройки — operational/бизнес-уровень, не секреты. Реальная защита
 * виджет-flow — серверный hard-limit в `intent-*` и per-user-max. Помечен
 * `// @shared-route` для `.run()` из Vue (карточка `HomeWidgetSettings.vue`).
 */

import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'
import { guardInternalApi } from '../../lib/access/apiGuard'

const LOG_PATH = 'api/widgets/settings-save'

const ALLOWED_WIDGET_KEYS: ReadonlySet<string> = new Set([
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_ENABLED,
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_DOMAINS,
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_MIN,
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_MAX,
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_OFFER_LIST_TYPE,
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_OFFER_IDS,
  settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_OFFERS,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_ENABLED,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_DOMAINS,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_MIN,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_MAX,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_OFFER_LIST_TYPE,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_OFFER_IDS,
  settingsLib.SETTING_KEYS.WIDGET_LAVATOP_OFFERS
])

export const widgetSettingsSaveRoute = app.post('/', async (ctx, req) => {
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
    return { success: false, error: 'WIDGET_SETTINGS_KEY_MISSING' }
  }

  if (!ALLOWED_WIDGET_KEYS.has(key)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] key_not_allowed`,
      payload: { key }
    })
    return { success: false, error: 'WIDGET_SETTINGS_KEY_NOT_ALLOWED' }
  }

  try {
    await settingsLib.setSetting(ctx, key, value)
    const saved = await settingsLib.getSetting(ctx, key)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] saved`,
      payload: { key }
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

export default widgetSettingsSaveRoute
