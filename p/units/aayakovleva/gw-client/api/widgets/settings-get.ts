// @shared-route
/**
 * `GET /api/widgets/settings-get` — приватный эндпоинт для панели.
 *
 * Возвращает текущие 12 виджет-настроек в типизированном виде (boolean / number
 * / string[]). Используется компонентом `HomeWidgetSettings.vue` через
 * `.run(ctx)` — поэтому файл помечен `// @shared-route`. Доступ —
 * `guardInternalApi` (Admin или сотрудник с активным `panel_access`).
 */

import * as loggerLib from '../../lib/logger.lib'
import { getWidgetSettings } from '../../lib/widget/widgetSettings.lib'
import { guardInternalApi } from '../../lib/access/apiGuard'

const LOG_PATH = 'api/widgets/settings-get'

export const widgetSettingsGetRoute = app.get('/', async (ctx) => {
  const denied = await guardInternalApi(ctx)
  if (denied) return denied

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: {}
  })

  try {
    const settings = await getWidgetSettings(ctx)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] settings loaded`,
      payload: {
        lifepayEnabled: settings.lifepayEnabled,
        lavatopEnabled: settings.lavatopEnabled,
        lifepayMax: settings.lifepayMax,
        lavatopMax: settings.lavatopMax,
        lifepayOfferListType: settings.lifepayOfferListType,
        lifepayOffersCount: settings.lifepayOffers.length,
        lavatopOfferListType: settings.lavatopOfferListType,
        lavatopOffersCount: settings.lavatopOffers.length
      }
    })
    return { success: true, settings }
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] error`,
      payload: { error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

export default widgetSettingsGetRoute
