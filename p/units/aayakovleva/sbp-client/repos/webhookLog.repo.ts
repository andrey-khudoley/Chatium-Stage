/**
 * Репозиторий журнала входящих webhook от LifePay (implementation-plan §1.8.1).
 */

import WebhookLog, { type WebhookLogRow } from '../tables/webhookLog.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/webhookLog.repo'

export type WebhookLogCreatePayload = {
  number: string
  type: string
  status: string
  method: string
  amount: string
  orderNumber: string
  tokenValid: boolean
  duplicate: boolean
  processedAt: number
  email: string
  rawBody: unknown
  rawQuery: unknown
}

export async function create(
  ctx: app.Ctx,
  data: WebhookLogCreatePayload
): Promise<WebhookLogRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create entry`,
    payload: {
      number: data.number,
      orderNumber: data.orderNumber,
      tokenValid: data.tokenValid,
      duplicate: data.duplicate
    }
  })
  const row = await WebhookLog.create(ctx, data)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create exit`,
    payload: { number: data.number }
  })
  return row
}

export async function findRecent(ctx: app.Ctx, limit: number): Promise<WebhookLogRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findRecent entry`,
    payload: { limit }
  })
  const rows = await WebhookLog.findAll(ctx, {
    order: [{ processedAt: 'desc' }],
    limit
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findRecent exit`,
    payload: { count: rows.length }
  })
  return rows
}

export async function findById(
  ctx: app.Ctx,
  id: string
): Promise<WebhookLogRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findById entry`,
    payload: { id }
  })
  const rows = await WebhookLog.findAll(ctx, {
    where: { id },
    limit: 1
  })
  const row = rows.length > 0 ? rows[0] : null
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findById exit`,
    payload: { id, found: !!row }
  })
  return row
}

export async function findByOrderNumber(
  ctx: app.Ctx,
  orderNumber: string
): Promise<WebhookLogRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findByOrderNumber entry`,
    payload: { orderNumber }
  })
  const rows = await WebhookLog.findAll(ctx, {
    where: { orderNumber },
    order: [{ processedAt: 'desc' }],
    limit: 100
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findByOrderNumber exit`,
    payload: { orderNumber, count: rows.length }
  })
  return rows
}

export async function countSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return WebhookLog.countBy(ctx, { processedAt: { $gte: sinceTimestamp } })
}

export async function countStatusSuccessSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return WebhookLog.countBy(ctx, {
    processedAt: { $gte: sinceTimestamp },
    status: 'success'
  })
}

export async function countTokenValidSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return WebhookLog.countBy(ctx, {
    processedAt: { $gte: sinceTimestamp },
    tokenValid: true
  })
}
