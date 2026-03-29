import LavaPaymentContract, { type LavaPaymentContractRow } from '../tables/lava_payment_contract.table'
import * as loggerLib from '../lib/logger.lib'

const LOG = 'repos/lava_payment_contract.repo'

/** Статусы контракта, при которых ссылка на оплату ещё считается «активной» (не терминальные). */
const ACTIVE_CONTRACT_STATUSES = ['created', 'in_progress', 'unknown'] as const

/**
 * Репозиторий контрактов оплаты Lava — слой работы с Heap.
 * Только CRUD-операции, без бизнес-логики.
 */
export async function create(
  ctx: app.Ctx,
  data: Omit<LavaPaymentContractRow, 'id'>
): Promise<LavaPaymentContractRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] create`,
    payload: { gc_order_id: data.gc_order_id, lava_contract_id: data.lava_contract_id }
  })
  const row = await LavaPaymentContract.create(ctx, data)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] create: ok`,
    payload: { id: row.id }
  })
  return row
}

export async function findByGcOrderId(ctx: app.Ctx, gcOrderId: string): Promise<LavaPaymentContractRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] findByGcOrderId`,
    payload: { gcOrderId }
  })
  const row = await LavaPaymentContract.findOneBy(ctx, { gc_order_id: gcOrderId })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] findByGcOrderId: результат`,
    payload: { found: Boolean(row), id: row?.id }
  })
  return row
}

export async function findByLavaContractId(
  ctx: app.Ctx,
  lavaContractId: string
): Promise<LavaPaymentContractRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] findByLavaContractId`,
    payload: { lavaContractId }
  })
  const row = await LavaPaymentContract.findOneBy(ctx, { lava_contract_id: lavaContractId })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] findByLavaContractId: результат`,
    payload: { found: Boolean(row), id: row?.id }
  })
  return row
}

export async function updateStatus(ctx: app.Ctx, id: string, status: string): Promise<void> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] updateStatus`,
    payload: { id, status }
  })
  await LavaPaymentContract.update(ctx, { id, status, updated_at: Date.now() })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] updateStatus: ok`,
    payload: { id }
  })
}

/**
 * Найти контракт по заказу GC со статусом не в терминальных (`paid`, `failed`, `cancelled`).
 * Для идемпотентности payment-link: эквивалентно статусам из `ACTIVE_CONTRACT_STATUSES`.
 */
export async function findActiveByGcOrderId(
  ctx: app.Ctx,
  gcOrderId: string
): Promise<LavaPaymentContractRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] findActiveByGcOrderId`,
    payload: { gcOrderId, statuses: [...ACTIVE_CONTRACT_STATUSES] }
  })
  const row = await LavaPaymentContract.findOneBy(ctx, {
    gc_order_id: gcOrderId,
    status: { $in: [...ACTIVE_CONTRACT_STATUSES] }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG}] findActiveByGcOrderId: результат`,
    payload: { found: Boolean(row), id: row?.id, status: row?.status }
  })
  return row
}
