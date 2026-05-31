/**
 * `GET /api/widgets/config` — публичный CORS-защищённый эндпоинт.
 *
 * ВНИМАНИЕ: эндпоинт сознательно публичный. Защита — whitelist Origin.
 * Возвращает конфигурацию виджетов (enabled/maxAmount каждого метода + список
 * офферов с типом фильтрации) для userscript-ов, встраиваемых на сторонние
 * страницы магазина. `requireRealUser`/`requireInternalAccess` НЕ применяются
 * сознательно — userscript исполняется в браузере покупателя.
 *
 * CORS-стратегия: simple-request, без OPTIONS-preflight. На стороне userscript
 * используется `fetch` без кастомных заголовков и с `credentials: 'omit'`.
 *
 * Origin запроса проверяется по объединению `widget_lifepay_domains` и
 * `widget_lavatop_domains`: достаточно совпадения с любым из списков, потому
 * что для конкретной фильтрации intent-эндпоинты применяют более строгие
 * pre-method whitelist'ы.
 */

import * as loggerLib from '../../lib/logger.lib'
import { getWidgetSettings } from '../../lib/widget/widgetSettings.lib'
import {
  checkWidgetOrigin,
  parseDomains,
  type WidgetCorsResult
} from '../../shared/widgetCorsCheck'
import type { WidgetPublicConfig } from '../../shared/widgetSettingsTypes'

const LOG_PATH = 'api/widgets/config'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readHeaders(req: app.Req): Record<string, unknown> {
  const h = (req as unknown as { headers?: unknown }).headers
  return isObject(h) ? h : {}
}

/** Объединение per-method whitelist'ов: общий список для `/api/widgets/config`. */
function mergeAllowedDomains(lifepayDomainsRaw: string, lavatopDomainsRaw: string): string {
  const merged = [...parseDomains(lifepayDomainsRaw), ...parseDomains(lavatopDomainsRaw)]
  return merged.join(',')
}

function buildCorsHeaders(corsResult: WidgetCorsResult): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  }
  if (corsResult.allowed && corsResult.origin) {
    headers['Access-Control-Allow-Origin'] = corsResult.origin
    headers['Vary'] = 'Origin'
  }
  return headers
}

function jsonResponse(
  statusCode: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string>
) {
  return {
    statusCode,
    rawHttpBody: JSON.stringify(body),
    headers: extraHeaders
  }
}

export const widgetConfigRoute = app.get('/', async (ctx, req) => {
  const headers = readHeaders(req)
  const settings = await getWidgetSettings(ctx)
  const allDomains = mergeAllowedDomains(settings.lifepayDomains, settings.lavatopDomains)
  // Безопасный дефолт: при пустом whitelist (`allDomains === ''`) функция
  // `checkWidgetOrigin` возвращает allowed=false для ЛЮБОГО Origin. Это
  // штатное поведение — пока админ не задал домены, виджет ни на одной
  // странице не получит конфиг.
  const corsResult = checkWidgetOrigin(headers, allDomains)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: {
      hostname: corsResult.hostname,
      allowed: corsResult.allowed,
      lifepayEnabled: settings.lifepayEnabled,
      lavatopEnabled: settings.lavatopEnabled,
      lifepayOffersCount: settings.lifepayOffers.length,
      lavatopOffersCount: settings.lavatopOffers.length,
      whitelistConfigured: allDomains.trim().length > 0
    }
  })

  if (!corsResult.allowed) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] cors_denied`,
      payload: { hostname: corsResult.hostname }
    })
    return jsonResponse(
      403,
      { ok: false, error: 'CORS_ORIGIN_NOT_ALLOWED' },
      buildCorsHeaders(corsResult)
    )
  }

  const body: WidgetPublicConfig = {
    lifepay: {
      enabled: settings.lifepayEnabled,
      minAmount: settings.lifepayMin,
      maxAmount: settings.lifepayMax,
      offerListType: settings.lifepayOfferListType,
      offers: settings.lifepayOffers
    },
    lavatop: {
      enabled: settings.lavatopEnabled,
      minAmount: settings.lavatopMin,
      maxAmount: settings.lavatopMax,
      offerListType: settings.lavatopOfferListType,
      offers: settings.lavatopOffers
    }
  }

  return jsonResponse(200, { ok: true, config: body }, buildCorsHeaders(corsResult))
})

export default widgetConfigRoute
