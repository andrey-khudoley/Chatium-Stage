/**
 * `POST /api/widgets/intent-by-deal` — публичная инициация платежа по id
 * заказа GetCourse (deal-поток виджета). Поддерживает методы 'lifepay' и 'lavatop'.
 *
 * ВНИМАНИЕ: эндпоинт сознательно публичный. Защита:
 *   1) Origin запроса проверяется по whitelist метода (lifepayDomains / lavatopDomains).
 *   2) Серверный hard-limit `WIDGET_INTENT_HARD_LIMIT_RUB`.
 *   3) Метод должен быть включён (lifepayEnabled / lavatopEnabled).
 *   4) Сумма, email и валюта берутся с сервера из GC (не от клиента) —
 *      dealId указывает на конкретный заказ в GetCourse.
 *   5) Audit-лог через `loggerLib.writeServerLog` на каждый вызов.
 *
 * `requireRealUser`/`requireInternalAccess` НЕ применяются сознательно —
 * userscript исполняется в браузере покупателя.
 *
 * Тело запроса принимается как JSON-строка с Content-Type: text/plain (CORS
 * preflight-обход — аналогично intent-lifepay.ts).
 *
 * Порядок проверок (безопасность мутирующего вызова):
 *   getWidgetSettings → whitelist по методу → checkWidgetOrigin →
 *   parseBody → method → enabled-флаг → dealId валидация →
 *   (только после всех проверок) резолвер / мутация.
 * Origin проверяется строго до любых upstream-вызовов.
 */

import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'
import { getWidgetSettings } from '../../lib/widget/widgetSettings.lib'
import { checkWidgetOrigin, type WidgetCorsResult } from '../../shared/widgetCorsCheck'
import { WIDGET_INTENT_HARD_LIMIT_RUB, areAllOffersAllowed } from '../../shared/widgetSettingsTypes'
import { invokeByGateway } from '../../lib/gateway/invokeDispatcher'
import { recordRequestLog } from '../../lib/gateway/recordRequestLog'
import { resolveGcDeal } from '../../lib/gateway/gcDealResolver'
import { handleLavatopDealIntent } from '../../lib/gateway/lavatopDealIntent'
import type { PaymentCurrency } from '../../lib/rates/currencyConverter'
import { getFullUrl, ROUTES } from '../../config/routes'
import { appendCorrelationId } from '../../shared/correlation'

const LOG_PATH = 'api/widgets/intent-by-deal'

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

/** Маппинг кода ошибки резолвера на HTTP-статус ответа. */
function resolveErrorToHttpStatus(code: string): 400 | 404 | 409 | 422 | 502 {
  switch (code) {
    case 'WIDGET_GC_DEAL_ID_INVALID':
      return 400
    case 'WIDGET_GC_DEAL_NOT_FOUND':
      return 404
    case 'WIDGET_GC_ALREADY_PAID':
      return 409
    case 'WIDGET_GC_EMAIL_MISSING':
    case 'WIDGET_GC_CURRENCY_UNSUPPORTED':
      return 422
    case 'WIDGET_GC_GATEWAY_ERROR':
    default:
      return 502
  }
}

