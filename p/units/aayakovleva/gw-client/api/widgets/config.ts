/**
 * `POST /api/widgets/config` — публичный CORS-защищённый эндпоинт.
 *
 * ВНИМАНИЕ: эндпоинт сознательно публичный. Защита — whitelist Origin.
 * Принимает тело text/plain с JSON { dealId, positions }. Возвращает
 * `WidgetAvailabilityConfig` с полем `enabled` для каждого метода.
 * Оффер-фильтр применяется по `positions` из тела. Сумма берётся из GC
 * при заданных min/max настройках (кэш 60с). Стратегия — fail-closed:
 * если GC недоступен, метод с ценовым ограничением отключается.
 *
 * CORS-стратегия: simple-request, без OPTIONS-preflight (Content-Type: text/plain).
 * Origin запроса проверяется по объединению `widget_lifepay_domains` и
 * `widget_lavatop_domains`.
 *
 * `requireRealUser`/`requireInternalAccess` НЕ применяются сознательно —
 * userscript исполняется в браузере покупателя.
 */

import * as loggerLib from '../../lib/logger.lib'
import { getWidgetSettings } from '../../lib/widget/widgetSettings.lib'
import {
  checkWidgetOrigin,
  parseDomains,
  type WidgetCorsResult
} from '../../shared/widgetCorsCheck'
import {
  areAllOffersAllowed,
  type WidgetAvailabilityConfig
} from '../../shared/widgetSettingsTypes'
import { resolveGcDealAmount } from '../../lib/gateway/gcDealResolver'
import { getCachedGcDealAmount, setCachedGcDealAmount } from '../../lib/gateway/gcDealCache'

const LOG_PATH = 'api/widgets/config'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readHeaders(req: app.Req): Record<string, unknown> {
  const h = (req as unknown as { headers?: unknown }).headers
  return isObject(h) ? h : {}
}

function parseBody(req: app.Req): Record<string, unknown> | null {
  const raw = (req as unknown as { body?: unknown }).body
  if (isObject(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return isObject(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
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

export const widgetConfigRoute = app.post('/', async (ctx, req) => {
  const headers = readHeaders(req)
  const settings = await getWidgetSettings(ctx)
  const allDomains = mergeAllowedDomains(settings.lifepayDomains, settings.lavatopDomains)
  const corsResult = checkWidgetOrigin(headers, allDomains)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: {
      hostname: corsResult.hostname,
      allowed: corsResult.allowed,
      lifepayEnabled: settings.lifepayEnabled,
      lavatopEnabled: settings.lavatopEnabled
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

  const body = parseBody(req)
  if (!body) {
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_BODY_INVALID' },
      buildCorsHeaders(corsResult)
    )
  }

  // Разбор positions из тела запроса (сверка офферов — только по id)
  const positionsRaw = body.positions
  const positions: { id: string }[] = []
  if (Array.isArray(positionsRaw)) {
    for (const el of positionsRaw) {
      if (isObject(el)) {
        const id = typeof el.id === 'string' ? el.id : ''
        positions.push({ id })
      }
    }
  }

  const dealIdRaw = body.dealId

  // Определяем, нужна ли сумма хотя бы для одного метода
  const lifepayNeedsAmount = settings.lifepayMin > 0 || settings.lifepayMax > 0
  const lavatopNeedsAmount = settings.lavatopMin > 0 || settings.lavatopMax > 0
  const anyNeedsAmount = lifepayNeedsAmount || lavatopNeedsAmount

  let resolvedAmount: number | null = null
  let gcFailed = false
  let cachedHit = false
  let dealIdNormalized: string | undefined

  if (anyNeedsAmount) {
    // Валидация dealId
    if (
      (typeof dealIdRaw !== 'string' && typeof dealIdRaw !== 'number') ||
      String(dealIdRaw).trim() === ''
    ) {
      return jsonResponse(
        400,
        { ok: false, error: 'WIDGET_BODY_INVALID' },
        buildCorsHeaders(corsResult)
      )
    }

    const dealIdNum = Number(String(dealIdRaw).trim())
    if (!Number.isInteger(dealIdNum) || dealIdNum <= 0) {
      return jsonResponse(
        400,
        { ok: false, error: 'WIDGET_BODY_INVALID' },
        buildCorsHeaders(corsResult)
      )
    }

    dealIdNormalized = String(dealIdNum)

    const cached = await getCachedGcDealAmount(ctx, dealIdNormalized)
    if (cached !== null) {
      resolvedAmount = cached
      cachedHit = true
    } else {
      const res = await resolveGcDealAmount(ctx, dealIdNum)
      if (res.ok) {
        resolvedAmount = res.amountRub
        await setCachedGcDealAmount(ctx, dealIdNormalized, res.amountRub)
      } else {
        gcFailed = true
      }
    }
  }

  // Вычисление enabled для LifePay
  const lifepayOfferOk = areAllOffersAllowed(
    positions,
    settings.lifepayOffers,
    settings.lifepayOfferListType
  )
  let lifepayAmountOk: boolean
  if (!lifepayNeedsAmount) {
    lifepayAmountOk = true
  } else if (resolvedAmount === null) {
    // fail-closed: GC упал или не запрошен
    lifepayAmountOk = false
  } else {
    lifepayAmountOk =
      !(settings.lifepayMin > 0 && resolvedAmount < settings.lifepayMin) &&
      !(settings.lifepayMax > 0 && resolvedAmount > settings.lifepayMax)
  }
  const lifepayEnabled = settings.lifepayEnabled && lifepayOfferOk && lifepayAmountOk

  // Вычисление enabled для Lava.Top
  const lavatopOfferOk = areAllOffersAllowed(
    positions,
    settings.lavatopOffers,
    settings.lavatopOfferListType
  )
  let lavatopAmountOk: boolean
  if (!lavatopNeedsAmount) {
    lavatopAmountOk = true
  } else if (resolvedAmount === null) {
    lavatopAmountOk = false
  } else {
    lavatopAmountOk =
      !(settings.lavatopMin > 0 && resolvedAmount < settings.lavatopMin) &&
      !(settings.lavatopMax > 0 && resolvedAmount > settings.lavatopMax)
  }
  const lavatopEnabled = settings.lavatopEnabled && lavatopOfferOk && lavatopAmountOk

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] success`,
    payload: {
      hostname: corsResult.hostname,
      anyNeedsAmount,
      cachedHit,
      gcFailed,
      dealId: dealIdNormalized,
      lifepayEnabled,
      lavatopEnabled
    }
  })

  const config: WidgetAvailabilityConfig = {
    lifepay: { enabled: lifepayEnabled },
    lavatop: { enabled: lavatopEnabled }
  }

  return jsonResponse(200, { ok: true, config }, buildCorsHeaders(corsResult))
})

export default widgetConfigRoute
