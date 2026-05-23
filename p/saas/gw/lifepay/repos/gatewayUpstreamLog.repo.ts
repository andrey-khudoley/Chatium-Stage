/**
 * Репозиторий журнала исходящих вызовов gateway → LifePay
 * (gatewayUpstreamLog.table).
 */

import GatewayUpstreamLog, {
  type GatewayUpstreamLogRow
} from '../tables/gatewayUpstreamLog.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/gatewayUpstreamLog.repo'

export type GatewayUpstreamLogCreatePayload = {
  requestId: string
  op: string
  upstreamKind: string
  rawLpJson: unknown
  lpHttpStatus: number
  semanticRule: string
  durationMs: number
  sentAt: number
}

export async function create(
  ctx: app.Ctx,
  data: GatewayUpstreamLogCreatePayload
): Promise<GatewayUpstreamLogRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create entry`,
    payload: {
      requestId: data.requestId,
      op: data.op,
      upstreamKind: data.upstreamKind,
      lpHttpStatus: data.lpHttpStatus
    }
  })
  const row = await GatewayUpstreamLog.create(ctx, data)
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
): Promise<GatewayUpstreamLogRow[]> {
  return GatewayUpstreamLog.findAll(ctx, {
    order: [{ sentAt: 'desc' }],
    limit
  })
}

export async function findById(
  ctx: app.Ctx,
  id: number
): Promise<GatewayUpstreamLogRow | null> {
  const rows = await GatewayUpstreamLog.findAll(ctx, {
    where: { id },
    limit: 1
  })
  return rows.length > 0 ? rows[0] : null
}

export async function findByRequestId(
  ctx: app.Ctx,
  requestId: string
): Promise<GatewayUpstreamLogRow | null> {
  const rows = await GatewayUpstreamLog.findAll(ctx, {
    where: { requestId },
    limit: 1
  })
  return rows.length > 0 ? rows[0] : null
}

export async function countSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return GatewayUpstreamLog.countBy(ctx, {
    sentAt: { $gte: sinceTimestamp }
  })
}

export async function countOkSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return GatewayUpstreamLog.countBy(ctx, {
    sentAt: { $gte: sinceTimestamp },
    upstreamKind: 'json_ok',
    semanticRule: ''
  })
}
