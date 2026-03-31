import * as loggerLib from '../../../../lib/logger.lib'
import { normalizeLavaCurrency } from '../../../../lib/lava-currency.lib'
import * as paymentService from '../../../../lib/lava-payment.service'
import type { PaymentLinkRequest } from '../../../../lib/lava-types'
import { normalizeStringRecord } from '../../../../lib/normalize-string-record.lib'

const LOG_PATH = 'api/integrations/lava/payment-link'

/**
 * POST …/api/integrations/lava/payment-link — создание ссылки на оплату для заказа GetCourse.
 * Вызов без заголовков авторизации (в т.ч. с браузера / встроенного JS на странице оплаты).
 */
export const lavaPaymentLinkRoute = app
  .body((s) => ({
    /** Идентификатор заказа GetCourse (классическое имя поля). */
    gcOrderId: s.optional(s.string()),
    /** Алиас из сценариев GetCourse — то же, что `gcOrderId`. */
    orderNumber: s.optional(s.string()),
    buyerEmail: s.optional(s.string()),
    /** Алиас для email покупателя (GetCourse). */
    email: s.optional(s.string()),
    amount: s.number(),
    /** RUB / USD / EUR (регистр не важен; см. `normalizeLavaCurrency`). */
    currency: s.string(),
    gcUserId: s.optional(s.string()),
    /** Текст предложения GetCourse (offer). */
    offer: s.optional(s.string()),
    /** Название продукта/пакета GetCourse — в Lava PATCH как `offers[].name`. */
    product: s.optional(s.string()),
    description: s.optional(s.string()),
    paymentProvider: s.optional(s.string()),
    paymentMethod: s.optional(s.string()),
    buyerLanguage: s.optional(s.string()),
    /** Произвольный JSON-объект; не `s.record(…)` — в UGC падает restrictModifiers. */
    utm: s.optional(s.unknown()),
    requestId: s.optional(s.string()),
    /**
     * Тестовый режим: при `true` после валидации полей возвращается успех без Lava/Heap.
     * GetCourse в проде поле не передаёт.
     */
    integrationTestDryRun: s.optional(s.boolean())
  }))
  .post('/', async (ctx, req) => {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Вход`,
      payload: {
        gcOrderId: req.body.gcOrderId,
        orderNumber: req.body.orderNumber,
        amount: req.body.amount,
        currency: req.body.currency,
        hasOffer: req.body.offer != null,
        hasProduct: req.body.product != null,
        hasRequestId: !!req.body.requestId,
        integrationTestDryRun: !!req.body.integrationTestDryRun
      }
    })

    const gcOrderId = (req.body.gcOrderId ?? req.body.orderNumber ?? '').trim()
    const rawBuyerEmail = req.body.buyerEmail ?? req.body.email ?? ''
    const buyerEmail = rawBuyerEmail.trim()
    const emailCharCodes = Array.from(buyerEmail).map((char) => char.charCodeAt(0))

    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] DEBUG email payload`,
      payload: {
        rawBuyerEmail,
        buyerEmail,
        buyerEmailTrimmed: buyerEmail,
        buyerEmailLength: buyerEmail.length,
        buyerEmailEqualsTrimmed: rawBuyerEmail === buyerEmail,
        buyerEmailLowercase: buyerEmail.toLowerCase(),
        buyerEmailCharCodes: emailCharCodes
      }
    })
    const currencyNorm = normalizeLavaCurrency(req.body.currency)
    if (!currencyNorm) {
      await loggerLib.writeServerLog(ctx, {
        severity: 7,
        message: `[${LOG_PATH}] VALIDATION_ERROR: неподдерживаемая валюта`,
        payload: { raw: req.body.currency }
      })
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'currency must be RUB, USD or EUR (Lava)'
      }
    }
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
        message: `[${LOG_PATH}] VALIDATION_ERROR: пустой email (buyerEmail / email)`,
        payload: { gcOrderId }
      })
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'buyerEmail or email must be non-empty'
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

    if (req.body.integrationTestDryRun === true) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] integrationTestDryRun — ответ без Lava`,
        payload: { gcOrderId }
      })
      return {
        success: true,
        integrationTestDryRun: true,
        gcOrderId,
        lavaContractId: 'integration-test-dry-run-contract',
        paymentUrl: 'https://integration-test.invalid/lava-dry-run',
        status: 'dry-run'
      }
    }

    const gcOfferTitle = req.body.offer?.trim() ?? ''
    const gcProductTitle = req.body.product?.trim() ?? ''

    const params: PaymentLinkRequest = {
      gcOrderId,
      buyerEmail,
      amount: req.body.amount,
      currency: currencyNorm,
      gcOfferTitle: gcOfferTitle || undefined,
      gcProductTitle: gcProductTitle || undefined,
      gcUserId: req.body.gcUserId?.trim() || undefined,
      description: req.body.description?.trim() || undefined,
      paymentProvider: req.body.paymentProvider?.trim() || undefined,
      paymentMethod: req.body.paymentMethod?.trim() || undefined,
      buyerLanguage: req.body.buyerLanguage?.trim() || undefined,
      utm: normalizeStringRecord(req.body.utm),
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
        hasPaymentUrl: !!result.paymentUrl,
        hasMessage: typeof result.message === 'string' && result.message.length > 0
      }
    })

    return result
  })
