/**
 * Downstream-вызов GC `createDeal` при успешной оплате LifePay.
 *
 * Два экспорта:
 *   - buildCreateDealArgs — чистая функция маппинга из webhook-данных в аргументы GC;
 *   - updateGcDealOnPayment — async-обёртка: вызывает invokeByGateway и логирует результат.
 *
 * Не содержит Heap-операций и импортов tables/repos. Предназначен только для
 * серверного вызова из web/webhook/index.tsx.
 */

import { invokeByGateway } from '../gateway/invokeDispatcher'
import * as loggerLib from '../logger.lib'

const LOG_MODULE = 'lib/webhook/gcDealUpdate'

/**
 * Строит аргументы `createDeal` из данных webhook-платежа.
 *
 * Замечания:
 *   - `deal_is_paid` передаётся строкой `'1'` (требование валидатора GC gateway).
 *   - `deal_cost` включается ТОЛЬКО если `amount` парсится в конечное число > 0.
 *     `amount === '0'`, `'0.00'` или нечисловые значения → `deal_cost` намеренно
 *     не передаётся (нулевая / неизвестная сумма неинформативна для GC).
 */
export function buildCreateDealArgs(input: {
  orderNumber: string
  email: string
  amount?: string
}): {
  params: {
    user: { email: string }
    deal: {
      deal_number: string
      deal_status: string
      deal_is_paid: string
      deal_cost?: number
    }
  }
} {
  const deal: {
    deal_number: string
    deal_status: string
    deal_is_paid: string
    deal_cost?: number
  } = {
    deal_number: input.orderNumber,
    deal_status: 'payed',
    deal_is_paid: '1'
  }

  if (input.amount !== undefined) {
    const n = parseFloat(input.amount)
    if (Number.isFinite(n) && n > 0) {
      deal.deal_cost = n
    }
  }

  return {
    params: {
      user: { email: input.email },
      deal
    }
  }
}

/**
 * Вызывает GC `createDeal` для пометки заказа как оплаченного.
 *
 * Не бросает исключений — все ошибки (сетевые и gateway) логируются и
 * возвращаются как `{ ok: false }`, чтобы не блокировать HTTP 200 webhook-ответа.
 */
export async function updateGcDealOnPayment(
  ctx: app.Ctx,
  input: {
    orderNumber: string
    email: string
    amount?: string
    correlationId: string
  }
): Promise<{ ok: boolean }> {
  const { orderNumber, email, amount, correlationId } = input
  try {
    const res = await invokeByGateway(
      ctx,
      'gc',
      'createDeal',
      buildCreateDealArgs({ orderNumber, email, amount }),
      { httpMethod: 'POST' }
    )

    if (res.ok === true) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_MODULE}] gc_deal_update_success`,
        payload: {
          orderNumber,
          correlationId,
          requestId: res.requestId,
          httpStatus: res.httpStatus
        }
      })
      return { ok: true }
    } else {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_MODULE}] gc_deal_update_gateway_error`,
        payload: {
          orderNumber,
          correlationId,
          httpStatus: res.httpStatus,
          proxyError: res.proxyError,
          requestId: res.requestId
        }
      })
      return { ok: false }
    }
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] gc_deal_update_exception`,
      payload: {
        orderNumber,
        correlationId,
        error: String(e)
      }
    })
    return { ok: false }
  }
}