export const widgetIntentByDealRoute = app.post('/', async (ctx, req) => {
  const headers = readHeaders(req)

  // Читаем настройки ДО checkWidgetOrigin — нужны домены по методу
  const settings = await getWidgetSettings(ctx)

  // Читаем тело заранее (нужен method для выбора whitelist)
  const body = parseBody(req)
  if (!body) {
    // Определяем corsResult по lifepay-доменам как дефолт для early-reject
    const earlyCorsWith = checkWidgetOrigin(headers, settings.lifepayDomains)
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_BODY_INVALID' },
      buildCorsHeaders(earlyCorsWith)
    )
  }

  // Метод: разрешены 'lifepay' и 'lavatop'; дефолт — 'lifepay'
  const methodRaw = body.method
  const method = typeof methodRaw === 'string' ? methodRaw.trim() : 'lifepay'
  if (method !== 'lifepay' && method !== 'lavatop') {
    const earlyCorsWith = checkWidgetOrigin(headers, settings.lifepayDomains)
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_GC_METHOD_UNSUPPORTED' },
      buildCorsHeaders(earlyCorsWith)
    )
  }

  // Выбрать whitelist домены по методу — CORS проверяется здесь строго до мутаций
  const domainWhitelist = method === 'lavatop' ? settings.lavatopDomains : settings.lifepayDomains
  const corsResult = checkWidgetOrigin(headers, domainWhitelist)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: {
      method,
      hostname: corsResult.hostname,
      allowed: corsResult.allowed
    }
  })

  if (!corsResult.allowed) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] widget_intent_by_deal: cors_denied`,
      payload: { method, hostname: corsResult.hostname, ok: false }
    })
    return jsonResponse(
      403,
      { ok: false, error: 'CORS_ORIGIN_NOT_ALLOWED' },
      buildCorsHeaders(corsResult)
    )
  }

  // Флаг включённости по методу
  const enabled = method === 'lavatop' ? settings.lavatopEnabled : settings.lifepayEnabled
  if (!enabled) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] widget_intent_by_deal: method_disabled`,
      payload: { method, hostname: corsResult.hostname, ok: false }
    })
    return jsonResponse(
      403,
      { ok: false, error: 'WIDGET_METHOD_DISABLED' },
      buildCorsHeaders(corsResult)
    )
  }

  // Валидация dealId из тела запроса
  const dealIdRaw = body.dealId
  if (
    (typeof dealIdRaw !== 'string' && typeof dealIdRaw !== 'number') ||
    String(dealIdRaw).trim() === ''
  ) {
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_GC_DEAL_ID_INVALID' },
      buildCorsHeaders(corsResult)
    )
  }

  // ── Ветвь Lava.Top ─────────────────────────────────────────────────────────
  if (method === 'lavatop') {
    // currency обязателен; нормализация toUpperCase; допустимые: RUB, USD, EUR
    const currencyRaw = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : ''
    if (currencyRaw !== 'RUB' && currencyRaw !== 'USD' && currencyRaw !== 'EUR') {
      return jsonResponse(
        400,
        { ok: false, error: 'WIDGET_LAVATOP_CURRENCY_INVALID' },
        buildCorsHeaders(corsResult)
      )
    }
    const currency = currencyRaw as PaymentCurrency

    const result = await handleLavatopDealIntent(ctx, {
      dealId: dealIdRaw,
      currency,
      corsHostname: corsResult.hostname
    })

    if (!result.ok) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] widget_intent_by_deal: lavatop_fail`,
        payload: {
          method,
          hostname: corsResult.hostname,
          dealId: String(dealIdRaw).trim(),
          currency,
          code: result.code,
          httpStatus: result.httpStatus,
          ok: false
        }
      })
      return jsonResponse(
        result.httpStatus,
        { ok: false, error: result.code },
        buildCorsHeaders(corsResult)
      )
    }

    return jsonResponse(
      200,
      {
        ok: true,
        method: 'lavatop',
        paymentUrl: result.paymentUrl,
        correlationId: result.correlationId,
        requestId: result.requestId
      },
      buildCorsHeaders(corsResult)
    )
  }

  // ── Ветвь LifePay (существующая логика без изменений) ──────────────────────

  // Резолвинг заказа из GC
  const resolved = await resolveGcDeal(ctx, dealIdRaw)
  if (!resolved.ok) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] widget_intent_by_deal: resolve_fail`,
      payload: {
        method: 'lifepay',
        hostname: corsResult.hostname,
        dealId: String(dealIdRaw).trim(),
        code: resolved.code,
        ok: false
      }
    })
    return jsonResponse(
      resolveErrorToHttpStatus(resolved.code),
      { ok: false, error: resolved.code },
      buildCorsHeaders(corsResult)
    )
  }

  const amount = resolved.amount

  // Фильтр суммы (hard-limit и пользовательские ограничения)
  if (amount > WIDGET_INTENT_HARD_LIMIT_RUB) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] widget_intent_by_deal: hard_limit_exceeded`,
      payload: {
        method: 'lifepay',
        hostname: corsResult.hostname,
        amount,
        hardLimit: WIDGET_INTENT_HARD_LIMIT_RUB,
        ok: false
      }
    })
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_AMOUNT_EXCEEDS_HARD_LIMIT' },
      buildCorsHeaders(corsResult)
    )
  }
  if (settings.lifepayMin > 0 && amount < settings.lifepayMin) {
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_AMOUNT_BELOW_MIN' },
      buildCorsHeaders(corsResult)
    )
  }
  if (settings.lifepayMax > 0 && amount > settings.lifepayMax) {
    return jsonResponse(
      400,
      { ok: false, error: 'WIDGET_AMOUNT_EXCEEDS_LIMIT' },
      buildCorsHeaders(corsResult)
    )
  }

  // Серверная проверка допуска по позициям заказа из GC
  if (
    !areAllOffersAllowed(resolved.positions, settings.lifepayOffers, settings.lifepayOfferListType)
  ) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] widget_intent_by_deal: offer_not_allowed`,
      payload: {
        method: 'lifepay',
        hostname: corsResult.hostname,
        positionsCount: resolved.positions.length,
        listType: settings.lifepayOfferListType,
        ok: false
      }
    })
    return jsonResponse(
      403,
      { ok: false, error: 'WIDGET_OFFER_NOT_ALLOWED' },
      buildCorsHeaders(corsResult)
    )
  }

  // Детерминированный orderNumber и correlationId по dealId (сырой числовой dealId после нормализации, без префикса)
  const dealIdNormalized = String(Number(String(dealIdRaw).trim()))
  const orderNumber = dealIdNormalized
  const correlationId = dealIdNormalized

  // Webhook callback URL: token из настроек + correlationId через appendCorrelationId
  const webhookToken = await settingsLib.getLpWebhookToken(ctx)
  const baseCallbackUrl = webhookToken
    ? `https://${ctx.account.host}${getFullUrl(ROUTES.webhook)}?token=${webhookToken}`
    : ''
  const callbackUrl = baseCallbackUrl ? appendCorrelationId(baseCallbackUrl, correlationId).url : ''

  const args: Record<string, unknown> = {
    orderNumber,
    amount: resolved.amount,
    customerEmail: resolved.email,
    description: resolved.title || `Оплата заказа ${dealIdNormalized}`,
    callbackUrl,
    correlationId
  }
  if (typeof body.customerPhone === 'string' && body.customerPhone.trim().length > 0) {
    args.customerPhone = body.customerPhone.trim()
  }

  // correlationId не должен уходить в gateway — удаляем из копии args (по образцу api/lp/invoke.ts)
  const argsForGateway: Record<string, unknown> = { ...args }
  delete argsForGateway.correlationId

  const result = await invokeByGateway(ctx, 'lifepay', 'createBill', argsForGateway)
  const responseBody = result.responseBody ?? {}
  const paymentUrl =
    (typeof responseBody.paymentUrl === 'string' && responseBody.paymentUrl) ||
    (typeof (responseBody.data as Record<string, unknown> | undefined)?.paymentUrl === 'string' &&
      ((responseBody.data as Record<string, unknown>).paymentUrl as string)) ||
    ''

  // Запись в request_log — до любого раннего return (покрывает ok=false и ok=true без paymentUrl)
  try {
    await recordRequestLog(ctx, {
      gatewayId: 'lifepay',
      op: 'createBill',
      args: argsForGateway,
      invoke: result,
      correlationId
    })
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] record_log_failed`,
      payload: { correlationId, error: String(e) }
    })
  }

  if (!result.ok || !paymentUrl) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] widget_intent_by_deal: gateway_error`,
      payload: {
        method: 'lifepay',
        hostname: corsResult.hostname,
        dealId: dealIdNormalized,
        orderNumber,
        correlationId,
        ok: false,
        httpStatus: result.httpStatus,
        requestId: result.requestId,
        hasPaymentUrl: false
      }
    })
    return jsonResponse(
      502,
      { ok: false, error: 'WIDGET_GC_GATEWAY_ERROR', requestId: result.requestId },
      buildCorsHeaders(corsResult)
    )
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] widget_intent_by_deal: success`,
    payload: {
      method: 'lifepay',
      hostname: corsResult.hostname,
      dealId: dealIdNormalized,
      amount,
      orderNumber,
      correlationId,
      ok: true,
      requestId: result.requestId,
      hasPaymentUrl: true
    }
  })

  // Ответ не содержит email/amount/title — только навигационные данные (PII-защита)
  return jsonResponse(
    200,
    {
      ok: true,
      paymentUrl,
      orderNumber,
      correlationId,
      requestId: result.requestId
    },
    buildCorsHeaders(corsResult)
  )
})

export default widgetIntentByDealRoute
