import * as loggerLib from '../../../../lib/logger.lib'
import * as webhookService from '../../../../lib/lava-webhook.service'
import type { LavaWebhookPayload } from '../../../../lib/lava-types'

const LOG_PATH = 'api/integrations/lava/webhook'

/** Валюта тела webhook (согласовано с `lib/lava-types`). */
enum LavaCurrencyEnum {
  RUB = 'RUB',
  USD = 'USD',
  EUR = 'EUR'
}

/** Значения `eventType` из контракта Lava. */
enum LavaWebhookEventTypeEnum {
  PaymentSuccess = 'payment.success',
  PaymentFailed = 'payment.failed',
  SubRecurringSuccess = 'subscription.recurring.payment.success',
  SubRecurringFailed = 'subscription.recurring.payment.failed',
  SubCancelled = 'subscription.cancelled'
}

/** Значения `status` контракта в webhook Lava. */
enum LavaContractStatusEnum {
  New = 'new',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  SubActive = 'subscription-active',
  SubExpired = 'subscription-expired',
  SubCancelled = 'subscription-cancelled',
  SubFailed = 'subscription-failed'
}

function extractApiKey(req: app.Req): string {
  const headers = req.headers as Record<string, string | string[] | undefined>
  const raw = headers['x-api-key'] ?? headers['X-Api-Key']
  const v = Array.isArray(raw) ? raw[0] : raw
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * POST …/api/integrations/lava/webhook — приём webhook от Lava (PurchaseWebhookLog).
 * Auth: заголовок `X-Api-Key` = настройка `lava_webhook_secret`.
 */
export const lavaWebhookRoute = app
  .body((s) => ({
    eventType: s.enum(LavaWebhookEventTypeEnum),
    product: s.optional(s.object({ id: s.string(), title: s.string() })),
    contractId: s.string(),
    parentContractId: s.optional(s.string()),
    buyer: s.optional(s.object({ email: s.string() })),
    amount: s.number(),
    currency: s.enum(LavaCurrencyEnum),
    status: s.enum(LavaContractStatusEnum),
    timestamp: s.string(),
    clientUtm: s.optional(s.record(s.string())),
    errorMessage: s.optional(s.string())
  }))
  .post('/', async (ctx, req) => {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Вход`,
      payload: {
        eventType: req.body.eventType,
        contractId: req.body.contractId,
        status: req.body.status
      }
    })

    const apiKey = extractApiKey(req)
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Заголовок X-Api-Key`,
      payload: { hasApiKey: Boolean(apiKey) }
    })

    const payload = req.body as LavaWebhookPayload

    const result = await webhookService.processWebhook(ctx, payload, apiKey)

    if (!result.success) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] Отказ: неверный или отсутствующий X-Api-Key`,
        payload: {}
      })
      return ctx.resp.json({ success: false }, result.statusCode)
    }

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] Обработано`,
      payload: { duplicate: result.duplicate === true }
    })

    return { success: true }
  })
