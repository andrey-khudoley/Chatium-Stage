/**
 * Репозиторий журнала исходящих вызовов gateway (implementation-plan §1.8.1).
 *
 * Слой работы с БД: только Heap-операции, без бизнес-логики.
 *
 * Поле `requestedAt` (Unix ms) — момент исходящего вызова к gateway. Названо
 * `requestedAt`, а не `createdAt`, чтобы не конфликтовать с системным полем
 * `createdAt: HsDateTime`, добавляемым Heap автоматически.
 */

import RequestLog, { type RequestLogRow } from '../tables/requestLog.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/requestLog.repo'

export type RequestLogCreatePayload = {
  requestId: string
  op: string
  argsRedacted: unknown
  orderNumber: string
  clientHttpStatus: number
  ok: boolean
  errorCode: string
  lpHttpStatus: number
  lpSemanticRule: string
  lpNumericCode: number
  durationMs: number
  requestedAt: number
  rawResponseBody: unknown
}

export async function create(
  ctx: app.Ctx,
  data: RequestLogCreatePayload
): Promise<RequestLogRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create entry`,
    payload: { requestId: data.requestId, op: data.op, ok: data.ok, errorCode: data.errorCode }
  })
  const row = await RequestLog.create(ctx, data)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create exit`,
    payload: { requestId: data.requestId }
  })
  return row
}

export async function findRecent(ctx: app.Ctx, limit: number): Promise<RequestLogRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findRecent entry`,
    payload: { limit }
  })
  const rows = await RequestLog.findAll(ctx, {
    order: [{ requestedAt: 'desc' }],
    limit
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findRecent exit`,
    payload: { limit, count: rows.length }
  })
  return rows
}

export async function findBeforeRequestedAt(
  ctx: app.Ctx,
  beforeRequestedAt: number,
  limit: number
): Promise<RequestLogRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findBeforeRequestedAt entry`,
    payload: { beforeRequestedAt, limit }
  })
  const rows = await RequestLog.findAll(ctx, {
    where: { requestedAt: { $lt: beforeRequestedAt } },
    order: [{ requestedAt: 'desc' }],
    limit
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findBeforeRequestedAt exit`,
    payload: { beforeRequestedAt, limit, count: rows.length }
  })
  return rows
}

export async function findById(
  ctx: app.Ctx,
  id: string
): Promise<RequestLogRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findById entry`,
    payload: { id }
  })
  const rows = await RequestLog.findAll(ctx, {
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
  orderNumber: string,
  limit: number = 50
): Promise<RequestLogRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findByOrderNumber entry`,
    payload: { orderNumber, limit }
  })
  const rows = await RequestLog.findAll(ctx, {
    where: { orderNumber },
    order: [{ requestedAt: 'desc' }],
    limit
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findByOrderNumber exit`,
    payload: { orderNumber, count: rows.length }
  })
  return rows
}

export async function findByRequestId(
  ctx: app.Ctx,
  requestId: string
): Promise<RequestLogRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findByRequestId entry`,
    payload: { requestId }
  })
  const rows = await RequestLog.findAll(ctx, {
    where: { requestId },
    limit: 1
  })
  const row = rows.length > 0 ? rows[0] : null
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findByRequestId exit`,
    payload: { requestId, found: !!row }
  })
  return row
}

/**
 * Возвращает записи журнала с `requestedAt >= sinceTimestamp`, отсортированные
 * по убыванию (свежие — первыми). Внешний `limit` ограничивает общее количество
 * возвращаемых записей. Внутри идём cursor-пагинацией по 1000 (HARD_BATCH —
 * максимум Heap.findAll, кэп платформы).
 *
 * Пограничный случай: если несколько записей имеют одинаковый `requestedAt` ms
 * и стоят ровно на стыке батчей, одна-две могут не попасть в выборку (из-за
 * фильтра $lt по курсору). Для аналитики p95/avg это незначительно.
 */
const HARD_BATCH = 1000

export async function findRecentSince(
  ctx: app.Ctx,
  sinceTimestamp: number,
  limit: number = 5000
): Promise<RequestLogRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findRecentSince entry`,
    payload: { sinceTimestamp, limit }
  })

  const result: RequestLogRow[] = []
  let cursor: number | null = null

  while (result.length < limit) {
    const where: Record<string, unknown> =
      cursor === null
        ? { requestedAt: { $gte: sinceTimestamp } }
        : { requestedAt: { $gte: sinceTimestamp, $lt: cursor } }

    const remaining = limit - result.length
    const batchSize = Math.min(HARD_BATCH, remaining)

    const rows = await RequestLog.findAll(ctx, {
      where,
      order: [{ requestedAt: 'desc' }],
      limit: batchSize
    })

    if (rows.length === 0) break
    result.push(...rows)
    cursor = rows[rows.length - 1].requestedAt
    if (rows.length < batchSize) break
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] findRecentSince exit`,
    payload: { sinceTimestamp, count: result.length }
  })
  return result
}

export async function countSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] countSince entry`,
    payload: { sinceTimestamp }
  })
  const count = await RequestLog.countBy(ctx, {
    requestedAt: { $gte: sinceTimestamp }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] countSince exit`,
    payload: { sinceTimestamp, count }
  })
  return count
}

export async function countOkSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return RequestLog.countBy(ctx, {
    requestedAt: { $gte: sinceTimestamp },
    ok: true
  })
}
