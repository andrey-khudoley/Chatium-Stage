import { LockAcquisitionError, runWithExclusiveLock } from '@app/sync'
import type { PaymentLinkRequest, PaymentLinkResponse } from './lava-types'
import * as lavaApi from './lava-api.client'
import * as loggerLib from './logger.lib'
import * as settingsLib from './settings.lib'
import {
  create as createLavaPaymentContract,
  deactivateActiveContractsForGcOrderId,
  findActiveByGcOrderAmountAndCurrency
} from '../repos/lava_payment_contract.repo'
import * as lockLogRepo from '../repos/lava_lock_log.repo'

const LOG_MODULE = 'lib/lava-payment.service'

const LOCK_KEY = 'lava:template-offer:payment-lock'
const LOCK_TIMEOUT_MS = 25000

/**
 * Создание ссылки на оплату: идемпотентность по активному контракту (заказ GC + сумма + валюта),
 * эксклюзивная блокировка шаблонного оффера, PATCH цены → POST invoice → запись в Heap.
 * При смене суммы при том же `gcOrderId` отменяются прочие активные контракты по заказу.
 */
export async function createPaymentLink(
  ctx: app.Ctx,
  params: PaymentLinkRequest
): Promise<PaymentLinkResponse> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] createPaymentLink: вход`,
    payload: {
      gcOrderId: params.gcOrderId,
      amount: params.amount,
      currency: params.currency,
      hasRequestId: Boolean(params.requestId)
    }
  })

  const existing = await findActiveByGcOrderAmountAndCurrency(ctx, {
    gcOrderId: params.gcOrderId,
    amount: params.amount,
    currency: params.currency
  })
  if (existing) {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] createPaymentLink: идемпотентность — активный контракт уже есть (заказ+сумма+валюта)`,
      payload: {
        gcOrderId: params.gcOrderId,
        amount: params.amount,
        currency: params.currency,
        lavaContractId: existing.lava_contract_id
      }
    })
    return {
      success: true,
      gcOrderId: params.gcOrderId,
      lavaContractId: existing.lava_contract_id,
      paymentUrl: existing.payment_url,
      status: 'in-progress'
    }
  }

  const productId = (await settingsLib.getLavaProductId(ctx)).trim()
  const offerId = (await settingsLib.getLavaOfferId(ctx)).trim()
  if (!productId || !offerId) {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] createPaymentLink: CONFIG_ERROR (нет product_id или offer_id)`,
      payload: { hasProductId: Boolean(productId), hasOfferId: Boolean(offerId) }
    })
    return { success: false, errorCode: 'CONFIG_ERROR' }
  }

  const lockRow = await lockLogRepo.create(ctx, {
    lock_key: LOCK_KEY,
    request_id: params.requestId ?? '',
    gc_order_id: params.gcOrderId,
    acquired_at: 0,
    released_at: 0,
    result: 'pending',
    error_message: ''
  })

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] createPaymentLink: запись lock_log создана, ожидание эксклюзивной блокировки`,
    payload: { lockRowId: lockRow.id, gcOrderId: params.gcOrderId }
  })

  try {
    return await runWithExclusiveLock(
      ctx,
      LOCK_KEY,
      { timeoutMs: LOCK_TIMEOUT_MS },
      async (ctx) => {
        await loggerLib.writeServerLog(ctx, {
          severity: 7,
          message: `[${LOG_MODULE}] createPaymentLink: блокировка получена`,
          payload: { lockRowId: lockRow.id, gcOrderId: params.gcOrderId }
        })

        const underLock = await findActiveByGcOrderAmountAndCurrency(ctx, {
          gcOrderId: params.gcOrderId,
          amount: params.amount,
          currency: params.currency
        })
        if (underLock) {
          await loggerLib.writeServerLog(ctx, {
            severity: 7,
            message: `[${LOG_MODULE}] createPaymentLink: под блокировкой найден контракт (гонка устранена)`,
            payload: {
              gcOrderId: params.gcOrderId,
              amount: params.amount,
              currency: params.currency,
              lavaContractId: underLock.lava_contract_id
            }
          })
          await lockLogRepo.updateReleased(ctx, lockRow.id, 'success')
          return {
            success: true,
            gcOrderId: params.gcOrderId,
            lavaContractId: underLock.lava_contract_id,
            paymentUrl: underLock.payment_url,
            status: 'in-progress'
          }
        }

        const superseded = await deactivateActiveContractsForGcOrderId(ctx, params.gcOrderId)
        if (superseded > 0) {
          await loggerLib.writeServerLog(ctx, {
            severity: 7,
            message: `[${LOG_MODULE}] createPaymentLink: отменены устаревшие активные контракты по заказу (другая сумма/валюта)`,
            payload: { gcOrderId: params.gcOrderId, superseded }
          })
        }

        await lockLogRepo.updateAcquiredAt(ctx, lockRow.id, Date.now())

        await loggerLib.writeServerLog(ctx, {
          severity: 7,
          message: `[${LOG_MODULE}] createPaymentLink: PATCH цены оффера Lava`,
          payload: { amount: params.amount, currency: params.currency }
        })

        try {
          await lavaApi.updateOfferPrice(ctx, {
            amount: params.amount,
            currency: params.currency
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          await loggerLib.writeServerLog(ctx, {
            severity: 7,
            message: `[${LOG_MODULE}] createPaymentLink: ошибка PATCH цены`,
            payload: { gcOrderId: params.gcOrderId, error: msg }
          })
          await lockLogRepo.updateReleased(ctx, lockRow.id, 'error', msg)
          await loggerLib.writeServerLog(ctx, {
            severity: 3,
            message: `[${LOG_MODULE}] createPaymentLink: LAVA_UPDATE_ERROR`,
            payload: { gcOrderId: params.gcOrderId, error: msg }
          })
          return { success: false, errorCode: 'LAVA_UPDATE_ERROR' }
        }

        await loggerLib.writeServerLog(ctx, {
          severity: 7,
          message: `[${LOG_MODULE}] createPaymentLink: создание счёта Lava (invoice)`,
          payload: { gcOrderId: params.gcOrderId }
        })

        let contractResult: { contractId: string; paymentUrl: string; status: string }
        try {
          contractResult = await lavaApi.createContract(ctx, {
            email: params.buyerEmail,
            currency: params.currency,
            paymentProvider: params.paymentProvider,
            paymentMethod: params.paymentMethod,
            buyerLanguage: params.buyerLanguage,
            clientUtm: params.utm
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          await loggerLib.writeServerLog(ctx, {
            severity: 7,
            message: `[${LOG_MODULE}] createPaymentLink: ошибка createContract Lava`,
            payload: { gcOrderId: params.gcOrderId, error: msg }
          })
          await lockLogRepo.updateReleased(ctx, lockRow.id, 'error', msg)
          await loggerLib.writeServerLog(ctx, {
            severity: 3,
            message: `[${LOG_MODULE}] createPaymentLink: LAVA_CONTRACT_ERROR`,
            payload: { gcOrderId: params.gcOrderId, error: msg }
          })
          return { success: false, errorCode: 'LAVA_CONTRACT_ERROR' }
        }

        await loggerLib.writeServerLog(ctx, {
          severity: 7,
          message: `[${LOG_MODULE}] createPaymentLink: запись контракта в Heap`,
          payload: { lavaContractId: contractResult.contractId, gcOrderId: params.gcOrderId }
        })

        try {
          await createLavaPaymentContract(ctx, {
            gc_order_id: params.gcOrderId,
            gc_user_id: params.gcUserId ?? '',
            lava_contract_id: contractResult.contractId,
            lava_product_id: productId,
            lava_offer_id: offerId,
            amount: params.amount,
            currency: params.currency,
            buyer_email: params.buyerEmail,
            payment_url: contractResult.paymentUrl,
            status: 'created',
            request_id: params.requestId ?? '',
            created_at: Date.now(),
            updated_at: Date.now()
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          await loggerLib.writeServerLog(ctx, {
            severity: 7,
            message: `[${LOG_MODULE}] createPaymentLink: ошибка записи контракта в Heap`,
            payload: { gcOrderId: params.gcOrderId, error: msg }
          })
          await lockLogRepo.updateReleased(ctx, lockRow.id, 'error', msg)
          await loggerLib.writeServerLog(ctx, {
            severity: 3,
            message: `[${LOG_MODULE}] createPaymentLink: Heap create failed`,
            payload: { gcOrderId: params.gcOrderId, error: msg }
          })
          return {
            success: false,
            errorCode: 'INTERNAL_ERROR',
            message: msg
          }
        }

        await lockLogRepo.updateReleased(ctx, lockRow.id, 'success')

        await loggerLib.writeServerLog(ctx, {
          severity: 7,
          message: `[${LOG_MODULE}] createPaymentLink: lock освобождён (success)`,
          payload: { lockRowId: lockRow.id }
        })

        await loggerLib.writeServerLog(ctx, {
          severity: 6,
          message: `[${LOG_MODULE}] createPaymentLink: success`,
          payload: {
            gcOrderId: params.gcOrderId,
            lavaContractId: contractResult.contractId
          }
        })

        return {
          success: true,
          gcOrderId: params.gcOrderId,
          lavaContractId: contractResult.contractId,
          paymentUrl: contractResult.paymentUrl,
          status: 'in-progress'
        }
      }
    )
  } catch (e) {
    if (e instanceof LockAcquisitionError) {
      await loggerLib.writeServerLog(ctx, {
        severity: 7,
        message: `[${LOG_MODULE}] createPaymentLink: таймаут блокировки (PAYMENT_TEMPLATE_BUSY)`,
        payload: { gcOrderId: params.gcOrderId, lockRowId: lockRow.id }
      })
      await lockLogRepo.updateReleased(ctx, lockRow.id, 'timeout')
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_MODULE}] createPaymentLink: PAYMENT_TEMPLATE_BUSY`,
        payload: { gcOrderId: params.gcOrderId }
      })
      return { success: false, errorCode: 'PAYMENT_TEMPLATE_BUSY' }
    }
    throw e
  }
}
