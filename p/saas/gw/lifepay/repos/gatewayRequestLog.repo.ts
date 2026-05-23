/**
 * Репозиторий журнала входящих запросов к gateway (gatewayRequestLog.table).
 * Слой работы с БД: только Heap-операции, без бизнес-логики.
 */

import GatewayRequestLog, {
  type GatewayRequestLogRow
} from '../tables/gatewayRequestLog.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/gatewayRequestLog.repo'

export type GatewayRequestLogCreatePayload = {
  requestId: string
  op: string
  contour: string
  method: string
  rawArgs: unknown
  rawHeadersSafe: unknown
  clientHttpStatus: number
  errorCode: string
  durationMs: number
  requestedAt: number
}

export async function create(
  ctx: app.Ctx,
  data: GatewayRequestLogCreatePayload
): Promise<GatewayRequestLogRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create entry`,
    payload: { requestId: data.requestId, op: data.op, errorCode: data.errorCode }
  })
  const row = await GatewayRequestLog.create(ctx, data)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create exit`,
    payload: { requestId: data.requestId }
  })
  return row
}

export async function findRecent(
  ctx: app.Ctx,
  limit: number
): Promise<GatewayRequestLogRow[]> {
  return GatewayRequestLog.findAll(ctx, {
    order: [{ requestedAt: 'desc' }],
    limit
  })
}

export async function findById(
  ctx: app.Ctx,
  id: number
): Promise<GatewayRequestLogRow | null> {
  const rows = await GatewayRequestLog.findAll(ctx, {
    where: { id },
    limit: 1
  })
  return rows.length > 0 ? rows[0] : null
}

export async function findByRequestId(
  ctx: app.Ctx,
  requestId: string
): Promise<GatewayRequestLogRow | null> {
  const rows = await GatewayRequestLog.findAll(ctx, {
    where: { requestId },
    limit: 1
  })
  return rows.length > 0 ? rows[0] : null
}

export async function countSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return GatewayRequestLog.countBy(ctx, {
    requestedAt: { $gte: sinceTimestamp }
  })
}

export async function countErrorsSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return GatewayRequestLog.countBy(ctx, {
    requestedAt: { $gte: sinceTimestamp },
    clientHttpStatus: { $gte: 400 }
  })
}
