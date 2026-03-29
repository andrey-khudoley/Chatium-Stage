import * as loggerLib from '../../../../lib/logger.lib'
import * as paymentService from '../../../../lib/lava-payment.service'
import type { PaymentLinkRequest } from '../../../../lib/lava-types'
import * as settingsLib from '../../../../lib/settings.lib'

const LOG_PATH = 'api/integrations/lava/payment-link'

/** Валюта тела запроса (согласовано с Lava / `lib/lava-types`). */
enum PaymentLinkCurrency {
  RUB = 'RUB',
  USD = 'USD',
  EUR = 'EUR'
}

function extractServiceToken(req: app.Req): string {
  const headers = req.headers as Record<string, string | string[] | undefined>
  const xRaw = headers['x-service-token'] ?? headers['X-Service-Token']
  const x = Array.isArray(xRaw) ? xRaw[0] : xRaw
  if (typeof x === 'string' && x.trim()) return x.trim()
  const authRaw = headers.authorization ?? headers.Authorization
  const auth = Array.isArray(authRaw) ? authRaw[0] : authRaw
  if (typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(\S+)/i)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

/**
 * POST …/api/integrations/lava/payment-link — создание ссылки на оплату для заказа GetCourse.
 * Auth: заголовок `X-Service-Token` или `Authorization: Bearer …` = настройка `gc_service_token`.
 */
export const lavaPaymentLinkRoute = app
  .body((s) => ({
    gcOrderId: s.string(),
    buyerEmail: s.string(),
    amount: s.number(),
    currency: s.enum(PaymentLinkCurrency),
    gcUserId: s.optional(s.string()),
    description: s.optional(s.string()),
    paymentProvider: s.optional(s.string()),
    paymentMethod: s.optional(s.string()),
    buyerLanguage: s.optional(s.string()),
    utm: s.optional(s.record(s.string())),
    requestId: s.optional(s.string())
  }))
  .post('/', async (ctx, req) => {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Вход`,
      payload: {
        gcOrderId: req.body.gcOrderId,
        amount: req.body.amount,
        currency: req.body.currency,
        hasRequestId: !!req.body.requestId
      }
    })

    const expectedToken = (await settingsLib.getGcServiceToken(ctx)).trim()
    if (!expectedToken) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] Отказ: не задан gc_service_token`,
        payload: {}
      })
      return { success: false, errorCode: 'UNAUTHORIZED' }
    }

    const token = extractServiceToken(req)
    if (token !== expectedToken) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] Отказ: неверный сервисный токен`,
        payload: {}
      })
      return { success: false, errorCode: 'UNAUTHORIZED' }
    }

    const gcOrderId = req.body.gcOrderId.trim()
    const buyerEmail = req.body.buyerEmail.trim()
    if (!gcOrderId) {
      await loggerLib.writeServerLog(ctx, {
        severity: 7,
        message: `[${LOG_PATH}] VALIDATION_ERROR: пустой gcOrderId`,
        payload: {}
      })
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'gcOrderId must be non-empty'
      }
    }
    if (!buyerEmail) {
      await loggerLib.writeServerLog(ctx, {
        severity: 7,
        message: `[${LOG_PATH}] VALIDATION_ERROR: пустой buyerEmail`,
        payload: { gcOrderId }
      })
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'buyerEmail must be non-empty'
      }
    }
    if (!Number.isFinite(req.body.amount) || req.body.amount <= 0) {
      await loggerLib.writeServerLog(ctx, {
        severity: 7,
        message: `[${LOG_PATH}] VALIDATION_ERROR: некорректный amount`,
        payload: { gcOrderId, amount: req.body.amount }
      })
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'amount must be a positive finite number'
      }
    }

    const params: PaymentLinkRequest = {
      gcOrderId,
      buyerEmail,
      amount: req.body.amount,
      currency: req.body.currency,
      gcUserId: req.body.gcUserId?.trim() || undefined,
      description: req.body.description?.trim() || undefined,
      paymentProvider: req.body.paymentProvider?.trim() || undefined,
      paymentMethod: req.body.paymentMethod?.trim() || undefined,
      buyerLanguage: req.body.buyerLanguage?.trim() || undefined,
      utm: req.body.utm,
      requestId: req.body.requestId?.trim() || undefined
    }

    const result = await paymentService.createPaymentLink(ctx, params)

    await loggerLib.writeServerLog(ctx, {
      severity: result.success ? 6 : 4,
      message: `[${LOG_PATH}] Выход`,
      payload: {
        success: result.success,
        gcOrderId: result.gcOrderId,
        errorCode: result.errorCode,
        hasPaymentUrl: !!result.paymentUrl
      }
    })

    return result
  })
